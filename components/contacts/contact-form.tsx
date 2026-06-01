"use client";

import { useState, useTransition } from "react";
import { createContact, updateContact, type Contact, type ContactFormData } from "@/app/actions/contacts";

type Props = {
  contact?: Contact;
  onSuccess: () => void;
  onCancel: () => void;
};

export function ContactForm({ contact, onSuccess, onCancel }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ContactFormData>({
    name: contact?.name ?? "",
    email: contact?.email ?? "",
    institution: contact?.institution ?? "",
    notes: contact?.notes ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError("Name and email are required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (contact) {
          await updateContact(contact.id, form);
        } else {
          await createContact(form);
        }
        onSuccess();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="name">Name *</label>
        <input id="name" name="name" className="input" placeholder="Jane Smith" value={form.name} onChange={handleChange} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="email">Email *</label>
        <input id="email" name="email" type="email" className="input" placeholder="jane@university.edu" value={form.email} onChange={handleChange} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="institution">Institution / Company</label>
        <input id="institution" name="institution" className="input" placeholder="MIT" value={form.institution} onChange={handleChange} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" className="input min-h-[80px] resize-none" placeholder="Any notes about this contact..." value={form.notes} onChange={handleChange} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isPending}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Saving…" : contact ? "Save changes" : "Add contact"}
        </button>
      </div>
    </form>
  );
}
