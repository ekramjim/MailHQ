import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";

function makeCookieMethods(): CookieMethodsServer {
  let cookieStore: Awaited<ReturnType<typeof cookies>>;

  const init = async () => {
    if (!cookieStore) cookieStore = await cookies();
    return cookieStore;
  };

  return {
    getAll: async () => (await init()).getAll(),
    setAll: async (cookiesToSet) => {
      const store = await init();
      cookiesToSet.forEach(({ name, value, options }) =>
        store.set(name, value, options)
      );
    },
  };
}

export function createServerSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: makeCookieMethods() }
  );
}

export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: makeCookieMethods() }
  );
}
