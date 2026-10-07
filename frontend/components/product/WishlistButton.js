'use client';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';

export default function WishlistButton({ productId, name = 'this product', className = '', withLabel = false }) {
  const { has, toggle } = useWishlist();
  const active = has(productId);
  return (
    <button type="button" onClick={() => toggle(productId)} aria-pressed={active} aria-label={active ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`} className={`flex cursor-pointer items-center justify-center gap-2 ${className}`}>
      <Heart key={String(active)} className={`size-5 ${active ? 'fill-black [animation:pop_.3s_ease-out]' : ''}`} aria-hidden />
      {withLabel && <span>{active ? 'Saved to wishlist' : 'Add to wishlist'}</span>}
    </button>
  );
}
