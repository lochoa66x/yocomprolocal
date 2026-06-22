import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

const ADMIN_COOKIE_NAME = "ycl_admin";

function getAdminAccessCode() {
  return process.env.ADMIN_ACCESS_CODE?.trim() ?? "";
}

function getAdminCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

function createAdminToken(code: string) {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "yocomprolocal-admin";

  return createHash("sha256").update(`${code}:${salt}`).digest("hex");
}

export function isAdminAccessConfigured() {
  return Boolean(getAdminAccessCode());
}

export async function hasAdminSession() {
  const adminCode = getAdminAccessCode();

  if (!adminCode) {
    return false;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? "";
  const expectedToken = createAdminToken(adminCode);

  return safeEqual(sessionToken, expectedToken);
}

export async function startAdminSession(code: string) {
  const adminCode = getAdminAccessCode();

  if (!adminCode || !safeEqual(code.trim(), adminCode)) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_COOKIE_NAME,
    createAdminToken(adminCode),
    getAdminCookieOptions()
  );

  return true;
}

export async function endAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    ...getAdminCookieOptions(),
    maxAge: 0,
  });
}

export async function requireAdminAccess(nextPath = "/admin") {
  if (!(await hasAdminSession())) {
    const params = new URLSearchParams({
      next: nextPath,
    });

    redirect(`/admin?${params.toString()}`);
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase admin environment variables");
  }

  return {
    supabase,
  };
}
