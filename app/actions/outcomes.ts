"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedClient } from "@/lib/supabase-server";

export type Outcome = "interested" | "meeting_booked" | "not_interested" | "no_response";

export async function updateOutcome(sendId: string, outcome: Outcome | null) {
  const { supabase } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("sends")
    .update({
      outcome,
      ...(outcome && outcome !== "no_response" ? { replied_at: new Date().toISOString() } : outcome === null ? { replied_at: null } : {}),
    })
    .eq("id", sendId);

  if (error) throw error;
  revalidatePath("/campaigns/[id]", "page");
}
