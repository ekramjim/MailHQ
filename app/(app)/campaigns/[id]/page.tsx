import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Paperclip, Mail } from "lucide-react";
import { getCampaign, getCampaignRecipients } from "@/app/actions/campaigns";
import { AIDrafts } from "@/components/campaigns/ai-drafts";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  sent: "bg-green-50 text-green-600 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  pending: "bg-muted text-muted-foreground",
  opened: "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  bounced: "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
};

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [campaign, recipients] = await Promise.all([
    getCampaign(id).catch(() => null),
    getCampaignRecipients(id).catch(() => []),
  ]);

  if (!campaign) notFound();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <Link href="/campaigns" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Campaigns
          </Link>
          <h1 className="text-2xl font-medium font-heading">{campaign.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn("badge", STATUS_STYLES[campaign.status])}>{campaign.status}</span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {recipients.length} recipients
            </span>
            {campaign.attachments && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5" /> {campaign.attachments.file_name}
              </span>
            )}
          </div>
        </div>

        {campaign.status === "draft" && (
          <Link href={`/campaigns/${id}/send`} className="btn-primary gap-2">
            <Mail className="h-4 w-4" />
            Send campaign
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Email preview */}
        <div className="card p-6 flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Email</h2>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Subject</p>
            <p className="font-medium">{campaign.subject}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Body</p>
            <pre className="text-sm whitespace-pre-wrap font-sans text-foreground leading-relaxed">{campaign.body}</pre>
          </div>
        </div>

        {/* Recipients */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recipients</h2>
          </div>
          {recipients.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No recipients added.</div>
          ) : (
            <div className="overflow-y-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-medium">
                        {(r.contacts as { name: string } | null)?.name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {(r.contacts as { email: string } | null)?.email ?? "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn("badge", STATUS_STYLES[r.status])}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* AI Drafts */}
      {recipients.length > 0 && (
        <AIDrafts
          recipients={recipients as Parameters<typeof AIDrafts>[0]["recipients"]}
          subject={campaign.subject}
          baseBody={campaign.body}
        />
      )}
    </div>
  );
}
