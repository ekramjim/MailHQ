"use server";

import { revalidatePath } from "next/cache";
import { resend } from "@/lib/resend";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type SendResult = {
  contactId: string;
  name: string;
  email: string;
  success: boolean;
  error?: string;
};

type AttachmentPayload = {
  filename: string;
  content: Buffer;
  contentType: string;
};

function applyPersonalization(body: string, contact: { name: string; email: string }) {
  const firstName = contact.name.split(" ")[0];

  return body
    .replace(/\{\{name\}\}/gi, contact.name)
    .replace(/\{\{first_name\}\}/gi, firstName)
    .replace(/\{\{email\}\}/gi, contact.email);
}

async function getAttachmentPayload(
  attachment: { file_name: string; file_url: string; mime_type: string | null } | null,
): Promise<AttachmentPayload | undefined> {
  if (!attachment) return undefined;

  const response = await fetch(attachment.file_url);
  if (!response.ok) {
    throw new Error(`Could not fetch attachment ${attachment.file_name}.`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    filename: attachment.file_name,
    content: buffer,
    contentType: attachment.mime_type ?? "application/octet-stream",
  };
}

export async function sendCampaign(
  campaignId: string,
  drafts: Record<string, string>,
): Promise<{ results: SendResult[]; sent: number; failed: number }> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "MailHQ <onboarding@resend.dev>";
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: campaign, error: campError } = await supabase
    .from("campaigns")
    .select("*, attachments(file_name, file_url, mime_type)")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();
  if (campError) throw campError;

  const attachment = await getAttachmentPayload(
    campaign.attachment_id
      ? (campaign.attachments as { file_name: string; file_url: string; mime_type: string | null } | null)
      : null,
  );

  const { data: sends, error: sendsError } = await supabase
    .from("sends")
    .select("*, contacts(name, email)")
    .eq("campaign_id", campaignId)
    .eq("status", "pending");
  if (sendsError) throw sendsError;
  if (!sends || sends.length === 0) throw new Error("No pending recipients found.");

  const results: SendResult[] = [];
  const successIds: string[] = [];

  for (const send of sends) {
    const contact = send.contacts as { name: string; email: string } | null;
    if (!contact) continue;

    const body = applyPersonalization(drafts[send.contact_id] ?? campaign.body, contact);

    try {
      const { error } = await resend.emails.send({
        from,
        to: contact.email,
        subject: campaign.subject,
        text: body,
        replyTo: user.email ? [user.email] : undefined,
        attachments: attachment ? [attachment] : undefined,
        tags: [
          { name: "campaign_id", value: campaignId },
          { name: "send_id", value: send.id },
        ],
      });

      if (error) throw new Error(error.message);

      successIds.push(send.id);
      results.push({
        contactId: send.contact_id,
        name: contact.name,
        email: contact.email,
        success: true,
      });
    } catch (err: unknown) {
      results.push({
        contactId: send.contact_id,
        name: contact.name,
        email: contact.email,
        success: false,
        error: err instanceof Error ? err.message : "Send failed",
      });
    }
  }

  if (successIds.length > 0) {
    await supabase.from("sends").update({ status: "sent" }).in("id", successIds);
  }

  const sent = results.filter((result) => result.success).length;
  const failed = results.filter((result) => !result.success).length;

  if (sent > 0) {
    const allProcessed = results.length === sends.length && results.every((result) => result.success);
    await supabase
      .from("campaigns")
      .update({ status: allProcessed ? "sent" : "draft" })
      .eq("id", campaignId)
      .eq("user_id", user.id);
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");

  return { results, sent, failed };
}
