"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { EditCampaignModal } from "./edit-campaign-modal";
import type { Attachment } from "@/app/actions/attachments";

type Props = {
  campaign: { id: string; name: string; subject: string; body: string; attachment_id: string | null; status: string };
  attachments: Attachment[];
};

export function CampaignDetailClient({ campaign, attachments }: Props) {
  const [editing, setEditing] = useState(false);

  if (campaign.status === "sent") return null;

  return (
    <>
      <button className="btn-secondary gap-2" onClick={() => setEditing(true)}>
        <Pencil className="h-4 w-4" />
        Edit
      </button>
      {editing && (
        <EditCampaignModal
          campaign={campaign}
          attachments={attachments}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
