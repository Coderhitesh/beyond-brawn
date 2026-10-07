import WishlistGrid from '@/components/account/WishlistGrid';

export default function AccountWishlistPage() {
  return (
    <>
      <h1 className="display mb-6 text-5xl sm:text-6xl">Wishlist</h1>
      <WishlistGrid cols={3} />
    </>
  );
}
