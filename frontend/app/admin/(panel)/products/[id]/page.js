'use client';
import { use } from 'react';
import ProductForm from '@/components/admin/ProductForm';
import { Guard } from '@/components/admin/AdminShell';

export default function Page({ params }) {
  const { id } = use(params);
  return (
    <Guard perms={['products.view', 'products.manage']}>
      <ProductForm id={id} />
    </Guard>
  );
}
