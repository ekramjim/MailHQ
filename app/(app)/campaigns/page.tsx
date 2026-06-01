import Link from "next/link";
import { Plus, Mail, Users, Paperclip } from "lucide-react";
import { getCampaigns } from "@/app/actions/campaigns";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  sent: "bg-green-50 text-green-600 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium font-heading">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{campaigns.length} total</p>
        </div>
        <Link href="/campaigns/new" className="btn-primary gap-2">
          <Plus className="h-4 w-4" />
          New campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="card p-12 text-center">
          <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No campaigns yet. Create your first one.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recipients</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Attachment</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/campaigns/${c.id}`} className="font-medium hover:text-orange-500 transition-colors">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{c.subject}</td>
                  <td className="px-4 py-3">
                    <span className={cn("badge", STATUS_STYLES[c.status])}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {c.recipient_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.attachment_name ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Paperclip className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[120px]">{c.attachment_name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
