'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CouponBox({ coupon, onApply, onRemove }) {
  const cartCtx = useCart();
  const apply = onApply || cartCtx.applyCoupon;
  const remove = onRemove || cartCtx.removeCoupon;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 border border-dashed border-black bg-lime/25 px-3 py-2.5">
        <p className="text-sm">
          <span className="font-bold">{coupon.code}</span> applied
          {coupon.description ? <span className="block text-mute">{coupon.description}</span> : null}
        </p>
        <button type="button" onClick={() => remove()} aria-label={`Remove coupon ${coupon.code}`} className="flex size-9 shrink-0 cursor-pointer items-center justify-center hover:bg-white">
          <X className="size-4" />
        </button>
      </div>
    );
  }
  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    const err = await apply(code.trim());
    setLoading(false);
    setError(err || '');
    if (!err) setCode('');
  };
  return (
    <form onSubmit={submit}>
      <label htmlFor="coupon-code" className="label">
        Coupon code
      </label>
      <div className="flex">
        <input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" autoComplete="off" className="input h-11 border-r-0 uppercase placeholder:normal-case" aria-describedby={error ? 'coupon-error' : undefined} />
        <button type="submit" disabled={loading || !code.trim()} className="btn btn-sm btn-black h-11">
          Apply
        </button>
      </div>
      {error && (
        <p id="coupon-error" className="field-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
