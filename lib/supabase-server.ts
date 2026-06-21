import { cookies } from "next/headers";
import {
  createClient,
  type AuthFlowType,
  type SupabaseClient,
  type SupportedStorage,
} from "@supabase/supabase-js";

const noStoreFetch: typeof fetch = (input, init) => {
  return fetch(input, {
    ...init,
    cache: "no-store",
  });
};

export function createSupabaseAdminClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: noStoreFetch,
    },
  });
}

function getSupabaseCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

type SupabaseAuthClientOptions = {
  flowType?: AuthFlowType;
};

export async function createSupabaseAuthClient(
  options?: SupabaseAuthClientOptions
): Promise<SupabaseClient | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();
  const storage: SupportedStorage = {
    isServer: true,
    getItem(key) {
      return cookieStore.get(key)?.value ?? null;
    },
    setItem(key, value) {
      try {
        cookieStore.set(key, value, getSupabaseCookieOptions());
      } catch {
        // Server Components can read cookies but cannot write them.
      }
    },
    removeItem(key) {
      try {
        cookieStore.set(key, "", {
          ...getSupabaseCookieOptions(),
          maxAge: 0,
        });
      } catch {
        // Server Components can read cookies but cannot write them.
      }
    },
  };

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: options?.flowType ?? "pkce",
      persistSession: true,
      storage,
    },
    global: {
      fetch: noStoreFetch,
    },
  });
}

export async function getSupabaseUser() {
  const supabase = await createSupabaseAuthClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user ?? null;
}
