// Event dates for rental orders are compared as text when checking stock, so every date is
// normalised to DD/MM/YYYY first — otherwise "20/12/26", "20-12-2026" and "20 Dec 2026" would
// count as different days and the same items could be booked twice.
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');

function normalizeDateTxt(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  let d; let m; let y;
  let r = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s); // 2026-12-20
  if (r) { y = +r[1]; m = +r[2]; d = +r[3]; }
  if (!r && (r = /^(\d{1,2})[/\-. ](\d{1,2})[/\-. ](\d{2}|\d{4})$/.exec(s))) { d = +r[1]; m = +r[2]; y = +r[3]; } // 20/12/2026
  if (!r && (r = /^(\d{1,2})[\s\-]+([A-Za-z]{3})[A-Za-z]*[\s,\-]+(\d{2}|\d{4})$/.exec(s))) { d = +r[1]; m = MONTHS[r[2].toLowerCase()]; y = +r[3]; } // 20 Dec 2026
  if (!d || !m || !y) return s; // unrecognised — keep as typed
  if (y < 100) y += 2000;
  const dt = new Date(y, m - 1, d);
  if (dt.getMonth() !== m - 1 || dt.getDate() !== d) return s;
  return `${pad(d)}/${pad(m)}/${y}`;
}

module.exports = { normalizeDateTxt };
