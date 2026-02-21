export default function Header({ status }: { status: string }) {
  return (
    <header className="flex justify-between items-center mb-12 border-b border-neutral-800 pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aegis Control Plane</h1>
        <p className="text-neutral-400 mt-1">Real-time interactive telemetry</p>
      </div>
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.includes("Live") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
        {status}
      </div>
    </header>
  );
}
