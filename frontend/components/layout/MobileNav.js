'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Heart, Package, User } from 'lucide-react';
import Modal from '@/components/ui/Modal';

export default function MobileNav({ open, onClose, categories, nav, user, wishlistCount }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <Modal open={open} onClose={onClose} title="Menu" side="left" width="max-w-sm">
      <nav aria-label="Mobile" className="-mx-5 -my-5">
        <div className="grid grid-cols-3 border-b-2 border-black text-center text-sm font-semibold">
          <Link href={user ? '/account' : '/login'} className="flex flex-col items-center gap-1 border-r border-line py-4">
            <User className="size-5" aria-hidden />
            {user ? 'Account' : 'Log in'}
          </Link>
          <Link href={user ? '/account/orders' : '/track-order'} className="flex flex-col items-center gap-1 border-r border-line py-4">
            <Package className="size-5" aria-hidden />
            {user ? 'Orders' : 'Track order'}
          </Link>
          <Link href="/wishlist" className="flex flex-col items-center gap-1 py-4">
            <Heart className="size-5" aria-hidden />
            Wishlist{wishlistCount ? ` (${wishlistCount})` : ''}
          </Link>
        </div>

        <ul>
          {categories.map((cat) => {
            const isOpen = expanded === cat._id;
            return (
              <li key={cat._id} className="border-b border-line">
                <button type="button" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : cat._id)} className="flex w-full cursor-pointer items-center justify-between px-5 py-4 font-display text-2xl font-black uppercase leading-none">
                  {cat.name}
                  <ChevronDown className={`size-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
                {isOpen && (
                  <ul className="bg-bone px-5 pb-3">
                    <li>
                      <Link href={`/category/${cat.slug}`} className="block py-2.5 font-semibold">
                        All {cat.name.toLowerCase()}
                      </Link>
                    </li>
                    {cat.subCategories.map((sub) => (
                      <li key={sub._id}>
                        <Link href={`/category/${cat.slug}?subcategory=${sub.slug}`} className="block py-2.5">
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <ul className="py-2">
          {nav.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="block px-5 py-3 text-[17px] font-semibold">
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/blog" className="block px-5 py-3 text-[17px] font-semibold">
              Blog
            </Link>
          </li>
          <li>
            <Link href="/faq" className="block px-5 py-3 text-[17px] font-semibold">
              Help & FAQ
            </Link>
          </li>
        </ul>
      </nav>
    </Modal>
  );
}
