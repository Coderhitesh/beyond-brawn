'use client';
import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, LoaderCircle, Star, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { uploadImages } from '@/services/admin';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

function DropZone({ onFiles, busy, multiple, compact }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center border-2 border-dashed text-center ${compact ? 'p-3' : 'p-6'} ${over ? 'border-black bg-lime/20' : 'border-line bg-bone/50'}`}
    >
      {busy ? <LoaderCircle className="size-6 animate-spin text-mute" aria-label="Uploading" /> : <Upload className="size-6 text-mute" aria-hidden />}
      <p className="mt-2 text-sm">
        Drag {multiple ? 'images' : 'an image'} here or{' '}
        <button type="button" onClick={() => input.current.click()} disabled={busy} className="cursor-pointer font-semibold underline">
          choose {multiple ? 'files' : 'a file'}
        </button>
      </p>
      <p className="text-xs text-mute">JPG, PNG, WEBP or AVIF, up to 5 MB each</p>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        hidden
        onChange={(e) => {
          if (e.target.files.length) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function useUpload(folder) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const upload = async (files) => {
    setBusy(true);
    try {
      return (await uploadImages(files, folder)).data.images;
    } catch (e) {
      toast.error(e.message);
      return [];
    } finally {
      setBusy(false);
    }
  };
  return { busy, upload };
}

// One image stored as a URL string (banner, category image, logo, blog cover).
export function SingleImage({ value, onChange, folder = 'misc' }) {
  const { busy, upload } = useUpload(folder);
  if (value) {
    return (
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Current upload" className="h-24 w-24 border border-line bg-bone object-contain" />
        <div className="min-w-0 flex-1">
          <input className="ainput" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Image URL" />
          <button type="button" onClick={() => onChange('')} className="mt-1.5 flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-danger">
            <Trash2 className="size-3.5" aria-hidden />
            Remove image
          </button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <DropZone compact busy={busy} onFiles={async (files) => {
        const [img] = await upload([files[0]]);
        if (img) onChange(img.url);
      }} />
      <input className="ainput mt-2" placeholder="or paste an image URL" onBlur={(e) => e.target.value.trim() && onChange(e.target.value.trim())} aria-label="Image URL" />
    </div>
  );
}

// Product gallery: [{ url, publicId, alt }], with a chosen thumbnail.
export function Gallery({ images, onChange, thumbnail, onThumbnail, folder = 'products' }) {
  const { busy, upload } = useUpload(folder);
  const move = (i, dir) => {
    const next = [...images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i) => {
    const gone = images[i];
    const next = images.filter((_, x) => x !== i);
    onChange(next);
    if (thumbnail === gone.url) onThumbnail(next[0] ? next[0].url : '');
  };
  return (
    <div>
      <DropZone multiple busy={busy} onFiles={async (files) => {
        const added = await upload(files);
        if (!added.length) return;
        const next = [...images, ...added.map((a) => ({ url: a.url, publicId: a.publicId, alt: '' }))].slice(0, 12);
        onChange(next);
        if (!thumbnail) onThumbnail(next[0].url);
      }} />
      {images.length > 0 && (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((img, i) => {
            const isThumb = thumbnail === img.url;
            return (
              <li key={img.url} className={`flex gap-3 border p-2 ${isThumb ? 'border-2 border-black' : 'border-line'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="size-20 shrink-0 bg-bone object-cover" />
                <div className="min-w-0 flex-1">
                  <input className="ainput h-8" placeholder="Alt text (describe the image)" value={img.alt || ''} onChange={(e) => onChange(images.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} aria-label={`Alt text for image ${i + 1}`} />
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <button type="button" onClick={() => onThumbnail(img.url)} disabled={isThumb} className={`abtn abtn-sm ${isThumb ? 'abtn-lime' : 'abtn-ghost'}`}>
                      <Star className="size-3.5" aria-hidden />
                      {isThumb ? 'Thumbnail' : 'Set as thumbnail'}
                    </button>
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="abtn abtn-ghost abtn-sm px-2">
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move later" className="abtn abtn-ghost abtn-sm px-2">
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => remove(i)} aria-label="Remove image" className="abtn abtn-danger abtn-sm px-2">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
