import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  sent: "bg-green-50 text-green-600 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
};

const OUTCOME_STYLES: Record<string, string> = {
  interested: "bg-green-50 text-green-600 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  meeting_booked: "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  not_interested: "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  no_response: "bg-muted text-muted-foreground border border-border",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const campaignIds = (campaigns ?? []).map((c) => c.id);

  const [
    { count: totalContacts },
    { count: totalSent },
    { count: totalCampaigns },
    { data: positiveOutcomes },
    { data: allSendCounts },
  ] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", userId),
    campaignIds.length > 0
      ? supabase.from("sends").select("*", { count: "exact", head: true }).in("campaign_id", campaignIds).eq("status", "sent")
      : Promise.resolve({ count: 0 }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("user_id", userId),
    campaignIds.length > 0
      ? supabase.from("sends")
          .select("outcome, contacts(name, email), campaigns(name)")
          .in("campaign_id", campaignIds)
          .in("outcome", ["interested", "meeting_booked"])
          .order("outcome")
      : Promise.resolve({ data: [] }),
    campaignIds.length > 0
      ? supabase.from("sends").select("campaign_id, status").in("campaign_id", campaignIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Build recipient count per campaign
  const countMap: Record<string, number> = {};
  for (const s of allSendCounts ?? []) {
    countMap[s.campaign_id] = (countMap[s.campaign_id] ?? 0) + 1;
  }

  const stats = [
    { label: "Total contacts", value: totalContacts ?? 0 },
    { label: "Campaigns", value: totalCampaigns ?? 0 },
    { label: "Emails sent", value: totalSent ?? 0 },
    { label: "Positive outcomes", value: positiveOutcomes?.length ?? 0 },
  ];

  const recentCampaigns = (campaigns ?? []).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium font-heading">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your outreach at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <span className="text-3xl font-medium text-orange-500">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent campaigns */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recent campaigns</h2>
            <Link href="/campaigns" className="text-xs text-orange-500 hover:underline">View all</Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">
              No campaigns yet.{" "}
              <Link href="/campaigns/new" className="text-orange-500 hover:underline">Create one</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recentCampaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/campaigns/${c.id}`} className="font-medium hover:text-orange-500 transition-colors">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("badge", STATUS_STYLES[c.status])}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {countMap[c.id] ?? 0} recipients
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Positive outcomes */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Positive outcomes</h2>
          </div>
          {!positiveOutcomes || positiveOutcomes.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">
              No positive outcomes yet. Mark them on your campaigns.
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {positiveOutcomes.map((o, i) => {
                  const contact = o.contacts as unknown as { name: string; email: string } | null;
                  const campaign = o.campaigns as unknown as { name: string } | null;
                  return (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{contact?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{campaign?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("badge", OUTCOME_STYLES[o.outcome])}>
                          {o.outcome.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
