import { NextResponse } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase-server";
import { getCanonicalSiteOrigin, isLocalOrigin } from "@/lib/site-url";

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}

function getRedirectUrl(requestUrl: URL, path: string) {
  const canonicalOrigin = getCanonicalSiteOrigin();
  const redirectOrigin =
    isLocalOrigin(requestUrl.origin) && !isLocalOrigin(canonicalOrigin)
      ? canonicalOrigin
      : requestUrl.origin;

  return new URL(path, redirectOrigin);
}

function getCanonicalCallbackUrl(requestUrl: URL, code: string, nextPath: string) {
  const canonicalOrigin = getCanonicalSiteOrigin();

  if (!isLocalOrigin(requestUrl.origin) || isLocalOrigin(canonicalOrigin)) {
    return null;
  }

  const callbackUrl = new URL("/auth/callback", canonicalOrigin);
  callbackUrl.searchParams.set("code", code);
  callbackUrl.searchParams.set("next", nextPath);

  return callbackUrl;
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

  const canonicalCallbackUrl = getCanonicalCallbackUrl(
    requestUrl,
    code,
    nextPath
  );

  if (canonicalCallbackUrl) {
    return NextResponse.redirect(canonicalCallbackUrl);
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
