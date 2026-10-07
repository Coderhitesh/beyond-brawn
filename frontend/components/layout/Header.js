'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import MobileNav from './MobileNav';
import SearchOverlay from './SearchOverlay';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { mega: true, label: 'Categories' },
  { href: '/shop?bestSeller=1&sort=best-selling', label: 'Best sellers' },
  { href: '/shop?newArrival=1&sort=newest', label: 'New arrivals' },
  { href: '/shop?offers=1', label: 'Offers' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

function IconLink({ href, label, count, children, onClick }) {
  const cls = 'relative flex size-11 cursor-pointer items-center justify-center hover:bg-bone';
  const badge = count > 0 && (
    <span key={count} className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center bg-lime px-1 text-[11px] font-bold text-black [animation:pop_.3s_ease-out]">
      {count > 99 ? '99+' : count}
    </span>
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-label={count ? `${label}, ${count} items` : label} className={cls}>
      {children}
      {badge}
    </button>
  ) : (
    <Link href={href} aria-label={count ? `${label}, ${count} items` : label} className={cls}>
      {children}
      {badge}
    </Link>
  );
}

export default function Header({ categories = [], logoUrl }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { cart, openDrawer } = useCart();
  const wishlist = useWishlist();
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const megaRef = useRef(null);
  const closeTimer = useRef(null);

  // Any navigation closes whatever is open.
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!megaOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMegaOpen(false);
    const onClick = (e) => megaRef.current && !megaRef.current.contains(e.target) && setMegaOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [megaOpen]);

  const hovering = useRef(false);
  const hoverOpen = () => {
    hovering.current = true;
    clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const hoverClose = () => {
    hovering.current = false;
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  };
  // With a mouse the menu is already open from hover, so a click must not close it again.
  // Keyboard and touch (no hover) toggle as usual.
  const clickMega = () => setMegaOpen((o) => (hovering.current ? true : !o));

  return (
    <header className="sticky top-0 z-50 border-b-2 border-black bg-white">
      <div className="container-site flex h-16 items-center gap-2 lg:h-[72px] lg:gap-8">
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="-ml-2 flex size-11 cursor-pointer items-center justify-center lg:hidden">
          <Menu className="size-6" />
        </button>
        <Logo src={logoUrl} className="mr-auto lg:mr-0" />

        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 lg:flex" ref={megaRef}>
          {NAV.map((item) =>
            item.mega ? (
              <div key={item.label} onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
                <button type="button" aria-expanded={megaOpen} aria-controls="mega-menu" onClick={clickMega} className="flex h-[72px] cursor-pointer items-center gap-1 px-3 text-[15px] font-semibold hover:text-lime-deep">
                  {item.label}
                  <ChevronDown className={`size-4 transition-transform ${megaOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
                {megaOpen && (
                  <div id="mega-menu" className="absolute inset-x-0 top-full border-y-2 border-black bg-white shadow-xl">
                    <div className="container-site grid grid-cols-5 gap-8 py-8">
                      {categories.map((cat) => (
                        <div key={cat._id}>
                          <Link href={`/category/${cat.slug}`} className="block border-b-[5px] border-black pb-2 font-display text-2xl font-black uppercase leading-none hover:border-lime">
                            {cat.name}
                          </Link>
                          <ul className="mt-3 space-y-1">
                            {cat.subCategories.map((sub) => (
                              <li key={sub._id}>
                                <Link href={`/category/${cat.slug}?subcategory=${sub.slug}`} className="block border-b border-line py-1.5 text-[15px] hover:border-black hover:font-semibold">
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link key={item.label} href={item.href} className="flex h-[72px] items-center px-3 text-[15px] font-semibold hover:text-lime-deep">
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center">
          <IconLink label="Search" onClick={() => setSearchOpen(true)}>
            <Search className="size-[22px]" />
          </IconLink>
          <span className="hidden lg:contents">
            <IconLink href={user ? '/account' : '/login'} label={user ? 'My account' : 'Log in'}>
              <User className="size-[22px]" />
            </IconLink>
            <IconLink href="/wishlist" label="Wishlist" count={wishlist.count}>
              <Heart className="size-[22px]" />
            </IconLink>
          </span>
          <IconLink label="Cart" count={cart.itemCount} onClick={openDrawer}>
            <ShoppingBag className="size-[22px]" />
          </IconLink>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} categories={categories} nav={NAV.filter((n) => !n.mega)} user={user} wishlistCount={wishlist.count} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
