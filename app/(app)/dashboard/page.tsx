export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your outreach campaigns</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Sent", value: "0" },
          { label: "Open Rate", value: "0%" },
          { label: "Reply Rate", value: "0%" },
        ].map((stat) => (
          <div key={stat.label} className="card p-6 flex flex-col gap-1">
            <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
            <span className="text-4xl font-bold font-heading text-mint">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <p className="text-muted-foreground text-sm">
          No campaigns yet. Create your first campaign to get started.
        </p>
      </div>
    </div>
  );
}
