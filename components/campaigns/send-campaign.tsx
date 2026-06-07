"use client";

import { useState, useTransition } from "react";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { sendCampaign } from "@/app/actions/send";

type Recipient = {
  id: string;
  contact_id: string;
  status: string;
  contacts: { name: string; email: string } | null;
};

type SendResult = {
  contactId: string;
  name: string;
  email: string;
  success: boolean;
  error?: string;
};

type Props = {
  campaignId: string;
  recipients: Recipient[];
  drafts: Record<string, string>;
};

export function SendCampaign({ campaignId, recipients, drafts }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pendingRecipients = recipients.filter((r) => r.status === "pending");

  function handleSend() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await sendCampaign(campaignId, drafts);
        setResults(res.results);
        setShowConfirm(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Send failed");
        setShowConfirm(false);
      }
    });
  }

  if (results) {
    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return (
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <h2 className="text-base font-medium">Campaign sent</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {sent} sent successfully{failed > 0 ? `, ${failed} failed` : ""}
        </p>
        {failed > 0 && (
          <div className="flex flex-col gap-1">
            {results.filter((r) => !r.success).map((r) => (
              <div key={r.contactId} className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                {r.name} ({r.email}) — {r.error}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pendingRecipients.length} recipient{pendingRecipients.length !== 1 ? "s" : ""} ready to send
        </p>
        <button
          className="btn-primary gap-2"
          onClick={() => setShowConfirm(true)}
          disabled={isPending || pendingRecipients.length === 0}
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
          ) : (
            <><Mail className="h-4 w-4" /> Send campaign</>
          )}
        </button>
      </div>

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
            <h2 className="text-lg font-medium font-heading">Send campaign?</h2>
            <p className="text-sm text-muted-foreground">
              This will send emails to <span className="font-medium text-foreground">{pendingRecipients.length} recipients</span> via MailHQ. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn-primary gap-2" onClick={handleSend}>
                <Mail className="h-4 w-4" /> Send now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
