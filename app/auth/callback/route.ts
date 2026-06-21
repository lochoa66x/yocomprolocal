import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseAuthClient } from "@/lib/supabase-server";
import { getCanonicalSiteOrigin, isLocalOrigin } from "@/lib/site-url";

const EMAIL_OTP_TYPES = new Set([
  "email",
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
]);

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}

function getEmailOtpType(type: string | null): EmailOtpType {
  if (type && EMAIL_OTP_TYPES.has(type)) {
    return type as EmailOtpType;
  }

  return "email";
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
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = getEmailOtpType(requestUrl.searchParams.get("type"));
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!code && !tokenHash) {
    return NextResponse.redirect(
      getRedirectUrl(requestUrl, "/entrar?error=callback")
    );
  }

  const canonicalCallbackUrl = code
    ? getCanonicalCallbackUrl(requestUrl, code, nextPath)
    : null;

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

  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      })
    : await supabase.auth.exchangeCodeForSession(code!);

  if (error) {
    console.error("Supabase auth callback error:", error);
    return NextResponse.redirect(
      getRedirectUrl(requestUrl, "/entrar?error=callback")
    );
  }

  return NextResponse.redirect(getRedirectUrl(requestUrl, nextPath));
}
