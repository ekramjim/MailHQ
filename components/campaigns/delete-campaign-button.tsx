"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteCampaign } from "@/app/actions/campaigns";

export function DeleteCampaignButton({ id }: { id: string }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    setDeleting(true);
    await deleteCampaign(id);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      aria-label="Delete campaign"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
