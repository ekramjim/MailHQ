import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

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

// TEMP: auth bypass — remove when new auth system is in place
// Wrapped in React cache() so concurrent server components / actions within the
// same request share one supabase client + one auth.getUser() round-trip.
export const getAuthenticatedClient = cache(async () => {
  const supabase = createServerSupabaseClient();
  if (process.env.BYPASS_AUTH === "true") {
    return {
      supabase,
      userId: "00000000-0000-0000-0000-000000000000",
      email: "dev@local.test",
    };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id, email: user.email ?? null };
});
