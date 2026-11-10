/**
 * Shown the instant a link is tapped, while the server renders the next
 * page. Without it the old page sits frozen until the new one arrives,
 * which reads as the app being slow.
 */
export default function Loading() {
  return (
    <div className="animate-pulse pt-8" aria-busy="true">
      <div className="h-3 w-24 rounded-full bg-surface-high" />
      <div className="mt-5 h-8 w-3/4 rounded-full bg-surface-high" />
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] rounded-[10px] border border-border bg-surface" />
            <div className="mt-3 h-3 w-4/5 rounded-full bg-surface-high" />
            <div className="mt-2 h-2.5 w-1/2 rounded-full bg-surface-high" />
          </div>
        ))}
      </div>
    </div>
  );
}
