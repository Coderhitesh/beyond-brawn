'use client';
import { useState } from 'react';

const W = 720;
const H = 220;
const PAD = { l: 44, r: 8, t: 10, b: 24 };

const nice = (max) => {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};
const short = (n) => (n >= 1e7 ? `${+(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `${+(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : String(n));

/*
 * Dependency-free SVG chart. type: 'area' | 'bars'.
 * data: [{ label, value }]. format(value) renders the tooltip number.
 */
export default function Chart({ data = [], type = 'area', format = (v) => v, label = 'Chart' }) {
  const [hover, setHover] = useState(null);
  if (!data.length) return <p className="py-10 text-center text-sm text-mute">No data for this period.</p>;
  const max = nice(Math.max(...data.map((d) => d.value), 0));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const step = iw / data.length;
  const x = (i) => PAD.l + step * i + step / 2;
  const y = (v) => PAD.t + ih - (v / max) * ih;
  // Small whole-number ranges (order counts) get one tick per integer instead of repeated rounded fractions.
  const ticks = max <= 4 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const every = Math.ceil(data.length / 8);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${label}. Total ${format(total)} across ${data.length} periods.`} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="var(--color-mute)">
              {short(Math.round(t))}
            </text>
          </g>
        ))}
        {type === 'area' ? (
          <>
            <path d={`${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill="var(--color-lime)" opacity="0.35" />
            <path d={line} fill="none" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
          </>
        ) : (
          data.map((d, i) => <rect key={d.label} x={x(i) - Math.min(step * 0.35, 14)} width={Math.min(step * 0.7, 28)} y={y(d.value)} height={Math.max(0, y(0) - y(d.value))} fill={hover === i ? 'var(--color-lime)' : '#000'} />)
        )}
        {data.map((d, i) => (i % every === 0 ? <text key={d.label} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--color-mute)">{d.short || d.label}</text> : null))}
        {hover !== null && type === 'area' && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} stroke="#000" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(data[hover].value)} r="4" fill="var(--color-lime)" stroke="#000" strokeWidth="2" />
          </>
        )}
        {data.map((d, i) => (
          <rect key={`h-${d.label}`} x={PAD.l + step * i} y={PAD.t} width={step} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 bg-black px-2 py-1 text-xs text-white" style={{ left: `${Math.min(82, Math.max(2, (x(hover) / W) * 100 - 6))}%` }}>
          <span className="block text-white/70">{data[hover].label}</span>
          <span className="font-bold">{format(data[hover].value)}</span>
        </div>
      )}
      {/* Same numbers for screen readers and keyboard users */}
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
