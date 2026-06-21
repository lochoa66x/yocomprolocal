import { notFound, redirect } from "next/navigation";
import { getAuthorizedSellerBySlug } from "@/lib/storefront";
import {
  createSupabaseAdminClient,
  getSupabaseUser,
} from "@/lib/supabase-server";

export function getLoginHref(nextPath: string) {
  const params = new URLSearchParams({
    next: nextPath,
  });

  return `/entrar?${params.toString()}`;
}

export async function requireSellerAccess({
  slug,
  nextPath,
}: {
  slug: string;
  nextPath: string;
}) {
  const user = await getSupabaseUser();

  if (!user) {
    redirect(getLoginHref(nextPath));
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    notFound();
  }

  const seller = await getAuthorizedSellerBySlug({
    supabase,
    slug,
    user,
  });

  if (!seller) {
    notFound();
  }

  return {
    seller,
    supabase,
    user,
  };
}
