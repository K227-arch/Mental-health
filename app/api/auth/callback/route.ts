import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";
import { checkRoleConflict, hasRegisteredAccount, isAdminEmail } from "@/lib/roles";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const errorMsg = request.nextUrl.searchParams.get("insforge_error");

  if (errorMsg || !code) {
    const url = new URL("/auth/sign-in", request.url);
    if (errorMsg) url.searchParams.set("error", errorMsg);
    return NextResponse.redirect(url);
  }

  const verifier = request.cookies.get("insforge_code_verifier")?.value;
  const redirectTo = request.cookies.get("insforge_redirect")?.value || "/dashboard";
  const intent = request.cookies.get("insforge_intent")?.value || "signin";

  try {
    // Exchange OAuth code for session
    const { data, error } = await (insforgeAdmin.auth as any).exchangeOAuthCode(code, verifier);

    if (error) {
      const url = new URL("/auth/sign-in", request.url);
      url.searchParams.set("error", error.message);
      return NextResponse.redirect(url);
    }

    // Get user ID + email from the token to check profile + role conflicts.
    let userId: string | null = null;
    let userEmail: string | null = null;
    if (data?.accessToken) {
      try {
        const payload = JSON.parse(Buffer.from(data.accessToken.split(".")[1], "base64").toString());
        userId = payload.sub || payload.user_id || null;
        userEmail = payload.email || null;
      } catch { /* invalid token */ }
    }

    // Enforce role separation for OAuth: if the user came in via the counsellor
    // portal but the email is already a student (or vice versa), refuse and send
    // them back to the correct sign-in with a message. Do NOT set session cookies.
    const intendedRole = redirectTo === "/counsellor" ? "counsellor" : "student";
    const roleConflict = await checkRoleConflict(userEmail, intendedRole);
    if (roleConflict) {
      const url = new URL("/auth/sign-in", request.url);
      if (intendedRole === "counsellor") url.searchParams.set("role", "counsellor");
      url.searchParams.set("error", roleConflict);
      const conflictResponse = NextResponse.redirect(url);
      conflictResponse.cookies.set("insforge_code_verifier", "", { path: "/", maxAge: 0 });
      conflictResponse.cookies.set("insforge_redirect", "", { path: "/", maxAge: 0 });
      conflictResponse.cookies.set("insforge_intent", "", { path: "/", maxAge: 0 });
      return conflictResponse;
    }

    // If the user clicked "Continue with Google" on the SIGN-IN page but has no
    // registered account yet, do not auto-create one. Send them to sign up.
    const isSuperAdmin = isAdminEmail(userEmail);
    if (intent === "signin" && !isSuperAdmin) {
      const registered = await hasRegisteredAccount(userEmail);
      if (!registered) {
        const role = redirectTo === "/counsellor" ? "counsellor" : "student";
        const url = new URL("/auth/sign-up", request.url);
        url.searchParams.set("role", role);
        url.searchParams.set(
          "error",
          "No account found for this Google email. Please sign up first — you can use Continue with Google on the sign-up page."
        );
        const noAccount = NextResponse.redirect(url);
        // Do NOT set session cookies — the user is not signed in.
        noAccount.cookies.set("insforge_code_verifier", "", { path: "/", maxAge: 0 });
        noAccount.cookies.set("insforge_redirect", "", { path: "/", maxAge: 0 });
        noAccount.cookies.set("insforge_intent", "", { path: "/", maxAge: 0 });
        return noAccount;
      }
    }

    // Decide where to send the user after establishing the session.
    // The admin email may access any portal — it goes to whichever portal it
    // signed in through (the tab the user picked, carried in redirectTo).
    // For everyone else, honor the portal they chose as long as it matches a
    // role they actually hold; students additionally need a COMPLETE profile.
    let finalRedirect = redirectTo;
    if (userId) {
      if (isSuperAdmin) {
        // Respect the chosen portal. Default to /admin only if none was set.
        finalRedirect =
          redirectTo === "/counsellor" || redirectTo === "/dashboard" || redirectTo === "/admin"
            ? redirectTo
            : "/admin";
      } else {
        const { data: counsellorProfile } = await insforgeAdmin.database
          .from("counsellor_profiles")
          .select("id")
          .eq("id", userId)
          .limit(1);

        const { data: adminProfile } = await insforgeAdmin.database
          .from("admin_profiles")
          .select("id")
          .eq("id", userId)
          .limit(1);

        const isCounsellor = counsellorProfile && counsellorProfile.length > 0;
        const isAdmin = adminProfile && adminProfile.length > 0;

        // Prefer the portal the user chose when they hold that role.
        if (redirectTo === "/admin" && isAdmin) {
          finalRedirect = "/admin";
        } else if (redirectTo === "/counsellor" && isCounsellor) {
          finalRedirect = "/counsellor";
        } else if (isAdmin) {
          finalRedirect = "/admin";
        } else if (isCounsellor) {
          finalRedirect = "/counsellor";
        } else {
          // Treat as a student — check profile completeness.
          const { data: studentProfile } = await insforgeAdmin.database
            .from("student_profiles")
            .select("student_id, faculty, year_of_study, consent")
            .eq("id", userId)
            .limit(1);

          const p = studentProfile?.[0];
          const complete = Boolean(p?.student_id && p?.faculty && p?.year_of_study && p?.consent === true);
          finalRedirect = complete ? "/dashboard" : "/auth/complete-profile";
        }
      }
    }

    const response = NextResponse.redirect(new URL(finalRedirect, request.url));

    // Set session cookies
    if (data?.accessToken) {
      response.cookies.set("insforge_access_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    if (data?.refreshToken) {
      response.cookies.set("insforge_refresh_token", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    response.cookies.set("insforge_code_verifier", "", { path: "/", maxAge: 0 });
    response.cookies.set("insforge_redirect", "", { path: "/", maxAge: 0 });
    response.cookies.set("insforge_intent", "", { path: "/", maxAge: 0 });
    return response;
  } catch {
    const url = new URL("/auth/sign-in", request.url);
    url.searchParams.set("error", "Authentication failed. Please try again.");
    return NextResponse.redirect(url);
  }
}
