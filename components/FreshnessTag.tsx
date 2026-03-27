"use client";

export function FreshnessTag({ source }: { source: string }) {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <p className="text-xs text-slate-400 mt-6 flex items-center gap-1.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      Data verified {month} · Source: {source}
    </p>
  );
}
