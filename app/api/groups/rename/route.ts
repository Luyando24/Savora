import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/app/lib/supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing auth token" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // Create standard client to verify the user token securely
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, proposedName } = body;

    if (!groupId || !proposedName || !proposedName.trim()) {
      return NextResponse.json({ error: "GroupId and proposedName are required." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // 1. Verify user is treasurer/admin of the group
    const { data: member, error: memberErr } = await supabaseAdmin
      .from("members")
      .select("id, role")
      .eq("group_id", groupId)
      .eq("email", user.email.toLowerCase().trim())
      .single();

    if (memberErr || !member || member.role !== "treasurer") {
      return NextResponse.json({ error: "Forbidden: Only the group treasurer can propose name changes." }, { status: 403 });
    }

    // 2. Check for any existing pending proposals for that group
    const { data: existingProposal, error: checkErr } = await supabaseAdmin
      .from("group_name_proposals")
      .select("id")
      .eq("group_id", groupId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingProposal) {
      return NextResponse.json({ error: "A name change proposal is already pending. Please resolve it first." }, { status: 400 });
    }

    // 3. Insert the new proposal
    const { data: newProposal, error: insertErr } = await supabaseAdmin
      .from("group_name_proposals")
      .insert({
        group_id: groupId,
        proposed_name: proposedName.trim(),
        proposed_by_member_id: member.id,
        status: "pending"
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Failed to insert name proposal:", insertErr);
      return NextResponse.json({ error: "Failed to submit proposal: " + insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, proposal: newProposal });

  } catch (error: any) {
    console.error("Rename endpoint error:", error);
    return NextResponse.json({ error: "Internal server error: " + error?.message }, { status: 500 });
  }
}
