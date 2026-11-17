/* ===== Round 4: mobile chrome (bottom nav, header height), mobile comparison table, account page ===== */
(function () {
  'use strict';
  var RK = window.RK, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var inr = function (n) { return '\u20b9' + Math.round(n).toLocaleString('en-IN'); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CFG = window.RK_CONFIG || {};

  /* header height -> CSS variable so page content always clears the fixed header */
  function measure() { var h = $('header'); if (h) document.documentElement.style.setProperty('--rk-hdr', Math.ceil(h.getBoundingClientRect().height) + 'px'); }
  if ('ResizeObserver' in window && $('header')) new ResizeObserver(measure).observe($('header')); window.addEventListener('resize', measure); measure();

  /* bottom navigation (mobile only, via CSS) */
  var NAV = [['explore', 'Explore', 'home'], ['local_offer', 'Combos', 'planner'], ['tune', 'Planner', 'plan'], ['person', 'Account', 'account'], ['shopping_bag', 'Cart', 'cart'], ['support_agent', 'Help', 'help']];
  function buildNav() {
    var n = document.createElement('nav'); n.id = 'rk-bnav'; n.setAttribute('aria-label', 'Quick navigation');
    n.innerHTML = NAV.map(function (x) { return '<button type="button" data-bn="' + x[2] + '"><span class="rk-bn-i"><span class="material-symbols-outlined">' + x[0] + '</span>' + (x[2] === 'cart' ? '<b id="rk-bn-badge" hidden>0</b>' : '') + '</span><span class="rk-bn-t">' + x[1] + '</span></button>'; }).join('');
    document.body.appendChild(n);
    n.addEventListener('click', function (e) {
      var b = e.target.closest('[data-bn]'); if (!b) return; var k = b.dataset.bn;
      if (k === 'help') { if (window.RKAssistant) RKAssistant.open(); return; }
      if (k === 'plan') { RK.show('home', { force: true }); setTimeout(function () { var h = document.getElementById('rk-hero'); if (h) h.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 80); return; }
      if (k === 'account') { if (window.RKAUTH) RKAUTH.account(); return; }
      RK.show(k, { force: true });
    });
  }
  function syncNav() {
    var v = RK.cur(); document.body.setAttribute('data-rk-view', v);
    $$('#rk-bnav [data-bn]').forEach(function (b) { var k = b.dataset.bn; b.classList.toggle('on', (k === 'home' && v === 'home') || (k === 'planner' && v === 'planner') || (k === 'cart' && v === 'cart') || (k === 'account' && (v === 'dashboard' || v === 'orders' || v === 'track' || v === 'settings' || v === 'pay'))); });
    var c = $('#rk-cart-count'), bb = $('#rk-bn-badge'); if (c && bb) { var n = parseInt(c.textContent, 10) || 0; bb.textContent = n; bb.hidden = !n; }
  }

  /* mobile comparison table, built from the desktop one so both always agree */
  function buildMatrix() {
    var src = $('#rk-matrix'), host = $('#rk-matrix-m'); if (!src) return;
    if (!host) { host = document.createElement('section'); host.id = 'rk-matrix-m'; host.className = 'rk-matrix-m'; src.parentNode.insertBefore(host, src.nextSibling); }
    if (host.dataset.done) return; host.dataset.done = 1;
    var head = $('.text-center', src), title = head ? $('h2', head).textContent : 'Rentickle vs Local Rental vs Buying New', sub = head ? $('p', head).innerHTML : '';
    var rows = $$('.divide-y > .grid', src).map(function (r) {
      var c = $$(':scope > div', r), main = function (el) { var t = ''; el.childNodes.forEach(function (n) { if (n.nodeType === 3) t += n.textContent; }); return t.trim(); }, note = function (el) { var s = $('span.block', el); return s ? s.innerHTML : ''; };
      return { t: $('h4', c[0]).textContent, d: $('p', c[0]).innerHTML, r: main(c[1]), rn: note(c[1]), l: main(c[2]), ln: note(c[2]), b: main(c[3]), bn: note(c[3]) };
    });
    host.innerHTML = '<div class="rk-mx-head"><h2>' + esc(title) + '</h2><p>' + sub + '</p></div><div class="rk-mx"><div class="rk-mx-row hd"><div>Decision metric</div><div class="r"><span data-loc-t="Rentickle {city}">Rentickle</span></div><div>Local / Buy</div></div>' +
      rows.map(function (x) { return '<div class="rk-mx-row"><div><b>' + esc(x.t) + '</b><small>' + x.d + '</small></div><div class="r"><b>' + esc(x.r) + '</b><small>' + x.rn + '</small></div><div><b>' + esc(x.l) + '</b><small>' + x.ln + '</small><small class="buy">Buy new: ' + esc(x.b) + '</small></div></div>'; }).join('') + '</div>';
    if (window.RKLOC) RKLOC.apply();
  }

  /* account page: active order card */
  function orderCard() { if (window.RKORD) window.RKORD.card(); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-ao]'); if (t) { RK.show('confirm', { force: true }); return; }
    var q = e.target.closest('[data-qa]'); if (!q) return; var k = q.dataset.qa;
    if (k === 'orders') RK.show('orders', { force: true });
    else if (k === 'addresses') { var sa = $('#saved-addresses'); if (sa) sa.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
    else if (k === 'support') { if (window.RKAssistant) RKAssistant.open(); }
    else if (k === 'settings') RK.show('settings', { force: true });
    else if (k === 'signout') { if (window.RKAUTH) RKAUTH.signOut(); }
    else if (k === 'pay') { window.__rkPay = ''; RK.show('pay', { force: true }); }
  });

  buildNav();
  var prev = window.RKX && window.RKX.render;
  window.RKX = Object.assign(window.RKX || {}, { render: function (view) {
    if (prev) prev(view);
    syncNav(); measure();
    if (view === 'home') buildMatrix();
    if (view === 'dashboard') orderCard();
  } });
  syncNav(); buildMatrix(); orderCard();
})();
