'use client';
import { useEffect, useState } from 'react';
import Img from '@/components/ui/Img';

// Main image zooms towards the cursor on hover (desktop). Thumbnails switch the image.
export default function Gallery({ images = [], name, activeUrl }) {
  const list = images.length ? images : [{ url: '/placeholders/product.svg', alt: name }];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(null);

  // Selecting a variant with its own image jumps to (or temporarily shows) that image.
  const variantIndex = activeUrl ? list.findIndex((i) => i.url === activeUrl) : -1;
  useEffect(() => {
    if (variantIndex >= 0) setIndex(variantIndex);
  }, [variantIndex]);
  const current = activeUrl && variantIndex < 0 ? { url: activeUrl, alt: name } : list[index] || list[0];

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {list.length > 1 && (
        <ul className="scrollbar-none flex gap-2 overflow-x-auto md:max-h-[560px] md:flex-col md:overflow-y-auto">
          {list.map((img, i) => (
            <li key={img.url + i} className="shrink-0">
              <button type="button" onClick={() => setIndex(i)} aria-label={`Show image ${i + 1} of ${list.length}`} aria-current={i === index} className={`relative block size-16 cursor-pointer bg-bone md:size-20 ${i === index ? 'outline-2 outline-black' : 'opacity-70 hover:opacity-100'}`}>
                <Img src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative aspect-square flex-1 overflow-hidden bg-bone md:cursor-zoom-in" onMouseMove={onMove} onMouseLeave={() => setZoom(null)}>
        <Img
          src={current.url}
          alt={current.alt || name}
          fill
          priority
          sizes="(min-width:1024px) 46vw, 100vw"
          className="object-cover transition-transform duration-150 ease-out"
          style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>
    </div>
  );
}
