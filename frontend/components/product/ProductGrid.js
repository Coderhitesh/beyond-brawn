import ProductCard from './ProductCard';

export default function ProductGrid({ products, cols = 4, priorityCount = 0 }) {
  const grid = cols === 3 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  return (
    <ul className={`grid ${grid} gap-x-4 gap-y-10 sm:gap-x-6`}>
      {products.map((p, i) => (
        <li key={p._id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
