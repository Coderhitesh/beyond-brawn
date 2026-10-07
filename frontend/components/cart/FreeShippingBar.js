import { Truck } from 'lucide-react';
import { formatINR } from '@/utils/format';

export default function FreeShippingBar({ pricing }) {
  if (!pricing || !pricing.freeShippingThreshold) return null;
  const away = pricing.amountToFreeShipping;
  const unlocked = pricing.shipping === 0;
  if (!unlocked && !away) return null;
  const pct = unlocked ? 100 : Math.min(100, Math.round(((pricing.freeShippingThreshold - away) / pricing.freeShippingThreshold) * 100));
  return (
    <div className="bg-bone px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="size-4 shrink-0" aria-hidden />
        {unlocked ? 'You have free shipping on this order' : `You're ${formatINR(away)} away from free shipping`}
      </p>
      <div className="mt-2 h-1.5 bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free shipping">
        <div className="h-full bg-black transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
