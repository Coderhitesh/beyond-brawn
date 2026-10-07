'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import useLockScroll from '@/hooks/useLockScroll';

// Centered dialog (default) or a side drawer (side="right" | "left").
export default function Modal({ open, onClose, title, children, side, width = 'max-w-lg', footer }) {
  useLockScroll(open);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;

  const drawer = Boolean(side);
  const panel = drawer
    ? `fixed inset-y-0 ${side === 'left' ? 'left-0 [animation:drawer-in-left_.22s_ease-out]' : 'right-0 [animation:drawer-in_.22s_ease-out]'} flex w-full ${width} flex-col bg-white shadow-2xl`
    : `relative flex max-h-[90dvh] w-full ${width} flex-col bg-white shadow-2xl`;

  return (
    <div className={`fixed inset-0 z-[80] ${drawer ? '' : 'flex items-end justify-center p-0 sm:items-center sm:p-4'}`} role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-black/60 [animation:fade-in_.15s_ease-out]" tabIndex={-1} />
      <div className={panel}>
        <div className="flex items-center justify-between border-b-2 border-black px-5 py-4">
          <h2 className="font-display text-2xl font-black uppercase leading-none">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 cursor-pointer p-2 hover:bg-bone">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
