export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
