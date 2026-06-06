"use client";

import useSWR, { mutate } from "swr";
import { useCallback } from "react";
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  bulkImportContacts,
  type Contact,
  type ContactFormData,
} from "@/app/actions/contacts";

const CONTACTS_KEY = "contacts";

const fetcher = () => getContacts();

export function useContacts(opts?: { fallbackData?: Contact[] }) {
  return useSWR<Contact[]>(CONTACTS_KEY, fetcher, {
    fallbackData: opts?.fallbackData,
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
}

export function useContactMutations() {
  const add = useCallback(async (data: ContactFormData) => {
    const temp: Contact = {
      id: `temp-${crypto.randomUUID()}`,
      user_id: "",
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      institution: data.institution.trim() || null,
      notes: data.notes.trim() || null,
      created_at: new Date().toISOString(),
    };
    await mutate(
      CONTACTS_KEY,
      async () => {
        await createContact(data);
        return getContacts();
      },
      {
        optimisticData: (current: Contact[] = []) => [temp, ...current],
        rollbackOnError: true,
        revalidate: false,
      },
    );
  }, []);

  const update = useCallback(async (id: string, data: ContactFormData) => {
    await mutate(
      CONTACTS_KEY,
      async () => {
        await updateContact(id, data);
        return getContacts();
      },
      {
        optimisticData: (current: Contact[] = []) =>
          current.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: data.name.trim(),
                  email: data.email.trim().toLowerCase(),
                  institution: data.institution.trim() || null,
                  notes: data.notes.trim() || null,
                }
              : c,
          ),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    await mutate(
      CONTACTS_KEY,
      async (current: Contact[] = []) => {
        await deleteContact(id);
        return current.filter((c) => c.id !== id);
      },
      {
        optimisticData: (current: Contact[] = []) => current.filter((c) => c.id !== id),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  }, []);

  const bulkImport = useCallback(
    async (
      rows: Array<{ name: string; email: string; institution?: string; notes?: string }>,
    ) => {
      const count = await bulkImportContacts(rows);
      // Bulk insert doesn't return rows; revalidate to pull them.
      await mutate(CONTACTS_KEY);
      return count;
    },
    [],
  );

  return { add, update, remove, bulkImport };
}
