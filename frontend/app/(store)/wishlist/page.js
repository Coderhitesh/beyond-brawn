import PageHeader from '@/components/ui/PageHeader';
import WishlistGrid from '@/components/account/WishlistGrid';

export const metadata = { title: 'Wishlist', robots: { index: false } };

export default function WishlistPage() {
  return (
    <>
      <PageHeader title="Wishlist" text="Products you saved for later." crumbs={[{ name: 'Wishlist' }]} />
      <div className="container-site py-10">
        <WishlistGrid />
      </div>
    </>
  );
}
