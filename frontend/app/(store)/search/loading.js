import { ProductGridSkeleton } from '@/components/ui/States';

export default function Loading() {
  return (
    <div className="container-site py-12" role="status" aria-label="Loading">
      <div className="skeleton mb-8 h-16 w-2/3 max-w-xl" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
