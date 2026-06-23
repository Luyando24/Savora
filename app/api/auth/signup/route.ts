import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/app/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Create the Auth User with email_confirm: true (bypassing confirmation)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
      user_metadata: { name: name.trim() }
    });

    if (authError) {
      console.error("Standard auth registration failed:", authError);
      if (authError.message.toLowerCase().includes("already exists") || authError.status === 422) {
        return NextResponse.json({ error: "An account with this email address already exists. Please sign in." }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to create account: " + authError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: authUser.user.id });

  } catch (error: any) {
    console.error("Standard signup endpoint error:", error);
    return NextResponse.json({ error: "Internal server error: " + error?.message }, { status: 500 });
  }
}
