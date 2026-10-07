const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok } = require('../../utils/respond');
const env = require('../../config/env');
const settings = require('../../services/settings.service');
const email = require('../../services/email.service');
const templates = require('../../templates');
const { usingCloudinary } = require('../../services/upload.service');

const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v);

exports.getAll = asyncHandler(async (req, res) => {
  ok(res, {
    settings: await settings.getAll(),
    // Secrets live in environment variables only. The admin sees whether they are configured, never the values.
    integrations: {
      razorpay: { configured: Boolean(env.razorpay.keyId && env.razorpay.keySecret), keyId: env.razorpay.keyId ? `${env.razorpay.keyId.slice(0, 8)}...` : '', mode: env.razorpay.keyId.startsWith('rzp_live') ? 'live' : 'test', webhook: Boolean(env.razorpay.webhookSecret) },
      smtp: { configured: email.configured, host: env.smtp.host, from: env.smtp.from },
      cloudinary: { configured: usingCloudinary },
    },
  });
});

exports.update = asyncHandler(async (req, res) => {
  const { group } = req.params;
  if (!settings.GROUPS.includes(group)) throw new ApiError(404, 'Unknown settings group');
  if (!isPlain(req.body)) throw new ApiError(400, 'Settings must be an object');
  if (JSON.stringify(req.body).length > 200000) throw new ApiError(413, 'Settings payload is too large');
  if (group === 'shipping') {
    const methods = req.body.methods || [];
    if (!methods.some((m) => m.isActive !== false)) throw new ApiError(400, 'Keep at least one active shipping method');
    if (methods.some((m) => !m.code || !m.name || Number(m.charge) < 0)) throw new ApiError(400, 'Each shipping method needs a code, a name and a charge of 0 or more');
  }
  ok(res, { [group]: await settings.set(group, req.body) }, 'Settings saved');
});

exports.testSmtp = asyncHandler(async (req, res) => {
  const result = await email.verifyConnection();
  if (!result.ok) throw new ApiError(400, `SMTP check failed: ${result.message}`);
  ok(res, result, result.message);
});

exports.emailTemplates = asyncHandler(async (req, res) => {
  const overrides = await settings.get('emailTemplates');
  ok(res, { templates: templates.list().map((t) => ({ ...t, subjectOverride: (overrides[t.key] && overrides[t.key].subject) || '' })) });
});

exports.previewTemplate = asyncHandler(async (req, res) => {
  if (!templates.TEMPLATES[req.params.key]) throw new ApiError(404, 'Template not found');
  const { subject, html } = templates.render(req.params.key, templates.SAMPLE, await settings.getAll());
  ok(res, { subject, html });
});

exports.sendTestTemplate = asyncHandler(async (req, res) => {
  if (!templates.TEMPLATES[req.params.key]) throw new ApiError(404, 'Template not found');
  await email.send(req.params.key, req.admin.email, templates.SAMPLE);
  ok(res, {}, `Test email sent to ${req.admin.email}`);
});
