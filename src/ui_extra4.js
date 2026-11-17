/* ===== Round 2: account (edit details + addresses), settings, header menu, awards strip ===== */
(function () {
  'use strict';
  var RK = window.RK, CFG = window.RK_CONFIG || {}, API = (CFG.api && CFG.api.baseUrl) || '';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var toast = function (m) { if (window.rkToast) window.rkToast(m); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var store = { profile: LS.get('rk-profile', null) || { name: 'Naman', phone: '9130208733', email: 'snaman2310@gmail.com' }, addrs: LS.get('rk-addrs', []), notify: LS.get('rk-notify', { email: true, sms: true, whatsapp: false }) };
  var LOCAL = !API;
  var delay = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function api(method, path, body) {
    return fetch(API + path, { method: method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (e) { throw new Error(e.message || 'Request failed (' + r.status + ')'); });
      return r.status === 204 ? null : r.json();
    });
  }
  /* Data layer. With RK_CONFIG.api.baseUrl set it calls the endpoints listed in the hand-off notes; without it, it saves on this device only (and the UI says so). */
  var DATA = {
    loadAll: function () { if (LOCAL) return Promise.resolve(); return Promise.all([api('GET', '/me'), api('GET', '/me/addresses'), api('GET', '/me/notifications')]).then(function (r) { store.profile = r[0] && r[0].name ? r[0] : null; store.addrs = Array.isArray(r[1]) ? r[1] : []; if (r[2] && typeof r[2] === 'object') store.notify = r[2]; }); },
    saveProfile: function (p) { if (!LOCAL) return api('PUT', '/me', p).then(function (r) { if (r && r.verificationRequired) return { pending: r, p: p }; store.profile = r || p; return store.profile; }); return delay(450).then(function () { store.profile = p; LS.set('rk-profile', p); return p; }); },
    saveAddr: function (a) {
      if (!LOCAL) return (a.id ? api('PUT', '/me/addresses/' + a.id, a) : api('POST', '/me/addresses', a)).then(function () { return api('GET', '/me/addresses'); }).then(function (l) { store.addrs = l; });
      return delay(450).then(function () {
        var l = store.addrs.slice(); if (!a.id) { a.id = 'a' + Date.now(); l.push(a); } else l = l.map(function (x) { return x.id === a.id ? a : x; });
        if (a.isDefault || l.length === 1) { l.forEach(function (x) { x.isDefault = x.id === a.id || (l.length === 1); }); }
        store.addrs = l; LS.set('rk-addrs', l);
      });
    },
    delAddr: function (id) { if (!LOCAL) return api('DELETE', '/me/addresses/' + id).then(function () { return api('GET', '/me/addresses'); }).then(function (l) { store.addrs = l; }); return delay(300).then(function () { var l = store.addrs.filter(function (x) { return x.id !== id; }); if (l.length && !l.some(function (x) { return x.isDefault; })) l[0].isDefault = true; store.addrs = l; LS.set('rk-addrs', l); }); },
    defAddr: function (id) { if (!LOCAL) return api('POST', '/me/addresses/' + id + '/default').then(function () { return api('GET', '/me/addresses'); }).then(function (l) { store.addrs = l; }); return delay(250).then(function () { store.addrs.forEach(function (x) { x.isDefault = x.id === id; }); LS.set('rk-addrs', store.addrs); }); },
    saveNotify: function (n) { if (!LOCAL) return api('PUT', '/me/notifications', n).then(function () { store.notify = n; }); store.notify = n; LS.set('rk-notify', n); return Promise.resolve(); }
  };

  /* ---------- validation ---------- */
  var V = {
    name: function (v) { v = v.trim(); if (!v) return 'Enter your full name.'; if (v.length < 2) return 'Name is too short.'; if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(v)) return 'Use letters, spaces, . \' or - only.'; return ''; },
    phone: function (v) { if (!v.trim()) return 'Enter your mobile number.'; if (!/^[6-9]\d{9}$/.test(normPhone(v))) return 'Enter a valid 10-digit Indian mobile number starting with 6-9 (a +91 prefix is fine).'; return ''; },
    email: function (v) { v = v.trim(); if (!v) return 'Enter your email address.'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email, like name@example.com.'; return ''; },
    line1: function (v) { v = v.trim(); if (!v) return 'Enter the flat / house number and street.'; if (v.length < 5) return 'Please add a little more detail.'; return ''; },
    city: function (v) { return v.trim() ? '' : 'Enter the city.'; },
    pin: function (v) { return /^[1-9]\d{5}$/.test(v.trim()) ? '' : 'Enter a valid 6-digit pincode.'; }
  };
  /* A leading 91 is only a country code when written +91, or when the number has 12 digits (91 + 10).
     The old rule stripped "91" from every number, so valid mobiles such as 9123456789 were rejected. */
  function normPhone(v) {
    var s0 = String(v).trim(), d = s0.replace(/\D/g, '');
    if (/^\+/.test(s0)) { if (d.indexOf('91') === 0) d = d.slice(2); }
    else if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    else if (d.length === 11 && d[0] === '0') d = d.slice(1);
    return d;
  }
  var fmtPhone = function (d) { return d && d.length === 10 ? '+91 ' + d.slice(0, 5) + ' ' + d.slice(5) : (d || ''); };

  /* ---------- modal ---------- */
  var modalRoot, lastFocus = null;
  function openModal(html, label) {
    closeModal(true); lastFocus = document.activeElement;
    modalRoot = document.createElement('div'); modalRoot.className = 'rk-modal'; modalRoot.innerHTML = '<div class="rk-dialog" role="dialog" aria-modal="true" aria-label="' + esc(label) + '" tabindex="-1">' + html + '</div>';
    document.body.appendChild(modalRoot); document.body.style.overflow = 'hidden';
    modalRoot.addEventListener('mousedown', function (e) { if (e.target === modalRoot) closeModal(); });
    var f = modalRoot.querySelector('input,button.rk-btn.pri,button'); (f || modalRoot.firstChild).focus();
  }
  function closeModal(silent) { if (!modalRoot) return; modalRoot.remove(); modalRoot = null; document.body.style.overflow = ''; if (!silent && lastFocus && lastFocus.focus) lastFocus.focus(); }
  document.addEventListener('keydown', function (e) {
    if (!modalRoot) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') { var f = [].slice.call(modalRoot.querySelectorAll('a[href],button:not([disabled]),input,select,textarea')).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return; var i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); } }
  });
  var localNote = function () { return LOCAL ? '<p class="rk-local"><span class="material-symbols-outlined">info</span>Backend not connected yet: changes are saved on this device only.</p>' : ''; };
  function field(id, label, val, opts) {
    opts = opts || {}; return '<div class="rk-fld"><label for="' + id + '">' + label + (opts.opt ? ' <small>(optional)</small>' : '') + '</label><input id="' + id + '" name="' + id + '" value="' + esc(val || '') + '" type="' + (opts.type || 'text') + '"' + (opts.mode ? ' inputmode="' + opts.mode + '"' : '') + (opts.ac ? ' autocomplete="' + opts.ac + '"' : '') + (opts.max ? ' maxlength="' + opts.max + '"' : '') + ' aria-describedby="' + id + '-e"' + (opts.ph ? ' placeholder="' + opts.ph + '"' : '') + '><p class="rk-err" id="' + id + '-e" role="alert"></p></div>';
  }
  function setErr(id, msg) { var i = $('#' + id), e = $('#' + id + '-e'); if (!i || !e) return; e.textContent = msg; i.setAttribute('aria-invalid', msg ? 'true' : 'false'); i.classList.toggle('bad', !!msg); }
  function bindValidate(map) { Object.keys(map).forEach(function (id) { var i = $('#' + id); if (!i) return; i.addEventListener('blur', function () { setErr(id, map[id](i.value)); }); i.addEventListener('input', function () { if (i.classList.contains('bad')) setErr(id, map[id](i.value)); }); }); }
  function runValidate(map) { var ok = true, first = null; Object.keys(map).forEach(function (id) { var i = $('#' + id), m = map[id](i.value); setErr(id, m); if (m) { ok = false; if (!first) first = i; } }); if (first) first.focus(); return ok; }
  function busy(btn, on, txt) { btn.disabled = on; btn.dataset.t = btn.dataset.t || btn.innerHTML; btn.innerHTML = on ? '<span class="rk-spin"></span>' + txt : btn.dataset.t; }

  /* ---------- profile + banner ---------- */
  function paintBanner() {
    var p = store.profile, ph = $('#acct-phone'); if (ph) { ph.textContent = p && p.phone ? fmtPhone(p.phone) : 'Add mobile number'; ph.classList.toggle('rk-add', !(p && p.phone)); }
    if (!p || !p.name) return;
    var n = $('#acct-name'), i = $('#acct-initials'), e = $('#acct-email');
    if (n) n.textContent = p.name; if (e) e.textContent = p.email;
    if (i) i.textContent = p.name.split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  }
  function editDetails() {
    var p = store.profile || { name: '', phone: '', email: '' };
    openModal('<div class="rk-dh"><h2>Edit details</h2><button class="rk-x" data-k2="close" aria-label="Close"><span class="material-symbols-outlined">close</span></button></div>' + localNote() +
      '<form id="rk-pf" novalidate>' + field('pf-name', 'Full name', p.name, { ac: 'name', max: 60 }) + field('pf-phone', 'Mobile number', p.phone ? p.phone.slice(0, 5) + ' ' + p.phone.slice(5) : '', { type: 'tel', mode: 'numeric', ac: 'tel', ph: '98765 43210', max: 18 }) + (LOCAL ? '<p class="rk-hint" style="margin:-6px 0 12px">Used for delivery updates. OTP verification isn\'t connected yet, so this number is saved but not verified.</p>' : '') + field('pf-email', 'Email', p.email, { type: 'email', ac: 'email', max: 80 }) +
      '<p class="rk-formerr" id="pf-form-e" role="alert"></p><div class="rk-dbtn"><button type="button" class="rk-btn sec lg" data-k2="close">Cancel</button><button type="submit" class="rk-btn pri lg" id="pf-save">Save changes</button></div></form>', 'Edit details');
    var map = { 'pf-name': V.name, 'pf-phone': V.phone, 'pf-email': V.email }; bindValidate(map);
    $('#rk-pf').addEventListener('submit', function (e) {
      e.preventDefault(); if (!runValidate(map)) return; var btn = $('#pf-save'); busy(btn, true, 'Saving…'); $('#pf-form-e').textContent = '';
      DATA.saveProfile({ name: $('#pf-name').value.trim(), phone: normPhone($('#pf-phone').value), email: $('#pf-email').value.trim() }).then(function (res) { if (res && res.pending) { otpStep(res); return; } closeModal(); paintBanner(); renderSettings(); toast(LOCAL ? 'Details saved on this device.' : 'Details updated.'); }, function (err) { busy(btn, false); $('#pf-form-e').textContent = err.message || 'Could not save. Please try again.'; });
    });
  }

  /* OTP step: only reachable when the API answers { verificationRequired: true, verificationId }.
     Needs POST /me/phone/verify { verificationId, otp } and POST /me/phone/resend { verificationId }. */
  function otpStep(res) {
    var d = $('.rk-dialog'); if (!d) return;
    d.innerHTML = '<div class="rk-dh"><h2>Verify your number</h2><button class="rk-x" data-k2="close" aria-label="Close"><span class="material-symbols-outlined">close</span></button></div><p style="color:#555;margin:0 0 12px">Enter the 6-digit code we sent to ' + esc(fmtPhone(res.p.phone)) + '.</p><form id="rk-otp" novalidate>' + field('otp-code', 'Verification code', '', { mode: 'numeric', ac: 'one-time-code', max: 6 }) + '<p class="rk-formerr" id="otp-form-e" role="alert"></p><div class="rk-dbtn"><button type="button" class="rk-btn sec lg" id="otp-resend">Resend code</button><button type="submit" class="rk-btn pri lg" id="otp-go">Verify</button></div></form>';
    $('#otp-code').focus();
    $('#otp-resend').addEventListener('click', function () { api('POST', '/me/phone/resend', { verificationId: res.pending.verificationId }).then(function () { toast('Code sent again.'); }, function (e) { $('#otp-form-e').textContent = e.message || 'Could not resend the code.'; }); });
    $('#rk-otp').addEventListener('submit', function (e) { e.preventDefault(); var c = $('#otp-code').value.trim(); if (!/^\d{6}$/.test(c)) { setErr('otp-code', 'Enter the 6-digit code.'); return; } setErr('otp-code', ''); var b = $('#otp-go'); busy(b, true, 'Verifying…');
      api('POST', '/me/phone/verify', { verificationId: res.pending.verificationId, otp: c }).then(function (r) { store.profile = r || res.p; closeModal(); paintBanner(); renderSettings(); toast('Mobile number verified and updated.'); }, function (er) { busy(b, false); $('#otp-form-e').textContent = er.message || 'That code didn\'t work. Please try again.'; }); });
  }

  /* ---------- addresses ---------- */
  function addrLine(a) { return [a.line1, a.line2, a.city + ' ' + a.pin].filter(Boolean).join(', '); }
  function renderAddrs() {
    var box = $('#saved-addresses'); if (!box) return;
    var list = store.addrs;
    box.innerHTML = '<div class="rk-ah"><h3 class="font-headline-sm text-headline-sm font-bold text-primary">Delivery Locations</h3><button class="rk-btn sec" data-k2="addr-add"><span class="material-symbols-outlined" style="font-size:18px">add</span>Add address</button></div>' +
      (list.length ? '<ul class="rk-addrs">' + list.map(function (a) {
        return '<li class="rk-addr"><div class="rk-addr-main"><div><b>' + esc(a.label) + '</b>' + (a.isDefault ? '<span class="rk-tag g" style="margin-left:8px">Default</span>' : '') + '</div><p>' + esc(addrLine(a)) + '</p></div><div class="rk-addr-act">' +
          (a.isDefault ? '' : '<button class="rk-link" data-k2="addr-def" data-id="' + a.id + '">Set default</button>') + '<button class="rk-link" data-k2="addr-edit" data-id="' + a.id + '">Edit</button><button class="rk-link danger" data-k2="addr-del" data-id="' + a.id + '">Delete</button></div></li>';
      }).join('') + '</ul>' : '<div class="rk-addr-empty"><span class="material-symbols-outlined">location_off</span><p>No saved addresses yet. Add one to speed up checkout.</p></div>') + localNote();
  }
  function editAddr(id) {
    var a = store.addrs.filter(function (x) { return x.id === id; })[0] || { label: 'Home', line1: '', line2: '', city: 'Gurgaon', pin: '', isDefault: !store.addrs.length };
    openModal('<div class="rk-dh"><h2>' + (id ? 'Edit address' : 'Add address') + '</h2><button class="rk-x" data-k2="close" aria-label="Close"><span class="material-symbols-outlined">close</span></button></div>' + localNote() +
      '<form id="rk-af" novalidate><div class="rk-fld"><span class="rk-lab" id="af-lab">Address type</span><div class="rk-chiprow" role="radiogroup" aria-labelledby="af-lab">' + ['Home', 'Work', 'Other'].map(function (l) { return '<button type="button" class="rk-chip' + (a.label === l ? ' on' : '') + '" role="radio" aria-checked="' + (a.label === l) + '" data-k2="addr-lab" data-v="' + l + '">' + l + '</button>'; }).join('') + '</div></div>' +
      field('af-l1', 'Flat / house no. and street', a.line1, { ac: 'address-line1', max: 120 }) + field('af-l2', 'Area, landmark', a.line2, { opt: 1, ac: 'address-line2', max: 120 }) +
      '<div class="rk-two">' + field('af-city', 'City', a.city, { ac: 'address-level2', max: 40 }) + field('af-pin', 'Pincode', a.pin, { mode: 'numeric', ac: 'postal-code', max: 6, ph: '122002' }) + '</div>' +
      '<label class="rk-check" style="margin:6px 0 4px"><input type="checkbox" id="af-def"' + (a.isDefault ? ' checked' : '') + '> Make this my default address</label>' +
      '<p class="rk-formerr" id="af-form-e" role="alert"></p><div class="rk-dbtn"><button type="button" class="rk-btn sec lg" data-k2="close">Cancel</button><button type="submit" class="rk-btn pri lg" id="af-save">Save address</button></div></form>', id ? 'Edit address' : 'Add address');
    var map = { 'af-l1': V.line1, 'af-city': V.city, 'af-pin': V.pin }; bindValidate(map); var label = a.label;
    $('#rk-af').addEventListener('click', function (e) { var b = e.target.closest('[data-k2="addr-lab"]'); if (!b) return; label = b.dataset.v; this.querySelectorAll('[data-k2="addr-lab"]').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); }); });
    $('#rk-af').addEventListener('submit', function (e) {
      e.preventDefault(); if (!runValidate(map)) return; var btn = $('#af-save'); busy(btn, true, 'Saving…');
      DATA.saveAddr({ id: id || null, label: label, line1: $('#af-l1').value.trim(), line2: $('#af-l2').value.trim(), city: $('#af-city').value.trim(), pin: $('#af-pin').value.trim(), isDefault: $('#af-def').checked }).then(function () { closeModal(); renderAddrs(); renderSettings(); toast('Address saved.'); }, function (err) { busy(btn, false); $('#af-form-e').textContent = err.message || 'Could not save the address.'; });
    });
  }
  function delAddr(id) {
    var a = store.addrs.filter(function (x) { return x.id === id; })[0]; if (!a) return;
    openModal('<div class="rk-dh"><h2>Delete address?</h2><button class="rk-x" data-k2="close" aria-label="Close"><span class="material-symbols-outlined">close</span></button></div><p style="color:#555;margin:6px 0 4px">' + esc(a.label) + ': ' + esc(addrLine(a)) + '</p><p class="rk-formerr" id="ad-e" role="alert"></p><div class="rk-dbtn"><button class="rk-btn sec lg" data-k2="close">Keep it</button><button class="rk-btn red lg" id="ad-go">Delete</button></div>', 'Delete address');
    $('#ad-go').addEventListener('click', function () { var b = this; busy(b, true, 'Deleting…'); DATA.delAddr(id).then(function () { closeModal(); renderAddrs(); renderSettings(); toast('Address deleted.'); }, function (err) { busy(b, false); $('#ad-e').textContent = err.message || 'Could not delete.'; }); });
  }

  /* ---------- settings ---------- */
  function renderSettings() {
    var r = $('#rk-settings-root'); if (!r) return; var p = store.profile, n = store.notify, ad = store.addrs;
    var tg = function (k, lab, sub) { return '<div class="rk-set-row"><div><b>' + lab + '</b><small>' + sub + '</small></div><button class="rk-switch' + (n[k] ? ' on' : '') + '" role="switch" aria-checked="' + !!n[k] + '" aria-label="' + lab + '" data-k2="notify" data-v="' + k + '"><i></i></button></div>'; };
    r.innerHTML = '<nav class="rk-crumbs"><a data-path="home" href="#">Home</a><span>›</span><a data-path="account" href="#">Account</a><span>›</span><strong style="color:#001831">Settings</strong></nav><h1 class="rk-h2" style="margin-bottom:18px">Settings</h1><div class="rk-set">' +
      '<section class="rk-panel"><h2>Profile</h2><div class="rk-set-row"><div><b>' + esc(p ? p.name : 'Not set yet') + '</b><small>' + (p ? esc(fmtPhone(p.phone) + ' · ' + p.email) : 'Add your name, mobile number and email') + '</small></div><button class="rk-btn sec" data-k2="edit">Edit details</button></div></section>' +
      '<section class="rk-panel"><h2>Notifications</h2>' + tg('email', 'Email', 'Order updates, invoices and offers') + tg('sms', 'SMS', 'Delivery slots and payment reminders') + tg('whatsapp', 'WhatsApp', 'Delivery updates and support chat') + (LOCAL ? '<p class="rk-local" style="margin-top:12px"><span class="material-symbols-outlined">info</span>Preferences are stored on this device. Sending messages needs a notifications service.</p>' : '') + '</section>' +
      '<section class="rk-panel"><h2>Saved addresses</h2><div class="rk-set-row"><div><b>' + ad.length + ' saved</b><small>' + (ad.length ? esc((ad.filter(function (x) { return x.isDefault; })[0] || ad[0]).label + ': ' + addrLine(ad.filter(function (x) { return x.isDefault; })[0] || ad[0])) : 'Add an address for faster checkout') + '</small></div><button class="rk-btn sec" data-k2="addr-manage">Manage addresses</button></div></section>' +
      '<section class="rk-panel"><h2>Account</h2><div class="rk-set-row"><div><b>Logout</b><small>' + 'Resets the demo. You stay signed in as Naman.' + '</small></div><button class="rk-btn sec" data-k2="signout">Logout</button></div></section></div>';
  }

  /* ---------- header account menu ---------- */
  function menu(open) { var b = $('#rk-acct-btn'), m = $('#rk-acct-menu'); if (!b || !m) return; m.hidden = !open; b.setAttribute('aria-expanded', open); if (open) { var f = m.querySelector('[role=menuitem]'); if (f) f.focus(); } }

  /* ---------- awards strip ---------- */
  var aw = { paused: false, user: false, inView: true };
  function initAwards() {
    var t = $('#rk-aw-track'); if (!t || t.dataset.done) return; t.dataset.done = 1;
    [].slice.call(t.children).forEach(function (k) { var c = k.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.removeAttribute('role'); var im = c.querySelector('img'); if (im) { im.alt = ''; } t.appendChild(c); });
    var last = 0, acc = 0, resume;
    function half() { return t.scrollWidth / 2; }
    function tick(ts) {
      if (!last) last = ts; var dt = Math.min(ts - last, 64); last = ts;
      if (!aw.paused && !aw.user && !document.hidden && aw.inView && !reduce) { acc += dt * 0.045; var px = Math.floor(acc); if (px >= 1) { acc -= px; t.scrollLeft += px; if (t.scrollLeft >= half()) t.scrollLeft -= half(); } } else acc = 0;
      requestAnimationFrame(tick);
    }
    var hold = function () { aw.paused = true; clearTimeout(resume); }, release = function (d) { clearTimeout(resume); resume = setTimeout(function () { aw.paused = false; }, d || 0); };
    t.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hold(); }); t.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') release(); });
    t.addEventListener('touchstart', hold, { passive: true }); t.addEventListener('touchend', function () { release(2500); }, { passive: true });
    t.addEventListener('focusin', hold); t.addEventListener('focusout', function () { release(); });
    t.addEventListener('scroll', function () { if (t.scrollLeft <= 0 && aw.paused) { /* allow manual swipe back past the start */ t.scrollLeft = half(); } }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { aw.inView = en[0].isIntersecting; }, { threshold: 0.1 }).observe(t);
    if (reduce) { var pb = $('#rk-aw-pp'); if (pb) pb.style.display = 'none'; } else requestAnimationFrame(tick);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var acct = e.target.closest('#rk-acct-btn'); if (acct) { menu($('#rk-acct-menu').hidden); return; }
    if (!e.target.closest('#rk-acct-wrap')) menu(false);
    var el = e.target.closest('[data-k2],[data-k="edit-details"]'); if (!el) return;
    var k = el.dataset.k2 || 'edit', id = el.dataset.id;
    if (el.closest('#rk-acct-menu')) menu(false);
    if (k === 'close') { closeModal(); return; }
    if (k === 'edit') { if (RK.cur() !== 'dashboard') RK.show('dashboard'); setTimeout(editDetails, RK.cur() === 'dashboard' ? 0 : 60); return; }
    if (k === 'addr-add') { editAddr(null); return; }
    if (k === 'addr-edit') { editAddr(id); return; }
    if (k === 'addr-del') { delAddr(id); return; }
    if (k === 'addr-def') { DATA.defAddr(id).then(function () { renderAddrs(); renderSettings(); toast('Default address updated.'); }, function (er) { toast(er.message || 'Could not update.'); }); return; }
    if (k === 'addr-manage') { RK.show('dashboard', { scrollTo: '#saved-addresses' }); return; }
    if (k === 'notify') { var n = Object.assign({}, store.notify); n[el.dataset.v] = !n[el.dataset.v]; DATA.saveNotify(n).then(function () { renderSettings(); toast('Notification preference saved.'); var s = $('#rk-settings-root [data-v="' + el.dataset.v + '"]'); if (s) s.focus(); }, function (er) { toast(er.message || 'Could not save.'); }); return; }
    if (k === 'signout') { if (window.RKAUTH) RKAUTH.signOut(); return; }
    if (k === 'aw-pp') { aw.user = !aw.user; el.setAttribute('aria-label', aw.user ? 'Play awards slider' : 'Pause awards slider'); el.firstChild.textContent = aw.user ? 'play_arrow' : 'pause'; return; }
  });
  document.addEventListener('click', function (e) { var el = e.target.closest('[data-k2="aw-pp"]'); if (!el) return; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); var m = $('#rk-acct-menu'); if (m && !m.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { var it = [].slice.call(m.querySelectorAll('[role=menuitem]')), i = it.indexOf(document.activeElement); it[(i + (e.key === 'ArrowDown' ? 1 : -1) + it.length) % it.length].focus(); e.preventDefault(); } });

  document.addEventListener('rk:citychange', function (e) {
    var d = e.detail || {};
    if (!LOCAL) { api('PUT', '/me/city', { city: d.city, pincode: d.pin || null }).catch(function () {}); return; }
    if (store.profile) { store.profile.city = d.city; LS.set('rk-profile', store.profile); }
  });
  document.addEventListener('rk:signin', function (ev) {
    var ph = ev.detail && ev.detail.phone; if (!ph) return; var p = store.profile || { name: '', phone: '', email: '' };
    if (!p.phone) { p = { name: p.name || '', phone: ph, email: p.email || '' }; store.profile = p; LS.set('rk-profile', p); paintBanner(); renderSettings(); }
  });
  window.RKX = { render: function (view) { if (view === 'dashboard') { paintBanner(); renderAddrs(); } if (view === 'settings') renderSettings(); if (view === 'home') initAwards(); } };
  paintBanner(); renderAddrs(); renderSettings(); initAwards();
  DATA.loadAll().then(function () { paintBanner(); renderAddrs(); renderSettings(); }, function () {});
})();
