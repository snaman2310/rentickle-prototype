/* ===== Header "Account" dropdown: Dashboard, Orders, Pay Rent, Settings, Logout ===== */
(function () {
  'use strict';
  var RK = window.RK, $ = function (s, r) { return (r || document).querySelector(s); };
  var fmt = function (d) { return d && d.length === 10 ? '+91 ' + d.slice(0, 5) + ' ' + d.slice(5) : '+91 91302 08733'; };
  function who() {
    var p = null; try { p = JSON.parse(localStorage.getItem('rk-profile') || 'null'); } catch (e) {}
    p = p || { name: 'Naman', phone: '9130208733' };
    var n = $('#rk-who-n'), t = $('#rk-who-p'); if (n) n.textContent = p.name || 'Naman'; if (t) t.textContent = fmt(p.phone);
  }
  function closeMenu() { var m = $('#rk-acct-menu'), b = $('#rk-acct-btn'); if (m) m.hidden = true; if (b) b.setAttribute('aria-expanded', 'false'); }
  document.addEventListener('click', function (e) {
    if (e.target.closest('#rk-acct-btn')) who();
    var b = e.target.closest('[data-acct]'); if (!b) return; var k = b.dataset.acct; closeMenu();
    if (k === 'dashboard') RK.show('dashboard', { force: true });
    else if (k === 'orders') RK.show('orders', { force: true });
    else if (k === 'pay') { window.__rkPay = ''; RK.show('pay', { force: true }); }
    else if (k === 'settings') RK.show('settings', { force: true });
    else if (k === 'logout') { if (window.RKAUTH) RKAUTH.signOut(); }
  });
  who();
})();
