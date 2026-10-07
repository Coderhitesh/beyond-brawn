import Link from 'next/link';
import JsonLd from './JsonLd';
import { breadcrumbLd } from '@/lib/seo';

export default function Breadcrumbs({ items }) {
  const all = [{ name: 'Home', href: '/' }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-mute">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {all.map((it, i) => (
          <li key={it.name} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href && i < all.length - 1 ? (
              <Link href={it.href} className="hover:text-black hover:underline">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
      <JsonLd data={breadcrumbLd(all)} />
    </nav>
  );
}
