export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TEMP: auth bypass — remove when new auth system is in place
  const bypassAuth = process.env.BYPASS_AUTH === "true";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = null;

  if (bypassAuth) {
    user = { id: "dev", email: "dev@local.test" };
  } else {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (!user) redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 ml-60 p-3">
        <main className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-card p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
