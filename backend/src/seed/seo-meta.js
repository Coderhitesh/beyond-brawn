/* eslint-disable no-await-in-loop, no-console */
/*
 * SEO meta update from Beyond_Brawn_Meta_Tags.xlsx  (data: ./seo-meta-data.js)
 *
 *   npm run seed:seo -- --dry              preview only, writes nothing
 *   npm run seed:seo                       apply (takes a backup first)
 *   npm run seed:seo -- --restore <file>   put back the exact SEO values from a backup file
 *
 * Safe by design:
 *  - Only touches seo.title / seo.description / seo.keywords / seo.robots (+ settings "seo" group keys).
 *    Name, price, stock, slug, images, orders, users... nothing else is changed.
 *  - Never creates or deletes products, categories, blogs or pages. Missing ones are only reported.
 *  - updatedAt is not bumped (timestamps: false).
 *  - Every document it changes is saved to seed/backups/seo-backup-<time>.json before writing.
 *  - Re-running is harmless: unchanged docs are skipped.
 */
const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('../config/db');
const { Category, SubCategory, Product, Blog, Page, Setting } = require('../models');
const { slugify } = require('../utils/slug');
const data = require('./seo-meta-data');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const restoreIdx = args.indexOf('--restore');
const BACKUP_DIR = path.join(__dirname, 'backups');
const MODELS = { Category, SubCategory, Product, Blog, Page };
const SEO_KEYS = ['title', 'description', 'keywords', 'robots'];
const SETTING_KEYS = { title: 'defaultTitle', description: 'defaultDescription', keywords: 'keywords' };

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const byName = (name) => ({ name: new RegExp(`^\\s*${esc(name)}\\s*$`, 'i') });

const report = { updated: [], unchanged: [], missing: [], hold: [] };
const backup = { createdAt: new Date().toISOString(), source: data.source, docs: [], settingsSeo: null };

// Builds the $set for one doc. Only keys present in the sheet are written; existing values for other keys stay.
function diff(current = {}, next = {}) {
  const set = {};
  SEO_KEYS.forEach((k) => {
    if (next[k] !== undefined && (current[k] || '') !== next[k]) set[`seo.${k}`] = next[k];
  });
  return set;
}

async function apply(modelName, doc, seo, label) {
  const set = diff(doc.seo || {}, seo);
  if (!Object.keys(set).length) {
    report.unchanged.push(`${modelName}: ${label}`);
    return;
  }
  backup.docs.push({ model: modelName, _id: String(doc._id), label, seo: doc.seo || null });
  report.updated.push(`${modelName}: ${label}  [${Object.keys(set).map((k) => k.slice(4)).join(', ')}]`);
  if (!DRY) await MODELS[modelName].updateOne({ _id: doc._id }, { $set: set }, { timestamps: false, runValidators: true });
}

async function findOne(Model, { slug, name, nameField = 'name' }) {
  if (slug) {
    const d = await Model.findOne({ slug }).select('slug seo').lean();
    if (d) return [d];
  }
  if (name) {
    const list = await Model.find(nameField === 'name' ? byName(name) : { [nameField]: byName(name).name }).select('slug seo').lean();
    if (list.length) return list;
    const d = await Model.findOne({ slug: slugify(name) }).select('slug seo').lean();
    if (d) return [d];
  }
  return [];
}

async function runSettings() {
  const doc = await Setting.findOne({ key: 'seo' }).lean();
  const current = (doc && doc.value) || {};
  const set = {};
  Object.entries(SETTING_KEYS).forEach(([from, to]) => {
    const v = data.home[from];
    if (v && current[to] !== v) set[`value.${to}`] = v;
  });
  if (!Object.keys(set).length) return report.unchanged.push('Settings: homepage SEO');
  backup.settingsSeo = { existed: Boolean(doc), value: doc ? doc.value : null };
  report.updated.push(`Settings: homepage SEO  [${Object.keys(set).map((k) => k.slice(6)).join(', ')}]`);
  if (!DRY) await Setting.updateOne({ key: 'seo' }, { $set: set }, { upsert: true });
  return null;
}

async function run() {
  await connectDB();
  console.log(DRY ? '\nDRY RUN: nothing will be written.\n' : '\nApplying SEO meta...\n');

  await runSettings();

  for (const p of data.pages) {
    const doc = await Page.findOne({ slug: p.slug }).select('slug seo').lean();
    if (!doc) report.missing.push(`Page: /${p.slug} (create it in Admin > Content > Pages, then re-run)`);
    else await apply('Page', doc, p.seo, `/${p.slug}`);
  }

  for (const c of data.categories) {
    const docs = await findOne(Category, { slug: c.slug, name: c.name });
    if (!docs.length) report.missing.push(`Category: ${c.name}${c.slug ? ` (/${c.slug})` : ''}`);
    for (const d of docs) await apply('Category', d, c.seo, `${c.name} (/category/${d.slug})`);
  }

  // A sub-category name can exist under more than one category: every match gets the same meta.
  for (const s of data.subCategories) {
    const docs = await findOne(SubCategory, { name: s.name });
    if (!docs.length) report.missing.push(`SubCategory: ${s.name}`);
    for (const d of docs) await apply('SubCategory', d, s.seo, `${s.name} (${d.slug})`);
  }

  for (const p of data.products) {
    const docs = await findOne(Product, { slug: p.slug, name: p.name });
    if (!docs.length) {
      report.missing.push(`Product: ${p.slug}`);
      continue;
    }
    // Compliance-hold products: only robots (noindex). Their title/description are not touched.
    const seo = p.hold ? { robots: p.seo.robots } : p.seo;
    if (p.hold) report.hold.push(p.slug);
    for (const d of docs.slice(0, 1)) await apply('Product', d, seo, p.slug);
  }

  for (const b of data.blogs) {
    const docs = await findOne(Blog, { slug: b.slug, name: b.title, nameField: 'title' });
    if (!docs.length) report.missing.push(`Blog: ${b.slug}`);
    for (const d of docs.slice(0, 1)) await apply('Blog', d, b.seo, `/blog/${d.slug}`);
  }

  if (!DRY && (backup.docs.length || backup.settingsSeo)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const file = path.join(BACKUP_DIR, `seo-backup-${backup.createdAt.replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(file, JSON.stringify(backup, null, 2));
    console.log(`Backup saved: ${file}\nUndo with: npm run seed:seo -- --restore "${file}"\n`);
  }

  const list = (t, a) => a.length && console.log(`${t} (${a.length})\n  ${a.join('\n  ')}\n`);
  list(DRY ? 'Would update' : 'Updated', report.updated);
  list('Already up to date', report.unchanged);
  list('Compliance hold, set to noindex only', report.hold);
  list('Not found in DB, skipped', report.missing);
  console.log(`Done. ${DRY ? 'Would update' : 'Updated'}: ${report.updated.length}, unchanged: ${report.unchanged.length}, missing: ${report.missing.length}`);
}

// Writes the saved seo objects back exactly as they were.
async function restore(file) {
  if (!file || !fs.existsSync(file)) throw new Error(`Backup file not found: ${file}`);
  const b = JSON.parse(fs.readFileSync(file, 'utf8'));
  await connectDB();
  for (const d of b.docs) {
    const update = d.seo ? { $set: { seo: d.seo } } : { $unset: { seo: 1 } };
    if (!DRY) await MODELS[d.model].updateOne({ _id: d._id }, update, { timestamps: false });
    console.log(`${DRY ? 'Would restore' : 'Restored'} ${d.model}: ${d.label}`);
  }
  if (b.settingsSeo) {
    if (!DRY) {
      if (b.settingsSeo.existed) await Setting.updateOne({ key: 'seo' }, { $set: { value: b.settingsSeo.value } });
      else await Setting.deleteOne({ key: 'seo' });
    }
    console.log(`${DRY ? 'Would restore' : 'Restored'} Settings: homepage SEO`);
  }
  console.log(`Restore done: ${b.docs.length} docs.`);
}

(restoreIdx > -1 ? restore(args[restoreIdx + 1]) : run())
  .catch((e) => {
    console.error('SEO seed failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close().catch(() => null));
