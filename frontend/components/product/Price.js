import { formatINR } from '@/utils/format';

export default function Price({ price, mrp, size = 'md', showSaving = false }) {
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const big = size === 'lg';
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className={big ? 'font-display text-5xl font-black leading-none' : 'text-lg font-bold'}>{formatINR(price)}</span>
      {off > 0 && (
        <>
          <span className={`text-mute line-through ${big ? 'text-lg' : 'text-sm'}`}>
            <span className="sr-only">MRP </span>
            {formatINR(mrp)}
          </span>
          <span className={`tag bg-lime text-black ${big ? 'text-sm' : ''}`}>{off}% off</span>
          {showSaving && <span className="w-full text-sm font-semibold text-lime-deep">You save {formatINR(mrp - price)}</span>}
        </>
      )}
    </div>
  );
}
