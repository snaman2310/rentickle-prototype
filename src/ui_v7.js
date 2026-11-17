/* ===== Rentickle catalog, product page and Smart Combos (data-driven from the Excel) ===== */
(function () {
  'use strict';
  var D = window.RK_DATA, P = D.products, CATS = D.categories, RK = window.RK;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var RATIO = { 12: 1, 9: 529 / 489, 6: 589 / 489, 3: 699 / 489 };
  var TENURES = [12, 9, 6, 3];
  var CFG = Object.assign({ showSampleReviews: false, imageOverrides: {} }, window.RK_CONFIG || {});
  P.forEach(function (p) { if (CFG.imageOverrides[p.id]) p.images = CFG.imageOverrides[p.id]; });
  var byId = {}; P.forEach(function (p) { byId[p.id] = p; });
  var catIcon = {}; CATS.forEach(function (c) { catIcon[c.name] = c.icon; });
  var isCat = function (n) { return function (p) { return p.cat === n; }; };
  var APPL = ['Microwaves', 'Water Purifiers', 'Televisions', 'Air Coolers', 'Air Purifiers', 'Oil Filled Radiators'];
  var HOME = [
    { key: 'beds', label: 'Beds', icon: 'bed', match: function (p) { return p.cat === 'Single Beds' || p.cat === 'Double Beds' || p.cat === 'Mattresses'; } },
    { key: 'wardrobes', label: 'Wardrobes', icon: 'door_sliding', match: isCat('Wardrobes') },
    { key: 'chairs', label: 'Chairs', icon: 'chair', match: function (p) { return /Chair/.test(p.name) || p.cat === 'Bean Bags'; } },
    { key: 'sofas', label: 'Sofas', icon: 'weekend', match: isCat('Sofas') },
    { key: 'center-tables', label: 'Center Tables', icon: 'table_restaurant', match: isCat('Center Tables') },
    { key: 'washing-machines', label: 'Washing Machines', icon: 'local_laundry_service', match: isCat('Washing Machines') },
    { key: 'refrigerators', label: 'Refrigerators', icon: 'kitchen', match: isCat('Refrigerators') },
    { key: 'study-tables', label: 'Study Tables', icon: 'desk', match: function (p) { return p.cat === 'Tables & Chairs' && /Study Table|Laptop Table/.test(p.name); } },
    { key: 'dining-tables', label: 'Dining Tables', icon: 'dining', match: isCat('Dining Tables') },
    { key: 'patio-furniture', label: 'Patio Furniture', icon: 'deck', match: isCat('Patio Furniture') },
    { key: 'bookshelves', label: 'Bookshelves', icon: 'auto_stories', match: isCat('Bookshelves') },
    { key: 'appliances', label: 'Appliances', icon: 'electrical_services', match: function (p) { return APPL.indexOf(p.cat) >= 0; } }
  ];
  var HOMEBY = {}; HOME.forEach(function (h) { HOMEBY[h.key] = h; h.count = P.filter(h.match).length; });
  HOMEBY.other = { key: 'other', label: 'Other furniture', icon: 'chair_alt', match: function (p) { return !HOME.some(function (h) { return h.match(p); }); } };
  HOMEBY.other.count = P.filter(HOMEBY.other.match).length;
  var homeKeyOf = function (p) { var h = HOME.filter(function (x) { return x.match(p); })[0]; return h ? h.key : 'other'; };
  var LEGACY = { 'beds-mattresses': 'beds', 'dining-center-tables': 'dining-tables', 'kitchen-appliances': 'refrigerators', 'tables-chairs': 'study-tables', 'single-beds': 'beds', 'double-beds': 'beds', 'mattresses': 'beds', 'tv-units': 'other', 'bean-bags': 'chairs', 'microwaves': 'appliances', 'water-purifiers': 'appliances', 'televisions': 'appliances', 'air-coolers': 'appliances', 'air-purifiers': 'appliances', 'oil-filled-radiators': 'appliances' };

  /* ---------- helpers ---------- */
  var cityMult = function () { return window.RKLOC ? RKLOC.mult() : 1; };
  var cityOff = function (p) { return !!(window.RKLOC && RKLOC.unavail(p)); };
  var out = function (p) { return p.oos || cityOff(p); };
  var outLabel = function (p) { return cityOff(p) ? 'Not in ' + RKLOC.get().city : 'Out of stock'; };
  var rent = function (p, m) { return Math.round(p.price * cityMult() * (RATIO[m || 12] || 1)); };
  var avail = function (p) { return !!p.price && !out(p); };
  function adj(p) { // rating adjusted for review volume (pulls thinly-reviewed items toward 4.2)
    var n = p.reviews != null ? p.reviews : (p.rating ? 30 : 0), r = p.rating != null ? p.rating : 4.2;
    return (r * n + 4.2 * 100) / (n + 100);
  }
  var fmtN = function (n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'K' : String(n); };
  var img = function (p, i) { return p.images && p.images[i || 0] ? 'images/' + p.images[i || 0] : ''; };
  var PH = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#eee9e6"/></svg>');
  function media(p, i, cls) {
    var src = img(p, i), ic = catIcon[p.cat] || 'chair';
    if (!src) return '<div class="rk-ph"><span class="material-symbols-outlined">' + ic + '</span><small>Photo coming soon</small></div>';
    return '<img ' + (cls ? 'class="' + cls + '" ' : '') + 'src="' + esc(src) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" data-icon="' + ic + '" onerror="rkImgFail(this)">';
  }
  window.rkImgFail = function (el) {
    var d = document.createElement('div'); d.className = 'rk-ph';
    d.innerHTML = '<span class="material-symbols-outlined">' + (el.getAttribute('data-icon') || 'chair') + '</span><small>Photo coming soon</small>'; el.replaceWith(d);
  };
  function ratingHTML(p) {
    if (p.rating == null) return '<span class="rk-rate" style="font-weight:500;color:#666">Not rated yet</span>';
    return '<span class="rk-rate"><span class="material-symbols-outlined">star</span>' + p.rating.toFixed(1) + (p.reviews ? ' <small>(' + fmtN(p.reviews) + ')</small>' : '') + '</span>';
  }
  function toast(m) { if (window.rkToast) window.rkToast(m); }

  /* ---------- catalog state ---------- */
  var MAXP = Math.ceil(Math.max.apply(null, P.filter(function (p) { return p.price; }).map(function (p) { return p.price; })) / 100) * 100;
  var cat = { key: 'all', label: 'All products', q: '', minR: 0, inStock: false, priced: false, min: 0, max: MAXP, sort: 'rec', tenure: 12 };
  var curPid = null; try { curPid = sessionStorage.getItem('rk-pid'); } catch (e) {}
  var galleryIdx = 0, prodTenure = 12;

  function resetFilters() { cat.q = ''; cat.minR = 0; cat.inStock = false; cat.priced = false; cat.min = 0; cat.max = MAXP; cat.sort = 'rec'; }
  function openCategory(key) {
    resetFilters();
    key = LEGACY[key] || key;
    if (!key || key === 'all' || !HOMEBY[key]) { cat.key = 'all'; cat.label = 'All products'; }
    else { cat.key = key; cat.label = HOMEBY[key].label; }
    RK.show('category', { force: true });
  }
  function pathToKey(path) {
    var m = { 'living-room-sofas': 'sofas', 'living-room-rentals': 'sofas', 'beds-mattresses': 'beds', 'bedroom-and-mattresses': 'beds', 'dining-tables': 'dining-tables', 'dining-room': 'dining-tables', 'refrigerators-kitchen': 'refrigerators', 'washing-machines': 'washing-machines', 'work-desks-chairs': 'study-tables', 'wardrobes': 'wardrobes' };
    return m[path] || 'all';
  }
  function openProduct(id) {
    if (!byId[id]) return; curPid = id; galleryIdx = 0; prodTenure = 12;
    try { sessionStorage.setItem('rk-pid', id); } catch (e) {}
    RK.show('product', { force: true });
  }
  function searchFor(q) { resetFilters(); cat.key = 'all'; cat.label = 'Search results'; cat.q = q; RK.show('category', { force: true }); }

  function alt2(p) { return p.images && p.images[1] ? '<img class="rk-alt" src="images/' + esc(p.images[1]) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : ''; }
  /* ---------- product card ---------- */
  function cardHTML(p, t) {
    var badges = '';
    if (out(p)) badges += '<span class="rk-badge red">' + outLabel(p) + '</span>';
    p.tags.forEach(function (g) { badges += '<span class="rk-badge ' + (g === 'Few Left' ? 'amber' : 'green') + '">' + esc(g) + '</span>'; });
    var priceBlock;
    if (p.price) {
      var pr = rent(p, t);
      priceBlock = '<div><b>' + (p.from_ ? '<small style="font-weight:600">From </small>' : '') + inr(pr) + '</b><small>/mo</small>' + (p.strike && t === 12 ? '<s>' + inr(p.strike) + '</s>' : '') + '</div><div class="rk-dep">Deposit ' + inr(pr) + '<br><span style="color:#666;font-weight:400">' + t + '-month lease</span></div>';
    } else {
      priceBlock = '<div><b style="font-size:18px">Price on request</b><br><small>Call 1800-270-1950</small></div>';
    }
    var addBtn = !p.price ? '<button class="rk-btn red" data-k="quote" data-id="' + p.id + '"><span class="material-symbols-outlined" style="font-size:18px">call</span>Get Quote</button>'
      : out(p) ? '<button class="rk-btn pri" disabled>' + (cityOff(p) ? 'Not available' : 'Out of Stock') + '</button>'
      : '<button class="rk-btn pri" data-k="add" data-id="' + p.id + '" data-t="' + t + '"><span class="material-symbols-outlined" style="font-size:18px">add_shopping_cart</span>Add</button>';
    return '<article class="rk-card"><div class="rk-media" data-k="open" data-id="' + p.id + '">' + media(p, 0) + alt2(p) + '<div class="rk-badges">' + badges + '</div></div>' +
      '<div class="rk-body"><div class="rk-meta"><span>' + esc(p.cat) + '</span>' + ratingHTML(p) + '</div>' +
      '<h3 class="rk-title font-headline-sm text-headline-sm" data-k="open" data-id="' + p.id + '">' + esc(p.name) + '</h3>' +
      '<p class="rk-desc">' + esc(p.desc || '') + '</p><div class="rk-price">' + priceBlock + '</div>' +
      '<div class="rk-btns"><button class="rk-btn sec" data-k="open" data-id="' + p.id + '">Details</button>' + addBtn + '</div></div></article>';
  }

  /* ---------- category page ---------- */
  function filtered() {
    var q = cat.q.trim().toLowerCase();
    var rangeOn = cat.min > 0 || cat.max < MAXP;
    var list = P.filter(function (p) {
      if (cat.key !== 'all' && !HOMEBY[cat.key].match(p)) return false;
      if (q && (p.name + ' ' + p.cat + ' ' + p.desc).toLowerCase().indexOf(q) < 0) return false;
      if (cat.minR && !(p.rating && p.rating >= cat.minR)) return false;
      if (cat.inStock && out(p)) return false;
      if ((cat.priced || rangeOn) && !p.price) return false;
      if (rangeOn && (p.price < cat.min || p.price > cat.max)) return false;
      return true;
    });
    var s = cat.sort;
    list.sort(function (a, b) {
      if (s === 'pa') return (a.price || 1e9) - (b.price || 1e9);
      if (s === 'pd') return (b.price || -1) - (a.price || -1);
      if (s === 'rt') return (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0);
      var av = (avail(b) ? 1 : 0) - (avail(a) ? 1 : 0); if (av) return av;
      var pr = (b.price ? 1 : 0) - (a.price ? 1 : 0); if (pr) return pr;
      return adj(b) - adj(a) || (b.reviews || 0) - (a.reviews || 0);
    });
    return list;
  }
  function renderCatShell() {
    var root = $('#rk-cat-root'); if (!root) return;
    var side = '<h4>Search</h4><div class="rk-searchbox"><span class="material-symbols-outlined">search</span><input class="rk-search" id="rk-q" placeholder="Search products" value="' + esc(cat.q) + '" aria-label="Search products"></div>' +
      '<h4>Categories</h4><button class="rk-catbtn" data-k="cat" data-v="all">All products <small>' + P.length + '</small></button>';
    HOME.concat([HOMEBY.other]).forEach(function (h) { if (h.count) side += '<button class="rk-catbtn" data-k="cat" data-v="' + h.key + '">' + esc(h.label) + ' <small>' + h.count + '</small></button>'; });
    side += '<h4>Rating</h4><div class="rk-chiprow" id="rk-rate">' + [[0, 'Any'], [4, '4.0+'], [4.3, '4.3+'], [4.5, '4.5+']].map(function (r) { return '<button class="rk-chip" data-k="rate" data-v="' + r[0] + '">' + r[1] + '</button>'; }).join('') + '</div>' +
      '<h4>Availability</h4><label class="rk-check"><input type="checkbox" id="rk-instock"> In stock only</label><label class="rk-check"><input type="checkbox" id="rk-priced"> Show only items with a listed price</label>' +
      '<h4>Monthly rent <span id="rk-rng" style="text-transform:none;letter-spacing:0;color:#001831"></span></h4>' +
      '<input class="rk-range" type="range" id="rk-min" min="0" max="' + MAXP + '" step="10"><input class="rk-range" type="range" id="rk-max" min="0" max="' + MAXP + '" step="10">' +
      '<h4 class="rk-sheet-only">Lease length</h4><div class="rk-chiprow rk-sheet-only" id="rk-ten-side">' + TENURES.slice().reverse().map(function (m) { return '<button class="rk-chip" data-k="tenure" data-v="' + m + '">' + m + ' months</button>'; }).join('') + '</div>';
    root.innerHTML = '<div class="rk-wrap" style="padding:0"><nav class="rk-crumbs" id="rk-cat-crumbs"></nav><div class="rk-layout"><aside class="rk-side" id="rk-side" aria-label="Filters"><div class="rk-side-head"><b>Filters</b><button type="button" class="rk-x" data-k="filt-close" aria-label="Close filters"><span class="material-symbols-outlined">close</span></button></div><div class="rk-side-body">' + side + '</div><div class="rk-side-foot"><button type="button" class="rk-btn sec lg" data-k="reset">Clear all</button><button type="button" class="rk-btn pri lg rk-apply" id="rk-apply" data-k="filt-close">Show results</button></div></aside><div class="rk-sheet-bg" data-k="filt-close"></div><div><div class="rk-toolbar" id="rk-cat-toolbar"></div><div class="rk-fchips" id="rk-fchips"></div><div id="rk-cat-grid"></div></div></div></div>';
  }
  function filterCount() { return (cat.key !== 'all' ? 1 : 0) + (cat.q.trim() ? 1 : 0) + (cat.minR ? 1 : 0) + (cat.inStock ? 1 : 0) + (cat.priced ? 1 : 0) + ((cat.min > 0 || cat.max < MAXP) ? 1 : 0); }
  function chipsHTML() {
    var c = [], x = function (t, l) { c.push('<button type="button" class="rk-fchip" data-k="fchip" data-v="' + t + '" aria-label="Remove filter: ' + esc(l) + '">' + esc(l) + '<span class="material-symbols-outlined" aria-hidden="true">close</span></button>'); };
    if (cat.key !== 'all') x('cat', cat.label); if (cat.q.trim()) x('q', '\u201c' + cat.q.trim() + '\u201d'); if (cat.minR) x('rate', cat.minR.toFixed(1) + '+ rating'); if (cat.inStock) x('stock', 'In stock'); if (cat.priced) x('priced', 'Priced items');
    if (cat.min > 0 || cat.max < MAXP) x('price', inr(cat.min) + ' \u2013 ' + inr(cat.max) + (cat.max >= MAXP ? '+' : ''));
    return c.length ? c.join('') + '<button type="button" class="rk-fchip clear" data-k="reset">Clear all</button>' : '';
  }
  function filtSheet(on) { var s = $('#rk-side'), b = $('.rk-sheet-bg'); if (!s) return; s.classList.toggle('open', on); if (b) b.classList.toggle('open', on); document.documentElement.classList.toggle('rk-lock', on); if (on) { var f = $('.rk-x', s); if (f) f.focus({ preventScroll: true }); } }
  function renderCategory() {
    if (!$('#rk-cat-root .rk-layout')) renderCatShell();
    var root = $('#rk-cat-root');
    var q = $('#rk-q'); if (q && q.value !== cat.q && document.activeElement !== q) q.value = cat.q;
    root.querySelectorAll('.rk-catbtn').forEach(function (b) {
      b.classList.toggle('on', b.dataset.v === cat.key);
    });
    root.querySelectorAll('#rk-rate .rk-chip').forEach(function (b) { b.classList.toggle('on', parseFloat(b.dataset.v) === cat.minR); });
    $('#rk-instock').checked = cat.inStock; $('#rk-priced').checked = cat.priced;
    $('#rk-min').value = cat.min; $('#rk-max').value = cat.max;
    $('#rk-rng').textContent = inr(cat.min) + ' – ' + inr(cat.max) + (cat.max >= MAXP ? '+' : '');
    $('#rk-cat-crumbs').innerHTML = '<a data-path="home" href="#">Home</a><span>›</span><strong style="color:#001831">' + esc(cat.label) + '</strong>';
    var list = filtered(), nF = filterCount();
    $('#rk-cat-toolbar').innerHTML = '<div><strong class="font-headline-sm text-headline-sm" style="color:#001831">' + list.length + ' product' + (list.length === 1 ? '' : 's') + '</strong> <span style="color:#666;font-size:14px">· ' + esc(cat.label) + '</span></div>' +
      '<div class="rk-tb-ctl"><button type="button" class="rk-btn sec rk-filt-btn" data-k="filt-open" aria-haspopup="dialog"><span class="material-symbols-outlined">tune</span>Filters' + (nF ? '<span class="rk-nbadge">' + nF + '</span>' : '') + '</button><div class="rk-chiprow rk-ten-d" title="Rental tenure">' + TENURES.slice().reverse().map(function (m) { return '<button class="rk-chip' + (cat.tenure === m ? ' on' : '') + '" data-k="tenure" data-v="' + m + '">' + m + ' Mo' + (m === 12 ? ' · best rate' : '') + '</button>'; }).join('') + '</div>' +
      '<select class="rk-select" id="rk-sort"><option value="rec">Recommended</option><option value="pa">Price: Low to High</option><option value="pd">Price: High to Low</option><option value="rt">Top rated</option></select></div>';
    $('#rk-sort').value = cat.sort;
    $$('#rk-ten-side .rk-chip').forEach(function (b) { b.classList.toggle('on', parseInt(b.dataset.v, 10) === cat.tenure); });
    var ap = $('#rk-apply'); if (ap) ap.textContent = 'Show ' + list.length + ' product' + (list.length === 1 ? '' : 's');
    var fc = $('#rk-fchips'); if (fc) fc.innerHTML = chipsHTML();
    $('#rk-cat-grid').innerHTML = list.length ? '<div class="rk-grid">' + list.map(function (p) { return cardHTML(p, cat.tenure); }).join('') + '</div>' :
      '<div class="rk-empty"><span class="material-symbols-outlined" style="font-size:48px">search_off</span><p style="margin:8px 0 14px">No products match these filters.</p><button class="rk-btn pri" data-k="reset">Reset filters</button></div>';
    document.title = cat.label + ' · Rentickle';
  }

  /* ---------- product page ---------- */
  function complements(p) {
    var out = [], pick = function (fn) { P.filter(function (x) { return x.id !== p.id && avail(x) && fn(x); }).sort(function (a, b) { return adj(b) - adj(a); }).slice(0, 2).forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); }); };
    var c = p.cat;
    if (c === 'Single Beds' || c === 'Double Beds') { pick(function (x) { return x.cat === 'Mattresses' && x.size === p.size; }); pick(function (x) { return x.cat === 'Wardrobes'; }); }
    else if (c === 'Mattresses') pick(function (x) { return (x.cat === 'Single Beds' || x.cat === 'Double Beds') && x.size === p.size; });
    else if (c === 'Sofas') { pick(function (x) { return x.cat === 'Center Tables'; }); pick(function (x) { return x.cat === 'TV Units'; }); }
    else if (c === 'Televisions') { pick(function (x) { return x.cat === 'TV Units'; }); pick(function (x) { return x.cat === 'Sofas'; }); }
    else if (c === 'TV Units') { pick(function (x) { return x.cat === 'Televisions'; }); pick(function (x) { return x.cat === 'Sofas'; }); }
    else if (c === 'Refrigerators') { pick(function (x) { return x.cat === 'Washing Machines'; }); pick(function (x) { return x.cat === 'Microwaves'; }); }
    else if (c === 'Washing Machines') { pick(function (x) { return x.cat === 'Refrigerators'; }); pick(function (x) { return x.cat === 'Water Purifiers'; }); }
    else if (c === 'Tables & Chairs') { pick(function (x) { return x.cat === 'Tables & Chairs' && (/Chair/.test(p.name) ? /Study Table/.test(x.name) : /Chair/.test(x.name)); }); pick(function (x) { return x.cat === 'Bookshelves'; }); }
    else pick(function (x) { return x.dept === p.dept && x.cat !== p.cat; });
    return out.slice(0, 4);
  }
  /* ---------- reviews ---------- */
  var starsHTML = function (r) { var h = ''; for (var i = 1; i <= 5; i++) h += '<span class="material-symbols-outlined rk-star' + (i <= Math.round(r) ? ' on' : '') + '">star</span>'; return '<span class="rk-stars" aria-label="' + r + ' out of 5">' + h + '</span>'; };
  function loadReviews(id) { try { return (JSON.parse(localStorage.getItem('rk-reviews') || '{}')[id]) || []; } catch (e) { return []; } }
  function saveReview(id, r) { try { var all = JSON.parse(localStorage.getItem('rk-reviews') || '{}'); (all[id] = all[id] || []).unshift(r); localStorage.setItem('rk-reviews', JSON.stringify(all)); return true; } catch (e) { return false; } }
  var SAMPLE_RV = [{ r: 5, t: 'Sample text: delivery and assembly went smoothly, and the item looks as pictured.' }, { r: 4, t: 'Sample text: sturdy and comfortable for everyday use. Placeholder copy only.' }];
  function reviewCard(r, sample) {
    return '<article class="rk-rv">' + (sample ? '<span class="rk-rv-flag">Sample content · not a real customer</span>' : '') + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' + starsHTML(r.r) + '<small style="color:#777">' + esc(sample ? 'Sample reviewer' : (r.name || 'Rentickle customer') + ' · ' + (r.date || '')) + '</small></div><p>' + esc(r.t) + '</p></article>';
  }
  function reviewsHTML(p) {
    var mine = loadReviews(p.id), shown = mine.slice(0, 2).map(function (r) { return reviewCard(r, false); });
    if (shown.length < 2 && CFG.showSampleReviews) SAMPLE_RV.slice(0, 2 - shown.length).forEach(function (r) { shown.push(reviewCard(r, true)); });
    var sum = p.rating ? '<div class="rk-rv-sum"><b>' + p.rating.toFixed(1) + '</b><div>' + starsHTML(p.rating) + '<small>' + (p.reviews ? fmtN(p.reviews) + ' ratings on rentickle.com' : 'Rating from rentickle.com') + '</small></div></div>' : '<div class="rk-rv-sum"><small>Not rated yet</small></div>';
    var body = shown.length ? shown.join('') : '<div class="rk-rv-empty"><span class="material-symbols-outlined">rate_review</span><b>No written reviews yet</b><p>Be the first to review this product and help others decide.</p></div>';
    return '<section class="rk-panel" id="reviews" style="margin-top:24px"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><h2 class="font-headline-md text-headline-md" style="color:#001831;font-weight:700">Customer reviews</h2><button class="rk-btn sec" data-k="rv-open">' + (shown.length && !CFG.showSampleReviews ? 'Write a review' : 'Be the first to review') + '</button></div>' + sum +
      '<div class="rk-rv-list">' + body + '</div>' + (mine.length > 2 ? '<small style="color:#777">Showing 2 of ' + mine.length + ' reviews</small>' : '') +
      '<form class="rk-rv-form" id="rk-rv-form" hidden onsubmit="return false"><div class="rk-lbl" style="margin-top:0">Your rating</div><div id="rk-rv-stars" role="radiogroup" aria-label="Rating">' + [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" class="rk-starbtn" data-k="rv-star" data-v="' + i + '" role="radio" aria-checked="false" aria-label="' + i + ' star' + (i > 1 ? 's' : '') + '"><span class="material-symbols-outlined rk-star">star</span></button>'; }).join('') + '</div>' +
      '<label class="rk-lbl" for="rk-rv-name">Name (optional)</label><input class="rk-search" id="rk-rv-name" style="padding-left:12px" maxlength="40" placeholder="Shown with your review">' +
      '<label class="rk-lbl" for="rk-rv-text">Your review</label><textarea class="rk-search" id="rk-rv-text" style="padding:10px 12px;height:96px" maxlength="500" placeholder="What did you like? How was delivery and quality?"></textarea>' +
      '<p style="font-size:12px;color:#777;margin:6px 0">Saved on this device only until the review form is connected to your reviews API.</p><div class="rk-btns" style="max-width:320px"><button type="button" class="rk-btn sec" data-k="rv-cancel">Cancel</button><button type="button" class="rk-btn pri" data-k="rv-submit">Submit review</button></div></form></section>';
  }
  var rvStar = 0;

  /* ---------- product page ---------- */
  function renderProduct() {
    var root = $('#rk-prod-root'); if (!root) return;
    var p = byId[curPid] || P.filter(avail)[0]; curPid = p.id;
    var imgs = p.images || [], t = prodTenure, pr = p.price ? rent(p, t) : 0;
    var stage = '<div class="rk-stage" id="rk-stage"' + (imgs.length ? ' style="--bg:url(\'images/' + esc(imgs[galleryIdx]) + '\')"' : '') + '>' + media(p, galleryIdx) + '</div>';
    var thumbs = imgs.length > 1 ? '<div class="rk-thumbs">' + imgs.map(function (f, i) { return '<button class="rk-thumb' + (i === galleryIdx ? ' on' : '') + '" data-k="thumb" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="images/' + esc(f) + '" alt="" loading="lazy" decoding="async"></button>'; }).join('') + '</div>' : '';
    var pills = [['local_shipping', 'Free delivery*'], ['build', 'Free assembly'], ['sanitizer', 'Sanitized'], ['verified', 'Maintenance included']].map(function (x) { return '<span class="rk-pill"><span class="material-symbols-outlined">' + x[0] + '</span>' + x[1] + '</span>'; }).join('');
    var priceUI;
    if (p.price) {
      priceUI = '<div style="display:flex;align-items:baseline;gap:8px;margin:14px 0 2px"><span style="font-size:38px;font-weight:700;color:#001831">' + (p.from_ ? '<small style="font-size:16px">From </small>' : '') + inr(pr) + '</span><span style="color:#666">/month</span>' + (p.strike && t === 12 ? '<s style="color:#888">' + inr(p.strike) + '</s>' : '') + '</div>' +
        '<div class="rk-tenures" role="group" aria-label="Rental tenure">' + TENURES.slice().reverse().map(function (m) { return '<button class="rk-ten' + (m === t ? ' on' : '') + '" data-k="pten" data-m="' + m + '" aria-pressed="' + (m === t) + '"><b>' + inr(rent(p, m)) + '</b><span>' + m + ' months' + (m === 12 ? ' · best' : '') + '</span></button>'; }).join('') + '</div>' +
        '<div class="rk-ledger"><div><span>Monthly rent (' + t + ' mo)</span><span>' + inr(pr) + '</span></div><div><span>Refundable deposit</span><span>' + inr(pr) + '</span></div><div class="tot"><span>Due today</span><span>' + inr(pr * 2) + '</span></div></div>';
    } else priceUI = '<div class="rk-note warn" style="margin-top:14px"><strong>Price on request.</strong> The live page did not publish a monthly rent for this item. Call <a href="tel:18002701950" style="text-decoration:underline">1800-270-1950</a> or email care@rentickle.com for a quote.</div>';
    var status = out(p) ? '<span class="rk-badge red" style="box-shadow:none">' + outLabel(p) + '</span>' : (p.tags.map(function (g) { return '<span class="rk-badge ' + (g === 'Few Left' ? 'amber' : 'green') + '" style="box-shadow:none">' + esc(g) + '</span>'; }).join(' '));
    var btns = !p.price ? '<button class="rk-btn red lg" data-k="quote" data-id="' + p.id + '">Get a quote</button>'
      : out(p) ? '<button class="rk-btn pri lg" disabled>' + (cityOff(p) ? 'Not available in ' + RKLOC.get().city : 'Currently out of stock') + '</button>'
      : '<button class="rk-btn sec lg" data-k="addp">Add to Cart</button><button class="rk-btn red lg" data-k="rentnow">Rent Now</button>';
    var comp = complements(p), combosIn = combosContaining(p.id), hk = homeKeyOf(p);
    var h = '<nav class="rk-crumbs"><a data-path="home" href="#">Home</a><span>›</span><button data-k="cat-go" data-v="' + hk + '">' + esc(HOMEBY[hk].label) + '</button><span>›</span><strong style="color:#001831">' + esc(p.name) + '</strong></nav>' +
      '<div class="rk-pdp"><div class="rk-pdp-gal" id="rk-pdp-gal">' + stage + thumbs + '</div>' +
      '<div class="rk-pdp-info"><div class="rk-panel rk-sticky" id="rk-pdp-panel"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="color:#666;font-size:13px">' + esc(p.cat) + '</span>' + status + '</div>' +
      '<h1 class="font-headline-lg text-headline-lg" style="color:#001831;font-weight:700;margin:6px 0">' + esc(p.name) + '</h1><div>' + ratingHTML(p) + '</div>' + priceUI +
      '<div style="display:grid;grid-template-columns:' + (p.price && !out(p) ? '1fr 1fr' : '1fr') + ';gap:10px;margin-top:16px">' + btns + '</div><div class="rk-pills">' + pills + '</div>' +
      '<p style="font-size:12px;color:#777">*Free delivery and assembly. Prices are monthly rent for the selected tenure.</p>' +
      (p.url ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" style="font-size:13px;text-decoration:underline;color:#001831">View original listing on rentickle.com ↗</a>' : '') + '</div></div>' +
      '<div class="rk-pdp-more"><div class="rk-panel"><h2 class="font-headline-md text-headline-md" style="color:#001831;font-weight:700;margin-bottom:8px">About this item</h2><p class="rk-spec">' + esc(p.desc || 'Details are not listed for this item yet.') + '</p></div>';
    if (combosIn.length) h += '<div class="rk-panel" style="margin-top:24px"><h2 class="font-headline-md text-headline-md" style="color:#001831;font-weight:700;margin-bottom:10px">Save more in a Smart Combo</h2><div class="rk-chiprow">' + combosIn.map(function (c) { return '<button class="rk-chip" data-k="goto-combo" data-v="' + c.id + '">' + esc(c.name) + '</button>'; }).join('') + '</div><p style="font-size:13px;color:#666;margin-top:8px">Bundle this with matching items for up to 15% off the monthly rent.</p></div>';
    h += reviewsHTML(p) + '</div></div>';
    if (comp.length) h += '<h2 class="rk-sec-title">Rented together with this</h2><div class="rk-grid">' + comp.map(function (x) { return cardHTML(x, 12); }).join('') + '</div>';
    var sim = P.filter(function (x) { return x.id !== p.id && homeKeyOf(x) === hk; }).sort(function (a, b) { return (avail(b) ? 1 : 0) - (avail(a) ? 1 : 0) || adj(b) - adj(a); }).slice(0, 4);
    if (sim.length) h += '<h2 class="rk-sec-title">More in ' + esc(HOMEBY[hk].label) + '</h2><div class="rk-grid">' + sim.map(function (x) { return cardHTML(x, 12); }).join('') + '</div>';
    h += '<h2 class="rk-sec-title" id="faq-anchor">Renting FAQs</h2><div class="rk-panel rk-faq">' + D.faq.map(function (f) { return '<details><summary><span>' + esc(f.q) + '</span></summary><p>' + esc(f.a) + '</p></details>'; }).join('') + '</div>';
    root.innerHTML = h; document.title = p.name + ' · Rentickle'; rvStar = 0;
    syncPdp(); var im = $('#rk-stage img'); if (im) im.addEventListener('load', syncPdp);
  }
  function syncPdp() { // keep the photo card and the price panel the same height on desktop
    var g = $('#rk-pdp-gal'), pn = $('#rk-pdp-panel'); if (!g || !pn) return;
    g.style.minHeight = pn.style.minHeight = '';
    if (window.innerWidth <= 900) return;
    var hgt = Math.max(g.offsetHeight, pn.offsetHeight); g.style.minHeight = hgt + 'px'; pn.style.minHeight = hgt + 'px';
  }
  window.addEventListener('resize', function () { if (RK.cur() === 'product') syncPdp(); });

  /* ---------- checkout coupons dropdown ---------- */
  var ddOpen = false;
  function renderCoupons() {
    var root = $('#rk-dd-root'); if (!root || !RK.coupons) return;
    var C = RK.coupons, cart = RK.state.cart, applied = RK.state.coupon, codes = Object.keys(C);
    var rows = codes.map(function (code) {
      var c = C[code], t = RK.totals(cart, code), elig = !!(cart.length && t.coupon), isOn = applied === code && elig, pct = Math.round(c.pct * 100);
      var reason = !cart.length ? 'Add items to your cart to use this coupon.' : !elig ? 'Choose a tenure of ' + c.minTenure + ' months or more for every item to unlock this.' : '';
      return '<li class="rk-cp"><div class="rk-cp-main"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><code class="rk-cp-code">' + esc(code) + '</code><span class="rk-tag g">' + esc(c.title) + '</span></div>' +
        '<p>Waives ' + pct + '% of your first month\'s rent across the cart.</p><small>Condition: minimum tenure of ' + c.minTenure + ' months on every item.</small>' +
        (elig && !isOn ? '<small class="rk-save" style="display:block">You would save ' + inr(t.promo) + '</small>' : '') + (reason ? '<small class="rk-cp-reason">' + esc(reason) + '</small>' : '') + '</div>' +
        '<div class="rk-cp-act"><button class="rk-btn sec" data-k="cp-copy" data-code="' + esc(code) + '"><span class="material-symbols-outlined" style="font-size:16px">content_copy</span>Copy</button>' +
        (isOn ? '<button class="rk-btn pri" disabled><span class="material-symbols-outlined" style="font-size:16px">check</span>Applied</button>' : '<button class="rk-btn pri" data-act="coupon-apply" data-code="' + esc(code) + '"' + (elig ? '' : ' disabled') + '>Apply</button>') + '</div></li>';
    }).join('');
    root.innerHTML = '<button type="button" class="rk-dd-btn" data-k="dd-toggle" aria-expanded="' + ddOpen + '" aria-controls="rk-dd-panel"><span><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:6px">sell</span>Available coupons <b>(' + codes.length + ')</b></span><span class="material-symbols-outlined rk-dd-chev">expand_more</span></button>' +
      '<div class="rk-dd-panel" id="rk-dd-panel"' + (ddOpen ? '' : ' hidden') + '><ul>' + rows + '</ul></div>';
    root.classList.toggle('open', ddOpen);
  }
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    return new Promise(function (res, rej) { var a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); res(); } catch (e) { rej(e); } a.remove(); });
  }
  function cartSpec(p, t, extra) {
    return Object.assign({ id: p.id, name: p.name, short: p.name, desc: (p.desc || '').slice(0, 110), room: p.dept, img: img(p, 0) || PH, base12: Math.round(p.price * cityMult()), tenure: t, qty: 1,
      chips: [['local_shipping', 'Free Delivery'], ['build', 'Free Assembly']] }, extra || {});
  }

  /* ---------- smart combo engine ---------- */
  var test = {
    bedS: function (p) { return p.cat === 'Single Beds'; }, bedD: function (p) { return p.cat === 'Double Beds'; },
    mattress: function (p) { return p.cat === 'Mattresses'; }, wardrobe: function (p) { return p.cat === 'Wardrobes'; },
    desk: function (p) { return p.cat === 'Tables & Chairs' && /Study Table/.test(p.name); }, chair: function (p) { return p.cat === 'Tables & Chairs' && /Chair/.test(p.name); },
    laptop: function (p) { return /Laptop Table/.test(p.name); }, side: function (p) { return /Side Table/.test(p.name); }, dressing: function (p) { return /Dressing/.test(p.name); },
    shelf: function (p) { return p.cat === 'Bookshelves'; }, sofa: function (p) { return p.cat === 'Sofas'; }, center: function (p) { return p.cat === 'Center Tables'; },
    tvunit: function (p) { return p.cat === 'TV Units'; }, tv: function (p) { return p.cat === 'Televisions'; }, bean: function (p) { return p.cat === 'Bean Bags'; },
    fridge: function (p) { return p.cat === 'Refrigerators'; }, washer: function (p) { return p.cat === 'Washing Machines'; }, micro: function (p) { return p.cat === 'Microwaves'; },
    ro: function (p) { return p.cat === 'Water Purifiers'; }, purifier: function (p) { return p.cat === 'Air Purifiers'; }, cooler: function (p) { return p.cat === 'Air Coolers'; },
    heater: function (p) { return p.cat === 'Oil Filled Radiators'; }, dining: function (p) { return p.cat === 'Dining Tables' && /4 Seater/.test(p.name); }
  };
  var SLOTLABEL = { bedS: 'Single bed', bedD: 'Double bed', mattress: 'Mattress', wardrobe: 'Wardrobe', desk: 'Study table', chair: 'Chair', laptop: 'Laptop table', side: 'Side table', dressing: 'Dressing table', shelf: 'Bookshelf', sofa: 'Sofa', center: 'Center table', tvunit: 'TV unit', tv: 'Television', bean: 'Bean bag', fridge: 'Refrigerator', washer: 'Washing machine', micro: 'Microwave', ro: 'Water purifier', purifier: 'Air purifier', cooler: 'Air cooler', heater: 'Room heater', dining: 'Dining table' };
  var SLOTICON = { bedS: 'single_bed', bedD: 'bed', mattress: 'bedtime', wardrobe: 'door_sliding', desk: 'desk', chair: 'chair_alt', laptop: 'laptop', side: 'table_bar', dressing: 'dresser', shelf: 'auto_stories', sofa: 'weekend', center: 'table_restaurant', tvunit: 'tv_gen', tv: 'tv', bean: 'chair', fridge: 'kitchen', washer: 'local_laundry_service', micro: 'microwave', ro: 'water_drop', purifier: 'air', cooler: 'mode_fan', heater: 'heat', dining: 'dining' };
  var TEMPLATES = [
    { id: 'student', name: 'Student Starter', icon: 'school', who: 'Hostel / PG · 1 person', blurb: 'A proper bed with a size-matched mattress, a study corner and a wardrobe.',
      slots: [{ id: 'b', k: 'bedS', req: 1 }, { id: 'm', k: 'mattress', of: 'b', req: 1 }, { id: 'd', k: 'desk', req: 1 }, { id: 'c', k: 'chair', req: 1 }, { id: 'w', k: 'wardrobe' }, { id: 'z', k: 'bean' }] },
    { id: 'wfh', name: 'WFH Power Desk', icon: 'laptop_mac', who: 'Remote work · 1 person', blurb: 'Desk, ergonomic revolving chair and storage for a focused home office.',
      slots: [{ id: 'd', k: 'desk', req: 1 }, { id: 'c', k: 'chair', req: 1 }, { id: 'l', k: 'laptop' }, { id: 's', k: 'shelf' }, { id: 'p', k: 'purifier' }] },
    { id: 'couple', name: "Couple's Bedroom", icon: 'bedroom_parent', who: 'Master bedroom · 2 people', blurb: 'Double bed with a matching mattress, wardrobe, dressing table and two side tables.',
      slots: [{ id: 'b', k: 'bedD', req: 1 }, { id: 'm', k: 'mattress', of: 'b', req: 1 }, { id: 'w', k: 'wardrobe', req: 1 }, { id: 'd', k: 'dressing' }, { id: 's', k: 'side', qty: 2 }] },
    { id: 'living', name: 'Living Room Lounge', icon: 'weekend', who: 'Living room · 2 to 4 people', blurb: 'Sofa, center table, TV and a TV unit to make the room feel like home.',
      slots: [{ id: 's', k: 'sofa', req: 1 }, { id: 'c', k: 'center', req: 1 }, { id: 'u', k: 'tvunit' }, { id: 't', k: 'tv' }, { id: 'z', k: 'bean' }] },
    { id: 'kitchen', name: 'Kitchen & Laundry', icon: 'kitchen', who: 'Any home', blurb: 'The appliances every move-in needs: fridge, washer, microwave and clean water.',
      slots: [{ id: 'f', k: 'fridge', req: 1 }, { id: 'w', k: 'washer', req: 1 }, { id: 'm', k: 'micro' }, { id: 'r', k: 'ro' }] },
    { id: 'comfort', name: 'All-Season Comfort', icon: 'thermostat', who: 'Any room', blurb: 'An air cooler for summer and an oil-filled radiator for winter, with an air purifier when in stock.',
      slots: [{ id: 'c', k: 'cooler', req: 1 }, { id: 'h', k: 'heater', req: 1 }, { id: 'p', k: 'purifier' }] },
    { id: '1bhk', name: '1BHK Move-in Kit', icon: 'home', who: '1BHK · 2 people', blurb: 'Bedroom, living room and kitchen basics in one bundle.',
      slots: [{ id: 'b', k: 'bedD', req: 1 }, { id: 'm', k: 'mattress', of: 'b', req: 1 }, { id: 'w', k: 'wardrobe', req: 1 }, { id: 's', k: 'sofa', req: 1 }, { id: 'f', k: 'fridge', req: 1 }, { id: 'x', k: 'washer', req: 1 }, { id: 'c', k: 'center' }, { id: 't', k: 'tv' }, { id: 'r', k: 'ro' }] },
    { id: '3bhk', name: '3BHK Premium Home', icon: 'villa', who: '3BHK · family of 5', blurb: 'Three bedrooms plus living, dining and a full kitchen setup.',
      slots: [{ id: 'b1', k: 'bedD', req: 1 }, { id: 'm1', k: 'mattress', of: 'b1', req: 1 }, { id: 'b2', k: 'bedD', req: 1 }, { id: 'm2', k: 'mattress', of: 'b2', req: 1 }, { id: 'b3', k: 'bedS', req: 1 }, { id: 'm3', k: 'mattress', of: 'b3', req: 1 }, { id: 'w', k: 'wardrobe', req: 1, qty: 3 }, { id: 's', k: 'sofa', req: 1 }, { id: 'f', k: 'fridge', req: 1 }, { id: 'x', k: 'washer', req: 1 }, { id: 'c', k: 'center' }, { id: 'n', k: 'dining' }, { id: 't', k: 'tv' }, { id: 'r', k: 'ro' }, { id: 'o', k: 'micro' }] },
    { id: '2bhk', name: '2BHK Family Home', icon: 'family_home', who: '2BHK · family of 4', blurb: 'Two bedrooms, a living room, dining and a full kitchen setup.',
      slots: [{ id: 'b1', k: 'bedD', req: 1 }, { id: 'm1', k: 'mattress', of: 'b1', req: 1 }, { id: 'b2', k: 'bedS', req: 1 }, { id: 'm2', k: 'mattress', of: 'b2', req: 1 }, { id: 'w', k: 'wardrobe', req: 1, qty: 2 }, { id: 's', k: 'sofa', req: 1 }, { id: 'f', k: 'fridge', req: 1 }, { id: 'x', k: 'washer', req: 1 }, { id: 'c', k: 'center' }, { id: 'n', k: 'dining' }, { id: 't', k: 'tv' }, { id: 'r', k: 'ro' }, { id: 'o', k: 'micro' }] }
  ];
  TEMPLATES.sort(function (a, b) { var o = ['student', 'wfh', 'couple', 'living', 'kitchen', 'comfort', '1bhk', '2bhk', '3bhk']; return o.indexOf(a.id) - o.indexOf(b.id); });
  var TBYID = {}; TEMPLATES.forEach(function (t) { TBYID[t.id] = t; });
  var bundlePct = function (n) { return n < 2 ? 0 : Math.min(15, 3 + 2 * (n - 2)); }; // % off monthly rent by distinct items
  var BUNDLE_ROWS = [[2, 3], [3, 5], [4, 7], [5, 9], [6, 11], [7, 13], [8, 15]];

  function pool(slot, sel) {
    var l = P.filter(function (p) { return avail(p) && test[slot.k](p); });
    if (slot.size) { var hm = l.filter(function (p) { return p.size === slot.size; }); if (hm.length) l = hm; }
    if (slot.of && sel[slot.of]) { var sz = sel[slot.of].size, m = l.filter(function (p) { return p.size === sz; }); if (m.length) l = m; }
    return l.sort(function (a, b) { return a.price - b.price || adj(b) - adj(a); });
  }
  function pickTier(l, tier) {
    if (!l.length) return null;
    if (tier === 'value') return l.reduce(function (b, p) { return adj(p) / Math.sqrt(p.price) > adj(b) / Math.sqrt(b.price) ? p : b; }, l[0]);
    if (tier === 'premium') return l.reduce(function (b, p) { return adj(p) >= adj(b) ? p : b; }, l[0]);
    var half = l.slice(0, Math.ceil(l.length / 2));
    return half.reduce(function (b, p) { return adj(p) > adj(b) ? p : b; }, half[0]);
  }
  function lines(tpl, sel) {
    var out = []; tpl.slots.forEach(function (s) { if (sel[s.id]) out.push({ slot: s, p: sel[s.id], qty: s.qty || 1 }); }); return out;
  }
  function price(items, t) {
    var sub = 0, n = items.length, pct = bundlePct(n), fin = 0, rat = 0, rc = 0;
    items.forEach(function (i) { sub += rent(i.p, t) * i.qty; fin += Math.round(i.p.price * cityMult() * (RATIO[t] || 1) * (1 - pct / 100)) * i.qty; if (i.p.rating) { rat += i.p.rating; rc++; } });
    return { sub: sub, pct: pct, fin: fin, save: sub - fin, rating: rc ? rat / rc : null, n: n, units: items.reduce(function (a, i) { return a + i.qty; }, 0) };
  }
  function composeTier(tpl, tier) {
    var sel = {}; tpl.slots.forEach(function (s) { var l = pool(s, sel); var p = pickTier(l, tier); if (p) sel[s.id] = p; }); return sel;
  }
  function composeBudget(tpl, budget, t) { // essentials -> optional extras -> quality upgrades, all within budget
    var sel = {}, cost = function () { return price(lines(tpl, sel), t).fin; };
    tpl.slots.filter(function (s) { return s.req; }).forEach(function (s) { var p = pickTier(pool(s, sel), 'value'); if (p) sel[s.id] = p; });
    var over = cost() > budget;
    if (!over) {
      tpl.slots.filter(function (s) { return !s.req; }).forEach(function (s) {
        var p = pickTier(pool(s, sel), 'value'); if (!p) return; sel[s.id] = p; if (cost() > budget) delete sel[s.id];
      });
      for (var guard = 0; guard < 60; guard++) {
        var best = null;
        tpl.slots.forEach(function (s) {
          if (!sel[s.id]) return;
          pool(s, s.of ? {} : sel).forEach(function (alt) {
            var cur = sel[s.id]; if (alt.id === cur.id || adj(alt) <= adj(cur) + 1e-9) return;
            if ((s.k === 'bedS' || s.k === 'bedD') && alt.size !== cur.size) return; // keep the matched mattress valid
            if (s.of && sel[s.of] && alt.size !== sel[s.of].size) return;
            var old = sel[s.id]; sel[s.id] = alt; var c = cost(); sel[s.id] = old;
            if (c > budget) return;
            var dp = c - cost(), gain = (adj(alt) - adj(cur)) / Math.max(dp, 1);
            if (!best || gain > best.gain) best = { s: s, alt: alt, gain: gain };
          });
        });
        if (!best) break; sel[best.s.id] = best.alt;
      }
    }
    return { sel: sel, over: over };
  }
  // curated combos (cached per tier)
  var CUR = {}; TEMPLATES.forEach(function (t) { CUR[t.id] = {}; ['value', 'balanced', 'premium'].forEach(function (tier) { CUR[t.id][tier] = composeTier(t, tier); }); });
  function combosContaining(pid) {
    return TEMPLATES.filter(function (t) { return ['value', 'balanced', 'premium'].some(function (tier) { return Object.keys(CUR[t.id][tier]).some(function (k) { return CUR[t.id][tier][k].id === pid; }); }); });
  }
  var comboTier = {}, comboTenure = 12;
  var B = { tpl: 'student', budget: 0, tenure: 12, sel: {}, over: false, auto: true };

  function addCombo(title, items, t) {
    var pct = price(items, t).pct;
    items.forEach(function (i) { RK.addItem(cartSpec(i.p, t, { qty: i.qty, disc: pct / 100, desc: 'Combo: ' + title + ' · ' + pct + '% bundle saving', room: title, chips: [['percent', pct + '% Combo Saving'], ['local_shipping', 'Free Delivery']] }), { silent: true }); });
    toast(title + ' added to your cart (' + items.length + ' items).'); RK.show('cart');
  }
  function stripHTML(items) {
    return '<div class="strip">' + items.slice(0, 6).map(function (i) { return '<div title="' + esc(i.p.name) + '">' + media(i.p, 0) + '</div>'; }).join('') + '</div>';
  }
  function comboCard(tpl) {
    var tier = comboTier[tpl.id] || 'balanced', items = lines(tpl, CUR[tpl.id][tier]), pr = price(items, comboTenure);
    return '<div class="rk-combo"><div style="display:flex;justify-content:space-between;align-items:start;gap:8px"><div><div style="display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="color:#001831">' + tpl.icon + '</span><h3 class="font-headline-sm text-headline-sm" style="color:#001831;font-weight:700">' + esc(tpl.name) + '</h3></div><div style="font-size:12px;color:#666;margin-top:2px">' + esc(tpl.who) + '</div></div><span class="rk-tag g">' + pr.pct + '% OFF</span></div>' +
      '<p style="font-size:13px;color:#555">' + esc(tpl.blurb) + '</p>' + stripHTML(items) +
      '<div class="rk-chiprow">' + ['value', 'balanced', 'premium'].map(function (t) { return '<button class="rk-chip' + (t === tier ? ' on' : '') + '" data-k="ctier" data-id="' + tpl.id + '" data-v="' + t + '">' + t[0].toUpperCase() + t.slice(1) + '</button>'; }).join('') + '</div>' +
      '<ul>' + items.map(function (i) { return '<li><span>' + (i.qty > 1 ? i.qty + '× ' : '') + esc(i.p.name) + '</span><span>' + inr(rent(i.p, comboTenure) * i.qty) + '</span></li>'; }).join('') + '</ul>' +
      '<div style="border-top:1px solid #e8e4de;padding-top:10px;display:flex;justify-content:space-between;align-items:end"><div><s style="color:#888;font-size:13px">' + inr(pr.sub) + '/mo</s><div><b style="font-size:28px;color:#001831">' + inr(pr.fin) + '</b><small style="color:#666">/mo</small></div><div class="rk-save" style="font-size:12px">Save ' + inr(pr.save) + '/mo · ' + inr(pr.save * comboTenure) + ' over ' + comboTenure + ' months</div></div>' +
      '<div style="text-align:right;font-size:12px;color:#666">' + (pr.rating ? '★ ' + pr.rating.toFixed(1) + ' avg<br>' : '') + 'Deposit ' + inr(pr.fin) + '</div></div>' +
      '<div class="rk-btns"><button class="rk-btn sec" data-k="customize" data-id="' + tpl.id + '">Customize</button><button class="rk-btn red" data-k="addcombo" data-id="' + tpl.id + '">Add combo</button></div></div>';
  }
  function initBuilder(tplId, keepBudget) {
    var tpl = TBYID[tplId]; B.tpl = tplId;
    var bal = price(lines(tpl, CUR[tplId].balanced), B.tenure).fin;
    if (!keepBudget || !B.budget) B.budget = Math.max(300, Math.round(bal / 100) * 100);
    runBuilder();
  }
  function runBuilder() { var r = composeBudget(TBYID[B.tpl], B.budget, B.tenure); B.sel = r.sel; B.over = r.over; }
  function renderBuilder() {
    var tpl = TBYID[B.tpl], items = lines(tpl, B.sel), pr = price(items, B.tenure);
    var maxB = Math.ceil(price(lines(tpl, CUR[tpl.id].premium), B.tenure).fin / 500) * 500 + 1000;
    var note = B.over ? '<div class="rk-note warn">The essentials alone come to ' + inr(pr.fin) + '/mo, which is above your ' + inr(B.budget) + ' budget. Increase the budget or pick a longer tenure for a lower rate.</div>'
      : pr.fin > B.budget ? '<div class="rk-note warn">After your swaps, this is ' + inr(pr.fin - B.budget) + '/mo over budget.</div>'
      : '<div class="rk-note ok">Fits your budget with ' + inr(B.budget - pr.fin) + '/mo to spare. The engine used the leftover to add extras and upgrade to better-rated models where it could.</div>';
    var rows = items.map(function (i) {
      var alts = pool(i.slot, B.sel);
      return '<div class="rk-line"><div class="th">' + media(i.p, 0) + '</div><div class="nm"><b>' + (i.qty > 1 ? i.qty + '× ' : '') + esc(i.p.name) + '</b><small>' + esc(SLOTLABEL[i.slot.k]) + (i.p.rating ? ' · ★ ' + i.p.rating.toFixed(1) : '') + '</small></div><div class="pr">' + inr(rent(i.p, B.tenure) * i.qty) + '</div>' +
        (alts.length > 1 ? '<div class="rk-swap"><button title="Previous option" data-k="swap" data-s="' + i.slot.id + '" data-d="-1"><span class="material-symbols-outlined">chevron_left</span></button><button title="Next option" data-k="swap" data-s="' + i.slot.id + '" data-d="1"><span class="material-symbols-outlined">chevron_right</span></button></div>' : '') + '</div>';
    }).join('');
    var skipped = tpl.slots.filter(function (s) { return !B.sel[s.id] && !s.req && pool(s, B.sel).length; });
    var extras = skipped.length ? '<div style="margin-top:10px;font-size:13px;color:#666">Not affordable at this budget: ' + skipped.map(function (s) { return '<button class="rk-chip" data-k="addslot" data-s="' + s.id + '">+ ' + SLOTLABEL[s.k] + '</button>'; }).join(' ') + '</div>' : '';
    return '<div class="rk-panel"><div class="rk-builder"><div><div class="rk-lbl" style="margin-top:0">1 · What are you setting up?</div><div class="rk-chiprow">' +
      (TBYID.plan ? [TBYID.plan] : []).concat(TEMPLATES).map(function (t) { return '<button class="rk-chip' + (t.id === B.tpl ? ' on' : '') + '" data-k="btpl" data-id="' + t.id + '">' + esc(t.name) + '</button>'; }).join('') + '</div>' +
      '<div class="rk-lbl">2 · Monthly budget: <span style="color:#001831;font-size:15px;text-transform:none;letter-spacing:0" id="rk-bud-lbl">' + inr(B.budget) + '</span></div><input class="rk-range" id="rk-bud" type="range" min="300" max="' + maxB + '" step="100" value="' + B.budget + '">' +
      '<div class="rk-lbl">3 · Lease length</div><div class="rk-chiprow">' + TENURES.slice().reverse().map(function (m) { return '<button class="rk-chip' + (B.tenure === m ? ' on' : '') + '" data-k="btenure" data-v="' + m + '">' + m + ' months</button>'; }).join('') + '</div>' + note +
      '<div class="rk-lbl">Your combo</div>' + (rows || '<div class="rk-empty">Nothing in stock for this setup right now.</div>') + extras + '</div>' +
      '<div class="rk-sum"><div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#666">' + esc(tpl.name) + '</div><div class="big">' + inr(pr.fin) + '<small style="font-size:14px;font-weight:400;color:#666">/mo</small></div>' +
      '<div class="row"><span>Items (' + pr.units + ')</span><span>' + inr(pr.sub) + '</span></div><div class="row rk-save"><span>Smart bundle saving (' + pr.pct + '%)</span><span>− ' + inr(pr.save) + '</span></div><div class="row"><span>Refundable deposit (1× rent)</span><span>' + inr(pr.fin) + '</span></div>' +
      (pr.rating ? '<div class="row"><span>Average rating</span><span>★ ' + pr.rating.toFixed(1) + '</span></div>' : '') + '<div class="row" style="border-top:1px solid #ddd;margin-top:6px;padding-top:8px"><span>Saved over ' + B.tenure + ' months</span><span class="rk-save">' + inr(pr.save * B.tenure) + '</span></div>' +
      '<button class="rk-btn red lg" style="width:100%;margin-top:14px" data-k="addbuilder"' + (items.length ? '' : ' disabled') + '>Add this combo to cart</button></div></div></div>';
  }
  function renderCombos() {
    var root = $('#rk-combo-root'); if (!root) return;
    if (!Object.keys(B.sel).length) initBuilder(B.tpl, false);
    var h = '<div class="rk-hero"><span class="rk-tag">SMART COMBOS</span><h1 style="margin-top:10px">Bundles that are priced, matched and ranked for you</h1><p>Every combo below is computed live from the ' + P.length + '-product catalogue: real rents, real ratings, size-matched mattresses and a bundle saving that grows with every item you add.</p>' +
      '<div class="rk-how"><div class="rk-how-card"><b>1 · Compatibility first</b><p>A mattress is only ever paired with a bed of the same size (6×3, 6×4, 6×5 or 6×6 ft). Out-of-stock and unpriced items are never bundled.</p></div>' +
      '<div class="rk-how-card"><b>2 · Three ways to pick</b><p>Value = best rating per √₹. Balanced = top-rated in the cheaper half. Premium = top-rated overall. Ratings are adjusted for how many reviews back them.</p></div>' +
      '<div class="rk-how-card"><b>3 · Bundle saving</b><p>The more items you add, the bigger the saving on your monthly rent:</p><ul class="rk-how-tiers">' + BUNDLE_ROWS.map(function (r) { return '<li><b>' + r[0] + (r[0] === 8 ? '+' : '') + ' items</b> ' + r[1] + '% off</li>'; }).join('') + '</ul></div></div></div>' +
      '<h2 class="rk-sec-title">Smart Combo Builder</h2><p style="color:#555;margin:-6px 0 14px;font-size:14px">Tell us the setup and your budget. We add the essentials, then extras, then upgrade to better-rated models with whatever is left.</p><div id="rk-builder">' + renderBuilder() + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:end;flex-wrap:wrap;gap:10px"><h2 class="rk-sec-title">Ready-made combos</h2><div class="rk-chiprow" style="margin-bottom:-6px">' + TENURES.slice().reverse().map(function (m) { return '<button class="rk-chip' + (comboTenure === m ? ' on' : '') + '" data-k="ctenure" data-v="' + m + '">' + m + ' Mo</button>'; }).join('') + '</div></div>' +
      '<div class="rk-combos" id="rk-combos-grid">' + TEMPLATES.map(comboCard).join('') + '</div>' +
      '<p style="font-size:12px;color:#777;margin-top:24px">Rents are the monthly prices shown on rentickle.com when the data was captured (5 Nov 2026), treated here as the 12-month rate; shorter tenures use the site\'s tenure multipliers. Bundle savings are an illustrative offer model.</p>';
    root.innerHTML = h; document.title = 'Smart Combos · Rentickle';
  }
  function refreshBuilder() { var b = $('#rk-builder'); if (b) b.innerHTML = renderBuilder(); }
  function refreshCombos() { var g = $('#rk-combos-grid'); if (g) g.innerHTML = TEMPLATES.map(comboCard).join(''); }

  /* ---------- home ---------- */
  /* ---------- Move-in planner: flip card ---------- */
  var BHK = [[1, '1 BHK'], [2, '2 BHK'], [3, '3 BHK'], [4, '4+ BHK']];
  var FAM = [['solo', 'Solo', 'person'], ['couple', 'Couple', 'favorite'], ['flatmates', 'Flatmates', 'group'], ['family', 'Family', 'family_restroom']];
  var OWN = [['bed', 'Bed'], ['mattress', 'Mattress'], ['wardrobe', 'Wardrobe'], ['sofa', 'Sofa'], ['center', 'Center table'], ['tvunit', 'TV unit'], ['tv', 'Television'], ['dining', 'Dining table'], ['study', 'Study table'], ['chair', 'Chair'], ['fridge', 'Refrigerator'], ['washer', 'Washing machine'], ['micro', 'Microwave'], ['ro', 'Water purifier']];
  var OWNKIND = { bedS: 'bed', bedD: 'bed', mattress: 'mattress', wardrobe: 'wardrobe', sofa: 'sofa', center: 'center', tvunit: 'tvunit', tv: 'tv', dining: 'dining', desk: 'study', laptop: 'study', chair: 'chair', fridge: 'fridge', washer: 'washer', micro: 'micro', ro: 'ro' };
  var PL = { bhk: 2, fam: 'couple', budget: 0, touched: false, own: {}, face: 'front', view: 'ask', res: null };
  var bhkLabel = function (n) { return n >= 4 ? '4+ BHK' : n + ' BHK'; };
  var famLabel = function (f) { return FAM.filter(function (x) { return x[0] === f; })[0][1]; };
  function buildPlan(bhk, fam) {
    var rooms = Math.min(bhk, 4), n = 0, slots = [], beds = 0, i;
    var nid = function () { return 'p' + (++n); };
    function bed(kind) { var b = nid(); slots.push({ id: b, k: kind, req: 1 }, { id: nid(), k: 'mattress', of: b, req: 1 }); beds++; }
    if (fam === 'solo') bed('bedS');
    else if (fam === 'couple') bed('bedD');
    else if (fam === 'flatmates') { var cnt = rooms === 1 ? 2 : rooms; for (i = 0; i < cnt; i++) bed('bedS'); }
    else { bed('bedD'); for (i = 1; i < rooms; i++) bed('bedS'); }
    slots.push({ id: nid(), k: 'wardrobe', req: 1, qty: Math.min(beds, 4) });
    var study = rooms >= 2 || fam === 'flatmates';
    slots.push({ id: nid(), k: 'desk', req: study ? 1 : 0 }, { id: nid(), k: 'chair', req: study ? 1 : 0 });
    slots.push({ id: nid(), k: 'sofa', req: (rooms === 1 && fam === 'solo') ? 0 : 1 }, { id: nid(), k: 'center' }, { id: nid(), k: 'tvunit' }, { id: nid(), k: 'tv' });
    if (fam === 'solo' || fam === 'flatmates') slots.push({ id: nid(), k: 'bean' });
    if (rooms >= 2 || fam === 'family') slots.push({ id: nid(), k: 'dining' });
    slots.push({ id: nid(), k: 'fridge', req: 1 }, { id: nid(), k: 'washer', req: 1 }, { id: nid(), k: 'micro' }, { id: nid(), k: 'ro' });
    return { id: 'plan', name: bhkLabel(bhk) + ' · ' + famLabel(fam), icon: 'home', who: bhkLabel(bhk) + ' · ' + famLabel(fam), blurb: 'Built from your answers.', slots: slots };
  }
  function applyOwn(tpl, own) { // each item the visitor already owns removes ONE unit of that item from the bundle
    var slots = tpl.slots.map(function (x) { return Object.assign({}, x); });
    Object.keys(own).forEach(function (key) {
      if (!own[key]) return;
      for (var i = 0; i < slots.length; i++) {
        var sl = slots[i]; if (OWNKIND[sl.k] !== key) continue;
        if ((sl.qty || 1) > 1) sl.qty--;
        else { slots.splice(i, 1); slots.forEach(function (m) { if (m.of === sl.id) { m.of = null; m.size = sl.k === 'bedD' ? '6x5' : '6x3'; } }); }
        break;
      }
    });
    return Object.assign({}, tpl, { slots: slots });
  }
  function planTpl(withOwn) { var t = buildPlan(PL.bhk, PL.fam); return withOwn ? applyOwn(t, PL.own) : t; }
  function planDefault() { var t = planTpl(false); return Math.max(500, Math.round(price(lines(t, composeTier(t, 'balanced')), 12).fin / 250) * 250); }
  function planBounds() { var t = planTpl(false); return { min: 500, max: Math.ceil(price(lines(t, composeTier(t, 'premium')), 12).fin / 250) * 250 + 1000 }; }
  function planCompute() {
    var t = planTpl(true), r = { tpl: t, budget: PL.budget };
    if (!t.slots.length) { r.state = 'complete'; return r; }
    var c = composeBudget(t, PL.budget, 12); r.sel = c.sel; r.over = c.over; r.items = lines(t, c.sel); r.pr = price(r.items, 12);
    r.state = !r.items.length ? 'nostock' : c.over ? 'low' : 'ok'; return r;
  }
  var ownedNames = function () { return OWN.filter(function (o) { return PL.own[o[0]]; }).map(function (o) { return o[1]; }); };
  function frontHTML() {
    var bd = planBounds();
    return '<div class="rk-fc-head"><h3><span class="material-symbols-outlined rk-d-only">tune</span><span class="rk-fc-ic rk-m-only"><span class="material-symbols-outlined">explore</span></span><span class="rk-fc-tt">Move-in Planner<small class="rk-m-only">Curated combo generator</small></span></h3><span class="rk-stepno">Step 1 of 2</span></div>' +
      '<div class="rk-lbl" id="rk-l-bhk">Space size</div><div class="rk-hr-chips c4" role="radiogroup" aria-labelledby="rk-l-bhk">' + BHK.map(function (b) { return '<button class="rk-hr-chip' + (PL.bhk === b[0] ? ' on' : '') + '" role="radio" aria-checked="' + (PL.bhk === b[0]) + '" data-k="pl-bhk" data-v="' + b[0] + '">' + b[1] + '</button>'; }).join('') + '</div>' +
      '<div class="rk-lbl" id="rk-l-fam"><span class="rk-d-only">Family size</span><span class="rk-m-only">Who\u2019s moving in?</span></div><div class="rk-hr-chips c4" role="radiogroup" aria-labelledby="rk-l-fam">' + FAM.map(function (f) { return '<button class="rk-hr-chip fam' + (PL.fam === f[0] ? ' on' : '') + '" role="radio" aria-checked="' + (PL.fam === f[0]) + '" data-k="pl-fam" data-v="' + f[0] + '"><span class="material-symbols-outlined">' + f[2] + '</span>' + f[1] + '</button>'; }).join('') + '</div>' +
      '<div class="rk-lbl" style="display:flex;justify-content:space-between;align-items:baseline"><span>Monthly budget</span><b id="rk-hr-bud" class="rk-bud">' + inr(PL.budget) + ' / mo</b></div>' +
      '<div class="rk-hr-stepper"><button data-k="pl-minus" aria-label="Decrease budget">\u2212</button><span class="rk-rl rk-m-only">' + inr(bd.min) + '</span><input type="range" id="rk-hr-range" aria-label="Monthly budget" min="' + bd.min + '" max="' + bd.max + '" step="250" value="' + PL.budget + '"><span class="rk-rl rk-m-only">' + inr(bd.max) + '</span><button data-k="pl-plus" aria-label="Increase budget">+</button></div>' +
      '<button class="rk-btn red lg rk-fc-cta" data-k="pl-next"><span class="rk-d-only">Next</span><span class="rk-m-only">Explore Recommended Packages</span><span class="material-symbols-outlined" style="font-size:18px">arrow_forward</span></button>';
  }
  function askHTML() {
    var none = !Object.keys(PL.own).some(function (k) { return PL.own[k]; });
    return '<div class="rk-fc-head"><h3 tabindex="-1" id="rk-back-h">What furniture do you already have?</h3><span class="rk-stepno">Step 2 of 2</span></div>' +
      '<p class="rk-fc-hint">Each item you pick is taken out of your bundle, so you only pay for what you still need.</p>' +
      '<div class="rk-own" role="group" aria-label="Furniture you already own">' + OWN.map(function (o) { var on = !!PL.own[o[0]]; return '<button class="rk-own-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-k="pl-own" data-v="' + o[0] + '">' + (on ? '<span class="material-symbols-outlined">check</span>' : '') + o[1] + '</button>'; }).join('') +
      '<button class="rk-own-chip none' + (none ? ' on' : '') + '" aria-pressed="' + none + '" data-k="pl-none">' + (none ? '<span class="material-symbols-outlined">check</span>' : '') + 'None</button></div>' +
      '<div class="rk-fc-btns"><button class="rk-btn sec lg" data-k="pl-back"><span class="material-symbols-outlined" style="font-size:18px">arrow_back</span>Back</button><button class="rk-btn red lg" data-k="pl-submit">Submit</button></div>';
  }
  function resultHTML() {
    var r = PL.res, head = '<div class="rk-fc-head"><h3 tabindex="-1" id="rk-back-h">Your move-in plan</h3><button class="rk-link" data-k="pl-edit">Edit answers</button></div>' +
      '<div class="rk-res-sum">' + bhkLabel(PL.bhk) + ' · ' + famLabel(PL.fam) + ' · budget ' + inr(PL.budget) + '/mo</div>';
    var own = ownedNames(), ownLine = own.length ? '<div class="rk-own-line"><span class="material-symbols-outlined">inventory_2</span>You already have: ' + esc(own.join(', ')) + '</div>' : '';
    var change = '<button class="rk-link" data-k="pl-furn">Change furniture</button>';
    if (r.state === 'complete') return head + '<div class="rk-empty-card"><span class="material-symbols-outlined">task_alt</span><b>You already have everything in this bundle.</b><p>Nothing left to rent for this setup. You can still browse the catalogue for extras.</p><button class="rk-btn pri" data-k="cat-go" data-v="all">Browse all products</button></div>' + ownLine + change;
    if (r.state === 'nostock') return head + '<div class="rk-empty-card"><span class="material-symbols-outlined">inventory</span><b>Those items are out of stock right now.</b><p>Call 1800-270-1950 and we will check availability for you.</p></div>' + change;
    if (r.state === 'low') {
      var need = Math.ceil(r.pr.fin / 250) * 250;
      return head + '<div class="rk-empty-card warn"><span class="material-symbols-outlined">savings</span><b>' + inr(PL.budget) + '/mo is below the cheapest set of essentials.</b><p>For this setup the essentials start at ' + inr(r.pr.fin) + '/mo. Raise your budget or tell us about more items you already own.</p><button class="rk-btn pri" data-k="pl-raise" data-v="' + need + '">Use ' + inr(need) + '/mo</button></div>' + ownLine + change;
    }
    var thumbs = r.items.slice(0, 7).map(function (i) { return '<div class="th" title="' + esc(i.p.name) + '">' + media(i.p, 0) + '</div>'; }).join('') + (r.items.length > 7 ? '<div class="th more">+' + (r.items.length - 7) + '</div>' : '');
    return head + '<div class="rk-hr-result"><div class="rk-hr-top"><span class="rk-hr-badge"><span class="material-symbols-outlined">check_circle</span>Optimal match</span><div class="rk-hr-price"><b>' + inr(r.pr.fin) + '</b><small>/mo</small></div></div>' +
      '<h4 class="rk-hr-name">What you still need <span>· ' + r.pr.units + ' items</span></h4><div class="rk-hr-msg"><span class="rk-save">Saves ' + inr(r.pr.save) + '/mo · ' + r.pr.pct + '% bundle discount</span></div><div class="rk-hr-thumbs">' + thumbs + '</div></div>' + ownLine +
      '<button class="rk-btn red lg rk-fc-cta" data-k="pl-open">See and edit this combo<span class="material-symbols-outlined" style="font-size:18px">arrow_forward</span></button>' + change;
  }
  function fitFlip() {
    var inner = $('.rk-flip-inner'); if (!inner) return;
    if (window.innerWidth > 767) { inner.style.height = ''; return; }
    var face = $(PL.face === 'back' ? '#rk-face-back' : '#rk-face-front'); if (face) inner.style.height = face.offsetHeight + 'px';
  }
  window.addEventListener('resize', fitFlip);
  function paintFront() { var f = $('#rk-face-front'); if (f) f.innerHTML = frontHTML(); fitFlip(); }
  function paintBack() { var b = $('#rk-face-back'); if (b) b.innerHTML = PL.view === 'result' ? resultHTML() : askHTML(); fitFlip(); }
  function flipTo(face) {
    PL.face = face; var fl = $('#rk-flip'); if (!fl) return; fl.classList.toggle('flipped', face === 'back'); fitFlip();
    var f = $('#rk-face-front'), b = $('#rk-face-back'); f.inert = face === 'back'; b.inert = face === 'front'; f.setAttribute('aria-hidden', face === 'back'); b.setAttribute('aria-hidden', face === 'front');
    setTimeout(function () { var t = face === 'back' ? $('#rk-back-h') : $('#rk-face-front .rk-hr-chip.on'); if (t) t.focus({ preventScroll: true }); }, reduce ? 0 : 450);
  }
  function renderHero() {
    var h = $('#rk-hero'); if (!h || h.dataset.done) return; h.dataset.done = 1;
    if (!PL.budget) PL.budget = planDefault();
    h.innerHTML = '<div class="rk-hero2-l"><span class="rk-hr-pill"><span class="material-symbols-outlined">bolt</span>Zero lock-in <span class="rk-m-only">\u2022</span><span class="rk-d-only">\u00b7</span> <span data-loc="hub">Gurgaon Hub</span></span>' +
      '<h1 class="rk-hr-h1">Rent the perfect lifestyle. <span>Without the guesswork.</span></h1>' +
      '<p class="rk-hr-p">Furnish your home in 48 hours with pristine, sanitized furniture and appliances. Tell us about your space and budget to see what you need.</p>' +
      '<ul class="rk-hr-perks"><li><span class="material-symbols-outlined">currency_rupee</span>Refundable deposit</li><li><span class="material-symbols-outlined">local_shipping</span>Free delivery &amp; assembly</li><li><span class="material-symbols-outlined">build_circle</span>Zero maintenance fees</li></ul></div>' +
      '<div class="rk-flip' + (PL.face === 'back' ? ' flipped' : '') + '" id="rk-flip"><div class="rk-flip-inner"><div class="rk-face rk-front" id="rk-face-front"></div><div class="rk-face rk-backf" id="rk-face-back"></div></div></div>';
    paintFront(); paintBack();
    var f = $('#rk-face-front'), b = $('#rk-face-back'); f.inert = PL.face === 'back'; b.inert = PL.face === 'front'; setTimeout(fitFlip, 60);
  }
  function planOpenBuilder() {
    var r = PL.res || planCompute(), t = r.tpl; TBYID.plan = t; CUR.plan = {}; ['value', 'balanced', 'premium'].forEach(function (k) { CUR.plan[k] = composeTier(t, k); });
    B.tpl = 'plan'; B.tenure = 12; B.budget = PL.budget; runBuilder(); RK.show('planner', { force: true });
    setTimeout(function () { renderCombos(); var bb = $('#rk-builder'); if (bb) bb.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  }
  var TOPIMG = { 'beds': 'beds', 'wardrobes': 'wardrobes', 'chairs': 'chairs', 'sofas': 'sofas', 'center-tables': 'center-tables', 'washing-machines': 'washing-machines', 'refrigerators': 'refrigerators', 'study-tables': 'study-tables', 'dining-tables': 'dining-tables', 'patio-furniture': 'patio-furniture', 'bookshelves': 'bookshelves', 'appliances': 'appliances' };
  var feat = byId['serenity-luxe-bed-6x6-ash-grey'] || P.filter(function (p) { return p.images.length; })[0];
  function bedFrom() { var l = P.filter(function (p) { return HOMEBY.beds.match(p) && avail(p); }).map(function (p) { return rent(p, 12); }); return l.length ? Math.min.apply(null, l) : 0; }
  function renderTopCats() {
    var c = $('#rk-home-cats'); if (!c || c.dataset.done) return; c.dataset.done = 1;
    c.innerHTML = '<div class="rk-top-head"><h2>Explore <span>our Top Categories</span></h2><i></i><button type="button" class="rk-viewall rk-m-only" data-k="cat-go" data-v="all">View all (' + HOME.length + ')</button></div><div class="rk-cm"><a class="rk-mp" data-k="cat-go" data-v="beds" href="#" aria-label="Most popular: Beds and Mattresses">' +
      '<img src="images/most-popular.webp" alt="A cosy bedroom with a platform bed, soft pink bedding and warm candlelight" width="638" height="480" decoding="async"><span class="rk-mp-badge"><span class="material-symbols-outlined">local_fire_department</span>Most Popular</span>' +
      '<span class="rk-mp-cta"><span class="rk-mp-t"><b>Beds &amp; Mattresses</b><small class="rk-mp-sub">Starting at ' + inr(bedFrom()) + '/mo \u2022 Free sanitized setup</small></span><span class="rk-mp-go">Shop now<span class="material-symbols-outlined">arrow_forward</span></span></span></a>' +
      '<div class="rk-top-grid">' + HOME.map(function (h) { return '<button class="rk-tile" data-k="cat-go" data-v="' + h.key + '"><span class="rk-tile-ico rk-m-only"><span class="material-symbols-outlined">' + h.icon + '</span></span><span class="rk-tile-stage"><img src="images/categories/' + TOPIMG[h.key] + '.webp" alt="" width="280" height="230" loading="lazy" decoding="async" data-icon="' + h.icon + '" onerror="rkImgFail(this)"></span><span class="rk-tile-name">' + esc(h.label) + '</span></button>'; }).join('') + '</div></div>';
  }
  /* auto-sliding carousel of top-rated picks */
  var car = { timer: null, paused: false, userPaused: false, n: 0 };
  function renderFeatured() {
    var f = $('#rk-home-featured'); if (!f || f.dataset.done) return; f.dataset.done = 1;
    var seen = {}, top = P.filter(function (p) { return avail(p) && p.rating && p.reviews && p.images.length; }).sort(function (a, b) { return adj(b) - adj(a); }).filter(function (p) { var k = homeKeyOf(p); if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 10);
    car.n = top.length;
    var slides = top.map(function (p) { return '<div class="rk-slide">' + cardHTML(p, 12) + '</div>'; });
    var clones = top.slice(0, 4).map(function (p) { return '<div class="rk-slide" aria-hidden="true" data-clone="1">' + cardHTML(p, 12) + '</div>'; });
    f.innerHTML = '<div class="rk-car" role="region" aria-roledescription="carousel" aria-label="Top-rated picks"><div class="rk-car-head"><div><span class="rk-eyebrow">Customer favourites</span><h2 class="rk-h2">Top-rated picks, ready to rent</h2></div>' +
      '<div class="rk-car-ctl"><button class="rk-car-btn" data-k="car-prev" aria-label="Previous"><span class="material-symbols-outlined">chevron_left</span></button><button class="rk-car-btn" data-k="car-pp" aria-label="Pause auto-slide" id="rk-car-pp"><span class="material-symbols-outlined">pause</span></button><button class="rk-car-btn" data-k="car-next" aria-label="Next"><span class="material-symbols-outlined">chevron_right</span></button></div></div>' +
      '<div class="rk-car-track" id="rk-car-track" tabindex="0" aria-live="off">' + slides.join('') + clones.join('') + '</div><div class="rk-car-dots" id="rk-car-dots">' + top.map(function (p, i) { return '<button data-k="car-dot" data-i="' + i + '" aria-label="Go to slide ' + (i + 1) + '"></button>'; }).join('') + '</div></div>';
    f.querySelectorAll('[data-clone] button').forEach(function (b) { b.tabIndex = -1; });
    initCarousel();
  }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function carStep() { var t = $('#rk-car-track'); if (!t) return 0; var s = t.querySelectorAll('.rk-slide'); return s.length > 1 ? s[1].offsetLeft - s[0].offsetLeft : t.clientWidth; }
  function carGo(dir) {
    var t = $('#rk-car-track'); if (!t) return; var w = carStep(), loopW = w * car.n;
    if (dir < 0 && t.scrollLeft <= 2) { carJump(t, loopW); }
    t.scrollBy({ left: dir * w, behavior: reduce ? 'auto' : 'smooth' });
  }
  function carJump(t, x) { t.style.scrollSnapType = 'none'; t.scrollLeft = x; void t.offsetWidth; t.style.scrollSnapType = ''; }
  function carNormalise() { var t = $('#rk-car-track'); if (!t) return; var w = carStep(), loopW = w * car.n; if (t.scrollLeft >= loopW - 2) carJump(t, t.scrollLeft - loopW); carDots(); }
  function carDots() {
    var t = $('#rk-car-track'), d = $('#rk-car-dots'); if (!t || !d) return; var i = Math.round(t.scrollLeft / (carStep() || 1)) % car.n;
    d.querySelectorAll('button').forEach(function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
  }
  function carPlay() { carStop(); if (reduce || car.userPaused) return; car.timer = setInterval(function () { if (!car.paused && !document.hidden) carGo(1); }, 4500); }
  function carStop() { if (car.timer) { clearInterval(car.timer); car.timer = null; } }
  function initCarousel() {
    var t = $('#rk-car-track'); if (!t) return; var deb;
    t.addEventListener('scroll', function () { clearTimeout(deb); deb = setTimeout(carNormalise, 120); carDots(); }, { passive: true });
    var root = t.closest('.rk-car');
    ['pointerenter', 'focusin', 'touchstart'].forEach(function (ev) { root.addEventListener(ev, function () { car.paused = true; }, { passive: true }); });
    ['pointerleave', 'focusout'].forEach(function (ev) { root.addEventListener(ev, function () { car.paused = false; }); });
    root.addEventListener('touchend', function () { setTimeout(function () { car.paused = false; }, 4000); }, { passive: true });
    t.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { carGo(1); e.preventDefault(); } if (e.key === 'ArrowLeft') { carGo(-1); e.preventDefault(); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { car.paused = !en[0].isIntersecting; }, { threshold: 0.2 }).observe(root);
    if (reduce) { var pp = $('#rk-car-pp'); if (pp) pp.style.display = 'none'; }
    carDots(); carPlay();
  }
  function renderHomeCombos() {
    var h = $('#rk-home-combos'); if (!h) return;
    h.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:20px;flex-wrap:wrap;gap:8px"><div><span class="rk-eyebrow" style="color:#e32b48">Smart Combos</span><h2 class="rk-h2">Bundles with up to 15% off, matched for you</h2></div><button class="rk-btn pri" data-path="move-in-combos">See all combos &amp; builder</button></div><div class="rk-combos">' + ['student', 'couple', '1bhk'].map(function (i) { return comboCard(TBYID[i]); }).join('') + '</div>';
  }
  function renderHome() { renderHero(); renderTopCats(); renderFeatured(); if (!$('#rk-home-combos').dataset.done) { $('#rk-home-combos').dataset.done = 1; } renderHomeCombos(); }
  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-k]'); if (!el) return;
    var k = el.dataset.k, id = el.dataset.id, v = el.dataset.v;
    if (k === 'open') { openProduct(id); return; }
    if (k === 'add') { var p = byId[id]; RK.addItem(cartSpec(p, parseInt(el.dataset.t, 10) || 12)); return; }
    if (k === 'quote') { toast('Call 1800-270-1950 or email care@rentickle.com for a quote on ' + byId[id].name + '.'); return; }
    if (k === 'cat') { filtSheet(false); openCategory(v); return; }
    if (k === 'cat-go') { openCategory(v); return; }
    if (k === 'rate') { cat.minR = parseFloat(v); renderCategory(); return; }
    if (k === 'tenure') { cat.tenure = parseInt(v, 10); renderCategory(); return; }
    if (k === 'reset') { resetFilters(); cat.key = 'all'; cat.label = 'All products'; renderCategory(); return; }
    if (k === 'filt-open') { filtSheet(true); return; }
    if (k === 'filt-close') { filtSheet(false); return; }
    if (k === 'fchip') { var t0 = v; if (t0 === 'cat') { cat.key = 'all'; cat.label = 'All products'; } else if (t0 === 'q') cat.q = ''; else if (t0 === 'rate') cat.minR = 0; else if (t0 === 'stock') cat.inStock = false; else if (t0 === 'priced') cat.priced = false; else if (t0 === 'price') { cat.min = 0; cat.max = MAXP; } renderCategory(); return; }
    if (k === 'thumb') { galleryIdx = parseInt(el.dataset.i, 10); renderProduct(); return; }
    if (k === 'pten') { prodTenure = parseInt(el.dataset.m, 10); renderProduct(); return; }
    if (k === 'addp') { RK.addItem(cartSpec(byId[curPid], prodTenure)); return; }
    if (k === 'rentnow') { RK.addItem(cartSpec(byId[curPid], prodTenure), { silent: true }); RK.show('cart'); return; }
    if (k === 'goto-combo') { RK.show('planner', { force: true }); setTimeout(function () { var g = $('#rk-combos-grid'); if (g) g.scrollIntoView({ behavior: 'smooth' }); }, 60); return; }
    if (k === 'ctier') { comboTier[id] = v; var cardsHome = $('#rk-home-combos'); refreshCombos(); if (cardsHome) renderHomeCombos(); return; }
    if (k === 'ctenure') { comboTenure = parseInt(v, 10); renderCombos(); return; }
    if (k === 'addcombo') { var t = TBYID[id], tier = comboTier[id] || 'balanced'; addCombo(t.name, lines(t, CUR[id][tier]), comboTenure); return; }
    if (k === 'customize') { B.tenure = comboTenure; B.sel = {}; var tr = comboTier[id] || 'balanced'; initBuilder(id, false); B.sel = Object.assign({}, CUR[id][tr]); B.auto = false; RK.show('planner', { force: true }); setTimeout(function () { renderCombos(); var b = $('#rk-builder'); if (b) b.scrollIntoView({ behavior: 'smooth' }); }, 60); return; }
    if (k === 'btpl') { B.budget = 0; initBuilder(id, false); refreshBuilder(); return; }
    if (k === 'btenure') { B.tenure = parseInt(v, 10); initBuilder(B.tpl, true); renderCombos(); return; }
    if (k === 'swap') {
      var tpl = TBYID[B.tpl], slot = tpl.slots.filter(function (s) { return s.id === el.dataset.s; })[0], l = pool(slot, B.sel);
      var i = l.findIndex(function (x) { return x.id === B.sel[slot.id].id; }); B.sel[slot.id] = l[(i + parseInt(el.dataset.d, 10) + l.length) % l.length];
      tpl.slots.forEach(function (s) { if (s.of === slot.id) { var m = pickTier(pool(s, B.sel), 'balanced'); if (m) B.sel[s.id] = m; } });
      refreshBuilder(); return;
    }
    if (k === 'addslot') { var tp = TBYID[B.tpl], sl = tp.slots.filter(function (s) { return s.id === el.dataset.s; })[0], pp = pickTier(pool(sl, B.sel), 'value'); if (pp) B.sel[sl.id] = pp; refreshBuilder(); return; }
    if (k === 'pl-bhk') { PL.bhk = parseInt(v, 10); if (!PL.touched) PL.budget = planDefault(); paintFront(); return; }
    if (k === 'pl-fam') { PL.fam = v; if (!PL.touched) PL.budget = planDefault(); paintFront(); return; }
    if (k === 'pl-minus' || k === 'pl-plus') { var bd = planBounds(); PL.touched = true; PL.budget = Math.min(bd.max, Math.max(bd.min, PL.budget + (k === 'pl-plus' ? 250 : -250))); var rg = $('#rk-hr-range'); if (rg) rg.value = PL.budget; var lb = $('#rk-hr-bud'); if (lb) lb.textContent = inr(PL.budget) + ' / mo'; return; }
    if (k === 'pl-next') { PL.view = 'ask'; paintBack(); flipTo('back'); return; }
    if (k === 'pl-back') { flipTo('front'); return; }
    if (k === 'pl-own') { PL.own[v] = !PL.own[v]; paintBack(); var fo = $('#rk-face-back [data-v="' + v + '"]'); if (fo) fo.focus({ preventScroll: true }); return; }
    if (k === 'pl-none') { PL.own = {}; paintBack(); var fn = $('#rk-face-back .none'); if (fn) fn.focus({ preventScroll: true }); return; }
    if (k === 'pl-submit') { PL.res = planCompute(); PL.view = 'result'; paintBack(); var hh = $('#rk-back-h'); if (hh) hh.focus({ preventScroll: true }); return; }
    if (k === 'pl-raise') { PL.touched = true; PL.budget = Math.min(planBounds().max, parseInt(v, 10)); PL.res = planCompute(); paintBack(); paintFront(); return; }
    if (k === 'pl-edit') { paintFront(); flipTo('front'); return; }
    if (k === 'pl-furn') { PL.view = 'ask'; paintBack(); var h2 = $('#rk-back-h'); if (h2) h2.focus({ preventScroll: true }); return; }
    if (k === 'pl-open') { planOpenBuilder(); return; }
    if (k === 'car-prev') { carGo(-1); return; }
    if (k === 'car-next') { carGo(1); return; }
    if (k === 'car-dot') { var tr = $('#rk-car-track'); if (tr) tr.scrollTo({ left: parseInt(el.dataset.i, 10) * carStep(), behavior: reduce ? 'auto' : 'smooth' }); return; }
    if (k === 'car-pp') { car.userPaused = !car.userPaused; el.setAttribute('aria-label', car.userPaused ? 'Resume auto-slide' : 'Pause auto-slide'); el.firstChild.textContent = car.userPaused ? 'play_arrow' : 'pause'; carPlay(); return; }
    if (k === 'dd-toggle') { ddOpen = !ddOpen; renderCoupons(); return; }
    if (k === 'cp-copy') { var cd = el.dataset.code; copyText(cd).then(function () { toast('Copied ' + cd); el.lastChild.textContent = 'Copied'; setTimeout(function () { el.lastChild.textContent = 'Copy'; }, 1500); }, function () { toast('Press and hold to copy: ' + cd); }); return; }
    if (k === 'rv-open') { var f = $('#rk-rv-form'); if (f) { f.hidden = false; f.scrollIntoView({ behavior: 'smooth', block: 'center' }); } return; }
    if (k === 'rv-cancel') { var f2 = $('#rk-rv-form'); if (f2) f2.hidden = true; return; }
    if (k === 'rv-star') { rvStar = parseInt(v, 10); document.querySelectorAll('#rk-rv-stars .rk-starbtn').forEach(function (b, i) { b.setAttribute('aria-checked', String(i + 1 === rvStar)); b.firstChild.classList.toggle('on', i < rvStar); }); return; }
    if (k === 'rv-submit') {
      var tx = ($('#rk-rv-text').value || '').trim();
      if (!rvStar) { toast('Please choose a star rating.'); return; }
      if (tx.length < 10) { toast('Please write at least 10 characters.'); return; }
      saveReview(curPid, { r: rvStar, t: tx, name: ($('#rk-rv-name').value || '').trim(), date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) });
      toast('Thanks! Your review was saved on this device.'); renderProduct(); return;
    }
    if (k === 'addbuilder') { var tp2 = TBYID[B.tpl]; addCombo(tp2.name, lines(tp2, B.sel), B.tenure); return; }
  });
  var swx = null;
  document.addEventListener('touchstart', function (e) { var st = e.target.closest && e.target.closest('#rk-stage'); swx = st ? e.touches[0].clientX : null; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (swx == null) return; var dx = e.changedTouches[0].clientX - swx; swx = null; var p = byId[curPid];
    if (!p || !p.images || p.images.length < 2 || Math.abs(dx) < 40) return;
    galleryIdx = (galleryIdx + (dx < 0 ? 1 : -1) + p.images.length) % p.images.length; renderProduct();
  }, { passive: true });
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'rk-q') { cat.q = t.value; if (cat.label !== 'Search results' && cat.key === 'all') cat.label = 'All products'; renderCategory(); return; }
    if (t.id === 'rk-min') { cat.min = Math.min(parseInt(t.value, 10), cat.max); renderCategory(); return; }
    if (t.id === 'rk-max') { cat.max = Math.max(parseInt(t.value, 10), cat.min); renderCategory(); return; }
    if (t.id === 'rk-hr-range') { PL.touched = true; PL.budget = parseInt(t.value, 10); var lb2 = $('#rk-hr-bud'); if (lb2) lb2.textContent = inr(PL.budget) + ' / mo'; return; }
    if (t.id === 'rk-bud') { B.budget = parseInt(t.value, 10); var l = $('#rk-bud-lbl'); if (l) l.textContent = inr(B.budget); runBuilder(); var sv = t.value; refreshBuilder(); var n = $('#rk-bud'); if (n) { n.value = sv; } return; }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'rk-sort') { cat.sort = t.value; renderCategory(); }
    if (t.id === 'rk-instock') { cat.inStock = t.checked; renderCategory(); }
    if (t.id === 'rk-priced') { cat.priced = t.checked; renderCategory(); }
  });
  document.addEventListener('click', function (e) { if (ddOpen && e.target.isConnected && !e.target.closest('#rk-dd-root')) { ddOpen = false; renderCoupons(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ddOpen) { ddOpen = false; renderCoupons(); } });
  var hs = document.querySelector('header input[type="text"]');
  if (hs) hs.addEventListener('keydown', function (e) { if (e.key === 'Enter' && hs.value.trim()) searchFor(hs.value.trim()); });

  if (window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    document.addEventListener('pointermove', function (e) {
      var tl = e.target.closest && e.target.closest('.rk-tile'); if (!tl) return; var r = tl.getBoundingClientRect();
      tl.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1) + 'deg'); tl.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 10).toFixed(1) + 'deg');
    });
    document.addEventListener('pointerout', function (e) { var tl = e.target.closest && e.target.closest('.rk-tile'); if (tl && !tl.contains(e.relatedTarget)) { tl.style.removeProperty('--rx'); tl.style.removeProperty('--ry'); } });
  }
  window.RKUI = {
    render: function (view) {
      if (view === 'home') renderHome(); else if (view === 'category') renderCategory(); else if (view === 'product') renderProduct(); else if (view === 'planner') renderCombos(); else if (view === 'cart') renderCoupons(); if (window.RKLOC) window.RKLOC.apply();
    },
    openCategory: openCategory, pathToKey: pathToKey, openProduct: openProduct
  };
  window.RKUI.render(RK.cur());
})();
