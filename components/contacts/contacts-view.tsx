"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Pencil, Trash2, Plus, Upload, Search, X } from "lucide-react";
import { type Contact } from "@/app/actions/contacts";
import { useContacts, useContactMutations } from "@/lib/queries/contacts";
import { ContactForm } from "./contact-form";
import { CSVImport } from "./csv-import";

type Modal = { type: "add" } | { type: "edit"; contact: Contact } | { type: "csv" } | null;

type Props = {
  fallbackData: Contact[];
};

export function ContactsView({ fallbackData }: Props) {
  const { data } = useContacts({ fallbackData });
  const contacts = data ?? fallbackData;
  const { add, update, remove, bulkImport } = useContactMutations();

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.institution ?? "").toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const closeModal = useCallback(() => setModal(null), []);

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        try {
          await remove(id);
          setDeleteId(null);
          showToast("Contact deleted");
        } catch {
          showToast("Failed to delete");
        }
      });
    },
    [remove, showToast],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium font-heading">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{contacts.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary gap-2" onClick={() => setModal({ type: "csv" })}>
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button className="btn-primary gap-2" onClick={() => setModal({ type: "add" })}>
            <Plus className="h-4 w-4" />
            Add contact
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="input pl-9"
          placeholder="Search by name, email, institution…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearch("")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {contacts.length === 0
              ? "No contacts yet. Add your first contact or import a CSV."
              : "No contacts match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Institution</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact) => (
                  <tr key={contact.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{contact.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{contact.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{contact.institution ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-ghost p-2 h-8 w-8"
                          onClick={() => setModal({ type: "edit", contact })}
                          title="Edit"
                          disabled={contact.id.startsWith("temp-")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="btn-ghost p-2 h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(contact.id)}
                          title="Delete"
                          disabled={contact.id.startsWith("temp-")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-card border border-border rounded-2xl shadow-lg w-full max-w-lg p-6 flex flex-col gap-4">
            <h2 className="text-lg font-medium font-heading">
              {modal.type === "add" && "Add contact"}
              {modal.type === "edit" && "Edit contact"}
              {modal.type === "csv" && "Import from CSV"}
            </h2>
            {modal.type === "csv" ? (
              <CSVImport
                onImport={bulkImport}
                onSuccess={(count) => {
                  closeModal();
                  showToast(`${count} contacts imported`);
                }}
                onCancel={closeModal}
              />
            ) : modal.type === "edit" ? (
              <ContactForm
                contact={modal.contact}
                onSubmit={(data) => update(modal.contact.id, data)}
                onSuccess={closeModal}
                onCancel={closeModal}
              />
            ) : (
              <ContactForm
                onSubmit={(data) => add(data)}
                onSuccess={closeModal}
                onCancel={closeModal}
              />
            )}
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
            <h2 className="text-lg font-medium font-heading">Delete contact?</h2>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setDeleteId(null)} disabled={isPending}>Cancel</button>
              <button className="btn-destructive" onClick={() => handleDelete(deleteId)} disabled={isPending}>
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}
