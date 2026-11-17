/* =====================================================================================
   SHARED MOCK DATA (frontend only). Edit this block to change every orders / payment screen.
   - orders:  items are matched to catalogue products by name (regex); rent, deposit and totals use the site's own pricing.
   - ago:     days since the order was placed.      nextDueIn: days until the next rent is due (negative = overdue).
   - status:  active | delivered | scheduled | completed | due   ("due" = Rent Due)
   - history: earlier rent payments (amount = that order's monthly rent).
   - Late fee (sample rule): lateFeePerDay x days overdue, capped at lateFeeMax.
   ===================================================================================== */
window.RK_MOCK = {
  customer: { name: 'Naman', phone: '9130208733', email: 'snaman2310@gmail.com' },
  lateFeePerDay: 25, lateFeeMax: 250,
  orders: [
    { id: 'RNK-GGN-84702', ago: 1, status: 'scheduled', tenure: 9, nextDueIn: 30, items: [['^Dining Table 4 Seater', 1], ['^Bookshelf Alpha', 1]] },
    { id: 'RNK-GGN-84610', ago: 5, status: 'delivered', tenure: 12, nextDueIn: 25, items: [['^Study Table With Drawers', 1], ['^Executive Chair', 1]] },
    { id: 'RNK-GGN-84521', ago: 38, status: 'active', tenure: 12, nextDueIn: 22, items: [['^Double Bed Alpha 6x5', 1], ['^Premium Ortho.*6x5', 1], ['^Two Door Wardrobe Small', 1]] },
    { id: 'RNK-GGN-84388', ago: 64, status: 'due', tenure: 12, nextDueIn: -4, items: [['^Washing Machine \\(Top Load', 1], ['^Refrigerator 190 Litres', 1]] },
    { id: 'RNK-GGN-84297', ago: 92, status: 'due', tenure: 12, nextDueIn: 2, items: [['^Celine Sofa 3 Seater', 1], ['^Center Table Walnut Alpha', 1], ['^32-inch LED TV', 1]] },
    { id: 'RNK-GGN-82244', ago: 330, status: 'completed', tenure: 6, nextDueIn: null, items: [['^Single Bed Alpha 6x3', 1], ['^Single Mattress.*6x3', 1]] }
  ],
  history: [
    { orderId: 'RNK-GGN-84388', ago: 34, method: 'UPI', txn: 'TXN4821907365' },
    { orderId: 'RNK-GGN-84297', ago: 33, method: 'Card', txn: 'TXN4799123480' },
    { orderId: 'RNK-GGN-84297', ago: 63, method: 'UPI', txn: 'TXN4655120957' },
    { orderId: 'RNK-GGN-82244', ago: 152, method: 'Netbanking', txn: 'TXN4012238817' },
    { orderId: 'RNK-GGN-82244', ago: 182, method: 'UPI', txn: 'TXN3988012233' }
  ]
};

/* shared state: every page reads from here, so paying rent updates the dashboard and the Orders list */
(function () {
  'use strict';
  var M = window.RK_MOCK, RK = window.RK, D = window.RK_DATA, KEY = 'rk-mock-v1', DAY = 86400000, base = Date.now();
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function find(pat) { var re = new RegExp(pat, 'i'); return (D.products || []).filter(function (p) { return p.price && re.test(p.name); })[0]; }
  function line(p, tenure, qty) { return { id: p.id, name: p.name, img: p.images && p.images[0] ? 'images/' + p.images[0] : '', base12: p.price, tenure: tenure, qty: qty || 1 }; }
  var monthOf = function (t) { var d = new Date(t); return MON[d.getMonth()] + ' ' + d.getFullYear(); };
  function orders() {
    var s = load(), out = [];
    M.orders.forEach(function (o) {
      var items = o.items.map(function (x) { var p = find(x[0]); return p ? line(p, o.tenure, x[1]) : null; }).filter(Boolean); if (!items.length) return;
      var t = RK.totals(items, null), st = o.status, nextDue = o.nextDueIn == null ? null : base + o.nextDueIn * DAY, paid = s.paid && s.paid[o.id];
      if (paid && st === 'due') { st = 'active'; nextDue = paid.ts + 30 * DAY; }
      var due = st === 'due', over = due ? Math.max(0, Math.ceil((base - nextDue) / DAY)) : 0;
      out.push({ id: o.id, ts: base - o.ago * DAY, status: st, items: items, tenure: o.tenure, rent: t.rent, dep: t.dep, total: t.total, nextDue: nextDue,
        overdueDays: over, lateFee: due ? Math.min(M.lateFeeMax, over * M.lateFeePerDay) : 0, tag: due ? (nextDue < base ? 'overdue' : 'soon') : null });
    });
    return out.sort(function (a, b) { return b.ts - a.ts; });
  }
  function due() {
    return orders().filter(function (o) { return o.status === 'due'; }).map(function (o) { return { id: o.id, order: o, monthLabel: monthOf(o.nextDue), dueTs: o.nextDue, amount: o.rent, lateFee: o.lateFee, tag: o.tag }; }).sort(function (a, b) { return a.dueTs - b.dueTs; });
  }
  function pay(ids, method) {
    var s = load(), ts = Date.now(), txn = 'TXN' + String(Math.floor(1e9 + Math.random() * 9e9)), list = due().filter(function (d) { return ids.indexOf(d.id) >= 0; });
    s.paid = s.paid || {}; s.extra = s.extra || [];
    list.forEach(function (d) { s.paid[d.id] = { ts: ts, txn: txn }; s.extra.push({ orderId: d.id, ts: ts, method: method, txn: txn, amount: d.amount + d.lateFee, label: d.monthLabel.split(' ')[0] }); });
    save(s); return { txn: txn, ts: ts, method: method, ids: list.map(function (d) { return d.id; }) };
  }
  function history() {
    var s = load(), byId = {}; orders().forEach(function (o) { byId[o.id] = o; });
    var seeds = M.history.map(function (h) { var o = byId[h.orderId], ts = base - h.ago * DAY; return o ? { orderId: h.orderId, ts: ts, method: h.method, txn: h.txn, amount: o.rent, label: MON[new Date(ts).getMonth()] } : null; }).filter(Boolean);
    return (s.extra || []).map(function (x) { return x; }).concat(seeds).sort(function (a, b) { return b.ts - a.ts; });
  }
  window.RKMOCK = { orders: orders, due: due, pay: pay, history: history, reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }, byId: function (id) { return orders().filter(function (o) { return o.id === id; })[0]; } };
})();
