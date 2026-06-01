"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type Outcome = "interested" | "meeting_booked" | "not_interested" | "no_response";

export async function updateOutcome(sendId: string, outcome: Outcome | null) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("sends")
    .update({
      outcome,
      replied_at: outcome && outcome !== "no_response" ? new Date().toISOString() : null,
    })
    .eq("id", sendId);

  if (error) throw error;
  revalidatePath("/campaigns/[id]", "page");
}
