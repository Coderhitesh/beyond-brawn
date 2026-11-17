'use client';
import BlogForm from '@/components/admin/BlogForm';
import { Guard } from '@/components/admin/AdminShell';

export default function Page() {
  return (
    <Guard perms={['content.manage']}>
      <BlogForm />
    </Guard>
  );
}
