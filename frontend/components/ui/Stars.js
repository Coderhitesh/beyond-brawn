import { Star } from 'lucide-react';

export default function Stars({ value = 0, count, size = 14, showValue = false }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className="inline-flex items-center gap-1.5 text-sm" aria-label={`Rated ${value} out of 5${count !== undefined ? ` from ${count} reviews` : ''}`}>
      <span className="relative inline-flex" aria-hidden>
        <span className="flex text-line">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
          ))}
        </span>
        <span className="absolute inset-0 flex overflow-hidden text-black" style={{ width: `${pct}%` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
          ))}
        </span>
      </span>
      {showValue && <span className="font-semibold">{Number(value).toFixed(1)}</span>}
      {count !== undefined && <span className="text-mute">({count})</span>}
    </span>
  );
}
