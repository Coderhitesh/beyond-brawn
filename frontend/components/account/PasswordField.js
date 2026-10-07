'use client';
import { useState } from 'react';
import Field from '@/components/ui/Field';

export default function PasswordField({ label = 'Password', ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Field label={label} type={show ? 'text' : 'password'} {...props} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="absolute right-0 top-[26px] h-12 cursor-pointer px-3.5 text-sm font-semibold text-mute hover:text-black">
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
