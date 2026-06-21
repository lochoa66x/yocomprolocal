import { NextResponse } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase-server";

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}

function getRedirectUrl(requestUrl: URL, path: string) {
  return new URL(path, requestUrl.origin);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      getRedirectUrl(requestUrl, "/entrar?error=callback")
    );
  }

  const supabase = await createSupabaseAuthClient();

  if (!supabase) {
    console.error("Missing Supabase auth environment variables");
    return NextResponse.redirect(
      getRedirectUrl(requestUrl, "/entrar?error=server")
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase auth callback error:", error);
    return NextResponse.redirect(
      getRedirectUrl(requestUrl, "/entrar?error=callback")
    );
  }

  return NextResponse.redirect(getRedirectUrl(requestUrl, nextPath));
}
