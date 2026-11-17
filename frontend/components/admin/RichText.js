'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold, Code, Eraser, Heading2, Heading3, Heading4, ImagePlus, Italic, Link2, List, ListOrdered, LoaderCircle, Maximize2, Minimize2, Minus, Pilcrow, Quote, Redo2, Strikethrough, Subscript, Superscript, Table, Underline, Undo2, Unlink,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { uploadImages } from '@/services/admin';

/*
 * WYSIWYG editor. Output is HTML; the API sanitises it again before storing.
 * Only tags the API keeps are produced here, so what you see is what gets saved.
 */

const ALLOWED = new Set(['H2', 'H3', 'H4', 'P', 'BR', 'HR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A', 'IMG', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'FIGURE', 'FIGCAPTION', 'SUP', 'SUB']);
const RENAME = { H1: 'H2', H5: 'H4', H6: 'H4', STRIKE: 'S', DEL: 'S', INS: 'U', DIV: 'P', SECTION: 'P', ARTICLE: 'P' };
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'META', 'LINK', 'NOSCRIPT', 'SVG', 'FORM', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA']);
const ATTRS = { A: ['href', 'title', 'target'], IMG: ['src', 'alt', 'width', 'height'], TD: ['colspan', 'rowspan'], TH: ['colspan', 'rowspan'] };
const SAFE_URL = /^(https?:\/\/|\/|mailto:|tel:|#)/i;
const BLOCKS = new Set(['P', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'UL', 'OL', 'TABLE', 'HR', 'FIGURE']);

// Loose text / inline nodes at the top level go inside paragraphs.
function wrapLoose(root, doc) {
  let p = null;
  [...root.childNodes].forEach((n) => {
    if (n.nodeType === 1 && BLOCKS.has(n.tagName)) {
      p = null;
      return;
    }
    if (n.nodeType === 3 && !n.textContent.trim() && !p) {
      n.remove();
      return;
    }
    if (n.nodeType === 1 && n.tagName === 'BR' && !p) {
      n.remove();
      return;
    }
    if (!p) {
      p = doc.createElement('p');
      n.replaceWith(p);
    }
    p.appendChild(n);
  });
}

// Cleans pasted / source-edited HTML to the same tag set the API allows.
function cleanHtml(html) {
  if (typeof window === 'undefined') return html || '';
  const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 8) return child.remove(); // comments
      if (child.nodeType !== 1) return undefined;
      let el = child;
      const tag = el.tagName;
      if (DROP.has(tag)) return el.remove();
      // Google Docs wraps everything in <b style="font-weight:normal">
      if (tag === 'B' && /font-weight:\s*(normal|400)/i.test(el.getAttribute('style') || '')) {
        walk(el);
        el.replaceWith(...el.childNodes);
        return undefined;
      }
      if (tag === 'SPAN') {
        const st = el.getAttribute('style') || '';
        walk(el);
        let inner = [...el.childNodes];
        const wrap = (t) => {
          const w = doc.createElement(t);
          w.append(...inner);
          inner = [w];
        };
        if (/font-weight:\s*(bold|[6-9]00)/i.test(st)) wrap('strong');
        if (/font-style:\s*italic/i.test(st)) wrap('em');
        if (/text-decoration[^;]*underline/i.test(st)) wrap('u');
        if (/text-decoration[^;]*line-through/i.test(st)) wrap('s');
        el.replaceWith(...inner);
        return undefined;
      }
      if (RENAME[tag]) {
        const n = doc.createElement(RENAME[tag]);
        n.append(...el.childNodes);
        el.replaceWith(n);
        el = n;
      }
      if (!ALLOWED.has(el.tagName)) {
        walk(el);
        el.replaceWith(...el.childNodes);
        return undefined;
      }
      const keep = ATTRS[el.tagName] || [];
      [...el.attributes].forEach((a) => {
        if (!keep.includes(a.name)) el.removeAttribute(a.name);
      });
      if (el.tagName === 'A') {
        const href = el.getAttribute('href') || '';
        if (!SAFE_URL.test(href)) el.removeAttribute('href');
      }
      if (el.tagName === 'IMG') {
        const src = el.getAttribute('src') || '';
        if (!/^(https?:\/\/|\/)/i.test(src)) return el.remove();
      }
      walk(el);
      return undefined;
    });
  };
  walk(doc.body);
  wrapLoose(doc.body, doc);
  return doc.body.innerHTML.replace(/<p>(\s|<br>)*<\/p>/g, '').trim();
}

// Browsers sometimes nest lists / tables inside <p>, which is invalid HTML. Fix that in the saved output
// (on a copy, so the caret in the live editor is not disturbed).
function tidy(root) {
  const copy = root.cloneNode(true);
  copy.querySelectorAll('p').forEach((p) => {
    if (![...p.children].some((c) => BLOCKS.has(c.tagName))) return;
    const parent = p.parentNode;
    let buf = null;
    [...p.childNodes].forEach((n) => {
      if (n.nodeType === 1 && BLOCKS.has(n.tagName)) {
        buf = null;
        parent.insertBefore(n, p);
      } else {
        if (!buf) {
          buf = document.createElement('p');
          parent.insertBefore(buf, p);
        }
        buf.appendChild(n);
      }
    });
    p.remove();
  });
  wrapLoose(copy, document);
  return copy.innerHTML.replace(/<p>(\s|<br>)*<\/p>/g, '').trim();
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const stats = (html) => {
  const text = String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
  const words = text ? text.split(/\s+/).length : 0;
  return { words, chars: text.length, minutes: Math.max(1, Math.round(words / 220)) };
};

function ToolBtn({ icon: Icon, label, onClick, active, disabled }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex size-8 shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'bg-black text-lime' : 'hover:bg-white'}`}
    >
      <Icon className="size-4" />
    </button>
  );
}
const Sep = () => <span className="mx-0.5 h-5 w-px shrink-0 bg-line" aria-hidden />;

function Popover({ title, children, onClose }) {
  return (
    <div className="absolute left-1 top-full z-30 mt-1 w-[min(340px,calc(100vw-2rem))] border-2 border-black bg-white p-3 shadow-xl" role="dialog" aria-label={title}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">{title}</p>
        <button type="button" onClick={onClose} className="cursor-pointer text-xs font-semibold text-mute hover:text-black">
          Close
        </button>
      </div>
      {children}
    </div>
  );
}

export default function RichText({ value, onChange, label, minHeight = 160, maxHeight = 480, folder = 'blog' }) {
  const toast = useToast();
  const ref = useRef(null);
  const last = useRef(null);
  const range = useRef(null);
  const fileInput = useRef(null);
  const plainPaste = useRef(false);
  const [active, setActive] = useState({});
  const [block, setBlock] = useState('p');
  const [source, setSource] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [full, setFull] = useState(false);
  const [pop, setPop] = useState(null); // 'link' | 'image' | 'table'
  const [linkForm, setLinkForm] = useState({ url: '', text: '', newTab: true });
  const [imgForm, setImgForm] = useState({ url: '', alt: '' });
  const [tableForm, setTableForm] = useState({ rows: 3, cols: 3, header: true });
  const [uploading, setUploading] = useState(false);
  const [count, setCount] = useState(() => stats(value));

  // Only push external changes into the DOM (loading a record); never while typing, which would move the caret.
  useEffect(() => {
    if (ref.current && value !== last.current) {
      ref.current.innerHTML = value || '';
      last.current = value;
      setCount(stats(value));
    }
  }, [value, source]);

  const emit = useCallback(() => {
    if (!ref.current) return;
    let html = tidy(ref.current);
    if (html === '<br>') html = '';
    if (html === last.current) return;
    last.current = html;
    setCount(stats(html));
    onChange(html);
  }, [onChange]);

  // Remember where the caret was so popovers / uploads can insert at the right place.
  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current && ref.current.contains(sel.anchorNode)) range.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreRange = () => {
    if (!ref.current) return;
    ref.current.focus();
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    if (range.current && ref.current.contains(range.current.startContainer)) sel.addRange(range.current);
    else {
      const r = document.createRange();
      r.selectNodeContents(ref.current);
      r.collapse(false);
      sel.addRange(r);
    }
  };

  const refresh = useCallback(() => {
    if (!ref.current) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !ref.current.contains(sel.anchorNode)) return;
    saveRange();
    const q = (c) => {
      try {
        return document.queryCommandState(c);
      } catch {
        return false;
      }
    };
    setActive({ bold: q('bold'), italic: q('italic'), underline: q('underline'), strike: q('strikeThrough'), sup: q('superscript'), sub: q('subscript'), ul: q('insertUnorderedList'), ol: q('insertOrderedList') });
    let n = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
    let found = 'p';
    while (n && n !== ref.current) {
      const t = n.tagName.toLowerCase();
      if (['h2', 'h3', 'h4', 'blockquote', 'p'].includes(t)) {
        found = t;
        break;
      }
      n = n.parentElement;
    }
    setBlock(found);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', refresh);
    return () => document.removeEventListener('selectionchange', refresh);
  }, [refresh]);

  // Esc leaves full screen; body scroll is locked while it is on.
  useEffect(() => {
    if (!full) return undefined;
    const onKey = (e) => e.key === 'Escape' && setFull(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [full]);

  const run = (cmd, arg) => {
    restoreRange();
    try {
      document.execCommand('styleWithCSS', false, false);
      document.execCommand(cmd, false, arg);
    } catch {
      /* unsupported command: ignore */
    }
    emit();
    refresh();
  };
  const insertHtml = (html) => {
    restoreRange();
    document.execCommand('insertHTML', false, html);
    emit();
  };
  const setBlockType = (t) => run('formatBlock', `<${t}>`);
  const toggleBlock = (t) => setBlockType(block === t ? 'p' : t);

  /* ----- link ----- */
  const openLink = () => {
    saveRange();
    const sel = window.getSelection();
    let a = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement) : null;
    while (a && a !== ref.current && a.tagName !== 'A') a = a.parentElement;
    const existing = a && a.tagName === 'A' ? a : null;
    setLinkForm({ url: existing ? existing.getAttribute('href') || '' : '', text: sel ? sel.toString() : '', newTab: existing ? existing.getAttribute('target') === '_blank' : true, hasSel: Boolean(sel && !sel.isCollapsed) });
    setPop('link');
  };
  const applyLink = () => {
    let url = linkForm.url.trim();
    if (!url) return toast.error('Enter a link address');
    if (!SAFE_URL.test(url)) url = `https://${url.replace(/^\/+/, '')}`;
    restoreRange();
    const sel = window.getSelection();
    const hasSelection = sel && !sel.isCollapsed;
    if (hasSelection) {
      document.execCommand('createLink', false, url);
      // set / clear target on the links just created
      const anchors = ref.current.querySelectorAll(`a[href="${CSS.escape(url)}"]`);
      anchors.forEach((a) => (linkForm.newTab ? a.setAttribute('target', '_blank') : a.removeAttribute('target')));
    } else {
      const text = linkForm.text.trim() || url;
      document.execCommand('insertHTML', false, `<a href="${esc(url)}"${linkForm.newTab ? ' target="_blank"' : ''}>${esc(text)}</a>&nbsp;`);
    }
    emit();
    setPop(null);
    return undefined;
  };

  /* ----- image ----- */
  const openImage = () => {
    saveRange();
    setImgForm({ url: '', alt: '' });
    setPop('image');
  };
  const insertImage = (url, alt) => {
    if (!/^(https?:\/\/|\/)/i.test(url)) return toast.error('Image address must start with https:// or /');
    insertHtml(`<p><img src="${esc(url)}" alt="${esc(alt || '')}" /></p><p><br></p>`);
    setPop(null);
    return undefined;
  };
  const upload = async (files) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const res = await uploadImages([files[0]], folder);
      const img = res.data.images[0];
      if (img) insertImage(img.url, imgForm.alt || files[0].name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  /* ----- table ----- */
  const openTable = () => {
    saveRange();
    setPop('table');
  };
  const insertTable = () => {
    const rows = Math.min(30, Math.max(1, Number(tableForm.rows) || 1));
    const cols = Math.min(10, Math.max(1, Number(tableForm.cols) || 1));
    const cell = (t) => `<${t}><br></${t}>`;
    const head = tableForm.header ? `<thead><tr>${Array.from({ length: cols }, () => cell('th')).join('')}</tr></thead>` : '';
    const body = `<tbody>${Array.from({ length: rows }, () => `<tr>${Array.from({ length: cols }, () => cell('td')).join('')}</tr>`).join('')}</tbody>`;
    insertHtml(`<table data-new="1">${head}${body}</table><p><br></p>`);
    // Put the caret in the first cell so typing goes into the table.
    const t = ref.current && ref.current.querySelector('table[data-new]');
    if (t) {
      t.removeAttribute('data-new');
      const first = t.querySelector('th, td');
      const sel = window.getSelection();
      if (first && sel) {
        const r = document.createRange();
        r.selectNodeContents(first);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      emit();
    }
    setPop(null);
  };

  /* ----- source view ----- */
  const toggleSource = () => {
    if (source) {
      const html = cleanHtml(sourceText);
      last.current = null; // force the effect to write the cleaned HTML back into the editor
      onChange(html);
      setSource(false);
    } else {
      setSourceText((ref.current && ref.current.innerHTML) || value || '');
      setPop(null);
      setSource(true);
    }
  };

  const onKeyDown = (e) => {
    const mod = e.ctrlKey || e.metaKey;
    plainPaste.current = mod && e.shiftKey && e.key.toLowerCase() === 'v';
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openLink();
    }
    // Tab inside a list nests / un-nests the item instead of leaving the editor.
    if (e.key === 'Tab' && (active.ul || active.ol)) {
      e.preventDefault();
      run(e.shiftKey ? 'outdent' : 'indent');
    }
  };

  const onPaste = (e) => {
    e.preventDefault();
    const html = plainPaste.current ? '' : e.clipboardData.getData('text/html');
    plainPaste.current = false;
    const text = e.clipboardData.getData('text/plain');
    // Hold Shift (Ctrl+Shift+V) or paste with no HTML: plain text, line breaks become paragraphs.
    if (!html) {
      const parts = text.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
      if (parts.length > 1) document.execCommand('insertHTML', false, parts.map((p) => `<p>${esc(p).replace(/\r?\n/g, '<br>')}</p>`).join(''));
      else document.execCommand('insertText', false, text);
    } else {
      const clean = cleanHtml(html);
      document.execCommand('insertHTML', false, clean || esc(text));
    }
    emit();
  };

  const onDrop = (e) => {
    const files = [...(e.dataTransfer.files || [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (r) range.current = r;
    }
    upload(files);
  };

  const blockOptions = [
    { v: 'p', l: 'Normal text' },
    { v: 'h2', l: 'Heading' },
    { v: 'h3', l: 'Subheading' },
    { v: 'h4', l: 'Small heading' },
    { v: 'blockquote', l: 'Quote' },
  ];

  return (
    <div className={full ? 'fixed inset-0 z-[100] flex flex-col bg-white p-3 sm:p-6' : 'relative'}>
      <div className={full ? 'relative' : 'sticky top-14 z-20'}>
        <div className="flex flex-wrap items-center gap-0.5 border border-b-0 border-line bg-bone p-1" role="toolbar" aria-label="Formatting">
          <ToolBtn icon={Undo2} label="Undo (Ctrl+Z)" onClick={() => run('undo')} disabled={source} />
          <ToolBtn icon={Redo2} label="Redo (Ctrl+Y)" onClick={() => run('redo')} disabled={source} />
          <Sep />
          <select
            aria-label="Text style"
            value={block}
            disabled={source}
            onMouseDown={saveRange}
            onChange={(e) => setBlockType(e.target.value)}
            className="h-8 cursor-pointer border border-line bg-white px-1.5 text-xs font-semibold disabled:opacity-40"
          >
            {blockOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
          <Sep />
          <ToolBtn icon={Bold} label="Bold (Ctrl+B)" active={active.bold} onClick={() => run('bold')} disabled={source} />
          <ToolBtn icon={Italic} label="Italic (Ctrl+I)" active={active.italic} onClick={() => run('italic')} disabled={source} />
          <ToolBtn icon={Underline} label="Underline (Ctrl+U)" active={active.underline} onClick={() => run('underline')} disabled={source} />
          <ToolBtn icon={Strikethrough} label="Strikethrough" active={active.strike} onClick={() => run('strikeThrough')} disabled={source} />
          <ToolBtn icon={Superscript} label="Superscript" active={active.sup} onClick={() => run('superscript')} disabled={source} />
          <ToolBtn icon={Subscript} label="Subscript" active={active.sub} onClick={() => run('subscript')} disabled={source} />
          <Sep />
          <ToolBtn icon={Heading2} label="Heading" active={block === 'h2'} onClick={() => toggleBlock('h2')} disabled={source} />
          <ToolBtn icon={Heading3} label="Subheading" active={block === 'h3'} onClick={() => toggleBlock('h3')} disabled={source} />
          <ToolBtn icon={Heading4} label="Small heading" active={block === 'h4'} onClick={() => toggleBlock('h4')} disabled={source} />
          <ToolBtn icon={Pilcrow} label="Normal text" active={block === 'p'} onClick={() => setBlockType('p')} disabled={source} />
          <ToolBtn icon={Quote} label="Quote" active={block === 'blockquote'} onClick={() => toggleBlock('blockquote')} disabled={source} />
          <Sep />
          <ToolBtn icon={List} label="Bullet list" active={active.ul} onClick={() => run('insertUnorderedList')} disabled={source} />
          <ToolBtn icon={ListOrdered} label="Numbered list" active={active.ol} onClick={() => run('insertOrderedList')} disabled={source} />
          <Sep />
          <ToolBtn icon={Link2} label="Link (Ctrl+K)" active={pop === 'link'} onClick={openLink} disabled={source} />
          <ToolBtn icon={Unlink} label="Remove link" onClick={() => run('unlink')} disabled={source} />
          <ToolBtn icon={ImagePlus} label="Image" active={pop === 'image'} onClick={openImage} disabled={source} />
          <ToolBtn icon={Table} label="Table" active={pop === 'table'} onClick={openTable} disabled={source} />
          <ToolBtn icon={Minus} label="Divider line" onClick={() => insertHtml('<hr><p><br></p>')} disabled={source} />
          <Sep />
          <ToolBtn icon={Eraser} label="Clear formatting" onClick={() => { run('removeFormat'); run('formatBlock', '<p>'); }} disabled={source} />
          <ToolBtn icon={Code} label={source ? 'Back to editor' : 'Edit HTML'} active={source} onClick={toggleSource} />
          <ToolBtn icon={full ? Minimize2 : Maximize2} label={full ? 'Exit full screen (Esc)' : 'Full screen'} onClick={() => setFull((f) => !f)} />
          {uploading && <LoaderCircle className="ml-1 size-4 animate-spin text-mute" aria-label="Uploading image" />}
        </div>

        {pop === 'link' && (
          <Popover title="Insert link" onClose={() => setPop(null)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyLink();
              }}
              className="space-y-2"
            >
              <input autoFocus className="ainput" placeholder="https://example.com or /shop" value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} aria-label="Link address" />
              {!linkForm.hasSel && <input className="ainput" placeholder="Text to show (optional)" value={linkForm.text} onChange={(e) => setLinkForm({ ...linkForm, text: e.target.value })} aria-label="Link text" />}
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-black" checked={linkForm.newTab} onChange={(e) => setLinkForm({ ...linkForm, newTab: e.target.checked })} />
                Open in a new tab
              </label>
              <button type="submit" className="abtn abtn-lime abtn-sm w-full">
                Apply link
              </button>
            </form>
          </Popover>
        )}

        {pop === 'image' && (
          <Popover title="Insert image" onClose={() => setPop(null)}>
            <div className="space-y-2">
              <input className="ainput" placeholder="Alt text (describe the image)" value={imgForm.alt} onChange={(e) => setImgForm({ ...imgForm, alt: e.target.value })} aria-label="Alt text" />
              <button type="button" disabled={uploading} onClick={() => fileInput.current && fileInput.current.click()} className="abtn abtn-primary abtn-sm w-full">
                {uploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
                {uploading ? 'Uploading...' : 'Upload from computer'}
              </button>
              <p className="text-center text-xs text-mute">or paste an image address</p>
              <div className="flex gap-1">
                <input className="ainput" placeholder="https://..." value={imgForm.url} onChange={(e) => setImgForm({ ...imgForm, url: e.target.value })} aria-label="Image address" />
                <button type="button" onClick={() => insertImage(imgForm.url.trim(), imgForm.alt)} className="abtn abtn-lime shrink-0">
                  Add
                </button>
              </div>
              <p className="text-xs text-mute">Tip: you can also drag an image straight into the article.</p>
            </div>
          </Popover>
        )}

        {pop === 'table' && (
          <Popover title="Insert table" onClose={() => setPop(null)}>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold">
                Rows
                <input type="number" min={1} max={30} className="ainput mt-0.5" value={tableForm.rows} onChange={(e) => setTableForm({ ...tableForm, rows: e.target.value })} />
              </label>
              <label className="text-xs font-semibold">
                Columns
                <input type="number" min={1} max={10} className="ainput mt-0.5" value={tableForm.cols} onChange={(e) => setTableForm({ ...tableForm, cols: e.target.value })} />
              </label>
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-black" checked={tableForm.header} onChange={(e) => setTableForm({ ...tableForm, header: e.target.checked })} />
              First row is a header
            </label>
            <button type="button" onClick={insertTable} className="abtn abtn-lime abtn-sm mt-2 w-full">
              Insert table
            </button>
          </Popover>
        )}
      </div>

      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />

      {source ? (
        <textarea
          className="block w-full flex-1 border border-line bg-ink p-3 font-mono text-[13px] leading-relaxed text-lime focus:border-black focus:outline-none"
          style={full ? undefined : { minHeight: Math.max(minHeight, 240) }}
          value={sourceText}
          onChange={(e) => {
            setSourceText(e.target.value);
            last.current = null; // re-render into the editor when switching back
            onChange(e.target.value); // the API sanitises again; keeps the form in sync if saved from here
          }}
          spellCheck={false}
          aria-label={`${label || 'Content'} HTML`}
        />
      ) : (
        <div
          ref={ref}
          className={`rich overflow-y-auto ${full ? 'flex-1' : ''}`}
          style={full ? undefined : { minHeight, maxHeight: maxHeight || undefined }}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          data-placeholder="Start writing..."
          onFocus={() => {
            try {
              document.execCommand('defaultParagraphSeparator', false, 'p');
            } catch {
              /* older browsers */
            }
          }}
          onInput={emit}
          onBlur={() => {
            saveRange();
            emit();
          }}
          onKeyUp={refresh}
          onMouseUp={refresh}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onDrop={onDrop}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-t-0 border-line bg-bone px-2 py-1 text-[11px] text-mute">
        <span>
          {count.words} words · {count.chars} characters · about {count.minutes} min read
        </span>
        <span className="hidden sm:inline">{source ? 'Editing HTML. Click the code button to go back.' : 'Ctrl+K link · Tab in a list to nest · Ctrl+Shift+V paste as plain text'}</span>
      </div>
    </div>
  );
}
