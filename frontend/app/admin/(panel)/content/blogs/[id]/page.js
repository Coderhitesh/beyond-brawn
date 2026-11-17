'use client';
import { use } from 'react';
import BlogForm from '@/components/admin/BlogForm';
import { Guard } from '@/components/admin/AdminShell';

export default function Page({ params }) {
  const { id } = use(params);
  return (
    <Guard perms={['content.manage']}>
      <BlogForm id={id} />
    </Guard>
  );
}
