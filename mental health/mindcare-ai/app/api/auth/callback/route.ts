import { NextRequest, NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";

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

  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { error } = await auth.exchangeOAuthCode(code, verifier);

  if (error) {
    const url = new URL("/auth/sign-in", request.url);
    url.searchParams.set("error", error.message);
    return NextResponse.redirect(url);
  }

  response.cookies.delete("insforge_code_verifier");
  response.cookies.delete("insforge_redirect");
  return response;
}
