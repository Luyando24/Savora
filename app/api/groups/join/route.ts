import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/app/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, name, email, password, phone } = body;

    if (!groupId || !name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // 1. Check if they are already a member of this specific group
    const { data: existingMember, error: fetchMemErr } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("group_id", groupId)
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: "You are already a member of this banking group. Please sign in instead." }, { status: 400 });
    }

    let authUserId = null;
    let isNewAuthUser = false;

    // 2. Try to create the Auth User with email_confirm: true (bypassing confirmation)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
      user_metadata: { name: name.trim() }
    });

    if (authError) {
      // If user already exists in auth table, we can proceed to insert membership
      const message = authError.message.toLowerCase();
      if (message.includes("already exists") || authError.status === 422) {
        console.log(`[Join API] Auth user already exists for ${email}. Proceeding to create membership.`);
      } else {
        console.error("Auth user creation failed:", authError);
        return NextResponse.json({ error: "Failed to create credentials account: " + authError.message }, { status: 500 });
      }
    } else if (authUser?.user?.id) {
      authUserId = authUser.user.id;
      isNewAuthUser = true;
    }

    // 3. Register the user in the members table for the group
    let formattedPhone = "";
    if (phone && phone.trim()) {
      const isZambianPhone = (phoneStr: string) => {
        const cleaned = phoneStr.replace(/[\s\-\(\)\+]+/g, "");
        return /^(097|096|095|077|076|075|057)\d{7}$/.test(cleaned);
      };

      if (!isZambianPhone(phone)) {
        // If auth user was newly created, roll it back to prevent orphaned accounts
        if (isNewAuthUser && authUserId) {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
        }
        return NextResponse.json({ error: "Please enter a valid 10-digit Zambian phone number." }, { status: 400 });
      }
      formattedPhone = phone.trim();
    }

    const { data: member, error: memberError } = await supabaseAdmin
      .from("members")
      .insert({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone_number: formattedPhone || null,
        group_id: groupId,
        role: "member"
      })
      .select()
      .single();

    if (memberError) {
      console.error("Member registration failed:", memberError);
      // Clean up the created auth user if this was a new signup
      if (isNewAuthUser && authUserId) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
      }
      return NextResponse.json({ error: "Failed to register group membership: " + memberError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, memberId: member.id });

  } catch (error: any) {
    console.error("Group join API error:", error);
    return NextResponse.json({ error: "Internal server error: " + error?.message }, { status: 500 });
  }
}
