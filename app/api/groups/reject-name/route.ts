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
    
    // Create standard client to verify user token securely
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { proposalId } = body;

    if (!proposalId) {
      return NextResponse.json({ error: "Proposal ID is required." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // 1. Fetch proposal details
    const { data: proposal, error: propErr } = await supabaseAdmin
      .from("group_name_proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (propErr || !proposal) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    if (proposal.status !== "pending") {
      return NextResponse.json({ error: `This proposal is already ${proposal.status}.` }, { status: 400 });
    }

    // 2. Fetch user's membership details in this group
    const { data: member, error: memberErr } = await supabaseAdmin
      .from("members")
      .select("id, role")
      .eq("group_id", proposal.group_id)
      .eq("email", user.email.toLowerCase().trim())
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this banking group." }, { status: 403 });
    }

    // 3. Determine status: Treasurers cancel their proposals, members reject
    const newStatus = member.role === "treasurer" ? "cancelled" : "rejected";

    const { error: updatePropErr } = await supabaseAdmin
      .from("group_name_proposals")
      .update({
        status: newStatus
      })
      .eq("id", proposalId);

    if (updatePropErr) {
      console.error("Failed to update proposal status:", updatePropErr);
      return NextResponse.json({ error: `Failed to ${newStatus === "cancelled" ? "cancel" : "reject"} name change: ` + updatePropErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: newStatus });

  } catch (error: any) {
    console.error("Reject rename endpoint error:", error);
    return NextResponse.json({ error: "Internal server error: " + error?.message }, { status: 500 });
  }
}
