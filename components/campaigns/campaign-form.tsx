"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Users, X, Check } from "lucide-react";
import { createCampaign, type CampaignFormData } from "@/app/actions/campaigns";
import type { Contact } from "@/app/actions/contacts";
import type { Attachment } from "@/app/actions/attachments";
import { cn } from "@/lib/utils";

const CATEGORIES = ["professor", "researcher", "industry", "recruiter", "other"];

type Props = {
  contacts: Contact[];
  attachments: Attachment[];
};

export function CampaignForm({ contacts, attachments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CampaignFormData>({
    name: "",
    subject: "",
    body: "",
    attachment_id: "",
    recipient_contact_ids: [],
  });

  const [recipientMode, setRecipientMode] = useState<"category" | "manual">("category");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const categoryContacts = contacts.filter(
    (c) => selectedCategories.length === 0 || selectedCategories.includes(c.category ?? "")
  );

  const resolvedRecipients =
    recipientMode === "category" ? categoryContacts : contacts.filter((c) => form.recipient_contact_ids.includes(c.id));

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleContact(id: string) {
    setForm((prev) => ({
      ...prev,
      recipient_contact_ids: prev.recipient_contact_ids.includes(id)
        ? prev.recipient_contact_ids.filter((c) => c !== id)
        : [...prev.recipient_contact_ids, id],
    }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.subject || !form.body) {
      setError("Name, subject, and body are required.");
      return;
    }

    const finalIds =
      recipientMode === "category"
        ? categoryContacts.map((c) => c.id)
        : form.recipient_contact_ids;

    if (finalIds.length === 0) {
      setError("Select at least one recipient.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const id = await createCampaign({ ...form, recipient_contact_ids: finalIds });
        router.push(`/campaigns/${id}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      {/* Basic info */}
      <div className="card p-6 flex flex-col gap-4">
        <h2 className="text-base font-medium">Campaign details</h2>

        <div className="flex flex-col gap-1.5">
          <label className="label">Campaign name</label>
          <input name="name" className="input" placeholder="PhD Applications — Fall 2025" value={form.name} onChange={handleChange} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label">Subject line</label>
          <input name="subject" className="input" placeholder="Inquiry about research opportunities" value={form.subject} onChange={handleChange} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label">Email body</label>
          <textarea
            name="body"
            className="input min-h-[200px] resize-y font-mono text-xs"
            placeholder={"Dear {{name}},\n\nI am writing to inquire about..."}
            value={form.body}
            onChange={handleChange}
          />
          <p className="text-xs text-muted-foreground">Use <code className="bg-muted px-1 rounded">{"{{name}}"}</code> as a placeholder — AI personalisation comes in Step 7.</p>
        </div>
      </div>

      {/* Attachment */}
      <div className="card p-6 flex flex-col gap-4">
        <h2 className="text-base font-medium flex items-center gap-2">
          <Paperclip className="h-4 w-4" /> Attachment <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </h2>
        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attachments yet — upload files on the Attachments page.</p>
        ) : (
          <select name="attachment_id" className="input" value={form.attachment_id} onChange={handleChange}>
            <option value="">— none —</option>
            {attachments.map((a) => (
              <option key={a.id} value={a.id}>{a.file_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Recipients */}
      <div className="card p-6 flex flex-col gap-4">
        <h2 className="text-base font-medium flex items-center gap-2">
          <Users className="h-4 w-4" /> Recipients
        </h2>

        <div className="flex gap-2">
          {(["category", "manual"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setRecipientMode(mode)}
              className={cn(
                "pb-0.5 text-xs font-medium transition-all border-b-2",
                recipientMode === mode ? "border-cyan-500 text-cyan-500" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {mode === "category" ? "By category" : "Hand-pick"}
            </button>
          ))}
        </div>

        {recipientMode === "category" ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg border transition-all",
                    selectedCategories.includes(cat)
                      ? "bg-cyan-500 text-white border-cyan-500"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedCategories.length === 0
                ? `All ${contacts.length} contacts selected`
                : `${categoryContacts.length} contact${categoryContacts.length !== 1 ? "s" : ""} in selected categories`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts yet.</p>
            ) : (
              contacts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleContact(c.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                    form.recipient_contact_ids.includes(c.id)
                      ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                      : "hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                    form.recipient_contact_ids.includes(c.id) ? "bg-cyan-500 border-cyan-500" : "border-border"
                  )}>
                    {form.recipient_contact_ids.includes(c.id) && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground text-xs">{c.email}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        <button type="button" className="btn-secondary" onClick={() => router.push("/campaigns")}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Creating…" : `Save as draft${resolvedRecipients.length > 0 ? ` · ${resolvedRecipients.length} recipients` : ""}`}
        </button>
      </div>
    </form>
  );
}
