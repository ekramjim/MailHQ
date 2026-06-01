import { getContacts } from "@/app/actions/contacts";
import { getAttachments } from "@/app/actions/attachments";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export default async function NewCampaignPage() {
  const [contacts, attachments] = await Promise.all([getContacts(), getAttachments()]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-medium font-heading">New campaign</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Draft an outreach campaign and pick your recipients</p>
      </div>
      <CampaignForm contacts={contacts} attachments={attachments} />
    </div>
  );
}
