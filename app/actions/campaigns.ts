"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type Campaign = {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  ai_generated: boolean;
  attachment_id: string | null;
  status: "draft" | "scheduled" | "sent";
  scheduled_at: string | null;
  created_at: string;
};

export type CampaignWithCount = Campaign & {
  recipient_count: number;
  attachment_name?: string | null;
};

export type CampaignFormData = {
  name: string;
  subject: string;
  body: string;
  attachment_id: string;
  recipient_contact_ids: string[];
};

async function getClient() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function getCampaigns() {
  const { supabase, userId } = await getClient();

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*, attachments(file_name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const campaignIds = campaigns.map((c) => c.id);
  let countMap: Record<string, number> = {};

  if (campaignIds.length > 0) {
    const { data: counts } = await supabase
      .from("sends")
      .select("campaign_id")
      .in("campaign_id", campaignIds);

    if (counts) {
      countMap = counts.reduce((acc, row) => {
        acc[row.campaign_id] = (acc[row.campaign_id] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  }

  return campaigns.map((c) => ({
    ...c,
    attachment_name: (c.attachments as { file_name: string } | null)?.file_name ?? null,
    recipient_count: countMap[c.id] ?? 0,
  })) as CampaignWithCount[];
}

export async function getCampaign(id: string) {
  const { supabase, userId } = await getClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select("*, attachments(file_name)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data as Campaign & { attachments: { file_name: string } | null };
}

export async function getCampaignRecipients(campaignId: string) {
  const { supabase, userId } = await getClient();

  const { data, error } = await supabase
    .from("sends")
    .select("*, contacts(name, email, category, institution)")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCampaign(formData: CampaignFormData) {
  const { supabase, userId } = await getClient();

  const { data: campaign, error: campError } = await supabase
    .from("campaigns")
    .insert({
      user_id: userId,
      name: formData.name.trim(),
      subject: formData.subject.trim(),
      body: formData.body.trim(),
      attachment_id: formData.attachment_id || null,
      status: "draft",
    })
    .select()
    .single();

  if (campError) throw campError;

  if (formData.recipient_contact_ids.length > 0) {
    const sends = formData.recipient_contact_ids.map((contact_id) => ({
      campaign_id: campaign.id,
      contact_id,
      status: "pending",
    }));
    const { error: sendsError } = await supabase.from("sends").insert(sends);
    if (sendsError) throw sendsError;
  }

  revalidatePath("/campaigns");
  return campaign.id as string;
}

export async function deleteCampaign(id: string) {
  const { supabase, userId } = await getClient();
  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  revalidatePath("/campaigns");
}
