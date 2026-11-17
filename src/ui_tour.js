/* ===== Round 6: guided tour ("What's improved") ===== */
(function () {
  'use strict';
  var RK = window.RK, $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'rk-tour-seen', isM = function () { return window.innerWidth <= 767; };
  var STEPS = [
    { sel: '#categories-browser .rk-cm', text: '12 categories, one tap away.' },
    { sel: '#rk-flip', text: 'Plan your move-in in two steps.' },
    { sel: function () { return isM() ? '#rk-bnav [data-bn=help]' : '#rk-assistant-btn'; }, text: 'Ask the assistant anything.' },
    { sel: '#rk-acct-btn', text: 'Orders and live tracking live here.' },
    { sel: '#rk-city-btn', text: 'Switch city in one tap.' },
    { sel: '.rk-ic[aria-label="Cart"]', text: 'Coupons are in your cart.' },
    { sel: '#rk-bnav', text: 'Built for mobile too.', mobile: true }
  ];
  var root, spot, card, steps = [], i = 0, active = false, lastF = null, raf = 0;
  function seen() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  function target() { var s = steps[i].sel; s = typeof s === 'function' ? s() : s; return document.querySelector(s); }
  function place() {
    raf = 0; if (!active) return; var t = target(); if (!t) return; var r = t.getBoundingClientRect(), pad = 8, vw = innerWidth, vh = innerHeight;
    spot.style.cssText = 'left:' + (r.left - pad) + 'px;top:' + (r.top - pad) + 'px;width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px';
    if (isM()) {
      var hdr = ($('header') || { getBoundingClientRect: function () { return { bottom: 100 }; } }).getBoundingClientRect().bottom, mid = r.top + r.height / 2;
      card.style.left = '12px'; card.style.right = '12px'; card.style.width = 'auto'; card.style.transform = '';
      if (mid > vh * 0.5) { card.style.top = (hdr + 12) + 'px'; card.style.bottom = 'auto'; } else { card.style.bottom = '84px'; card.style.top = 'auto'; }
    } else {
      var w = 320, ch = card.offsetHeight || 150, below = r.bottom + pad + 14 + ch < vh, left = Math.min(Math.max(16, r.left + r.width / 2 - w / 2), vw - w - 16);
      card.style.width = w + 'px'; card.style.right = 'auto'; card.style.bottom = 'auto'; card.style.left = left + 'px'; card.style.top = (below ? r.bottom + pad + 14 : Math.max(16, r.top - pad - 14 - ch)) + 'px';
    }
  }
  function queue() { if (!raf) raf = requestAnimationFrame(place); }
  function render() {
    var s = steps[i], last = i === steps.length - 1;
    card.innerHTML = '<div class="rk-tr-top"><span class="rk-tr-prog" aria-label="Step ' + (i + 1) + ' of ' + steps.length + '">' + steps.map(function (_, k) { return '<i class="' + (k === i ? 'on' : k < i ? 'done' : '') + '"></i>'; }).join('') + '</span><span class="rk-tr-n">' + (i + 1) + ' / ' + steps.length + '</span></div><p class="rk-tr-t" id="rk-tr-t">' + esc(s.text) + '</p><div class="rk-tr-btns"><button type="button" class="rk-link" data-tr="skip">Skip</button><span><button type="button" class="rk-btn sec" data-tr="back"' + (i === 0 ? ' disabled' : '') + '>Back</button><button type="button" class="rk-btn pri" data-tr="next">' + (last ? 'Done' : 'Next') + '</button></span></div>';
    var t = target(); if (t) { var fixed = false, p = t; while (p && p !== document.body) { if (getComputedStyle(p).position === 'fixed') { fixed = true; break; } p = p.parentElement; } if (!fixed) t.scrollIntoView({ block: 'center', behavior: 'auto' }); }
    place(); setTimeout(place, 60); var nb = card.querySelector('[data-tr=next]'); if (nb) nb.focus({ preventScroll: true });
  }
  function end() { if (!active) return; active = false; seen(); root.remove(); root = null; document.documentElement.classList.remove('rk-lock'); window.removeEventListener('resize', queue); window.removeEventListener('scroll', queue, true); if (lastF && lastF.focus) lastF.focus({ preventScroll: true }); }
  function go(d) { var n = i + d; if (n >= steps.length) { end(); return; } if (n < 0) return; i = n; while (!target() && i + d >= 0 && i + d < steps.length) i += d; render(); }
  function start() {
    if (active) return; if (RK.cur() !== 'home') RK.show('home', { force: true });
    steps = STEPS.filter(function (s) { return !s.mobile || isM(); }); i = 0; active = true; lastF = document.activeElement;
    root = document.createElement('div'); root.className = 'rk-tour'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'rk-tr-t');
    spot = document.createElement('div'); spot.className = 'rk-tour-spot'; card = document.createElement('div'); card.className = 'rk-tour-card';
    root.appendChild(spot); root.appendChild(card); document.body.appendChild(root); document.documentElement.classList.add('rk-lock');
    root.addEventListener('click', function (e) { var b = e.target.closest('[data-tr]'); if (!b) return; var k = b.dataset.tr; if (k === 'skip') end(); else if (k === 'next') go(1); else if (k === 'back') go(-1); });
    window.addEventListener('resize', queue); window.addEventListener('scroll', queue, true); setTimeout(render, 120);
  }
  document.addEventListener('keydown', function (e) { if (!active) return; if (e.key === 'Escape') end(); else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); });
  document.addEventListener('click', function (e) { if (e.target.closest('[data-tour]')) { e.preventDefault(); start(); } });
  window.RKTOUR = { start: start };
  var done = false; try { done = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (!done) setTimeout(function () { if (RK.cur() === 'home' && !document.querySelector('.rk-modal') && !document.querySelector('#location-modal-overlay:not(.hidden)')) start(); }, 1600);
})();
