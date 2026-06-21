import { NextResponse } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase-server";

type SessionRequestBody = {
  access_token?: unknown;
  refresh_token?: unknown;
  next?: unknown;
};

function getToken(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSafeNextPath(value: unknown) {
  const nextPath = typeof value === "string" ? value : "";

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/panel";
  }

  return nextPath;
}

export async function POST(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as SessionRequestBody | null;
  const accessToken = getToken(body?.access_token);
  const refreshToken = getToken(body?.refresh_token);
  const redirectTo = getSafeNextPath(body?.next);

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "missing_tokens" }, { status: 400 });
  }

  const supabase = await createSupabaseAuthClient({ flowType: "implicit" });

  if (!supabase) {
    console.error("Missing Supabase auth environment variables");
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error("Supabase implicit session error:", error);
    return NextResponse.json({ error: "session" }, { status: 400 });
  }

  return NextResponse.json({ redirectTo });
}
