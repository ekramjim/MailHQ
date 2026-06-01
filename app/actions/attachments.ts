"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type Attachment = {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
};

async function getClient() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function getAttachments() {
  const { supabase, userId } = await getClient();
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Attachment[];
}

export async function uploadAttachment(formData: FormData) {
  const { supabase, userId } = await getClient();
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const path = `${userId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("attachments")
    .getPublicUrl(path);

  const { error: dbError } = await supabase.from("attachments").insert({
    user_id: userId,
    file_name: file.name,
    file_url: publicUrl,
    file_size: file.size,
    mime_type: file.type,
  });

  if (dbError) {
    await supabase.storage.from("attachments").remove([path]);
    throw dbError;
  }

  const { data: attachment } = await supabase
    .from("attachments")
    .select("id")
    .eq("user_id", userId)
    .eq("file_name", file.name)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  revalidatePath("/attachments");
  return attachment?.id ?? "";
}

export async function deleteAttachment(id: string, fileUrl: string) {
  const { supabase, userId } = await getClient();

  // Extract storage path from URL
  const url = new URL(fileUrl);
  const pathParts = url.pathname.split("/storage/v1/object/public/attachments/");
  const storagePath = pathParts[1];

  if (storagePath) {
    await supabase.storage.from("attachments").remove([storagePath]);
  }

  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
  revalidatePath("/attachments");
}
