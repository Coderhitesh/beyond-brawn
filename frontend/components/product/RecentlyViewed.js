'use client';
import { useEffect, useState } from 'react';
import { productsByIds } from '@/services/catalog';
import ProductRow from './ProductRow';

export default function RecentlyViewed({ excludeId }) {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    let ids = [];
    try {
      ids = JSON.parse(localStorage.getItem('bb_recently_viewed') || '[]').filter((id) => id !== excludeId).slice(0, 8);
    } catch (e) {
      /* ignore */
    }
    if (!ids.length) return;
    productsByIds(ids).then((r) => setProducts(r.data.products)).catch(() => null);
  }, [excludeId]);
  return <ProductRow title="Recently viewed" products={products} />;
}
