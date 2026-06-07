"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Trash2 } from "lucide-react";
import {
  disconnectSendingSettings,
  saveSendingSettings,
  type SendingSettings,
  type SendingSettingsState,
} from "@/app/actions/settings";

const initialState: SendingSettingsState = {};

type Props = {
  settings: SendingSettings | null;
};

export function SendingSettingsForm({ settings }: Props) {
  const [state, formAction] = useActionState(saveSendingSettings, initialState);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-medium font-heading">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connect your Resend account to send campaigns from your own verified sender.
        </p>
      </div>

      <div className="card p-6 max-w-2xl flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-card border border-border flex items-center justify-center">
              <KeyRound className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-medium">Resend sending</h2>
              <p className="text-sm text-muted-foreground">
                {settings ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>
          {settings && <DisconnectButton />}
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Sender name
            <input
              className="input"
              name="from_name"
              defaultValue={settings?.resend_from_name ?? "MailHQ"}
              autoComplete="organization"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Sender email
            <input
              className="input"
              type="email"
              name="from_email"
              defaultValue={settings?.resend_from_email ?? ""}
              placeholder="hello@yourdomain.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Resend API key
            <input
              className="input"
              type="password"
              name="resend_api_key"
              placeholder={settings ? "Leave blank to keep current key" : "re_..."}
              autoComplete="off"
              required={!settings}
            />
          </label>

          <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground leading-relaxed">
            The sender email must be verified in your Resend account. API keys are encrypted before storage.
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.message && <p className="text-sm text-green-600">{state.message}</p>}

          <div className="flex justify-end">
            <SubmitButton hasSettings={Boolean(settings)} />
          </div>
        </form>
      </div>
    </div>
  );
}

function SubmitButton({ hasSettings }: { hasSettings: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="btn-primary" type="submit" disabled={pending}>
      {pending ? "Saving..." : hasSettings ? "Save settings" : "Connect Resend"}
    </button>
  );
}

function DisconnectButton() {
  return (
    <form action={disconnectSendingSettings}>
      <DisconnectSubmitButton />
    </form>
  );
}

function DisconnectSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="btn-secondary gap-2" type="submit" disabled={pending}>
      <Trash2 className="h-4 w-4" />
      Disconnect
    </button>
  );
}
