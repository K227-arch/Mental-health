import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin as insforge } from "@/lib/insforge";

// GET - fetch resources (optionally filtered by assigned_to for student-specific)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const assignedTo = searchParams.get("assignedTo");
    const category = searchParams.get("category");

    let query = insforge.database
      .from("library_resources")
      .select()
      .order("created_at", { ascending: false });

    if (assignedTo) {
      // Get resources assigned to this student OR general (no assignment)
      query = query.or(`assigned_to.eq.${assignedTo},assigned_to.is.null`);
    }

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ resources: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - create a new resource (counsellor adds)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, type, contentUrl, readTime, createdBy, assignedTo } = body;

    if (!title || !category) {
      return NextResponse.json({ error: "title and category are required" }, { status: 400 });
    }

    const { data, error } = await insforge.database
      .from("library_resources")
      .insert({
        title,
        description: description || "",
        category,
        type: type || "article",
        content_url: contentUrl || null,
        read_time: readTime || "5 min",
        created_by: createdBy || null,
        assigned_to: assignedTo || null,
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If assigned to a student, send them a notification
    if (assignedTo) {
      await insforge.database.from("notifications").insert({
        user_id: assignedTo,
        title: "New Resource Shared",
        body: `Your counsellor shared "${title}" with you.`,
        type: "resource",
        link: "/wellness",
      });
    }

    return NextResponse.json({ resource: data?.[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - remove a resource
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { error } = await insforge.database
      .from("library_resources")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - update a resource (e.g., assign to student)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, assignedTo } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { data, error } = await insforge.database
      .from("library_resources")
      .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send notification to student
    if (assignedTo) {
      const resource = data?.[0];
      await insforge.database.from("notifications").insert({
        user_id: assignedTo,
        title: "New Resource Shared",
        body: `Your counsellor shared "${resource?.title || "a resource"}" with you.`,
        type: "resource",
        link: "/wellness",
      });
    }

    return NextResponse.json({ resource: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
