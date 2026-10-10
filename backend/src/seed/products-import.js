/* eslint-disable no-await-in-loop, no-console */
// One-shot import: node src/seed/products-import.js   (or: npm run seed:products)
// Safe to re-run: categories/brands/products that already exist (by slug/SKU) are skipped.
const { connectDB, mongoose } = require('../config/db');
const { Category, SubCategory, Brand, Product } = require('../models');
const { slugify } = require('../utils/slug');
const { products, categories, brands } = require('./olimp-amix-data');

const upsert = (Model, filter, doc) => Model.findOneAndUpdate(filter, { $setOnInsert: doc }, { upsert: true, new: true, setDefaultsOnInsert: true });

async function run() {
  await connectDB();
  const catMap = {}; const subMap = {};
  for (const c of categories) {
    const cat = await upsert(Category, { slug: slugify(c.name) }, { name: c.name, slug: slugify(c.name), description: c.description, sortOrder: 50 });
    catMap[c.name] = cat._id;
    for (const [i, s] of c.subs.entries()) {
      const key = `${c.name}::${s}`;
      const slug = slugify(s);
      // Sub-category slugs are global; if the same name exists under another category, namespace it.
      const existing = await SubCategory.findOne({ slug });
      const sub = existing && String(existing.category) !== String(cat._id)
        ? await upsert(SubCategory, { slug: `${slugify(c.name)}-${slug}` }, { name: s, slug: `${slugify(c.name)}-${slug}`, category: cat._id, sortOrder: i })
        : await upsert(SubCategory, { slug }, { name: s, slug, category: cat._id, sortOrder: i });
      subMap[key] = sub._id;
    }
  }
  const brandMap = {};
  for (const b of brands) brandMap[b.name] = (await upsert(Brand, { slug: slugify(b.name) }, { ...b, slug: slugify(b.name) }))._id;

  let created = 0; let skipped = 0;
  for (const p of products) {
    if (await Product.exists({ sku: p.sku })) { skipped += 1; continue; }
    const { cat, sub, brand, ...rest } = p;
    let slug = slugify(p.name); let n = 1;
    while (await Product.exists({ slug })) { n += 1; slug = `${slugify(p.name)}-${n}`; }
    await Product.create({
      ...rest, slug, category: catMap[cat], subCategory: subMap[`${cat}::${sub}`], brand: brandMap[brand],
      thumbnail: '/placeholders/product.svg', hasVariants: false,
      seo: { title: `${p.name} | Beyond Brawn`.slice(0, 160), description: p.shortDescription },
    });
    created += 1;
  }
  console.log(`Done. Created: ${created}, skipped (SKU exists): ${skipped}. Inactive drafts (no price set): ${products.filter((x) => !x.isActive).length}`);
  await mongoose.connection.close();
}
run().catch(async (e) => { console.error('Import failed:', e); await mongoose.connection.close().catch(() => null); process.exit(1); });
