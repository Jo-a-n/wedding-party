import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = "banana";

/** Server-side: verify admin header in API routes */
export function verifyAdmin(request: Request): boolean {
  return request.headers.get("X-Admin") === ADMIN_PASSWORD;
}

/** Server-side: create a Supabase client with the service role key (bypasses RLS) */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/** Client-side: check if admin param is in the current URL */
export function isAdminUrl(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("admin") === ADMIN_PASSWORD;
}

/** Client-side: make an authenticated admin API call */
export function adminFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "X-Admin": ADMIN_PASSWORD,
    },
  });
}
