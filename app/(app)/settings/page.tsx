import { getSendingSettings } from "@/app/actions/settings";
import { SendingSettingsForm } from "@/components/settings/sending-settings-form";

export default async function SettingsPage() {
  try {
    const settings = await getSendingSettings();
    return <SendingSettingsForm settings={settings} />;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "PGRST205"
    ) {
      return (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-medium font-heading">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Resend sending settings need one database migration before they can be used.
            </p>
          </div>

          <div className="card p-6 max-w-2xl flex flex-col gap-3">
            <h2 className="text-base font-medium">Database migration required</h2>
            <p className="text-sm text-muted-foreground">
              Apply <span className="font-mono text-foreground">supabase/migrations/202606070001_user_sending_settings.sql</span>, then refresh this page.
            </p>
          </div>
        </div>
      );
    }

    throw err;
  }
}
