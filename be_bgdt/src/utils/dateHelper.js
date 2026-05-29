const { Sequelize } = require('sequelize');

/**
 * Parse any date-like input → 'YYYY-MM-DD' string or null.
 * Accepts: Date object, 'YYYY-MM-DD', 'DD/MM/YYYY'.
 */
const toDateOnly = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return isNaN(value) ? null : value.toISOString().slice(0, 10);
  }

  const s = String(value).trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD-MM-YYYY  e.g. '15-08-2005'
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const parsed = new Date(s);
  return isNaN(parsed) ? null : parsed.toISOString().slice(0, 10);
};

/**
 * Use for DATE columns in .create() / .update().
 * Tedious v19 + SQL Server: passing a plain string for a DATE column causes
 * "Conversion failed". CONVERT(date, N'...', 23) bypasses the type-binding issue.
 *
 * @param {string|Date|null|undefined} value
 * @returns {import('sequelize').Utils.Literal | null}
 */
const dateLiteral = (value) => {
  const s = toDateOnly(value);
  if (!s) return null;
  return Sequelize.literal(`CONVERT(date, N'${s}', 23)`);
};

module.exports = { toDateOnly, dateLiteral };
