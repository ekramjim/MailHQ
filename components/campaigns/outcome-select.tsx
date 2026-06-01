"use client";

import { useState, useTransition } from "react";
import { updateOutcome, type Outcome } from "@/app/actions/outcomes";
import { cn } from "@/lib/utils";

const OUTCOMES: { value: Outcome; label: string; style: string }[] = [
  { value: "interested", label: "Interested", style: "bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" },
  { value: "meeting_booked", label: "Meeting booked", style: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800" },
  { value: "not_interested", label: "Not interested", style: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800" },
  { value: "no_response", label: "No response", style: "bg-muted text-muted-foreground border-border" },
];

type Props = {
  sendId: string;
  current: Outcome | null;
};

export function OutcomeSelect({ sendId, current }: Props) {
  const [selected, setSelected] = useState<Outcome | null>(current);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentOutcome = OUTCOMES.find((o) => o.value === selected);

  function handleSelect(value: Outcome | null) {
    setSelected(value);
    setOpen(false);
    startTransition(async () => {
      await updateOutcome(sendId, value);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={cn(
          "badge border text-xs cursor-pointer hover:opacity-80 transition-opacity",
          currentOutcome ? currentOutcome.style : "bg-muted text-muted-foreground border-border"
        )}
      >
        {isPending ? "…" : currentOutcome ? currentOutcome.label : "Set outcome"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-50 bg-card border border-border rounded-xl shadow-lg p-1 flex flex-col gap-0.5 min-w-[160px]">
            {OUTCOMES.map((o) => (
              <button
                key={o.value}
                onClick={() => handleSelect(o.value)}
                className={cn(
                  "text-left px-3 py-1.5 text-xs rounded-lg transition-colors",
                  selected === o.value ? cn("border", o.style) : "hover:bg-muted"
                )}
              >
                {o.label}
              </button>
            ))}
            {selected && (
              <button
                onClick={() => handleSelect(null)}
                className="text-left px-3 py-1.5 text-xs rounded-lg text-muted-foreground hover:bg-muted border-t border-border mt-0.5 pt-2"
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
