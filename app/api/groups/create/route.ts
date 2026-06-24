import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/app/lib/supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    let loggedInUserEmail: string | null = null;

    if (authHeader) {
      if (!authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized: Invalid auth scheme" }, { status: 401 });
      }
      const token = authHeader.split(" ")[1];
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });
      const { data: { user }, error: authError } = await userClient.auth.getUser(token);
      if (authError || !user || !user.email) {
        return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
      }
      loggedInUserEmail = user.email.toLowerCase().trim();
    }

    const body = await request.json();
    const { name, type, location, rules, treasurerName, treasurerEmail, treasurerPassword } = body;

    if (!name || !type || !treasurerName || !treasurerEmail || (!loggedInUserEmail && !treasurerPassword)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (loggedInUserEmail && treasurerEmail.toLowerCase().trim() !== loggedInUserEmail) {
      return NextResponse.json({ error: "Forbidden: You cannot create a group with a different treasurer email." }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    let authUser = null;

    if (!loggedInUserEmail) {
      // 1. Create Auth User for Treasurer
      const { data: createdAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: treasurerEmail.trim(),
        password: treasurerPassword,
        email_confirm: true
      });

      if (authError) {
        console.error("Treasurer auth creation failed:", authError);
        if (authError.message.toLowerCase().includes("already exists") || authError.status === 422) {
          return NextResponse.json({ error: "An account with this email address already exists. Please log in first." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create treasurer auth account: " + authError.message }, { status: 500 });
      }
      authUser = createdAuthUser;
    }

    // 2. Insert Group
    const { data: group, error: groupError } = await supabaseAdmin
      .from("groups")
      .insert({
        name,
        type,
        location,
        cycle_settings: rules,
        registration_status: "active"
      })
      .select()
      .single();

    if (groupError) {
      console.error("Group creation failed:", groupError);
      // Clean up the created auth user
      if (authUser?.user?.id) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      }
      return NextResponse.json({ error: "Failed to create group: " + groupError.message }, { status: 500 });
    }

    // 3. Insert Treasurer Member
    const { data: member, error: memberError } = await supabaseAdmin
      .from("members")
      .insert({
        email: treasurerEmail.toLowerCase().trim(),
        name: treasurerName,
        group_id: group.id,
        role: "treasurer"
      })
      .select()
      .single();

    if (memberError) {
      console.error("Treasurer member registration failed:", memberError);
      // Clean up the group and the auth user
      await supabaseAdmin.from("groups").delete().eq("id", group.id);
      if (authUser?.user?.id) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      }
      return NextResponse.json({ error: "Failed to create treasurer member: " + memberError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, groupId: group.id });

  } catch (error: any) {
    console.error("Group creation endpoint error:", error);
    return NextResponse.json({ error: "Internal server error: " + error?.message }, { status: 500 });
  }
}

