// Business reporting runs on India Standard Time regardless of server timezone.
const TZ = 'Asia/Kolkata';
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

const startOfDayIST = (d = new Date()) => {
  const shifted = new Date(d.getTime() + IST_OFFSET);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - IST_OFFSET);
};
const startOfMonthIST = (d = new Date()) => {
  const shifted = new Date(d.getTime() + IST_OFFSET);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) - IST_OFFSET);
};
const addDays = (d, n) => new Date(d.getTime() + n * 24 * 60 * 60 * 1000);

// Parses ?from=YYYY-MM-DD&to=YYYY-MM-DD (IST days, inclusive). Defaults to the last 30 days.
function dateRange(query = {}, defaultDays = 30) {
  const parse = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? new Date(`${s}T00:00:00+05:30`) : null);
  const to = parse(query.to) || startOfDayIST();
  const from = parse(query.from) || addDays(to, -(defaultDays - 1));
  return { from, to: addDays(to, 1) }; // `to` is exclusive
}

module.exports = { TZ, startOfDayIST, startOfMonthIST, addDays, dateRange };
