import { NextResponse } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const supabase = await createSupabaseAuthClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/", request.url));
}
