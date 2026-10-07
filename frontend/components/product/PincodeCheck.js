'use client';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { checkPincode } from '@/services/orders';
import { formatDate } from '@/utils/format';

export default function PincodeCheck() {
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) return setState({ error: 'Enter a valid 6-digit pincode' });
    setLoading(true);
    try {
      const res = await checkPincode(pincode);
      setState(res.data.serviceable ? { methods: res.data.methods } : { error: res.data.reason });
    } catch (err) {
      setState({ error: err.message });
    } finally {
      setLoading(false);
    }
    return null;
  };

  return (
    <div>
      <form onSubmit={submit} className="flex max-w-sm">
        <label htmlFor="pincode-check" className="sr-only">
          Delivery pincode
        </label>
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" aria-hidden />
          <input id="pincode-check" inputMode="numeric" maxLength={6} value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} placeholder="Enter pincode" className="input h-11 border-r-0 border-black pl-9" />
        </div>
        <button type="submit" disabled={loading} className="btn btn-sm btn-black h-11">
          Check
        </button>
      </form>
      <div aria-live="polite" className="mt-2 text-sm">
        {state && state.error && <p className="font-semibold text-danger">{state.error}</p>}
        {state &&
          state.methods &&
          state.methods.map((m) => (
            <p key={m.code}>
              <span className="font-semibold">{m.name}:</span> arrives {formatDate(m.estimate.from, { day: 'numeric', month: 'short' })} to {formatDate(m.estimate.to, { day: 'numeric', month: 'short' })}
            </p>
          ))}
      </div>
    </div>
  );
}
