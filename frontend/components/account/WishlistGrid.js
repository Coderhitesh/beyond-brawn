'use client';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { EmptyState, ProductGridSkeleton } from '@/components/ui/States';
import ProductGrid from '@/components/product/ProductGrid';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';

export default function WishlistGrid({ cols = 4 }) {
  const { user, loading: authLoading } = useAuth();
  const { products, loading } = useWishlist();
  if (authLoading || (user && loading)) return <ProductGridSkeleton count={4} />;
  if (!user) {
    return (
      <div className="flex flex-col items-center border border-dashed border-line px-6 py-16 text-center">
        <Heart className="mb-4 size-10 text-mute" strokeWidth={1.5} aria-hidden />
        <h2 className="font-display text-3xl font-black uppercase leading-none">Log in to see your wishlist</h2>
        <p className="mt-2 max-w-md text-mute">Saved products stay with your account, on every device.</p>
        <Link href="/login?next=/wishlist" className="btn btn-lime mt-6">
          Log in
        </Link>
      </div>
    );
  }
  if (!products.length) return <EmptyState icon={Heart} title="Your wishlist is empty" text="Tap the heart on any product to save it for later." action="Browse products" href="/shop" />;
  return <ProductGrid products={products} cols={cols} />;
}
