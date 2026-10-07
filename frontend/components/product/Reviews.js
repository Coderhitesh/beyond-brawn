'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Star } from 'lucide-react';
import Stars from '@/components/ui/Stars';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Field from '@/components/ui/Field';
import { ErrorState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fieldErrors } from '@/lib/api';
import { createReview, productReviews, reviewEligibility, uploadReviewImage } from '@/services/catalog';
import { formatDate } from '@/utils/format';

function ReviewForm({ product, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.rating) return setErrors({ rating: 'Choose a star rating' });
    setLoading(true);
    setErrors({});
    try {
      let images = [];
      if (file) images = [(await uploadReviewImage(file)).data.url];
      const res = await createReview({ productId: product._id, ...form, images });
      toast.success(res.message);
      onDone();
    } catch (err) {
      setErrors({ ...fieldErrors(err), form: err.message });
    } finally {
      setLoading(false);
    }
    return null;
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, rating: n }))} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={form.rating === n} className="cursor-pointer p-1">
              <Star className={`size-8 ${n <= form.rating ? 'fill-black' : 'text-line'}`} strokeWidth={n <= form.rating ? 0 : 1.5} />
            </button>
          ))}
        </div>
        {errors.rating && <p className="field-error">{errors.rating}</p>}
      </fieldset>
      <Field label="Headline (optional)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} maxLength={120} error={errors.title} />
      <Field as="textarea" rows={5} label="Your review" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} maxLength={2000} required error={errors.comment} hint="Taste, mixability, results: whatever would help someone decide." />
      <div>
        <label htmlFor="review-photo" className="label">
          Photo (optional)
        </label>
        <input id="review-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} className="block w-full text-sm file:mr-3 file:h-10 file:cursor-pointer file:border-0 file:bg-black file:px-4 file:font-semibold file:text-white" />
      </div>
      {errors.form && !errors.comment && !errors.title && (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      )}
      <Button type="submit" variant="lime" loading={loading} className="w-full">
        Submit review
      </Button>
    </form>
  );
}

export default function Reviews({ product }) {
  const { user } = useAuth();
  const [state, setState] = useState({ reviews: [], meta: null, loading: true, error: null });
  const [sort, setSort] = useState('newest');
  const [eligibility, setEligibility] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(
    async (page = 1, append = false) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await productReviews(product.slug, page, sort);
        setState((s) => ({ reviews: append ? [...s.reviews, ...res.data.reviews] : res.data.reviews, meta: res.meta, loading: false, error: null }));
      } catch (e) {
        setState((s) => ({ ...s, loading: false, error: e.message }));
      }
    },
    [product.slug, sort]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const checkEligibility = useCallback(() => {
    if (!user) return setEligibility(null);
    return reviewEligibility(product._id).then((r) => setEligibility(r.data)).catch(() => null);
  }, [user, product._id]);
  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const total = product.ratingCount || 0;
  const breakdown = product.ratingBreakdown || {};

  let cta;
  if (!user) cta = <Link href={`/login?next=/products/${product.slug}%23reviews`} className="btn btn-outline btn-sm">Log in to write a review</Link>;
  else if (eligibility && eligibility.canReview) cta = <Button variant="black" size="sm" onClick={() => setFormOpen(true)}>Write a review</Button>;
  else if (eligibility && eligibility.existing) cta = <p className="text-sm text-mute">{eligibility.existing.status === 'pending' ? 'Your review is waiting for approval.' : 'You have reviewed this product.'}</p>;
  else if (eligibility) cta = <p className="text-sm text-mute">You can review this product once it has been delivered to you.</p>;

  return (
    <section id="reviews" className="scroll-mt-28">
      <h2 className="h-section border-b-2 border-black pb-3">Customer reviews</h2>
      <div className="mt-8 grid gap-10 lg:grid-cols-[300px_1fr]">
        <div>
          <div className="flex items-end gap-3">
            <span className="font-display text-7xl font-black leading-[0.8]">{total ? Number(product.ratingAverage).toFixed(1) : '0.0'}</span>
            <div className="pb-1">
              <Stars value={product.ratingAverage} size={18} />
              <p className="text-sm text-mute">{total} verified {total === 1 ? 'review' : 'reviews'}</p>
            </div>
          </div>
          <ul className="mt-5 space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = breakdown[n] || 0;
              return (
                <li key={n} className="flex items-center gap-2 text-sm">
                  <span className="w-12 shrink-0">{n} star</span>
                  <span className="h-2 flex-1 bg-bone">
                    <span className="block h-full bg-black" style={{ width: total ? `${(c / total) * 100}%` : 0 }} />
                  </span>
                  <span className="w-6 text-right tabular-nums text-mute">{c}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-6">{cta}</div>
        </div>

        <div>
          {state.reviews.length > 0 && (
            <div className="mb-4 flex justify-end">
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort reviews" className="h-10 cursor-pointer border border-black bg-white px-3 text-sm font-semibold">
                <option value="newest">Newest first</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </div>
          )}
          {state.error && <ErrorState message={state.error} onRetry={() => load(1)} />}
          {!state.error && !state.loading && state.reviews.length === 0 && <p className="border border-dashed border-line px-6 py-10 text-center text-mute">No reviews yet. Bought this? Yours could be the first.</p>}
          <ul className="divide-y divide-line">
            {state.reviews.map((r) => (
              <li key={r.id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={r.rating} />
                  {r.title && <h3 className="font-bold">{r.title}</h3>}
                </div>
                <p className="mt-2 max-w-prose whitespace-pre-line leading-relaxed">{r.comment}</p>
                {r.images && r.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.images[0]} alt={`Photo from ${r.name}`} loading="lazy" className="mt-3 size-24 object-cover" />
                )}
                <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-mute">
                  <span className="font-semibold text-ink">{r.name}</span>
                  {r.isVerifiedPurchase && (
                    <span className="flex items-center gap-1">
                      <BadgeCheck className="size-4" aria-hidden />
                      Verified purchase
                    </span>
                  )}
                  <span>{formatDate(r.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
          {state.meta && state.meta.page < state.meta.pages && (
            <Button variant="outline" size="sm" className="mt-4" loading={state.loading} onClick={() => load(state.meta.page + 1, true)}>
              Show more reviews
            </Button>
          )}
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Write a review">
        <ReviewForm
          product={product}
          onDone={() => {
            setFormOpen(false);
            checkEligibility();
          }}
        />
      </Modal>
    </section>
  );
}
