"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { EditCampaignModal } from "./edit-campaign-modal";
import { deleteCampaign } from "@/app/actions/campaigns";
import type { Attachment } from "@/app/actions/attachments";

type Props = {
  campaign: { id: string; name: string; subject: string; body: string; attachment_id: string | null; status: string };
  attachments: Attachment[];
};

export function CampaignDetailClient({ campaign, attachments }: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    setDeleting(true);
    await deleteCampaign(campaign.id);
    router.push("/campaigns");
  }

  return (
    <div className="flex items-center gap-2">
      {campaign.status !== "sent" && (
        <button className="btn-secondary gap-2" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      )}
      <button
        className="btn-secondary gap-2 text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
        disabled={deleting}
      >
        <Trash2 className="h-4 w-4" />
        {deleting ? "Deleting…" : "Delete"}
      </button>
      {editing && (
        <EditCampaignModal
          campaign={campaign}
          attachments={attachments}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
