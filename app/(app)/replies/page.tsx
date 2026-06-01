import { MessageSquare } from "lucide-react";

export default function RepliesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-medium font-heading">Replies</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track replies to your campaigns</p>
      </div>
      <div className="card p-12 text-center flex flex-col items-center gap-3">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Reply tracking coming soon via Resend webhooks.</p>
        <p className="text-xs text-muted-foreground">For now, mark outcomes manually on each campaign.</p>
      </div>
    </div>
  );
}
