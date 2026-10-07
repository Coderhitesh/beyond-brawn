import Link from 'next/link';
import Img from '@/components/ui/Img';
import { formatDate, formatINR } from '@/utils/format';
import { StatusBadge } from './OrderView';

export default function OrderList({ orders }) {
  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.orderNumber} className="border border-line">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line bg-bone px-4 py-3">
            <div>
              <p className="font-bold">{o.orderNumber}</p>
              <p className="text-sm text-mute">
                {formatDate(o.placedAt || o.createdAt)}, {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}, {formatINR(o.pricing ? o.pricing.total : 0)}
              </p>
            </div>
            <StatusBadge status={o.status} />
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              {(o.items || []).slice(0, 4).map((it) => (
                <Img key={it.id} src={it.image} alt={it.name} width={52} height={52} className="size-[52px] shrink-0 bg-bone object-cover" />
              ))}
              {(o.items || []).length > 4 && <span className="text-sm text-mute">+{o.items.length - 4}</span>}
            </div>
            <Link href={`/account/orders/${o.orderNumber}`} className="btn btn-sm btn-outline shrink-0">
              View order
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
