const slugify = (str = '') =>
  String(str)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

// Returns a slug that is unique within Model (optionally ignoring one document).
async function uniqueSlug(Model, base, ignoreId = null) {
  const root = slugify(base) || 'item';
  let slug = root;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })) {
    i += 1;
    slug = `${root}-${i}`;
  }
  return slug;
}

module.exports = { slugify, uniqueSlug };
