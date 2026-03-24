export function AdSlot({ id, className = '' }: { id: string; className?: string }) {
  return (
    <div
      className={`ad-slot my-6 min-h-[90px] bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm ${className}`}
      data-ad-slot={id}
    >
      {/* AdSense will fill this slot. Replace with actual ad code after approval. */}
      <span className="hidden">Ad</span>
    </div>
  );
}
