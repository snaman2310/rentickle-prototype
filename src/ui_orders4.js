/* ===== Orders page (/#orders), order details, Live Move-in Tracker, dashboard orders ===== */
(function () {
  'use strict';
  var RK = window.RK, M = window.RKMOCK, CFG = window.RK_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var inr = function (n) { return '\u20b9' + Math.round(n).toLocaleString('en-IN'); };
  var toast = function (m) { if (window.rkToast) window.rkToast(m); };
  var DAY = 86400000, MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var fDate = function (t) { var d = new Date(t); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
  var fShort = function (t) { var d = new Date(t); return MON[d.getMonth()] + ' ' + d.getDate(); };
  var STATUS = { active: ['Active', 'st-active'], delivered: ['Delivered', 'st-delivered'], scheduled: ['Scheduled', 'st-scheduled'], completed: ['Completed', 'st-completed'], due: ['Rent due', 'st-due'], progress: ['In progress', 'st-progress'], cancelled: ['Cancelled', 'st-cancelled'] };
  var ONGOING = { active: 1, delivered: 1, scheduled: 1, progress: 1 };
  var TABS = [['all', 'All'], ['active', 'Active'], ['completed', 'Completed'], ['due', 'Rent Due']];
  var tab = 'all', dtab = 'all', cur = null;
  var inTab = function (o, t) { return t === 'all' || (t === 'active' ? !!ONGOING[o.status] : t === 'completed' ? (o.status === 'completed' || o.status === 'cancelled') : o.status === 'due'); };
  var orders = function () { return M.orders(); };
  var byId = function (id) { return orders().filter(function (o) { return o.id === id; })[0]; };
  var cityCode = function () { return (window.RKLOC && RKLOC.info().code) || 'GGN'; };

  /* order placed through the real checkout (used by the Order Confirmed page only) */
  function realOrder() {
    var o = RK.state.order; if (!o || !o.items || !o.items.length) return null;
    var key = 'rk-order-meta', meta = null; try { meta = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (e) {}
    var sig = o.items.map(function (i) { return i.id + i.tenure + i.qty; }).join('|');
    if (!meta || meta.sig !== sig) { meta = { sig: sig, id: 'RNK-' + cityCode() + '-' + (10000 + sig.length * 37), ts: Date.now() - 2 * 3600000 }; try { sessionStorage.setItem(key, JSON.stringify(meta)); } catch (e) {} }
    return { id: meta.id, ts: meta.ts, status: 'progress', items: o.items };
  }

  /* ---------- order card ---------- */
  function thumbs(o) {
    var t = o.items.slice(0, 3).map(function (i) { return '<span class="th">' + (i.img ? '<img src="' + esc(i.img) + '" alt="" loading="lazy" decoding="async">' : '<span class="material-symbols-outlined">chair</span>') + '</span>'; }).join('');
    return t + (o.items.length > 3 ? '<span class="th more">+' + (o.items.length - 3) + '</span>' : '');
  }
  function card(o, compact) {
    var st = STATUS[o.status] || STATUS.active, first = o.items[0], extra = o.items.length - 1, isDue = o.status === 'due';
    var dueNote = isDue ? '<small class="rk-oc-due">' + (o.tag === 'overdue' ? 'Overdue \u00b7 ' : 'Due soon \u00b7 ') + 'Due ' + fDate(o.nextDue) + ' \u00b7 ' + inr(o.rent + o.lateFee) + '</small>' : '';
    return '<article class="rk-oc' + (compact ? ' compact' : '') + '"><div class="rk-oc-id"><b>#' + esc(o.id) + '</b><small>Placed ' + fDate(o.ts) + '</small><span class="rk-st ' + st[1] + '">' + st[0] + '</span></div>' +
      '<div class="rk-oc-items"><div class="rk-oc-thumbs">' + thumbs(o) + '</div><div class="rk-oc-names"><b>' + esc(first.name) + '</b><small>' + (extra > 0 ? '+ ' + extra + ' more item' + (extra > 1 ? 's' : '') : (first.qty > 1 ? 'Qty ' + first.qty : '1 item')) + '</small>' + dueNote + '</div></div>' +
      '<dl class="rk-oc-stats"><div><dt>Tenure</dt><dd>' + o.tenure + ' months</dd></div><div><dt>Monthly rent</dt><dd>' + inr(o.rent) + '</dd></div><div><dt>Deposit</dt><dd>' + inr(o.dep) + '</dd></div><div><dt>Next due</dt><dd>' + (o.nextDue ? fDate(o.nextDue) : '\u2014') + '</dd></div></dl>' +
      '<div class="rk-oc-act' + (isDue ? ' has-pay' : '') + '">' + (isDue ? '<button type="button" class="rk-btn red pay" data-pay="' + esc(o.id) + '"><span class="material-symbols-outlined">payments</span>Pay rent</button>' : '') +
      '<button type="button" class="rk-btn pri" data-ord="track" data-id="' + esc(o.id) + '"><span class="material-symbols-outlined">local_shipping</span>Track order</button><button type="button" class="rk-btn sec" data-ord="details" data-id="' + esc(o.id) + '">View details</button></div></article>';
  }
  function tabsHTML(active, attr, all, idp) {
    var cnt = {}; TABS.forEach(function (t) { cnt[t[0]] = all.filter(function (o) { return inTab(o, t[0]); }).length; });
    return '<div class="rk-od-tabs" role="tablist" aria-label="Filter orders">' + TABS.map(function (t) { return '<button type="button" role="tab"' + (idp ? ' id="' + idp + t[0] + '"' : '') + ' aria-selected="' + (active === t[0]) + '" class="' + (active === t[0] ? 'on' : '') + '" data-ord="' + attr + '" data-v="' + t[0] + '">' + t[1] + '<span>' + cnt[t[0]] + '</span></button>'; }).join('') + '</div>';
  }
  function renderOrders() {
    var root = $('#rk-orders-root'); if (!root) return;
    var all = orders(), list = all.filter(function (o) { return inTab(o, tab); }), dueN = all.filter(function (o) { return o.status === 'due'; }).length;
    var empty = !all.length ? ['receipt_long', 'No orders yet', 'When you place your first rental, it will show up here with live tracking.']
      : tab === 'active' ? ['inventory_2', 'No active orders right now', 'Orders being prepared, scheduled or in use appear here.']
      : tab === 'completed' ? ['task_alt', 'No completed orders yet', 'Orders that reach the end of their tenure appear here.']
      : ['task_alt', 'No rent due', 'You\u2019re all paid up. Your payment history is on the Pay rent page.'];
    root.innerHTML = '<nav class="rk-crumbs"><a data-path="home" href="#">Home</a><span>\u203a</span><a data-path="account" href="#">Account</a><span>\u203a</span><strong style="color:#001831">Orders</strong></nav>' +
      '<div class="rk-od-head"><div><h1 class="rk-h2">Your orders</h1><p>' + all.length + ' order' + (all.length === 1 ? '' : 's') + ' \u00b7 sample data for this demo</p></div>' + (dueN ? '<button type="button" class="rk-btn red" data-pay="all"><span class="material-symbols-outlined" style="font-size:18px">payments</span>Pay rent (' + dueN + ')</button>' : '') + '</div>' +
      tabsHTML(tab, 'tab', all, 'rk-tab-') +
      (list.length ? '<div class="rk-od-colhead" aria-hidden="true"><span>Order</span><span>Items</span><span>Rental details</span><span></span></div><div class="rk-od-list" role="tabpanel" aria-labelledby="rk-tab-' + tab + '">' + list.map(function (o) { return card(o); }).join('') + '</div>'
        : '<div class="rk-od-empty" role="tabpanel"><span class="material-symbols-outlined">' + empty[0] + '</span><b>' + empty[1] + '</b><p>' + empty[2] + '</p>' + (tab === 'due' ? '<button type="button" class="rk-btn pri lg" data-pay="all">Payment history</button>' : '<button type="button" class="rk-btn pri lg" data-k="cat-go" data-v="all">Browse products</button>') + '</div>');
  }

  /* ---------- details dialog ---------- */
  var dlg = null, lastF = null;
  function closeDlg() { if (!dlg) return; dlg.remove(); dlg = null; document.documentElement.classList.remove('rk-lock'); if (lastF && lastF.focus) lastF.focus({ preventScroll: true }); }
  function details(id) {
    var o = byId(id); if (!o) return; var st = STATUS[o.status] || STATUS.active; lastF = document.activeElement; closeDlg();
    var city = (window.RKLOC && RKLOC.get().city) || 'Gurgaon', isDue = o.status === 'due', R = { 12: 1, 9: 529 / 489, 6: 589 / 489, 3: 699 / 489 };
    dlg = document.createElement('div'); dlg.className = 'rk-modal';
    dlg.innerHTML = '<div class="rk-dialog rk-odlg" role="dialog" aria-modal="true" aria-labelledby="rk-odlg-t" tabindex="-1"><div class="rk-dh"><div><h2 id="rk-odlg-t">Order #' + esc(o.id) + '</h2><small style="color:#666">Placed ' + fDate(o.ts) + ' \u00b7 ' + esc(city) + '</small></div><button class="rk-x" type="button" data-ord="close" aria-label="Close"><span class="material-symbols-outlined">close</span></button></div>' +
      '<span class="rk-st ' + st[1] + '">' + st[0] + '</span><ul class="rk-od-items">' + o.items.map(function (i) { var r = Math.round(i.base12 * (R[i.tenure] || 1)); return '<li><span class="th">' + (i.img ? '<img src="' + esc(i.img) + '" alt="" loading="lazy">' : '') + '</span><span class="nm"><b>' + esc(i.name) + '</b><small>' + (i.qty > 1 ? 'Qty ' + i.qty + ' \u00b7 ' : '') + i.tenure + ' months</small></span><span class="pr">' + inr(r * (i.qty || 1)) + '<small>/mo</small></span></li>'; }).join('') + '</ul>' +
      '<dl class="rk-od-sum"><div><dt>Tenure</dt><dd>' + o.tenure + ' months</dd></div><div><dt>Monthly rent</dt><dd>' + inr(o.rent) + '</dd></div><div><dt>Refundable deposit</dt><dd>' + inr(o.dep) + '</dd></div><div><dt>Next due</dt><dd>' + (o.nextDue ? fDate(o.nextDue) : '\u2014') + '</dd></div>' + (isDue && o.lateFee ? '<div><dt>Late fee</dt><dd>' + inr(o.lateFee) + '</dd></div>' : '') + '<div class="tot"><dt>Paid at checkout</dt><dd>' + inr(o.total) + '</dd></div></dl>' +
      '<div class="rk-dbtn">' + (isDue ? '<button type="button" class="rk-btn red lg" data-pay="' + esc(o.id) + '">Pay rent</button>' : '<button type="button" class="rk-btn sec lg" data-ord="close">Close</button>') + '<button type="button" class="rk-btn pri lg" data-ord="track" data-id="' + esc(o.id) + '">Track order</button></div></div>';
    document.body.appendChild(dlg); document.documentElement.classList.add('rk-lock'); $('.rk-dialog', dlg).focus();
    dlg.addEventListener('mousedown', function (e) { if (e.target === dlg) closeDlg(); });
  }
  document.addEventListener('keydown', function (e) {
    if (!dlg) return; if (e.key === 'Escape') { closeDlg(); return; }
    if (e.key === 'Tab') { var f = $$('button,a[href]', dlg).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return; var i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); } }
  });

  /* ---------- Live Move-in Tracker ---------- */
  var STEPS = [['task_alt', 'Order Placed', 'Payment verified via Razorpay'], ['assignment_turned_in', 'e-KYC Signed', 'Aadhaar DigiLocker verified'], ['sanitizer', 'Deep Sanitize & QA', '12-Point inspection & UV treatment'], ['local_shipping', 'Hub Dispatch', 'From {city} Hub'], ['door_front', 'White-Glove Setup', 'Delivery, room staging & unboxing']];
  var stage = function (o) { return o.status === 'progress' ? 2 : o.status === 'scheduled' ? 3 : 5; };
  function times(o) { var t = o.ts, d1 = t + DAY, active = o.status === 'progress'; return [fShort(t) + ' \u00b7 10:14 AM', fShort(t) + ' \u00b7 10:16 AM', active ? 'Active right now (3:30 PM)' : fShort(t) + ' \u00b7 3:30 PM', fShort(d1) + ' \u00b7 7:30 AM', fShort(d1) + ' \u00b7 9 AM \u2013 1 PM']; }
  function trackerHTML(o) {
    var done = stage(o), city = (window.RKLOC && RKLOC.get().city) || 'Gurgaon', tm = times(o);
    return '<ol class="rk-trk" aria-label="Order progress">' + STEPS.map(function (s, i) {
      var st = i < done ? 'done' : (i === done ? 'active' : 'todo'), label = st === 'done' ? 'Completed' : st === 'active' ? 'In progress' : (i === 3 ? 'Scheduled' : 'Appointment');
      return '<li class="rk-trk-step st-' + st + '"' + (st === 'active' ? ' aria-current="step"' : '') + '><span class="rk-trk-ic"><span class="material-symbols-outlined">' + s[0] + '</span></span><div class="rk-trk-tx"><span class="rk-trk-lb">' + (st === 'active' ? '<i class="rk-trk-dot"></i>' : '') + label + '</span><h3>' + esc(s[1]) + '</h3><p>' + esc(s[2].replace('{city}', city)) + '</p><time>' + esc(tm[i]) + '</time></div></li>';
    }).join('') + '</ol>';
  }
  function renderTrack() {
    var root = $('#rk-track-root'); if (!root) return; var o = cur ? byId(cur) : null; if (!o) o = orders().filter(function (x) { return ONGOING[x.status] || x.status === 'due'; })[0] || orders()[0];
    if (!o) { root.innerHTML = '<div class="rk-od-empty"><span class="material-symbols-outlined">receipt_long</span><b>No orders to track yet</b><button type="button" class="rk-btn pri lg" data-k="cat-go" data-v="all">Browse products</button></div>'; return; }
    var st = STATUS[o.status] || STATUS.active;
    root.innerHTML = '<nav class="rk-crumbs"><a data-path="home" href="#">Home</a><span>\u203a</span><button type="button" data-ord="back">Orders</button><span>\u203a</span><strong style="color:#001831">Track #' + esc(o.id) + '</strong></nav>' +
      '<section class="rk-trk-card"><div class="rk-trk-head"><div><span class="rk-trk-eye"><i></i>Real-time progression engine</span><h1>Live Move-in Tracker</h1></div><span class="rk-trk-pill"><span class="material-symbols-outlined">local_shipping</span>Standard 48-Hour Turnaround Protocol</span></div>' +
      '<div class="rk-trk-meta"><span>Order <b>#' + esc(o.id) + '</b></span><span>Placed ' + fDate(o.ts) + '</span><span class="rk-st ' + st[1] + '">' + st[0] + '</span></div>' + trackerHTML(o) +
      '<div class="rk-trk-foot"><button type="button" class="rk-btn sec" data-ord="back">All orders</button>' + (o.status === 'due' ? '<button type="button" class="rk-btn red" data-pay="' + esc(o.id) + '">Pay rent</button>' : '') + '<button type="button" class="rk-btn pri" data-ord="details" data-id="' + esc(o.id) + '">View details</button></div></section>';
  }
  function renderConfirmTracker() { var m = $('#rk-tracker-confirm'); if (!m) return; var o = realOrder() || { ts: Date.now() - 2 * 3600000, status: 'progress', items: [] }; m.innerHTML = trackerHTML(o); }

  /* ---------- dashboard: active order card, rent-due alert, orders list ---------- */
  function accountCard() {
    var box = $('#acct-order'); if (!box) return; var o = orders().filter(function (x) { return x.status !== 'completed' && x.status !== 'cancelled'; })[0];
    if (!o) { box.innerHTML = '<div class="rk-ao-empty"><span class="material-symbols-outlined">inventory_2</span><div><b>No active orders yet</b><small>Your next order will show up here with live tracking.</small></div><button type="button" class="rk-btn pri" data-k="cat-go" data-v="all">Browse products</button></div>'; return; }
    var first = o.items[0], extra = o.items.length - 1, st = STATUS[o.status] || STATUS.active, done = stage(o);
    box.innerHTML = '<div class="rk-ao"><div class="rk-ao-top"><span class="rk-st ' + st[1] + '">' + st[0] + '</span><small>#' + esc(o.id) + '</small></div><div class="rk-ao-main"><div class="rk-ao-img">' + (first.img ? '<img src="' + esc(first.img) + '" alt="" loading="lazy" decoding="async">' : '') + '</div><div><b>' + esc(first.name) + '</b><small>' + (extra > 0 ? '+ ' + extra + ' more item' + (extra > 1 ? 's' : '') + ' \u00b7 ' : '') + inr(o.rent) + '/mo \u00b7 Deposit ' + inr(o.dep) + '</small></div></div><div class="rk-ao-steps" aria-hidden="true">' + [0, 1, 2, 3, 4].map(function (i) { return '<i class="' + (i < done ? 'd' : i === done ? 'a' : '') + '"></i>'; }).join('') + '</div><div class="rk-ao-btns"><button type="button" class="rk-btn pri" data-ord="track" data-id="' + esc(o.id) + '">Track order</button>' + (o.status === 'due' ? '<button type="button" class="rk-btn red" data-pay="' + esc(o.id) + '">Pay rent</button>' : '<button type="button" class="rk-btn sec" data-ord="orders">All orders</button>') + '</div></div>';
  }
  function renderDash() {
    accountCard();
    var al = $('#rk-dash-alert'), due = M.due();
    if (al) { var tot = due.reduce(function (a, d) { return a + d.amount + d.lateFee; }, 0), late = due.some(function (d) { return d.tag === 'overdue'; });
      al.innerHTML = due.length ? '<div class="rk-alert" role="status"><span class="material-symbols-outlined">payments</span><div><b>Rent due: ' + inr(tot) + '</b><small>' + due.length + ' order' + (due.length === 1 ? '' : 's') + ' \u00b7 ' + (late ? 'includes an overdue payment' : 'due soon') + '</small></div><button type="button" class="rk-btn red" data-pay="all">Pay now</button></div>' : ''; }
    var all = orders(), box = $('#rk-dash-orders');
    if (box) {
      var list = all.filter(function (o) { return inTab(o, dtab); }), shown = list.slice(0, 2);
      box.innerHTML = tabsHTML(dtab, 'dtab', all, '') + (shown.length ? '<div class="rk-od-list">' + shown.map(function (o) { return card(o, true); }).join('') + '</div>' + (list.length > 2 ? '<button type="button" class="rk-btn sec rk-od-more" data-ord="orders">View all ' + list.length + ' orders</button>' : '')
        : '<div class="rk-od-empty sm"><span class="material-symbols-outlined">receipt_long</span><b>' + (all.length ? 'Nothing here yet' : 'No orders yet') + '</b></div>');
    }
  }

  /* ---------- events + hooks ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ord]'); if (!b) return; var k = b.dataset.ord, id = b.dataset.id;
    if (k === 'tab') { tab = b.dataset.v; renderOrders(); var t = $('#rk-tab-' + tab); if (t) t.focus({ preventScroll: true }); return; }
    if (k === 'dtab') { dtab = b.dataset.v; renderDash(); var dt = $('#rk-dash-orders [data-v="' + dtab + '"]'); if (dt) dt.focus({ preventScroll: true }); return; }
    if (k === 'details') { details(id); return; }
    if (k === 'close') { closeDlg(); return; }
    if (k === 'orders' || k === 'back') { closeDlg(); RK.show('orders', { force: true }); return; }
    if (k === 'track') { closeDlg(); cur = id; RK.show('track', { force: true }); return; }
  });
  document.addEventListener('click', function (e) { if (e.target.closest('[data-pay]')) closeDlg(); }, true);
  document.addEventListener('keydown', function (e) {
    if (!/^Arrow(Left|Right)$/.test(e.key) || !e.target.closest || !e.target.closest('.rk-od-tabs')) return;
    var t = $$('.rk-od-tabs [role=tab]', e.target.closest('.rk-od-tabs')), i = t.indexOf(document.activeElement); if (i < 0) return; t[(i + (e.key === 'ArrowRight' ? 1 : -1) + t.length) % t.length].click(); e.preventDefault();
  });
  var prev = window.RKX && window.RKX.render;
  window.RKX = Object.assign(window.RKX || {}, { render: function (view) {
    if (prev) prev(view);
    if (view === 'orders') renderOrders(); else if (view === 'track') renderTrack(); else if (view === 'confirm') renderConfirmTracker(); else if (view === 'dashboard') renderDash();
  } });
  window.RKORD = { card: renderDash, orders: orders };
  renderConfirmTracker(); renderDash();
})();
