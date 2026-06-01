"use client";

import { useState } from "react";
import { AIDrafts } from "./ai-drafts";
import { SendCampaign } from "./send-campaign";

type Recipient = {
  id: string;
  contact_id: string;
  status: string;
  contacts: { name: string; email: string; category: string | null; institution: string | null } | null;
};

type Props = {
  campaignId: string;
  recipients: Recipient[];
  subject: string;
  baseBody: string;
};

export function CampaignSendWrapper({ campaignId, recipients, subject, baseBody }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="flex flex-col gap-4">
      <AIDrafts
        recipients={recipients}
        subject={subject}
        baseBody={baseBody}
        onDraftsChange={setDrafts}
      />
      <div className="card p-4">
        <SendCampaign
          campaignId={campaignId}
          recipients={recipients}
          drafts={drafts}
        />
      </div>
    </div>
  );
}
