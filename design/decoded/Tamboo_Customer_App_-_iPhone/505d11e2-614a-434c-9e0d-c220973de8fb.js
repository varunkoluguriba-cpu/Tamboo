// Live UI translation layer for the Tamboo prototype.
// Watches the phone screen's text nodes + placeholders and swaps English strings for the selected language.
// Known strings come from utsaviyana-i18n.js; everything else is translated on demand and cached in localStorage.
(function () {
  const CK = 'utsaviyana_tr_cache_v2';
  let cache = {}; try { cache = JSON.parse(localStorage.getItem(CK) || '{}'); } catch (e) { }
  const orig = new WeakMap(), lastSet = new WeakMap(), phOrig = new WeakMap(), phSet = new WeakMap();
  let root = null, lang = 'en', obs = null, queue = new Set(), timer = null, busy = 0, onStatus = () => { };
  const tracked = new Set();
  const hasLatin = (s) => /[A-Za-z]{2,}/.test(s);
  const skip = (el) => !el || el.closest('[data-no-tr]') || ['SCRIPT', 'STYLE', 'OPTION'].includes(el.tagName);
  const langName = (l) => { const x = (window.UI18N && UI18N.LANGS.find(a => a[0] === l)); return x ? x[2] : l; };

  function seedFromDict() {
    if (!window.UI18N) return;
    const en = UI18N.t('en');
    UI18N.LANGS.forEach(([l]) => { if (l === 'en' || !UI18N.full(l)) return; const d = UI18N.t(l); cache[l] = cache[l] || {}; Object.keys(en).forEach(k => { if (d[k] && d[k] !== en[k] && !cache[l][en[k]]) cache[l][en[k]] = d[k]; }); });
  }
  function save() { try { localStorage.setItem(CK, JSON.stringify(cache)); } catch (e) { } }

  function applyText(n) {
    let src = orig.get(n);
    if (src == null) return;
    const key = src.trim();
    if (lang === 'en' || !hasLatin(key)) { if (n.nodeValue !== src) { lastSet.set(n, src); n.nodeValue = src; } return; }
    const tr = cache[lang] && cache[lang][key];
    if (tr) { const out = src.replace(key, tr); if (n.nodeValue !== out) { lastSet.set(n, out); n.nodeValue = out; } }
    else { queue.add(key); schedule(); if (n.nodeValue !== src) { lastSet.set(n, src); n.nodeValue = src; } }
  }
  function applyPh(el) {
    const src = phOrig.get(el); if (src == null) return;
    if (lang === 'en' || !hasLatin(src)) { if (el.placeholder !== src) { phSet.set(el, src); el.placeholder = src; } return; }
    const tr = cache[lang] && cache[lang][src];
    if (tr) { if (el.placeholder !== tr) { phSet.set(el, tr); el.placeholder = tr; } } else { queue.add(src); schedule(); }
  }
  function track(n) {
    if (n.nodeType === 3) {
      if (skip(n.parentElement) || !n.nodeValue.trim()) return;
      if (lastSet.get(n) === n.nodeValue) return;
      orig.set(n, n.nodeValue); tracked.add(n); applyText(n);
    } else if (n.nodeType === 1) {
      if (skip(n)) return;
      if ((n.tagName === 'INPUT' || n.tagName === 'TEXTAREA') && n.placeholder && phSet.get(n) !== n.placeholder) { phOrig.set(n, n.placeholder); tracked.add(n); applyPh(n); }
      n.childNodes.forEach(track);
    }
  }
  function reapply() { tracked.forEach(n => { if (!n.isConnected) { tracked.delete(n); return; } n.nodeType === 3 ? applyText(n) : applyPh(n); }); }

  function schedule() { clearTimeout(timer); timer = setTimeout(flush, 300); }
  async function one(l, items) {
    try {
      const res = await window.claude.complete({
        max_tokens: 4000,
        system: `You translate mobile-app UI strings for "Tamboo", an Indian event-rental marketplace (tents, chairs, vessels, lighting, decor). Translate into ${langName(l)} using its native script, with natural everyday wording a customer expects in a consumer app. Keep unchanged: the brand name Tamboo, rupee amounts (₹), numbers, booking/quote IDs like UT-250101, TM-240917, Q-1182, coupon codes, and the acronyms OTP, UPI, GST, PDF. Keep business names and person names as they are. You receive a JSON array of strings. Return ONLY a JSON array of the same length with the translations in the same order.`,
        messages: [{ role: 'user', content: JSON.stringify(items) }],
      });
      const m = res.match(/\[[\s\S]*\]/); const arr = m ? JSON.parse(m[0]) : [];
      cache[l] = cache[l] || {};
      items.forEach((s, i) => { if (typeof arr[i] === 'string' && arr[i].trim()) cache[l][s] = arr[i]; });
      save();
    } catch (e) { console.warn('[translate]', e); }
  }
  async function flush() {
    if (lang === 'en' || !queue.size) return;
    if (!window.claude || !window.claude.complete) { onStatus('offline'); return; }
    const l = lang, items = [...queue].filter(s => !(cache[l] && cache[l][s])).slice(0, 90);
    items.forEach(s => queue.delete(s));
    if (!items.length) return;
    busy++; onStatus('busy');
    const chunks = []; for (let i = 0; i < items.length; i += 30) chunks.push(items.slice(i, i + 30));
    await Promise.all(chunks.map(c => one(l, c).then(() => { if (l === lang) reapply(); })));
    busy--;
    if (queue.size && lang !== 'en') schedule(); else if (!busy) onStatus('idle');
  }

  window.UTX = {
    attach(el, status) {
      if (obs) obs.disconnect();
      root = el; onStatus = status || onStatus; seedFromDict(); window.UTX.attached = true;
      track(root);
      obs = new MutationObserver(ms => ms.forEach(m => {
        if (m.type === 'characterData') track(m.target);
        else if (m.type === 'attributes') { const t = m.target; if (t.placeholder && phSet.get(t) !== t.placeholder) { phOrig.set(t, t.placeholder); tracked.add(t); applyPh(t); } }
        else m.addedNodes.forEach(track);
      }));
      obs.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder'] });
    },
    setLang(l) { window.UTX.lang = l; lang = l; queue.clear(); reapply(); if (l === 'en') onStatus('idle'); },
    clearCache() { cache = {}; save(); seedFromDict(); },
  };
})();
