/* ===== Rent payment page (/#pay and /#pay/<orderId>), all mock ===== */
(function () {
  'use strict';
  var RK = window.RK, M = window.RKMOCK;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var inr = function (n) { return '\u20b9' + Math.round(n).toLocaleString('en-IN'); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var fDate = function (t) { var d = new Date(t); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
  var fTime = function (t) { var d = new Date(t), h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h >= 12 ? 'PM' : 'AM'); };
  var APPS = ['Google Pay', 'PhonePe', 'Paytm'], BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra'];
  var active = false, sel = {}, method = 'upi', f = { upi: '', app: '', num: '', exp: '', cvv: '', name: '', bank: '' }, phase = 'form', result = null, err = '';
  var names = function (o) { return o.items.length > 1 ? o.items[0].name + ' + ' + (o.items.length - 1) + ' more' : o.items[0].name; };

  function init() {
    var due = M.due(), p = window.__rkPay, one = p && due.filter(function (d) { return d.id === p; })[0];
    sel = {}; if (one) sel[p] = true; else due.forEach(function (d) { sel[d.id] = true; });
    phase = 'form'; result = null; err = '';
  }
  function chosen() { return M.due().filter(function (d) { return sel[d.id]; }); }
  function totals() { var c = chosen(), rent = 0, late = 0; c.forEach(function (d) { rent += d.amount; late += d.lateFee; }); return { n: c.length, rent: rent, late: late, total: rent + late }; }

  function dueHTML() {
    var due = M.due();
    if (!due.length) return '<div class="rk-od-empty sm"><span class="material-symbols-outlined">task_alt</span><b>You\u2019re all paid up</b><small>No rent is due right now.</small></div>';
    return '<div class="rk-due-list">' + due.map(function (d) {
      var tag = d.tag === 'overdue' ? '<span class="rk-dtag late">Overdue</span>' : '<span class="rk-dtag soon">Due soon</span>';
      return '<label class="rk-due"><input type="checkbox" data-pay-chk value="' + esc(d.id) + '"' + (sel[d.id] ? ' checked' : '') + '><span class="rk-due-main"><b>#' + esc(d.id) + '</b><small>' + esc(names(d.order)) + '</small><small>' + esc(d.monthLabel) + ' rent \u00b7 Due ' + fDate(d.dueTs) + '</small></span><span class="rk-due-amt"><b>' + inr(d.amount + d.lateFee) + '</b>' + tag + '</span></label>';
    }).join('') + '</div>';
  }
  function upiPanel() {
    return '<div class="rk-fld"><label for="rk-upi">UPI ID</label><input id="rk-upi" data-pay-f="upi" value="' + esc(f.upi) + '" placeholder="name@bank" autocomplete="off" inputmode="email"></div><p class="rk-hint" style="margin:0 0 8px">Or pay with an app</p><div class="rk-apps" role="group" aria-label="UPI apps">' + APPS.map(function (a) { return '<button type="button" class="rk-chip' + (f.app === a ? ' on' : '') + '" data-pay-app="' + esc(a) + '" aria-pressed="' + (f.app === a) + '">' + esc(a) + '</button>'; }).join('') + '</div>';
  }
  function cardPanel() {
    return '<div class="rk-fld"><label for="rk-cn">Card number</label><input id="rk-cn" data-pay-f="num" value="' + esc(f.num) + '" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456" maxlength="19"></div>' +
      '<div class="rk-two" style="grid-template-columns:1fr 1fr"><div class="rk-fld"><label for="rk-ce">Expiry</label><input id="rk-ce" data-pay-f="exp" value="' + esc(f.exp) + '" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5"></div><div class="rk-fld"><label for="rk-cv">CVV</label><input id="rk-cv" data-pay-f="cvv" value="' + esc(f.cvv) + '" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="3"></div></div>' +
      '<div class="rk-fld"><label for="rk-cnm">Name on card</label><input id="rk-cnm" data-pay-f="name" value="' + esc(f.name) + '" autocomplete="cc-name" placeholder="Naman"></div>';
  }
  function netPanel() {
    return '<p class="rk-hint" style="margin:0 0 8px">Choose your bank</p><div class="rk-apps" role="radiogroup" aria-label="Banks">' + BANKS.map(function (b) { return '<button type="button" class="rk-chip' + (f.bank === b ? ' on' : '') + '" role="radio" aria-checked="' + (f.bank === b) + '" data-pay-bank="' + esc(b) + '">' + esc(b) + '</button>'; }).join('') + '</div>';
  }
  function methodsHTML() {
    var tabs = [['upi', 'UPI', 'account_balance_wallet'], ['card', 'Card', 'credit_card'], ['net', 'Netbanking', 'account_balance']];
    return '<section class="rk-dsec"><h2 class="rk-dsec-h">Payment method</h2><div class="rk-pm-tabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" aria-selected="' + (method === t[0]) + '" class="' + (method === t[0] ? 'on' : '') + '" data-pay-m="' + t[0] + '"><span class="material-symbols-outlined">' + t[2] + '</span>' + t[1] + '</button>'; }).join('') + '</div><div role="tabpanel">' + (method === 'upi' ? upiPanel() : method === 'card' ? cardPanel() : netPanel()) + '</div></section>';
  }
  function sumHTML() {
    var t = totals(), c = chosen();
    return '<aside class="rk-pay-sum"><div class="rk-dsec"><h2 class="rk-dsec-h">Summary</h2><dl class="rk-od-sum"><div><dt>Rent (' + t.n + ' order' + (t.n === 1 ? '' : 's') + ')</dt><dd>' + inr(t.rent) + '</dd></div>' +
      c.filter(function (d) { return d.lateFee; }).map(function (d) { return '<div class="late"><dt>Late fee \u00b7 #' + esc(d.id.slice(-5)) + '</dt><dd>' + inr(d.lateFee) + '</dd></div>'; }).join('') +
      '<div class="tot"><dt>Total payable</dt><dd>' + inr(t.total) + '</dd></div></dl><p class="rk-err" role="alert" style="margin:0 0 8px">' + esc(err) + '</p><button type="button" class="rk-btn red lg" data-pay-go style="width:100%"' + (t.total ? '' : ' disabled') + '>Pay ' + inr(t.total) + '</button><p class="rk-hint" style="margin:10px 0 0;text-align:center">Demo payment. No money moves.</p></div></aside>';
  }
  function historyHTML() {
    var h = M.history();
    return '<section class="rk-dsec rk-hist"><h2 class="rk-dsec-h">Payment history</h2>' + (h.length ? '<ul class="rk-hist-list">' + h.map(function (p) {
      return '<li><span class="a"><b>#' + esc(p.orderId) + '</b><small>' + esc(p.label) + ' rent \u00b7 ' + esc(p.method) + '</small></span><span class="b"><b>' + inr(p.amount) + '</b><small>' + fDate(p.ts) + '</small></span><span class="c"><small>' + esc(p.txn) + '</small><i class="rk-dtag paid">Paid</i></span></li>';
    }).join('') + '</ul>' : '<div class="rk-od-empty sm"><b>No payments yet</b></div>') + '</section>';
  }
  function successHTML() {
    var r = result;
    return '<section class="rk-pay-ok"><span class="ok-ic"><span class="material-symbols-outlined">check_circle</span></span><h1>Payment successful</h1><p class="amt">' + inr(r.total) + '</p><dl class="rk-od-sum"><div><dt>Transaction ID</dt><dd>' + esc(r.txn) + '</dd></div><div><dt>Date</dt><dd>' + fDate(r.ts) + ', ' + fTime(r.ts) + '</dd></div><div><dt>Paid via</dt><dd>' + esc(r.method) + '</dd></div><div><dt>Orders</dt><dd>' + r.ids.map(function (id) { return '#' + esc(id); }).join(', ') + '</dd></div></dl>' +
      '<div class="rk-dbtn"><button type="button" class="rk-btn sec lg" data-pay-rcpt><span class="material-symbols-outlined" style="font-size:18px">download</span>Download receipt</button><button type="button" class="rk-btn pri lg" data-pay-nav="orders">View orders</button></div><button type="button" class="rk-link" data-pay-nav="dashboard" style="margin-top:12px">Back to dashboard</button></section>';
  }
  function render() {
    var root = $('#rk-pay-root'); if (!root) return;
    var head = '<nav class="rk-crumbs"><a data-path="home" href="#">Home</a><span>\u203a</span><a data-path="account" href="#">Account</a><span>\u203a</span><strong style="color:#001831">Pay rent</strong></nav>';
    if (phase === 'success') { root.innerHTML = head + successHTML() + historyHTML(); return; }
    root.innerHTML = head + '<div class="rk-od-head"><div><h1 class="rk-h2">Pay rent</h1><p>Pay one or several orders at once.</p></div></div><div class="rk-pay-grid"><div class="rk-pay-main"><section class="rk-dsec"><h2 class="rk-dsec-h">Rent due</h2>' + dueHTML() + '</section>' + methodsHTML() + '</div>' + sumHTML() + '</div>' + historyHTML();
  }
  function fail(m) { err = m; render(); }
  function go() {
    var t = totals(); err = '';
    if (!t.n || !t.total) return fail('Select at least one order to pay.');
    if (method === 'upi') { if (!f.app && !/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(f.upi.trim())) return fail('Enter a valid UPI ID or pick an app.'); }
    else if (method === 'card') {
      if (f.num.replace(/\s/g, '').length !== 16) return fail('Enter a valid 16-digit card number.');
      var mm = /^(\d{2})\/(\d{2})$/.exec(f.exp); if (!mm || +mm[1] < 1 || +mm[1] > 12) return fail('Enter the expiry as MM/YY.');
      if (f.cvv.length !== 3) return fail('Enter the 3-digit CVV.'); if (f.name.trim().length < 2) return fail('Enter the name on the card.');
    } else if (!f.bank) return fail('Choose your bank.');
    var btn = $('[data-pay-go]'); if (btn) { btn.disabled = true; btn.innerHTML = '<span class="rk-spin"></span>Processing\u2026'; }
    var ids = chosen().map(function (d) { return d.id; }), label = method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : 'Netbanking';
    setTimeout(function () {
      var r = M.pay(ids, label); r.total = t.total; r.rent = t.rent; r.late = t.late; result = r; phase = 'success'; render(); window.scrollTo(0, 0);
    }, 1500);
  }
  function receipt() {
    var r = result; if (!r) return;
    var lines = ['RENTICKLE - RENT RECEIPT (demo)', '', 'Transaction ID: ' + r.txn, 'Date: ' + fDate(r.ts) + ' ' + fTime(r.ts), 'Paid via: ' + r.method, 'Customer: Naman, +91 91302 08733', '', 'Orders: ' + r.ids.join(', '), 'Rent: ' + inr(r.rent), 'Late fee: ' + inr(r.late), 'Total paid: ' + inr(r.total), '', 'This is a demo receipt. No payment was made.'];
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' })); a.download = 'Rentickle-receipt-' + r.txn + '.txt'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  document.addEventListener('click', function (e) {
    var p = e.target.closest('[data-pay]');
    if (p) { window.__rkPay = p.dataset.pay === 'all' ? '' : p.dataset.pay; active = false; RK.show('pay', { force: true }); return; }
    if (RK.cur() !== 'pay') return;
    var m = e.target.closest('[data-pay-m]'); if (m) { method = m.dataset.payM; err = ''; render(); return; }
    var a = e.target.closest('[data-pay-app]'); if (a) { f.app = f.app === a.dataset.payApp ? '' : a.dataset.payApp; err = ''; render(); return; }
    var b = e.target.closest('[data-pay-bank]'); if (b) { f.bank = b.dataset.payBank; err = ''; render(); return; }
    if (e.target.closest('[data-pay-go]')) { go(); return; }
    if (e.target.closest('[data-pay-rcpt]')) { receipt(); return; }
    var n = e.target.closest('[data-pay-nav]'); if (n) { RK.show(n.dataset.payNav, { force: true }); return; }
  });
  document.addEventListener('change', function (e) { var c = e.target.closest && e.target.closest('[data-pay-chk]'); if (!c || RK.cur() !== 'pay') return; sel[c.value] = c.checked; err = ''; render(); });
  document.addEventListener('input', function (e) {
    var i = e.target; if (!i.dataset || i.dataset.payF === undefined) return; var k = i.dataset.payF, v = i.value;
    if (k === 'num') { v = v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); i.value = v; }
    if (k === 'exp') { v = v.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); i.value = v; }
    if (k === 'cvv') { v = v.replace(/\D/g, '').slice(0, 3); i.value = v; }
    f[k] = v;
  });
  var prev = window.RKX && window.RKX.render;
  window.RKX = Object.assign(window.RKX || {}, { render: function (view) {
    if (prev) prev(view);
    if (view === 'pay') { if (!active) { active = true; init(); } render(); } else active = false;
  } });
})();
