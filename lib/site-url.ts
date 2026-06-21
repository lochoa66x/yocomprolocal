import { headers } from "next/headers";

export const DEFAULT_SITE_ORIGIN = "https://yocomprolocal.com.mx";

export function normalizeOrigin(value: string | null | undefined) {
  const trimmedValue = value?.trim().replace(/\/$/, "");

  if (!trimmedValue) {
    return null;
  }

  try {
    return new URL(trimmedValue).origin;
  } catch {
    return trimmedValue;
  }
}

export function isLocalOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);

    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return origin.includes("localhost") || origin.includes("127.0.0.1");
  }
}

function isProductionRuntime() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

export function getConfiguredSiteOrigin() {
  const configuredSiteOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);

  if (!configuredSiteOrigin) {
    return null;
  }

  if (isProductionRuntime() && isLocalOrigin(configuredSiteOrigin)) {
    console.error(
      "Ignoring localhost NEXT_PUBLIC_SITE_URL in production auth flow"
    );

    return null;
  }

  return configuredSiteOrigin;
}

export function getCanonicalSiteOrigin() {
  return getConfiguredSiteOrigin() ?? DEFAULT_SITE_ORIGIN;
}

export async function getAuthRedirectOrigin() {
  const configuredSiteOrigin = getConfiguredSiteOrigin();

  if (configuredSiteOrigin) {
    return configuredSiteOrigin;
  }

  const headersList = await headers();
  const origin = normalizeOrigin(headersList.get("origin"));
  const forwardedHost =
    headersList.get("x-forwarded-host") || headersList.get("host");
  const forwardedProto = headersList.get("x-forwarded-proto") || "https";
  const forwardedOrigin = normalizeOrigin(
    forwardedHost ? `${forwardedProto}://${forwardedHost}` : null
  );
  const requestOrigin = origin || forwardedOrigin;

  if (requestOrigin && !isLocalOrigin(requestOrigin)) {
    return requestOrigin;
  }

  return DEFAULT_SITE_ORIGIN;
}
