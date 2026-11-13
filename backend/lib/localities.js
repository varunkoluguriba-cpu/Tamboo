// Hyderabad localities — the one standard list the area-wise analytics, the customer
// "Your area" picker and partner-area matching all use. Coordinates are approximate
// centres; anything farther than MAX_KM from every centre counts as 'Other'.
const MAX_KM = 4;

const LOCALITIES = [
  ['Ameerpet', 17.4375, 78.4483], ['Begumpet', 17.4447, 78.4664], ['Banjara Hills', 17.4156, 78.4347, ['banjarahills']],
  ['Jubilee Hills', 17.4325, 78.4071], ['HITEC City', 17.4474, 78.3762, ['hitech city', 'hi tech city', 'hitec', 'hitech', 'cyber towers']],
  ['Madhapur', 17.4483, 78.3915], ['Gachibowli', 17.4401, 78.3489], ['Kondapur', 17.4690, 78.3640],
  ['Financial District', 17.4140, 78.3420, ['nanakramguda', 'nanakram guda']], ['Manikonda', 17.4040, 78.3870], ['Narsingi', 17.3880, 78.3610],
  ['Kokapet', 17.3920, 78.3330], ['Kukatpally', 17.4849, 78.4138], ['KPHB', 17.4935, 78.3994, ['kphb colony']],
  ['Miyapur', 17.4968, 78.3614], ['Chandanagar', 17.4964, 78.3216], ['Lingampally', 17.4867, 78.3175], ['Nizampet', 17.5170, 78.3830],
  ['Bachupally', 17.5440, 78.3610], ['Kompally', 17.5360, 78.4870], ['Moosapet', 17.4700, 78.4250], ['Balanagar', 17.4750, 78.4450],
  ['Jeedimetla', 17.5070, 78.4590], ['Quthbullapur', 17.5050, 78.4440, ['qutbullapur']], ['Erragadda', 17.4560, 78.4320],
  ['Sanath Nagar', 17.4590, 78.4430, ['sanathnagar']], ['SR Nagar', 17.4420, 78.4400, ['s r nagar', 'srnagar']],
  ['Panjagutta', 17.4260, 78.4510, ['punjagutta']], ['Khairatabad', 17.4140, 78.4620], ['Lakdikapul', 17.4030, 78.4650],
  ['Masab Tank', 17.4010, 78.4520, ['masabtank']], ['Mehdipatnam', 17.3950, 78.4380], ['Tolichowki', 17.4000, 78.4140, ['toli chowki']],
  ['Attapur', 17.3711, 78.4316], ['Rajendranagar', 17.3200, 78.4000], ['Shamshabad', 17.2600, 78.3900],
  ['Secunderabad', 17.4399, 78.4983], ['Bowenpally', 17.4710, 78.4860], ['Trimulgherry', 17.4710, 78.5070, ['tirumalagiri']],
  ['Alwal', 17.5020, 78.5030], ['Malkajgiri', 17.4530, 78.5260], ['Moula Ali', 17.4480, 78.5560, ['moulali']],
  ['Sainikpuri', 17.4900, 78.5520], ['AS Rao Nagar', 17.4790, 78.5560, ['a s rao nagar', 'asrao nagar']], ['ECIL', 17.4710, 78.5730],
  ['Kushaiguda', 17.4800, 78.5700], ['Tarnaka', 17.4290, 78.5380], ['Habsiguda', 17.4180, 78.5420], ['Nacharam', 17.4300, 78.5560],
  ['Uppal', 17.4018, 78.5602], ['Boduppal', 17.4110, 78.5800], ['Peerzadiguda', 17.4110, 78.6040], ['Ghatkesar', 17.4510, 78.6870],
  ['Amberpet', 17.3900, 78.5180, ['bagh amberpet']], ['Vidyanagar', 17.4040, 78.5070], ['Nallakunta', 17.3970, 78.5000],
  ['Himayatnagar', 17.4010, 78.4870, ['himayat nagar']], ['Narayanguda', 17.3930, 78.4870], ['Abids', 17.3920, 78.4760],
  ['Koti', 17.3850, 78.4860], ['Nampally', 17.3890, 78.4690], ['Malakpet', 17.3730, 78.5000], ['Saidabad', 17.3600, 78.5130],
  ['Dilsukhnagar', 17.3688, 78.5247, ['dilsukh nagar', 'dilsuknagar', 'dsnr', 'dilshuknagar']], ['Kothapet', 17.3680, 78.5430],
  ['Saroornagar', 17.3530, 78.5290, ['saroor nagar']], ['LB Nagar', 17.3457, 78.5522, ['l b nagar', 'lbnagar']],
  ['Vanasthalipuram', 17.3300, 78.5700], ['Hayathnagar', 17.3270, 78.6040, ['hayat nagar']], ['Charminar', 17.3616, 78.4747, ['old city']],
  ['Falaknuma', 17.3310, 78.4670], ['Chandrayangutta', 17.3100, 78.4800], ['Patancheru', 17.5280, 78.2670], ['Tellapur', 17.4630, 78.2840],
  ['Medchal', 17.6290, 78.4810], ['Shamirpet', 17.5960, 78.5650],
].map(([name, lat, lng, aliases = []]) => ({ name, lat, lng, aliases }));

const OTHER = 'Other';
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Every name and alias, longest first, so "KPHB Colony" wins over a shorter overlap.
const KEYS = LOCALITIES.flatMap((l) => [l.name, ...l.aliases].map((k) => ({ key: norm(k), name: l.name })))
  .sort((a, b) => b.key.length - a.key.length);

function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

// Typed text ("Plot 12, Madhapur, Hyderabad", "dilsuknagar", "Kukatpally Housing Board") → locality.
function localityFromText(text) {
  const t = ` ${norm(text)} `;
  if (!t.trim()) return null;
  for (const { key, name } of KEYS) if (t.includes(` ${key} `)) return name;
  // Joined/typo'd spellings: compare each word (and word pairs) with a small edit distance.
  const words = t.trim().split(' ');
  const grams = [...words, ...words.slice(1).map((w, i) => `${words[i]} ${w}`), ...words.slice(1).map((w, i) => `${words[i]}${w}`)];
  for (const { key, name } of KEYS) {
    if (key.length < 6) continue;
    if (grams.some((g) => Math.abs(g.length - key.length) <= 2 && levenshtein(g, key) <= (key.length >= 10 ? 2 : 1))) return name;
  }
  return null;
}

function km(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Map point → nearest locality centre, or 'Other' if it's not near any of them.
function localityFromPoint(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  let best = null, bestKm = Infinity;
  for (const l of LOCALITIES) {
    const d = km(lat, lng, l.lat, l.lng);
    if (d < bestKm) { bestKm = d; best = l.name; }
  }
  return bestKm <= MAX_KM ? best : OTHER;
}

const LOCALITY_NAMES = LOCALITIES.map((l) => l.name).sort((a, b) => a.localeCompare(b));

module.exports = { LOCALITY_NAMES, localityFromText, localityFromPoint, OTHER };
