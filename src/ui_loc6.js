/* ===== Round 4: city picker (instant switch) + one city state for the whole site ===== */
(function () {
  'use strict';
  var RK = window.RK, CFG = window.RK_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var toast = function (m) { if (window.rkToast) window.rkToast(m); };
  var KEY = 'rk-city';
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

  /* All seven cities are served (Excel "Cities" sheet), with identical pricing and stock. Order matches the design: 4 + 3. */
  var CITIES = [
    { n: 'Delhi', tag: 'Capital Region Hub', st: 'DL', code: 'DEL' }, { n: 'Gurgaon', tag: 'Millennium City Hub', st: 'HR', code: 'GGN' },
    { n: 'Hyderabad', tag: 'Cyberabad Hub', st: 'TS', code: 'HYD' }, { n: 'Noida', tag: 'Tricity Express Hub', st: 'UP', code: 'NOI' },
    { n: 'Bengaluru', tag: 'Silicon Valley Hub', st: 'KA', code: 'BLR' }, { n: 'Pune', tag: 'IT Corridor & Citywide', st: 'MH', code: 'PNQ' },
    { n: 'Mumbai', tag: 'Metro Hub', st: 'MH', code: 'MUM' }
  ];
  var BY = {}; CITIES.forEach(function (c) { BY[c.n] = c; });
  var canon = function (n) { n = String(n || '').trim(); if (BY[n]) return n; var l = n.toLowerCase(); return l === 'bangalore' ? 'Bengaluru' : l === 'gurugram' ? 'Gurgaon' : l === 'new delhi' ? 'Delhi' : 'Gurgaon'; };
  var stored = LS.get(KEY, null);
  var CUR = stored && stored.city ? { city: canon(stored.city), pin: stored.pin || '' } : { city: 'Gurgaon', pin: '122002' };
  var info = function () { return BY[CUR.city] || BY.Gurgaon; };
  var label = function () { return CUR.city; };

  /* ---------- illustrated landmark tiles (swap for photos via RK_CONFIG.cityImages = { Delhi: 'images/cities/delhi.webp', ... }) ---------- */
  var SKY = { Delhi: ['#ffd9a8', '#7aa7d6'], Gurgaon: ['#bfe0f5', '#5f9ed1'], Hyderabad: ['#ffe0b8', '#8bb4de'], Noida: ['#cfe6f7', '#6aa6d8'], Bengaluru: ['#c9e4f4', '#7db4dc'], Pune: ['#f6dcc0', '#86a9cc'], Mumbai: ['#ffcf9f', '#e9946e'] };
  var ART = {
    Delhi: '<rect x="14" y="30" width="44" height="30" fill="#c8895a"/><rect x="11" y="26" width="50" height="6" fill="#b4723f"/><path d="M26 60V42a10 10 0 0 1 20 0v18z" fill="#6f98c4"/><rect x="31" y="20" width="10" height="8" fill="#b4723f"/><rect x="0" y="58" width="72" height="14" fill="#5f8f4e"/>',
    Gurgaon: '<rect x="10" y="26" width="14" height="36" fill="#4f7fa8"/><rect x="26" y="10" width="17" height="52" fill="#2f5d8a"/><rect x="45" y="22" width="15" height="40" fill="#6c98c0"/><rect x="60" y="34" width="9" height="28" fill="#4f7fa8"/><path d="M29 16h11M29 24h11M29 32h11M29 40h11M29 48h11M13 34h8M13 42h8M13 50h8M48 30h9M48 38h9M48 46h9" stroke="#cfe4f5" stroke-width="1.6"/><rect x="0" y="60" width="72" height="12" fill="#3f6f95"/>',
    Hyderabad: '<rect x="12" y="38" width="48" height="22" fill="#e8d7bd"/><path d="M28 60V46a8 8 0 0 1 16 0v14z" fill="#8a6a47"/><rect x="9" y="18" width="7" height="40" fill="#efe0c7"/><rect x="56" y="18" width="7" height="40" fill="#efe0c7"/><rect x="21" y="26" width="6" height="14" fill="#efe0c7"/><rect x="45" y="26" width="6" height="14" fill="#efe0c7"/><circle cx="12.5" cy="16" r="4" fill="#d9c2a0"/><circle cx="59.5" cy="16" r="4" fill="#d9c2a0"/><circle cx="24" cy="24" r="3.4" fill="#d9c2a0"/><circle cx="48" cy="24" r="3.4" fill="#d9c2a0"/><rect x="0" y="58" width="72" height="14" fill="#9a7a58"/>',
    Noida: '<rect x="8" y="34" width="12" height="28" fill="#5b8db8"/><rect x="22" y="14" width="13" height="48" fill="#2f5d8a"/><rect x="37" y="26" width="12" height="36" fill="#7fa9cf"/><rect x="51" y="8" width="13" height="54" fill="#3b6f9c"/><path d="M25 20h7M25 28h7M25 36h7M25 44h7M54 14h7M54 22h7M54 30h7M54 38h7M40 32h6M40 40h6" stroke="#dcebf7" stroke-width="1.5"/><rect x="0" y="60" width="72" height="12" fill="#6b9a5a"/>',
    Bengaluru: '<rect x="8" y="38" width="56" height="22" fill="#d9a678"/><rect x="26" y="30" width="20" height="10" fill="#c48f62"/><path d="M28 30a8 8 0 0 1 16 0z" fill="#b97d52"/><rect x="35" y="14" width="2" height="8" fill="#8a5a38"/><path d="M30 22a6 6 0 0 1 12 0z" fill="#b97d52"/><path d="M12 44h48M12 50h48" stroke="#f3dcc2" stroke-width="2"/><path d="M14 38v22M22 38v22M50 38v22M58 38v22" stroke="#f3dcc2" stroke-width="2"/><rect x="0" y="58" width="72" height="14" fill="#6a9a55"/>',
    Pune: '<rect x="8" y="30" width="18" height="30" fill="#8a6a55"/><rect x="46" y="30" width="18" height="30" fill="#8a6a55"/><rect x="24" y="36" width="24" height="24" fill="#a07b63"/><path d="M30 60V48a6 6 0 0 1 12 0v12z" fill="#4b3a30"/><path d="M8 30h18M46 30h18" stroke="#6e5240" stroke-width="3"/><path d="M11 24l3 6M17 24l3 6M49 24l3 6M55 24l3 6" stroke="#6e5240" stroke-width="2"/><rect x="0" y="58" width="72" height="14" fill="#6f9b55"/>',
    Mumbai: '<rect x="12" y="34" width="48" height="26" fill="#d9b98a"/><path d="M27 60V44a9 9 0 0 1 18 0v16z" fill="#7aa6c8"/><rect x="12" y="28" width="9" height="8" fill="#c9a574"/><rect x="51" y="28" width="9" height="8" fill="#c9a574"/><path d="M14 28a3 3 0 0 1 6 0zM53 28a3 3 0 0 1 6 0z" fill="#b48a58"/><path d="M26 34a10 10 0 0 1 20 0z" fill="#c9a574"/><path d="M0 60q9-4 18 0t18 0 18 0 18 0v12H0z" fill="#2f78a8"/>'
  };
  function art(c) {
    var g = SKY[c]; if (CFG.cityImages && CFG.cityImages[c]) return '<img src="' + esc(CFG.cityImages[c]) + '" alt="" width="72" height="72" loading="lazy" decoding="async">';
    return '<svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true" focusable="false"><defs><linearGradient id="sk-' + c + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + g[0] + '"/><stop offset="1" stop-color="' + g[1] + '"/></linearGradient></defs><rect width="72" height="72" fill="url(#sk-' + c + ')"/>' + ART[c] + '</svg>';
  }

  /* ---------- picker markup ---------- */
  function buildPicker() {
    var ov = $('#location-modal-overlay'); if (!ov) return;
    ov.setAttribute('aria-labelledby', 'rk-cd-title'); ov.removeAttribute('aria-label');
    ov.innerHTML = '<div class="rk-cd" role="document"><button class="rk-cd-x" type="button" onclick="closeLocationModal()" aria-label="Close city picker"><span class="material-symbols-outlined">close</span></button>' +
      '<div class="rk-cd-head"><span class="rk-cd-ic" aria-hidden="true"><span class="material-symbols-outlined">my_location</span></span><div><h2 id="rk-cd-title">Choose Your City</h2><p>Select your city to explore rental products and services available near you.</p></div></div>' +
      '<div class="rk-cd-grid" id="cities-grid" role="radiogroup" aria-labelledby="rk-cd-title">' + CITIES.map(function (c) {
        return '<button type="button" class="city-card rk-ct" role="radio" aria-checked="false" data-city="' + c.n + '"><span class="rk-ct-img">' + art(c.n) + '</span><span class="rk-ct-name">' + c.n + '</span></button>';
      }).join('') + '</div><p class="rk-cd-note"><span class="material-symbols-outlined">local_shipping</span>48h delivery \u00b7 Free assembly</p></div>';
  }
  function mark() { $$('#cities-grid .rk-ct').forEach(function (b) { var on = b.dataset.city === CUR.city; b.classList.toggle('selected', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); }); }

  /* ---------- apply the city everywhere ---------- */
  function tpl(t) { return t.replace(/\{city\}/g, CUR.city).replace(/\{code\}/g, info().code).replace(/\{pinText\}/g, CUR.pin ? 'Pincode ' + CUR.pin + ' \u00b7 ' : '').replace(/\{pin\}/g, CUR.pin ? ' ' + CUR.pin : ''); }
  function apply() {
    var set = function (id, txt) { var e = document.getElementById(id); if (e) e.textContent = txt; };
    set('rk-brand-city', CUR.city + ' Hub'); set('rk-city-label', label()); set('rk-city-sla', '48h Delivery Certified');
    set('rk-cart-city', 'Delivering to ' + CUR.city + (CUR.pin ? ' ' + CUR.pin : ''));
    var isG = CUR.city === 'Gurgaon';
    $$('[data-loc]').forEach(function (e) { var t = e.dataset.loc; e.textContent = t === 'hub' ? CUR.city + ' Hub' : t === 'possessive' ? CUR.city + "'s" : t === 'tag' ? info().tag : CUR.city; });
    $$('[data-loc-t]').forEach(function (e) { if (e.dataset.locG === undefined) e.dataset.locG = e.innerHTML; e.innerHTML = isG ? e.dataset.locG : esc(tpl(e.dataset.locT)); });
    $$('[data-loc-only]').forEach(function (e) { e.classList.toggle('rk-loc-off', e.dataset.locOnly !== CUR.city); });
    if (RK && RK.state) RK.state.city = { city: CUR.city, tagline: info().tag };
    document.documentElement.setAttribute('data-city', CUR.city); mark();
  }
  function choose(name) {
    name = canon(name); var changed = name !== CUR.city;
    CUR = { city: name, pin: name === 'Gurgaon' && !changed ? CUR.pin : (name === 'Gurgaon' ? '122002' : '') };
    LS.set(KEY, CUR); if (RK && RK.persist) RK.persist();
    apply();
    setTimeout(function () { close(); if (RK) RK.show(RK.cur(), { force: true }); if (changed) toast('Now showing ' + name + '.'); }, reduce ? 0 : 140);
    if (changed) document.dispatchEvent(new CustomEvent('rk:citychange', { detail: { city: CUR.city, pin: CUR.pin } }));
  }

  /* ---------- open / close ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, lastFocus = null;
  function open() { var o = $('#location-modal-overlay'); if (!o) return; lastFocus = document.activeElement; mark(); o.classList.remove('hidden'); document.documentElement.classList.add('rk-lock'); var s = $('#cities-grid .selected') || $('#cities-grid .rk-ct'); if (s) s.focus({ preventScroll: true }); }
  function close() { var o = $('#location-modal-overlay'); if (!o || o.classList.contains('hidden')) return; o.classList.add('hidden'); document.documentElement.classList.remove('rk-lock'); document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  window.openLocationModal = open; window.closeLocationModal = close;
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('#cities-grid .rk-ct'); if (t) choose(t.dataset.city); });
  document.addEventListener('keydown', function (e) {
    var o = $('#location-modal-overlay'); if (!o || o.classList.contains('hidden')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') { var f = $$('button', o); if (!f.length) return; var i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); } }
    if (/^Arrow/.test(e.key) && document.activeElement && document.activeElement.classList.contains('rk-ct')) { var t = $$('#cities-grid .rk-ct'), i2 = t.indexOf(document.activeElement), d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1; t[(i2 + d + t.length) % t.length].focus(); e.preventDefault(); }
  });
  var ov = $('#location-modal-overlay'); if (ov) ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });

  window.RKLOC = { apply: apply, get: function () { return CUR; }, choose: choose, open: open, close: close, mult: function () { return 1; }, unavail: function () { return false; }, noteHTML: function () { return ''; }, info: info };
  buildPicker(); apply();
  if (RK && RK.cur) RK.show(RK.cur(), { force: true });
})();
