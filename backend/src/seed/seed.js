/* eslint-disable no-await-in-loop, no-console */
const env = require('../config/env');
const { connectDB, mongoose } = require('../config/db');
const models = require('../models');
const { PERMISSIONS, DEFAULT_ROLES } = require('../config/permissions');
const { slugify } = require('../utils/slug');
const data = require('./data');

const { Permission, Role, Admin, Category, SubCategory, Brand, Attribute, Product, ProductVariant, Inventory, Coupon, FAQ, BlogCategory, Blog, Page, Banner } = models;
const fresh = process.argv.includes('--fresh');
const upsert = (Model, filter, doc) => Model.findOneAndUpdate(filter, { $setOnInsert: doc }, { upsert: true, new: true, setDefaultsOnInsert: true });

async function run() {
  if (fresh && env.isProd && !process.argv.includes('--force')) throw new Error('Refusing to wipe a production database. Pass --force if you really mean it.');
  await connectDB();
  if (fresh) {
    await mongoose.connection.dropDatabase();
    console.log('Database dropped');
  }
  await Promise.all(Object.values(models).map((m) => m.syncIndexes()));

  // Permissions and roles are always refreshed so new permission keys appear after an upgrade.
  for (const p of PERMISSIONS) await Permission.updateOne({ key: p.key }, p, { upsert: true });
  for (const r of DEFAULT_ROLES) {
    const base = { name: r.name, description: r.description, isSystem: true };
    // Super Admin always gets every permission; other roles keep whatever the owner customised.
    const update = r.slug === 'super-admin' ? { $set: { ...base, permissions: r.permissions } } : { $set: base, $setOnInsert: { permissions: r.permissions } };
    await Role.updateOne({ slug: r.slug }, update, { upsert: true });
  }

  const superRole = await Role.findOne({ slug: 'super-admin' });
  if (!(await Admin.exists({ email: env.seedAdmin.email }))) {
    await Admin.create({ name: 'Super Admin', email: env.seedAdmin.email, password: env.seedAdmin.password, role: superRole._id, isSuperAdmin: true });
    console.log(`Admin created: ${env.seedAdmin.email} / ${env.seedAdmin.password}`);
  }

  const catMap = {};
  const subMap = {};
  for (const [i, c] of data.categories.entries()) {
    const cat = await upsert(Category, { slug: slugify(c.name) }, { name: c.name, slug: slugify(c.name), description: c.description, isFeatured: c.isFeatured, sortOrder: i });
    catMap[c.name] = cat._id;
    for (const [j, s] of c.subs.entries()) {
      const sub = await upsert(SubCategory, { slug: slugify(s) }, { name: s, slug: slugify(s), category: cat._id, sortOrder: j });
      subMap[s] = sub._id;
    }
  }
  const brandMap = {};
  for (const b of data.brands) brandMap[b.name] = (await upsert(Brand, { slug: slugify(b.name) }, { ...b, slug: slugify(b.name) }))._id;
  for (const a of data.attributes) await upsert(Attribute, { slug: slugify(a.name) }, { ...a, slug: slugify(a.name) });

  let createdProducts = 0;
  for (const p of data.products) {
    if (await Product.exists({ sku: p.sku })) continue;
    const { cat, sub, brand, variants, ...rest } = p;
    const hasVariants = Boolean(variants && variants.length);
    const product = await Product.create({
      ...rest,
      slug: slugify(p.name),
      category: catMap[cat],
      subCategory: subMap[sub],
      brand: brandMap[brand],
      hasVariants,
      stock: hasVariants ? variants.reduce((s, v) => s + v.stock, 0) : p.stock || 0,
      seo: { title: `${p.name} | Beyond Brawn`, description: p.shortDescription },
    });
    if (hasVariants) {
      for (const [i, v] of variants.entries()) {
        const variant = await ProductVariant.create({ ...v, product: product._id, label: Object.values(v.options).join(' / '), sortOrder: i });
        if (v.stock) await Inventory.create({ product: product._id, variant: variant._id, sku: v.sku, type: 'initial', quantity: v.stock, stockBefore: 0, stockAfter: v.stock, note: 'Seed opening stock' });
      }
    } else if (product.stock) {
      await Inventory.create({ product: product._id, sku: p.sku, type: 'initial', quantity: product.stock, stockBefore: 0, stockAfter: product.stock, note: 'Seed opening stock' });
    }
    createdProducts += 1;
  }

  const in90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  for (const c of data.coupons) {
    const { categories, ...rest } = c;
    await upsert(Coupon, { code: c.code }, { ...rest, startDate: new Date(), expiryDate: in90, applicableCategories: (categories || []).map((n) => catMap[n]) });
  }
  if (!(await FAQ.countDocuments())) await FAQ.insertMany(data.faqs);
  const blogCatMap = {};
  for (const n of data.blogCategories) blogCatMap[n] = (await upsert(BlogCategory, { slug: slugify(n) }, { name: n, slug: slugify(n) }))._id;
  for (const [i, b] of data.blogs.entries()) {
    const { category, ...rest } = b;
    await upsert(Blog, { slug: slugify(b.title) }, { ...rest, slug: slugify(b.title), category: blogCatMap[category], isPublished: true, publishedAt: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000), coverImage: '/placeholders/blog.svg', readMinutes: 4 });
  }
  for (const p of data.pages) await upsert(Page, { slug: p.slug }, { ...p, seo: { title: `${p.title} | Beyond Brawn` } });
  if (!(await Banner.countDocuments())) await Banner.insertMany(data.banners);

  console.log(`Seed complete. Products created: ${createdProducts}. Categories: ${await Category.countDocuments()}, coupons: ${await Coupon.countDocuments()}, blogs: ${await Blog.countDocuments()}`);
  await mongoose.connection.close();
}

run().catch(async (e) => {
  console.error('Seed failed:', e);
  await mongoose.connection.close().catch(() => null);
  process.exit(1);
});
