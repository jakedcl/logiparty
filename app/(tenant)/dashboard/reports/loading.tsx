export default function ReportsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-md bg-[var(--surface-hover)]" />
        <div className="h-4 w-72 max-w-full rounded bg-[var(--surface-hover)]" />
      </div>
      <div className="h-10 w-full max-w-md rounded-md bg-[var(--surface-hover)]" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-5 w-36 rounded bg-[var(--surface-hover)]" />
          <div className="space-y-2">
            <div className="h-2.5 rounded-full bg-[var(--surface-hover)]" />
            <div className="h-2.5 w-4/5 rounded-full bg-[var(--surface-hover)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
