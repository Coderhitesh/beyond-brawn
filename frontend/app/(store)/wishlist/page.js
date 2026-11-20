import PageHeader from '@/components/ui/PageHeader';
import WishlistGrid from '@/components/account/WishlistGrid';
import { staticMetadata } from '@/lib/seo-pages';

export const metadata = staticMetadata('/wishlist');

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
