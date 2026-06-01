"use server";

import { google } from "googleapis";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type SendResult = {
  contactId: string;
  name: string;
  email: string;
  success: boolean;
  error?: string;
};

function buildEmail({
  from, to, subject, body, attachment,
}: {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachment?: { name: string; mimeType: string; data: string };
}) {
  const boundary = "mailhq_boundary_" + Date.now();

  if (!attachment) {
    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      body,
    ].join("\r\n");
    return Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
    ``,
    `--${boundary}`,
    `Content-Type: ${attachment.mimeType}; name="${attachment.name}"`,
    `Content-Disposition: attachment; filename="${attachment.name}"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    attachment.data,
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  return Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sendCampaign(
  campaignId: string,
  drafts: Record<string, string>
): Promise<{ results: SendResult[]; sent: number; failed: number }> {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const providerToken = session.provider_token;
  if (!providerToken) throw new Error("Gmail access not granted. Please sign out and sign back in with Google.");

  const senderEmail = session.user.email!;
  const senderName = session.user.user_metadata?.full_name || senderEmail;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: providerToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const { data: campaign, error: campError } = await supabase
    .from("campaigns").select("*, attachments(file_name, file_url, mime_type)").eq("id", campaignId).single();
  if (campError) throw campError;

  // Fetch attachment file if present
  let attachmentPayload: { name: string; mimeType: string; data: string } | undefined;
  if (campaign.attachment_id && campaign.attachments) {
    const att = campaign.attachments as { file_name: string; file_url: string; mime_type: string | null };
    try {
      const res = await fetch(att.file_url);
      const buffer = await res.arrayBuffer();
      attachmentPayload = {
        name: att.file_name,
        mimeType: att.mime_type ?? "application/octet-stream",
        data: Buffer.from(buffer).toString("base64"),
      };
    } catch {
      // Send without attachment if fetch fails
    }
  }

  const { data: sends, error: sendsError } = await supabase
    .from("sends").select("*, contacts(name, email)")
    .eq("campaign_id", campaignId).eq("status", "pending");
  if (sendsError) throw sendsError;
  if (!sends || sends.length === 0) throw new Error("No pending recipients found.");

  const results: SendResult[] = [];

  for (const send of sends) {
    const contact = send.contacts as { name: string; email: string } | null;
    if (!contact) continue;

    const rawBody = drafts[send.contact_id] ?? campaign.body;
    const firstName = contact.name.split(" ")[0];
    const body = rawBody
      .replace(/\{\{name\}\}/gi, contact.name)
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{email\}\}/gi, contact.email);

    try {
      const raw = buildEmail({
        from: `${senderName} <${senderEmail}>`,
        to: contact.email,
        subject: campaign.subject,
        body,
        attachment: attachmentPayload,
      });
      await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
      await supabase.from("sends").update({ status: "sent" }).eq("id", send.id);
      results.push({ contactId: send.contact_id, name: contact.name, email: contact.email, success: true });
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

  const sent = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  if (sent > 0) {
    await supabase.from("campaigns")
      .update({ status: sent === sends.length ? "sent" : "draft" })
      .eq("id", campaignId);
  }

  return { results, sent, failed };
}
