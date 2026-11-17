'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Eye, Save, Send, Trash2 } from 'lucide-react';
import { useAdmin } from '@/context/AdminAuthContext';
import { useToast } from '@/context/ToastContext';
import { fieldErrors } from '@/lib/api';
import { adminApi } from '@/services/admin';
import { clearOptionCache, useOptions } from './FormFields';
import { SingleImage } from './ImageUpload';
import RichText from './RichText';
import { Btn, Card, Confirm, ErrorBox, Loading, PageTitle, Toggle } from './ui';

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '', coverImage: '', category: '', author: 'Team Beyond Brawn', tags: '', isPublished: false,
  seo: { title: '', description: '', keywords: '' },
};

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

const plain = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function fromApi(b) {
  return {
    ...EMPTY,
    title: b.title || '',
    slug: b.slug || '',
    excerpt: b.excerpt || '',
    content: b.content || '',
    coverImage: b.coverImage || '',
    category: (b.category && typeof b.category === 'object' ? b.category._id : b.category) || '',
    author: b.author || '',
    tags: (b.tags || []).join(', '),
    isPublished: Boolean(b.isPublished),
    seo: { ...EMPTY.seo, ...(b.seo || {}) },
  };
}

function toApi(f) {
  const body = {
    title: f.title.trim(),
    excerpt: f.excerpt.trim(),
    content: f.content,
    coverImage: f.coverImage || null,
    category: f.category || null,
    author: f.author.trim() || 'Team Beyond Brawn',
    tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
    isPublished: f.isPublished,
    seo: { title: f.seo.title.trim(), description: f.seo.description.trim(), keywords: f.seo.keywords.trim() },
  };
  if (f.slug.trim()) body.slug = slugify(f.slug);
  return body;
}

function Counter({ value = '', max }) {
  const n = value.length;
  return <span className={`text-[11px] ${n > max ? 'font-bold text-danger' : 'text-mute'}`}>{n}/{max}</span>;
}

export default function BlogForm({ id }) {
  const router = useRouter();
  const toast = useToast();
  const { can } = useAdmin();
  const canManage = can('content.manage');
  const categories = useOptions('/blog-categories');
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY); // last saved state, for the unsaved-changes guard
  const [meta, setMeta] = useState(null); // { slug, publishedAt, updatedAt, readMinutes }
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [removing, setRemoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const slugTouched = useRef(Boolean(id));

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  const apply = (item) => {
    const f = fromApi(item);
    setForm(f);
    setSaved(f);
    setMeta({ slug: item.slug, publishedAt: item.publishedAt, updatedAt: item.updatedAt, readMinutes: item.readMinutes, isPublished: item.isPublished });
  };

  const load = () => {
    setLoading(true);
    setLoadError(null);
    adminApi(`/blogs/${id}`)
      .then((r) => apply(r.data.item))
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Warn before closing / reloading the tab with unsaved work.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBefore = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, [dirty]);

  // Ctrl+S saves.
  const saveRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (saveRef.current) saveRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setSeo = (patch) => setForm((f) => ({ ...f, seo: { ...f.seo, ...patch } }));
  const onTitle = (title) => set(slugTouched.current ? { title } : { title, slug: slugify(title) });

  const check = (f) => {
    const e = {};
    if (f.title.trim().length < 3) e.title = 'Enter a title (at least 3 characters)';
    if (f.excerpt.length > 400) e.excerpt = 'Keep the summary under 400 characters';
    if (f.seo.title.length > 160) e['seo.title'] = 'Keep the SEO title under 160 characters';
    if (f.seo.description.length > 320) e['seo.description'] = 'Keep the SEO description under 320 characters';
    if (f.seo.keywords.length > 320) e['seo.keywords'] = 'Keep the keywords under 320 characters';
    if (f.isPublished && !plain(f.content)) e.content = 'Write the article before publishing it';
    return e;
  };

  const save = async (publish) => {
    if (!canManage || saving) return;
    const next = publish === undefined ? form : { ...form, isPublished: publish };
    const v = check(next);
    setErrors(v);
    if (Object.keys(v).length) {
      toast.error(Object.values(v)[0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const body = toApi(next);
      const res = id ? await adminApi(`/blogs/${id}`, { method: 'PUT', body }) : await adminApi('/blogs', { method: 'POST', body });
      toast.success(res.message);
      clearOptionCache('/blogs');
      const item = res.data.item;
      if (id) apply(item);
      else {
        const f = fromApi(item);
        setSaved(f); // so the guard does not fire on the redirect
        setForm(f);
        router.replace(`/admin/content/blogs/${item._id}`);
      }
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  saveRef.current = () => save();

  const remove = async () => {
    setDeleting(true);
    try {
      const res = await adminApi(`/blogs/${id}`, { method: 'DELETE' });
      toast.success(res.message);
      setSaved(form);
      router.replace('/admin/content/blogs');
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  };

  const back = (e) => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) e.preventDefault();
  };

  if (loading) return <Loading />;
  if (loadError) return <ErrorBox message={loadError} onRetry={load} />;

  const seoTitle = form.seo.title || form.title || 'Article title';
  const seoDesc = form.seo.description || form.excerpt || plain(form.content).slice(0, 160) || 'Article summary shows here.';
  const urlSlug = form.slug || slugify(form.title) || 'article-url';
  const err = (k) => errors[k] && <p className="mt-1 text-xs font-semibold text-danger">{errors[k]}</p>;

  return (
    <>
      <PageTitle title={id ? form.title || 'Edit article' : 'New article'} crumbs={[{ label: 'Content' }, { label: 'Blog', href: '/admin/content/blogs' }, { label: id ? 'Edit' : 'New' }]}>
        <Link href="/admin/content/blogs" onClick={back} className="abtn abtn-ghost">
          <ArrowLeft className="size-4" aria-hidden />
          All articles
        </Link>
        {id && meta && meta.isPublished && (
          <a href={`/blog/${meta.slug}`} target="_blank" rel="noopener noreferrer" className="abtn abtn-ghost">
            <ExternalLink className="size-4" aria-hidden />
            View live
          </a>
        )}
      </PageTitle>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ---------- main column ---------- */}
        <div className="min-w-0 space-y-5">
          <Card>
            <div className="space-y-4">
              <div>
                <label htmlFor="blog-title" className="alabel">
                  Title <span className="text-danger">*</span>
                </label>
                <input id="blog-title" className="ainput h-12 text-lg font-semibold" value={form.title} onChange={(e) => onTitle(e.target.value)} maxLength={200} placeholder="e.g. Whey vs plant protein: which one should you pick?" disabled={!canManage} />
                {err('title')}
              </div>
              <div>
                <label htmlFor="blog-slug" className="alabel">
                  URL slug
                </label>
                <div className="flex items-stretch">
                  <span className="hidden items-center border border-r-0 border-line bg-bone px-2 text-xs text-mute sm:flex">/blog/</span>
                  <input
                    id="blog-slug"
                    className="ainput"
                    value={form.slug}
                    onChange={(e) => {
                      slugTouched.current = true;
                      set({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') });
                    }}
                    onBlur={() => set({ slug: slugify(form.slug) })}
                    placeholder="created-from-the-title"
                    disabled={!canManage}
                  />
                </div>
                {errors.slug ? err('slug') : <p className="ahint">Leave empty to create it from the title. Changing it on a live article breaks old links.</p>}
              </div>
              <div>
                <div className="flex items-end justify-between">
                  <label htmlFor="blog-excerpt" className="alabel">
                    Summary
                  </label>
                  <Counter value={form.excerpt} max={400} />
                </div>
                <textarea id="blog-excerpt" rows={3} className="ainput" value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} placeholder="One or two sentences shown on the blog list and in search results" disabled={!canManage} />
                {err('excerpt')}
              </div>
            </div>
          </Card>

          <Card title="Article">
            <RichText value={form.content} onChange={(content) => set({ content })} label="Article" minHeight={420} maxHeight={0} folder="blog" />
            {err('content')}
          </Card>

          <Card title="Search engine listing">
            <div className="mb-4 border border-line bg-bone/40 p-3">
              <p className="text-xs text-mute">Google preview</p>
              <p className="mt-1 truncate text-xs text-[#1a7f37]">beyondbrawn.store › blog › {urlSlug}</p>
              <p className="truncate text-[17px] text-[#1a0dab]">{seoTitle}</p>
              <p className="line-clamp-2 text-[13px] text-ink/80">{seoDesc}</p>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-end justify-between">
                  <label htmlFor="seo-title" className="alabel">
                    SEO title
                  </label>
                  <Counter value={form.seo.title} max={160} />
                </div>
                <input id="seo-title" className="ainput" value={form.seo.title} onChange={(e) => setSeo({ title: e.target.value })} placeholder="Leave empty to use the article title" disabled={!canManage} />
                {err('seo.title')}
              </div>
              <div>
                <div className="flex items-end justify-between">
                  <label htmlFor="seo-desc" className="alabel">
                    SEO description
                  </label>
                  <Counter value={form.seo.description} max={320} />
                </div>
                <textarea id="seo-desc" rows={2} className="ainput" value={form.seo.description} onChange={(e) => setSeo({ description: e.target.value })} placeholder="Aim for about 150 characters" disabled={!canManage} />
                {err('seo.description')}
              </div>
              <div>
                <label htmlFor="seo-keys" className="alabel">
                  SEO keywords
                </label>
                <input id="seo-keys" className="ainput" value={form.seo.keywords} onChange={(e) => setSeo({ keywords: e.target.value })} placeholder="Comma separated" disabled={!canManage} />
                {err('seo.keywords')}
              </div>
            </div>
          </Card>
        </div>

        {/* ---------- sidebar ---------- */}
        <aside className="space-y-5 lg:sticky lg:top-20">
          <Card title="Publish">
            <div className="space-y-3">
              <Toggle checked={form.isPublished} onChange={(v) => set({ isPublished: v })} label="Published" hint="Drafts are not visible on the store" />
              {meta && (
                <dl className="space-y-1 text-xs text-mute">
                  {meta.publishedAt && (
                    <div className="flex justify-between gap-2">
                      <dt>First published</dt>
                      <dd>{new Date(meta.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
                    </div>
                  )}
                  {meta.updatedAt && (
                    <div className="flex justify-between gap-2">
                      <dt>Last saved</dt>
                      <dd>{new Date(meta.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</dd>
                    </div>
                  )}
                  {meta.readMinutes ? (
                    <div className="flex justify-between gap-2">
                      <dt>Read time</dt>
                      <dd>{meta.readMinutes} min</dd>
                    </div>
                  ) : null}
                </dl>
              )}
              {dirty && <p className="bg-lime/30 px-2 py-1 text-xs font-semibold">Unsaved changes</p>}
              {canManage && (
                <div className="grid gap-2">
                  <Btn variant="lime" loading={saving} onClick={() => save()} className="w-full">
                    <Save className="size-4" aria-hidden />
                    {id ? 'Save changes' : form.isPublished ? 'Publish article' : 'Save draft'}
                  </Btn>
                  {!form.isPublished && (
                    <Btn variant="primary" disabled={saving} onClick={() => save(true)} className="w-full">
                      <Send className="size-4" aria-hidden />
                      Save and publish
                    </Btn>
                  )}
                  {id && meta && meta.isPublished && form.isPublished && (
                    <Btn variant="ghost" disabled={saving} onClick={() => save(false)} className="w-full">
                      <Eye className="size-4" aria-hidden />
                      Move to drafts
                    </Btn>
                  )}
                  <p className="text-center text-[11px] text-mute">Ctrl+S to save</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Cover image">
            <SingleImage value={form.coverImage} onChange={(coverImage) => set({ coverImage })} folder="blog" />
            <p className="ahint">Wide images work best (16:9, at least 1200px wide).</p>
          </Card>

          <Card title="Organise">
            <div className="space-y-3">
              <div>
                <label htmlFor="blog-cat" className="alabel">
                  Category
                </label>
                <select id="blog-cat" className="ainput cursor-pointer" value={form.category} onChange={(e) => set({ category: e.target.value })} disabled={!canManage}>
                  <option value="">No category</option>
                  {categories.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <Link href="/admin/content/blog-categories" className="mt-1 inline-block text-xs font-semibold underline">
                  Manage categories
                </Link>
              </div>
              <div>
                <label htmlFor="blog-author" className="alabel">
                  Author
                </label>
                <input id="blog-author" className="ainput" value={form.author} onChange={(e) => set({ author: e.target.value })} disabled={!canManage} />
              </div>
              <div>
                <label htmlFor="blog-tags" className="alabel">
                  Tags
                </label>
                <input id="blog-tags" className="ainput" value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="protein, recovery, beginners" disabled={!canManage} />
                <p className="ahint">Comma separated</p>
              </div>
            </div>
          </Card>

          {id && canManage && (
            <Btn variant="danger" onClick={() => setRemoving(true)} className="w-full">
              <Trash2 className="size-4" aria-hidden />
              Delete article
            </Btn>
          )}
        </aside>
      </div>

      <Confirm open={removing} onClose={() => setRemoving(false)} onConfirm={remove} loading={deleting} title="Delete this article?" text={`"${form.title}" will be removed permanently. This cannot be undone.`} action="Delete article" />
    </>
  );
}
