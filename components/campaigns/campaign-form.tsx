"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Users, Check, Paperclip, X } from "lucide-react";
import { createCampaign } from "@/app/actions/campaigns";
import { uploadAttachment } from "@/app/actions/attachments";
import type { Contact } from "@/app/actions/contacts";
import { cn } from "@/lib/utils";

type Props = {
  contacts: Contact[];
};

export function CampaignForm({ contacts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    subject: "",
    body: "",
    attachment_id: "",
    recipient_contact_ids: [] as string[],
  });

  function toggleContact(id: string) {
    setForm((prev) => ({
      ...prev,
      recipient_contact_ids: prev.recipient_contact_ids.includes(id)
        ? prev.recipient_contact_ids.filter((c) => c !== id)
        : [...prev.recipient_contact_ids, id],
    }));
  }

  function selectAll() {
    setForm((prev) => ({ ...prev, recipient_contact_ids: contacts.map((c) => c.id) }));
  }

  function clearAll() {
    setForm((prev) => ({ ...prev, recipient_contact_ids: [] }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAttachmentFile(e.target.files?.[0] ?? null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.subject || !form.body) {
      setError("Name, subject, and body are required.");
      return;
    }
    if (form.recipient_contact_ids.length === 0) {
      setError("Select at least one recipient.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        let attachmentId = "";
        if (attachmentFile) {
          const fd = new FormData();
          fd.append("file", attachmentFile);
          attachmentId = await uploadAttachment(fd);
        }
        const id = await createCampaign({ ...form, attachment_id: attachmentId });
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
            placeholder={"Dear {{first_name}},\n\nI am writing to inquire about..."}
            value={form.body}
            onChange={handleChange}
          />
          <p className="text-xs text-muted-foreground">
            Placeholders: <code className="bg-muted px-1 rounded">{"{{name}}"}</code> full name · <code className="bg-muted px-1 rounded">{"{{first_name}}"}</code> first name · <code className="bg-muted px-1 rounded">{"{{email}}"}</code> email
          </p>
        </div>

        {/* Attachment */}
        <div className="flex flex-col gap-1.5">
          <label className="label">Attachment <span className="text-muted-foreground font-normal">(optional)</span></label>
          {attachmentFile ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm">
              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate flex-1">{attachmentFile.name}</span>
              <button type="button" onClick={() => { setAttachmentFile(null); if (fileRef.current) fileRef.current.value = ""; }}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ) : (
            <button type="button" className="btn-secondary gap-2 self-start" onClick={() => fileRef.current?.click()}>
              <Paperclip className="h-4 w-4" />
              Attach file
            </button>
          )}
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {/* Recipients */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium flex items-center gap-2">
            <Users className="h-4 w-4" /> Recipients
          </h2>
          <div className="flex gap-3">
            <button type="button" onClick={selectAll} className="text-xs text-orange-500 hover:underline">Select all</button>
            <button type="button" onClick={clearAll} className="text-xs text-muted-foreground hover:underline">Clear</button>
          </div>
        </div>

        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
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
                    ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    : "hover:bg-muted"
                )}
              >
                <div className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                  form.recipient_contact_ids.includes(c.id) ? "bg-orange-500 border-orange-500" : "border-border"
                )}>
                  {form.recipient_contact_ids.includes(c.id) && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground text-xs">{c.institution ?? c.email}</span>
              </button>
            ))
          )}
        </div>
        <p className="text-xs text-muted-foreground">{form.recipient_contact_ids.length} of {contacts.length} selected</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        <button type="button" className="btn-secondary" onClick={() => router.push("/campaigns")}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Creating…" : `Save as draft · ${form.recipient_contact_ids.length} recipients`}
        </button>
      </div>
    </form>
  );
}
