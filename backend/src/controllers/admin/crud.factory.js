const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok, created } = require('../../utils/respond');
const { paginate, pageMeta, pick, escapeRegex } = require('../../utils/helpers');
const { slugify, uniqueSlug } = require('../../utils/slug');
const { richText } = require('../../utils/sanitize');

/*
 * Generic admin CRUD for simple resources (categories, brands, banners, FAQ, blog ...).
 * `fields` is a whitelist: nothing outside it can be written (prevents mass assignment).
 */
module.exports = function crud(Model, { fields, search = [], populate = '', sort = { createdAt: -1 }, slugFrom = null, filters = [], html = [], beforeSave, beforeRemove, label = Model.modelName } = {}) {
  const cast = (v) => (v === 'true' ? true : v === 'false' ? false : v);

  async function prepare(body, existing) {
    const data = pick(body, fields);
    html.forEach((f) => {
      if (data[f] !== undefined) data[f] = richText(data[f]);
    });
    if (slugFrom) {
      const source = data.slug || (!existing ? data[slugFrom] : null);
      if (source) data.slug = await uniqueSlug(Model, slugify(source), existing ? existing._id : null);
      else delete data.slug;
    }
    if (beforeSave) await beforeSave(data, existing);
    return data;
  }

  return {
    list: asyncHandler(async (req, res) => {
      const pg = paginate(req.query, { defaultLimit: 20, maxLimit: 500 });
      const filter = {};
      filters.forEach((f) => {
        if (req.query[f] !== undefined && req.query[f] !== '') filter[f] = cast(String(req.query[f]));
      });
      if (req.query.q && search.length) {
        const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
        filter.$or = search.map((f) => ({ [f]: rx }));
      }
      const [items, total] = await Promise.all([Model.find(filter).populate(populate).sort(sort).skip(pg.skip).limit(pg.limit).lean(), Model.countDocuments(filter)]);
      ok(res, { items }, 'Success', 200, pageMeta(pg, total));
    }),
    get: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id).populate(populate).lean();
      if (!item) throw new ApiError(404, `${label} not found`);
      ok(res, { item });
    }),
    create: asyncHandler(async (req, res) => {
      const item = await Model.create(await prepare(req.body, null));
      created(res, { item }, `${label} created`);
    }),
    update: asyncHandler(async (req, res) => {
      const existing = await Model.findById(req.params.id);
      if (!existing) throw new ApiError(404, `${label} not found`);
      existing.set(await prepare(req.body, existing));
      await existing.save();
      ok(res, { item: existing }, `${label} saved`);
    }),
    remove: asyncHandler(async (req, res) => {
      const existing = await Model.findById(req.params.id);
      if (!existing) throw new ApiError(404, `${label} not found`);
      if (beforeRemove) await beforeRemove(existing);
      await existing.deleteOne();
      ok(res, {}, `${label} deleted`);
    }),
  };
};
