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

function getImplicitCallbackHtml(nextPath: string) {
  const safeNextPath = JSON.stringify(nextPath);
  const loginErrorPath = JSON.stringify(
    `/entrar?error=callback&next=${encodeURIComponent(nextPath)}`
  );

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Abriendo tu panel | YoComproLocal</title>
    <style>
      body {
        align-items: center;
        background: #fbfbf7;
        color: #1f3429;
        display: flex;
        font-family: Arial, sans-serif;
        justify-content: center;
        margin: 0;
        min-height: 100vh;
      }

      main {
        max-width: 30rem;
        padding: 2rem;
        text-align: center;
      }

      strong {
        display: block;
        font-size: 1.5rem;
        margin-bottom: 0.75rem;
      }

      p {
        color: #53645a;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <main>
      <strong>Abriendo tu panel...</strong>
      <p>Estamos preparando tu acceso seguro a YoComproLocal.</p>
    </main>
    <script>
      (async function () {
        const errorPath = ${loginErrorPath};
        const nextPath = ${safeNextPath};
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        window.history.replaceState(null, "", window.location.pathname + window.location.search);

        if (!accessToken || !refreshToken) {
          window.location.replace(errorPath);
          return;
        }

        const response = await fetch("/auth/session", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          credentials: "same-origin",
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            next: nextPath
          })
        });

        if (!response.ok) {
          window.location.replace(errorPath);
          return;
        }

        const data = await response.json();
        window.location.replace(data.redirectTo || nextPath);
      })().catch(function () {
        window.location.replace(${loginErrorPath});
      });
    </script>
  </body>
</html>`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = getEmailOtpType(requestUrl.searchParams.get("type"));
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!code && !tokenHash) {
    return new NextResponse(getImplicitCallbackHtml(nextPath), {
      headers: {
        "cache-control": "no-store",
        "content-type": "text/html; charset=utf-8",
      },
    });
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
