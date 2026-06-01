"use client";

import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type Recipient = {
  id: string;
  contact_id: string;
  status: string;
  contacts: { name: string; email: string; institution: string | null } | null;
};

type Draft = {
  contactId: string;
  text: string;
  loading: boolean;
  error: string | null;
};

type Props = {
  recipients: Recipient[];
  subject: string;
  baseBody: string;
  onDraftsChange?: (drafts: Record<string, string>) => void;
};

export function AIDrafts({ recipients, subject, baseBody, onDraftsChange }: Props) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const texts = Object.fromEntries(
      Object.entries(drafts).filter(([, d]) => d.text).map(([k, d]) => [k, d.text])
    );
    onDraftsChange?.(texts);
  }, [drafts, onDraftsChange]);
  const [generatingAll, setGeneratingAll] = useState(false);

  async function generateDraft(recipient: Recipient) {
    const contact = recipient.contacts;
    if (!contact) return;

    setDrafts((prev) => ({
      ...prev,
      [recipient.contact_id]: { contactId: recipient.contact_id, text: "", loading: true, error: null },
    }));
    setExpanded(recipient.contact_id);

    try {
      const res = await fetch("/api/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseBody, subject, contact }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDrafts((prev) => ({
        ...prev,
        [recipient.contact_id]: { contactId: recipient.contact_id, text: data.draft, loading: false, error: null },
      }));
    } catch (err: unknown) {
      setDrafts((prev) => ({
        ...prev,
        [recipient.contact_id]: {
          contactId: recipient.contact_id,
          text: "",
          loading: false,
          error: err instanceof Error ? err.message : "Failed",
        },
      }));
    }
  }

  async function generateAll() {
    setGeneratingAll(true);
    for (const r of recipients) {
      await generateDraft(r);
    }
    setGeneratingAll(false);
  }

  function updateDraft(contactId: string, text: string) {
    setDrafts((prev) => ({ ...prev, [contactId]: { ...prev[contactId], text } }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" /> AI Personalised Drafts
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Generate a personalised version of your email for each recipient</p>
        </div>
        <button
          className="btn-primary gap-2"
          onClick={generateAll}
          disabled={generatingAll || recipients.length === 0}
        >
          <Sparkles className="h-4 w-4" />
          {generatingAll ? "Generating…" : `Generate all (${recipients.length})`}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {recipients.map((r) => {
          const contact = r.contacts;
          const draft = drafts[r.contact_id];
          const isExpanded = expanded === r.contact_id;

          return (
            <div key={r.contact_id} className="card overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : r.contact_id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    draft?.loading ? "bg-amber-400 animate-pulse" :
                    draft?.text ? "bg-green-500" :
                    draft?.error ? "bg-red-500" :
                    "bg-muted-foreground/30"
                  )} />
                  <span className="font-medium text-sm">{contact?.name ?? "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">{contact?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!draft?.loading && (
                    <button
                      className="btn-ghost p-1.5 h-7 w-7 text-muted-foreground"
                      onClick={(e) => { e.stopPropagation(); generateDraft(r); }}
                      title={draft?.text ? "Regenerate" : "Generate"}
                    >
                      {draft?.text ? <RotateCcw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border px-4 py-3">
                  {draft?.loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Sparkles className="h-4 w-4 animate-pulse text-orange-500" />
                      Generating personalised draft…
                    </div>
                  ) : draft?.error ? (
                    <p className="text-sm text-destructive">{draft.error}</p>
                  ) : draft?.text ? (
                    <textarea
                      className="input min-h-[180px] resize-y font-mono text-xs"
                      value={draft.text}
                      onChange={(e) => updateDraft(r.contact_id, e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      Click <Sparkles className="inline h-3.5 w-3.5" /> to generate a personalised draft for this recipient.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
