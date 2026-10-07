// Dot-path helpers so field configs can address nested values ("seo.title", "hero.primaryCta.label").
export const getPath = (obj, path) => (typeof path === 'string' ? path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj) : undefined);

export function setPath(obj, path, value) {
  const keys = path.split('.');
  const out = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cur = out;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value;
    else {
      cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] || {}) };
      cur = cur[k];
    }
  });
  return out;
}

const idOf = (v) => (v && typeof v === 'object' ? v._id : v);
const toDateInput = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  // Dates are shown and edited as India-time calendar days.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
};

// API document -> form state, guided by the field list.
export function toForm(fields, item = {}, defaults = {}) {
  let form = {};
  fields.forEach((f) => {
    if (f.type === 'heading') return;
    let v = getPath(item, f.name);
    if (v === undefined || v === null) v = getPath(defaults, f.name);
    switch (f.type) {
      case 'checkbox': v = Boolean(v); break;
      case 'asyncSelect': v = idOf(v) || ''; break;
      case 'multiAsync': v = (v || []).map(idOf); break;
      case 'date': case 'dateEnd': v = toDateInput(v); break;
      case 'tags': v = Array.isArray(v) ? v.join(', ') : v || ''; break;
      case 'list': v = Array.isArray(v) ? v.join('\n') : v || ''; break;
      case 'rows': v = Array.isArray(v) ? v.map((r) => ({ ...r })) : []; break;
      case 'multiCheck': v = Array.isArray(v) ? v : []; break;
      default: v = v === undefined || v === null ? '' : v;
    }
    form = setPath(form, f.name, v);
  });
  return form;
}

// Form state -> API payload.
export function toPayload(fields, form) {
  let out = {};
  fields.forEach((f) => {
    if (f.type === 'heading' || f.readOnly) return;
    let v = getPath(form, f.name);
    switch (f.type) {
      case 'number': v = v === '' || v === null || v === undefined ? (f.nullable ? undefined : 0) : Number(v); break;
      case 'asyncSelect': v = v || null; break;
      case 'date': v = v ? `${v}T00:00:00+05:30` : null; break;
      case 'dateEnd': v = v ? `${v}T23:59:59+05:30` : null; break;
      case 'tags': v = String(v || '').split(',').map((s) => s.trim()).filter(Boolean); break;
      case 'list': v = String(v || '').split('\n').map((s) => s.trim()).filter(Boolean); break;
      case 'rows':
        v = (v || []).map((row) => {
          const r = { ...row };
          (f.columns || []).forEach((c) => {
            if (c.type === 'number') r[c.name] = r[c.name] === '' || r[c.name] == null ? 0 : Number(r[c.name]);
            if (c.type === 'checkbox') r[c.name] = Boolean(r[c.name]);
          });
          return r;
        });
        break;
      default: break;
    }
    if (v !== undefined) out = setPath(out, f.name, v);
  });
  return out;
}

export function validate(fields, form) {
  const errors = {};
  fields.forEach((f) => {
    if (!f.required) return;
    const v = getPath(form, f.name);
    if (v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length)) errors[f.name] = `${f.label} is required`;
  });
  return errors;
}
