'use client';
import ProductForm from '@/components/admin/ProductForm';
import { Guard } from '@/components/admin/AdminShell';

export default function Page() {
  return (
    <Guard perms={['products.manage']}>
      <ProductForm />
    </Guard>
  );
}
