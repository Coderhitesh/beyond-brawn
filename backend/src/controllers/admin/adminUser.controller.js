const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok, created } = require('../../utils/respond');
const { slugify, uniqueSlug } = require('../../utils/slug');
const { Admin, Role, Permission } = require('../../models');
const { ALL_PERMISSIONS } = require('../../config/permissions');

const view = (a) => ({ _id: a._id, name: a.name, email: a.email, role: a.role, isSuperAdmin: a.isSuperAdmin, isActive: a.isActive, lastLoginAt: a.lastLoginAt, createdAt: a.createdAt });

/* ---------- admins ---------- */
exports.listAdmins = asyncHandler(async (req, res) => ok(res, { items: (await Admin.find().populate('role', 'name slug').sort({ createdAt: 1 }).lean()).map(view) }));

exports.createAdmin = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.body.role);
  if (!role) throw new ApiError(400, 'Choose a valid role');
  const admin = await Admin.create({ ...req.body, isSuperAdmin: role.slug === 'super-admin' });
  created(res, { item: view(admin) }, 'Admin user created');
});

exports.updateAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id).select('+password');
  if (!admin) throw new ApiError(404, 'Admin user not found');
  const self = String(admin._id) === String(req.admin._id);
  const { name, email, password, role, isActive } = req.body;
  if (self && (isActive === false || (role && String(role) !== String(admin.role)))) throw new ApiError(400, 'You cannot disable or change the role of your own account');
  if (role) {
    const r = await Role.findById(role);
    if (!r) throw new ApiError(400, 'Choose a valid role');
    const demoting = admin.isSuperAdmin && r.slug !== 'super-admin';
    if (demoting && (await Admin.countDocuments({ isSuperAdmin: true, isActive: true })) <= 1) throw new ApiError(400, 'At least one Super Admin must remain');
    admin.role = r._id;
    admin.isSuperAdmin = r.slug === 'super-admin';
    admin.tokenVersion += 1;
  }
  if (name) admin.name = name;
  if (email) admin.email = email;
  if (password) {
    admin.password = password;
    admin.tokenVersion += 1;
  }
  if (isActive !== undefined) {
    if (!isActive && admin.isSuperAdmin && (await Admin.countDocuments({ isSuperAdmin: true, isActive: true })) <= 1) throw new ApiError(400, 'At least one Super Admin must remain active');
    admin.isActive = isActive;
    if (!isActive) admin.tokenVersion += 1;
  }
  await admin.save();
  ok(res, { item: view(admin) }, 'Admin user saved');
});

exports.removeAdmin = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.admin._id)) throw new ApiError(400, 'You cannot delete your own account');
  const admin = await Admin.findById(req.params.id);
  if (!admin) throw new ApiError(404, 'Admin user not found');
  if (admin.isSuperAdmin && (await Admin.countDocuments({ isSuperAdmin: true })) <= 1) throw new ApiError(400, 'At least one Super Admin must remain');
  await admin.deleteOne();
  ok(res, {}, 'Admin user deleted');
});

/* ---------- roles & permissions ---------- */
const validPermissions = (list = []) => [...new Set(list)].filter((k) => ALL_PERMISSIONS.includes(k));

exports.listRoles = asyncHandler(async (req, res) => {
  const [roles, counts] = await Promise.all([Role.find().sort({ createdAt: 1 }).lean(), Admin.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  ok(res, { items: roles.map((r) => ({ ...r, admins: map.get(String(r._id)) || 0 })) });
});

exports.createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  const role = await Role.create({ name, description, slug: await uniqueSlug(Role, slugify(name)), permissions: validPermissions(permissions) });
  created(res, { item: role }, 'Role created');
});

exports.updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError(404, 'Role not found');
  if (role.slug === 'super-admin') throw new ApiError(400, 'The Super Admin role always has every permission');
  role.description = req.body.description ?? role.description;
  role.permissions = validPermissions(req.body.permissions);
  if (!role.isSystem) role.name = req.body.name;
  await role.save();
  ok(res, { item: role }, 'Role saved');
});

exports.removeRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError(404, 'Role not found');
  if (role.isSystem) throw new ApiError(400, 'Built-in roles cannot be deleted');
  if (await Admin.exists({ role: role._id })) throw new ApiError(400, 'Move the admins on this role to another role first');
  await role.deleteOne();
  ok(res, {}, 'Role deleted');
});

exports.listPermissions = asyncHandler(async (req, res) => {
  const items = await Permission.find().sort({ group: 1, key: 1 }).lean();
  const groups = {};
  items.forEach((p) => {
    (groups[p.group] = groups[p.group] || []).push({ key: p.key, label: p.label });
  });
  ok(res, { items, groups });
});
