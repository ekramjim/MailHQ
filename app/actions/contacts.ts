"use server";

import { getAuthenticatedClient } from "@/lib/supabase-server";

export type Contact = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  institution: string | null;
  notes: string | null;
  created_at: string;
};

export type ContactFormData = {
  name: string;
  email: string;
  institution: string;
  notes: string;
};

const getUserId = getAuthenticatedClient;

export async function getContacts(search?: string, category?: string) {
  const { supabase, userId } = await getUserId();

  let query = supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,institution.ilike.%${search}%`);
  }
  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Contact[];
}

export async function createContact(formData: ContactFormData) {
  const { supabase, userId } = await getUserId();

  const { error } = await supabase.from("contacts").insert({
    user_id: userId,
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    institution: formData.institution.trim() || null,
    notes: formData.notes.trim() || null,
  });

  if (error) throw error;
}

export async function updateContact(id: string, formData: ContactFormData) {
  const { supabase, userId } = await getUserId();

  const { error } = await supabase
    .from("contacts")
    .update({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      institution: formData.institution.trim() || null,
      notes: formData.notes.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteContact(id: string) {
  const { supabase, userId } = await getUserId();

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function bulkImportContacts(
  contacts: Array<{ name: string; email: string; institution?: string; notes?: string }>
) {
  const { supabase, userId } = await getUserId();

  const rows = contacts
    .filter((c) => c.name && c.email)
    .map((c) => ({
      user_id: userId,
      name: c.name.trim(),
      email: c.email.trim().toLowerCase(),
      institution: c.institution?.trim() || null,
      notes: c.notes?.trim() || null,
    }));

  if (rows.length === 0) throw new Error("No valid contacts found");

  const { error } = await supabase.from("contacts").insert(rows);
  if (error) throw error;
  return rows.length;
}
