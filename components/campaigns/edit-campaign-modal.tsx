"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { updateCampaign } from "@/app/actions/campaigns";
import type { Attachment } from "@/app/actions/attachments";

type Props = {
  campaign: { id: string; name: string; subject: string; body: string; attachment_id: string | null };
  attachments: Attachment[];
  onClose: () => void;
};

export function EditCampaignModal({ campaign, attachments, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: campaign.name,
    subject: campaign.subject,
    body: campaign.body,
    attachment_id: campaign.attachment_id ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.subject || !form.body) {
      setError("Name, subject, and body are required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateCampaign(campaign.id, form);
        onClose();
        window.location.reload();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-lg w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium font-heading">Edit campaign</h2>
          <button className="btn-ghost h-8 w-8 p-1.5" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="label">Campaign name</label>
            <input name="name" className="input" value={form.name} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label">Subject line</label>
            <input name="subject" className="input" value={form.subject} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label">Email body</label>
            <textarea
              name="body"
              className="input min-h-[180px] resize-y font-mono text-xs"
              value={form.body}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label">Attachment</label>
            <select name="attachment_id" className="input" value={form.attachment_id} onChange={handleChange}>
              <option value="">— none —</option>
              {attachments.map((a) => (
                <option key={a.id} value={a.id}>{a.file_name}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isPending}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
