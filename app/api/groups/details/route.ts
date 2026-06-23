import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/app/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "Missing groupId parameter" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Fetch Group details (bypassing RLS because it's for public display on invite link)
    const { data: group, error: groupErr } = await supabaseAdmin
      .from("groups")
      .select("name, type, location")
      .eq("id", groupId)
      .single();

    if (groupErr || !group) {
      return NextResponse.json({ error: "Group not found or invalid ID" }, { status: 404 });
    }

    return NextResponse.json({
      name: group.name,
      type: group.type,
      location: group.location
    });

  } catch (error: any) {
    console.error("Public group details API error:", error);
    return NextResponse.json({ error: "Internal server error: " + error?.message }, { status: 500 });
  }
}
