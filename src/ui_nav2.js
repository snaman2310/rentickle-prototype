/* ===== Round 6: navigation (history + back bar) and demo sign-in ===== */
(function () {
  'use strict';
  var RK = window.RK, CFG = window.RK_CONFIG || {}, API = (CFG.api && CFG.api.baseUrl) || '';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var toast = function (m) { if (window.rkToast) window.rkToast(m); };
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del: function (k) { try { localStorage.removeItem(k); } catch (e) {} } };

  /* ---------- history: every page change is a history entry, so browser/hardware back works ---------- */
  window.addEventListener('popstate', function (e) { window.__rkDepth = (e.state && e.state.d) || 0; });
  function back() { if ((window.__rkDepth || 0) > 0) history.back(); else RK.show('home', { force: true, noPush: true }); }

  /* ---------- back bar (mobile) on every full-screen page ---------- */
  var TITLES = { category: 'Catalogue', product: 'Product', planner: 'Smart bundles', cart: 'Cart', kyc: 'Checkout', confirm: 'Order confirmed', dashboard: 'Account', settings: 'Settings', orders: 'Orders', track: 'Live tracker', pay: 'Pay rent' };
  $$('main[data-view]').forEach(function (m) {
    var v = m.dataset.view; if (v === 'home' || $('.rk-backbar', m)) return;
    var b = document.createElement('div'); b.className = 'rk-backbar';
    b.innerHTML = '<button type="button" data-nav="back" aria-label="Go back"><span class="material-symbols-outlined">arrow_back</span></button><b>' + (TITLES[v] || '') + '</b><button type="button" data-nav="home" aria-label="Home"><span class="material-symbols-outlined">home</span></button>';
    m.insertBefore(b, m.firstChild);
  });
  document.addEventListener('click', function (e) {
    var n = e.target.closest('[data-nav]'); if (!n) return;
    if (n.dataset.nav === 'back') back(); else RK.show('home', { force: true });
  });

  /* ---------- demo sign-in (no SMS is sent; any 6 digits are accepted unless api.baseUrl is set) ---------- */
  var GUARD = {};
  var session = { phone: '9130208733', at: Date.now() }, pendingView = null, dlg = null, lastF = null, phone = '';
  var signedIn = function () { return !!(session && session.phone); };
  function normPhone(v) { var s0 = String(v).trim(), d = s0.replace(/\D/g, ''); if (/^\+/.test(s0)) { if (d.indexOf('91') === 0) d = d.slice(2); } else if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2); else if (d.length === 11 && d[0] === '0') d = d.slice(1); return d; }
  var fmt = function (d) { return d.length === 10 ? '+91 ' + d.slice(0, 5) + ' ' + d.slice(5) : d; };
  function api(path, body) { return fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }).then(function (r) { if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.message || 'Request failed'); }); return r.status === 204 ? null : r.json().catch(function () { return null; }); }); }
  function close() { if (!dlg) return; dlg.remove(); dlg = null; document.documentElement.classList.remove('rk-lock'); if (lastF && lastF.focus) lastF.focus({ preventScroll: true }); }
  function setErr(msg) { var e = $('#rk-au-e'); if (e) e.textContent = msg || ''; var i = $('#rk-au-in'); if (i) { i.classList.toggle('bad', !!msg); i.setAttribute('aria-invalid', msg ? 'true' : 'false'); } }
  function busy(btn, on, t) { btn.disabled = on; if (on) { btn.dataset.t = btn.innerHTML; btn.innerHTML = '<span class="rk-spin"></span>' + t; } else if (btn.dataset.t) btn.innerHTML = btn.dataset.t; }
  function stepPhone() {
    $('.rk-au-body', dlg).innerHTML = '<p class="rk-hint">Use your mobile number.</p><div class="rk-fld"><label for="rk-au-in">Mobile number</label><div class="rk-au-ph"><span>+91</span><input id="rk-au-in" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="14" placeholder="98765 43210" aria-describedby="rk-au-e"></div><p class="rk-err" id="rk-au-e" role="alert"></p></div><button type="button" class="rk-btn red lg" style="width:100%" id="rk-au-go">Send OTP</button><p class="rk-hint" style="margin-top:12px">' + (API ? '' : 'Demo sign-in: no SMS is sent.') + '</p>';
    var i = $('#rk-au-in'); i.value = phone; i.focus();
    var go = function () { var d = normPhone(i.value); if (!/^[6-9]\d{9}$/.test(d)) { setErr('Enter a valid 10-digit mobile number starting with 6-9.'); return; } setErr(''); phone = d; var b = $('#rk-au-go'); busy(b, true, 'Sending\u2026');
      (API ? api('/auth/otp/send', { phone: d }) : new Promise(function (r) { setTimeout(r, 450); })).then(function () { stepOtp(); }, function (er) { busy(b, false); setErr(er.message || 'Could not send the code. Try again.'); }); };
    $('#rk-au-go').addEventListener('click', go); i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  }
  function stepOtp() {
    $('.rk-au-body', dlg).innerHTML = '<p class="rk-hint">Enter the 6-digit code sent to <b>' + esc(fmt(phone)) + '</b>.</p><div class="rk-fld"><label for="rk-au-in">Verification code</label><input id="rk-au-in" class="rk-au-otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="\u2022 \u2022 \u2022 \u2022 \u2022 \u2022" aria-describedby="rk-au-e"><p class="rk-err" id="rk-au-e" role="alert"></p></div><button type="button" class="rk-btn red lg" style="width:100%" id="rk-au-go">Verify</button><div class="rk-au-links"><button type="button" class="rk-link" id="rk-au-chg">Change number</button></div><p class="rk-hint">' + (API ? '' : 'Demo: any 6 digits work.') + '</p>';
    var i = $('#rk-au-in'); i.focus();
    var go = function () { var c = i.value.trim(); if (!/^\d{6}$/.test(c)) { setErr('Enter the 6-digit code.'); return; } setErr(''); var b = $('#rk-au-go'); busy(b, true, 'Verifying\u2026');
      (API ? api('/auth/otp/verify', { phone: phone, otp: c }) : new Promise(function (r) { setTimeout(r, 450); })).then(function () { done(); }, function (er) { busy(b, false); setErr(er.message || 'That code did not work.'); }); };
    $('#rk-au-go').addEventListener('click', go); i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } }); $('#rk-au-chg').addEventListener('click', stepPhone);
  }
  function done() {
    session = { phone: phone, at: Date.now() }; LS.set('rk-session', session); var dest = pendingView || 'dashboard'; pendingView = null; close();
    document.dispatchEvent(new CustomEvent('rk:signin', { detail: { phone: phone } })); toast('Signed in.'); RK.show(dest, { force: true });
  }
  function open(o) {
    if (dlg) return; pendingView = (o && o.after) || 'dashboard'; lastF = document.activeElement;
    dlg = document.createElement('div'); dlg.className = 'rk-modal';
    dlg.innerHTML = '<div class="rk-dialog rk-au" role="dialog" aria-modal="true" aria-labelledby="rk-au-t"><div class="rk-dh"><h2 id="rk-au-t">Sign in</h2><button class="rk-x" type="button" data-au="close" aria-label="Close"><span class="material-symbols-outlined">close</span></button></div><div class="rk-au-body"></div></div>';
    document.body.appendChild(dlg); document.documentElement.classList.add('rk-lock'); stepPhone();
    dlg.addEventListener('mousedown', function (e) { if (e.target === dlg) close(); }); dlg.addEventListener('click', function (e) { if (e.target.closest('[data-au=close]')) close(); });
  }
  document.addEventListener('keydown', function (e) {
    if (!dlg) return; if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') { var f = $$('button,input,a[href]', dlg).filter(function (x) { return x.offsetParent !== null && !x.disabled; }); if (!f.length) return; var i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); } }
  });
  function signOut() { if (window.RKMOCK) RKMOCK.reset(); toast('Demo reset. You stay signed in as Naman.'); RK.show('home', { force: true }); }
  function account() { RK.show('dashboard', { force: true }); }

  /* signed-out visitors cannot stay on account pages */
  var prev = window.RKX && window.RKX.render;
  window.RKX = Object.assign(window.RKX || {}, { render: function (view) {
    if (GUARD[view] && !signedIn()) { RK.show('home', { force: true, noPush: true }); open({ after: view }); return; }
    if (prev) prev(view);
  } });
  window.RKAUTH = { account: account, open: open, signedIn: signedIn, signOut: signOut, phone: function () { return session ? session.phone : ''; } };
  window.RKNAV = { back: back };
})();
