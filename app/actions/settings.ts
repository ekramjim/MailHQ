"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { decryptSecret, encryptSecret } from "@/lib/encryption";
import { getAuthenticatedClient } from "@/lib/supabase-server";

export type SendingSettings = {
  resend_from_name: string;
  resend_from_email: string;
  has_resend_api_key: boolean;
  updated_at: string;
};

export type SendingSettingsState = {
  error?: string;
  message?: string;
};

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeName(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function validateResendConnection(apiKey: string, fromEmail: string) {
  const resend = new Resend(apiKey);
  const { data, error } = await resend.domains.list();
  if (error) throw new Error(error.message);

  const fromDomain = fromEmail.split("@")[1];
  const matchingDomain = data.data.find((domain) => domain.name === fromDomain);

  if (!matchingDomain) {
    throw new Error(`The domain ${fromDomain} is not added to this Resend account.`);
  }

  if (matchingDomain.status !== "verified") {
    throw new Error(`The domain ${fromDomain} is not verified in Resend.`);
  }
}

export async function getSendingSettings(): Promise<SendingSettings | null> {
  const { supabase, userId } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("user_sending_settings")
    .select("resend_from_name, resend_from_email, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    resend_from_name: data.resend_from_name,
    resend_from_email: data.resend_from_email,
    has_resend_api_key: true,
    updated_at: data.updated_at,
  };
}

export async function saveSendingSettings(
  _prevState: SendingSettingsState,
  formData: FormData,
): Promise<SendingSettingsState> {
  const { supabase, userId } = await getAuthenticatedClient();

  const fromName = normalizeName(formData.get("from_name")) || "MailHQ";
  const fromEmail = normalizeEmail(formData.get("from_email"));
  const apiKey = String(formData.get("resend_api_key") ?? "").trim();

  if (!validateEmail(fromEmail)) {
    return { error: "Enter a valid sender email address." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("user_sending_settings")
    .select("resend_api_key_encrypted")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) return { error: existingError.message };
  if (!existing && !apiKey) {
    return { error: "Enter a Resend API key to connect sending." };
  }

  let encryptedApiKey = existing?.resend_api_key_encrypted;
  if (apiKey) {
    try {
      await validateResendConnection(apiKey, fromEmail);
      encryptedApiKey = encryptSecret(apiKey);
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err.message : "Could not validate the Resend connection.",
      };
    }
  } else if (existing?.resend_api_key_encrypted) {
    try {
      await validateResendConnection(decryptSecret(existing.resend_api_key_encrypted), fromEmail);
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err.message : "Could not validate the Resend connection.",
      };
    }
  }

  const { error } = await supabase.from("user_sending_settings").upsert({
    user_id: userId,
    resend_api_key_encrypted: encryptedApiKey,
    resend_from_name: fromName,
    resend_from_email: fromEmail,
  });

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { message: "Sending settings saved." };
}

export async function disconnectSendingSettings(): Promise<void> {
  const { supabase, userId } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("user_sending_settings")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;

  revalidatePath("/settings");
}
