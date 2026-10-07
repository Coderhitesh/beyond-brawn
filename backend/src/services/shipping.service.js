const ApiError = require('../utils/ApiError');
const settings = require('./settings.service');

/*
 * Shipping providers. `flat` reads rates from Settings.
 * To plug in a courier API later (Shiprocket, Delhivery ...), add a provider with the same
 * three functions and set Settings > Shipping > provider.
 */
const providers = {
  flat: {
    async serviceability(pincode, cfg) {
      if (!/^\d{6}$/.test(String(pincode || ''))) return { serviceable: false, reason: 'Enter a valid 6-digit pincode' };
      if ((cfg.blockedPincodes || []).includes(pincode)) return { serviceable: false, reason: 'We do not deliver to this pincode yet' };
      if (cfg.pincodeMode === 'allowlist' && !(cfg.allowedPincodes || []).includes(pincode)) return { serviceable: false, reason: 'We do not deliver to this pincode yet' };
      return { serviceable: true };
    },
    async rates({ amount }, cfg) {
      return (cfg.methods || [])
        .filter((m) => m.isActive !== false)
        .map((m) => {
          const free = m.freeEligible !== false && cfg.freeShippingThreshold > 0 && amount >= cfg.freeShippingThreshold;
          return { code: m.code, name: m.name, charge: free ? 0 : Number(m.charge) || 0, baseCharge: Number(m.charge) || 0, minDays: m.minDays, maxDays: m.maxDays, isFree: free };
        });
    },
    // Hook for creating a shipment / AWB with a courier. Flat provider has nothing to do.
    async createShipment() {
      return null;
    },
  },
};

async function ctx() {
  const cfg = await settings.get('shipping');
  return { cfg, provider: providers[cfg.provider] || providers.flat };
}

function estimate(method) {
  const day = 24 * 60 * 60 * 1000;
  return { from: new Date(Date.now() + (method.minDays || 2) * day), to: new Date(Date.now() + (method.maxDays || 6) * day) };
}

async function getMethods(amount = 0) {
  const { cfg, provider } = await ctx();
  const methods = await provider.rates({ amount }, cfg);
  return { methods, freeShippingThreshold: cfg.freeShippingThreshold };
}

async function checkPincode(pincode) {
  const { cfg, provider } = await ctx();
  const res = await provider.serviceability(String(pincode || '').trim(), cfg);
  if (!res.serviceable) return res;
  const methods = await provider.rates({ amount: 0 }, cfg);
  return { serviceable: true, methods: methods.map((m) => ({ code: m.code, name: m.name, minDays: m.minDays, maxDays: m.maxDays, estimate: estimate(m) })) };
}

// Returns the chosen method priced for `amount`. Falls back to the first active method.
async function quote({ amount, methodCode }) {
  const { methods, freeShippingThreshold } = await getMethods(amount);
  if (!methods.length) throw new ApiError(500, 'No shipping method is configured', null, 'NO_SHIPPING');
  const method = methods.find((m) => m.code === methodCode) || methods[0];
  return { method, methods, freeShippingThreshold };
}

async function assertServiceable(pincode) {
  const res = await checkPincode(pincode);
  if (!res.serviceable) throw new ApiError(400, res.reason, null, 'PINCODE_NOT_SERVICEABLE');
}

module.exports = { getMethods, checkPincode, quote, assertServiceable, estimate, providers };
