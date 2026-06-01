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

export async function sendCampaign(
  campaignId: string,
  drafts: Record<string, string>
): Promise<{ results: SendResult[]; sent: number; failed: number }> {
  const supabase = await createServerSupabaseClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const providerToken = session.provider_token;
  if (!providerToken) throw new Error("Gmail access not granted. Please sign out and sign back in with Google.");

  // Get campaign
  const { data: campaign, error: campError } = await supabase
    .from("campaigns")
    .select("*, attachments(file_name, file_url, mime_type)")
    .eq("id", campaignId)
    .single();
  if (campError) throw campError;

  // Get recipients
  const { data: sends, error: sendsError } = await supabase
    .from("sends")
    .select("*, contacts(name, email)")
    .eq("campaign_id", campaignId)
    .eq("status", "pending");
  if (sendsError) throw sendsError;
  if (!sends || sends.length === 0) throw new Error("No pending recipients found.");

  // Set up Gmail client
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: providerToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const senderEmail = session.user.email!;
  const senderName = session.user.user_metadata?.full_name ?? senderEmail;

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
      const rawMessage = buildEmail({
        from: `${senderName} <${senderEmail}>`,
        to: contact.email,
        subject: campaign.subject,
        body,
      });

      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: rawMessage },
      });

      await supabase
        .from("sends")
        .update({ status: "sent" })
        .eq("id", send.id);

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
    await supabase
      .from("campaigns")
      .update({ status: sent === sends.length ? "sent" : "draft" })
      .eq("id", campaignId);
  }

  return { results, sent, failed };
}

function buildEmail({ from, to, subject, body }: { from: string; to: string; subject: string; body: string }) {
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
