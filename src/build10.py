import json, re, shutil, os, csv
from PIL import Image
SRC='/mnt/user-data/uploads/index__1_.html'
src=open(SRC,encoding='utf-8').read().split('\n')
OUT='site'
if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(OUT+'/images/categories'); os.makedirs(OUT+'/brand')

# ---------- images -> webp, data ----------
data=json.load(open('data.json'))
WRONG={'executive-chair-revolving','study-table-basic','executive-study-table-with-drawer'}  # these 3 files are bed photos, not the product
audit=[]
IMG='/home/claude/img/images'
conv={}
for f in sorted(os.listdir(IMG)):
    try: im=Image.open(os.path.join(IMG,f))
    except Exception: continue
    im=im.convert('RGBA') if im.mode in('P','LA','RGBA') else im.convert('RGB')
    im.thumbnail((1200,1200))
    n=os.path.splitext(f)[0]+'.webp'; im.save(f'{OUT}/images/{n}','WEBP',quality=82,method=6); conv[f]=n
for p in data['products']:
    if p['id'] in WRONG:
        audit.append((p['name'],p['cat'],'Supplied photo shows a bed, not this product','Not sourced')); p['images']=[]
    elif not p['images'] and True: pass
    p['images']=[conv[f] for f in p['images'] if f in conv]
for nm in data['missing']:
    audit.append((nm,[p['cat'] for p in data['products'] if p['name']==nm][0],'Image file named in the Excel is not in images.zip','Not sourced'))
NEW='/home/claude/r4/imgs/Images'; newmap={}
for f in sorted(os.listdir(NEW)):
    stem=os.path.splitext(f)[0]; mt=re.match(r'^(.+)_(\d+)$',stem)
    im=Image.open(os.path.join(NEW,f)); im=im.convert('RGBA') if im.mode in('P','LA','RGBA') else im.convert('RGB'); im.thumbnail((1200,1200)); im.save(f'{OUT}/images/{stem}.webp','WEBP',quality=82,method=6)
    newmap.setdefault(mt.group(1).replace('_','-'),[]).append(stem+'.webp')
_ids={p['id'] for p in data['products']}
unmatched_new=[k for k in newmap if k not in _ids]
for p in data['products']:
    if p['id'] in newmap: p['images']=sorted(newmap[p['id']])
audit=[]; resolved=[p['name'] for p in data['products'] if p['id'] in newmap]
single=[p['name'] for p in data['products'] if len(p['images'])==1]; noimg=[p['name'] for p in data['products'] if not p['images']]
print('new-image products matched:',len(resolved),'| unmatched files:',unmatched_new,'| products with 1 photo:',len(single),'| with none:',noimg)
for f in os.listdir('cutouts3'):
    if f.endswith('.webp'): shutil.copy('cutouts3/'+f,f'{OUT}/images/categories/'+f)
Image.open('/mnt/user-data/uploads/Most_Popular_image.jpg').convert('RGB').save(f'{OUT}/images/most-popular.webp','WEBP',quality=86,method=6)
AW=[('bw_businessworld.0qswade0_0r1s (1).webp','award-businessworld.webp','Business World award: Tech company to watch out for'),
    ('economics.2jk2s3msclwct (1).webp','award-economic-times.webp','The Economic Times award: Most Promising Brand'),
    ('great_workplace.1jbghz1w8tki8.webp','award-great-place-to-work.webp','Great Place To Work Certified, India'),
    ('silicon.37int88tah555.webp','award-silicon-india.webp','Silicon India award: Brand of the Year'),
    ('super_brands.0hwwashew--z5.webp','award-superbrands.webp','Superbrands India award: Startup of the Year')]
for sf,dst,alt in AW:
    im=Image.open('/home/claude/r2/award/Award/'+sf).convert('RGB'); im.thumbnail((960,540)); im.save(f'{OUT}/images/{dst}','WEBP',quality=84,method=6)
for f in os.listdir('/home/claude/brand'):
    if f.endswith(('.svg','.ico')): shutil.copy('/home/claude/brand/'+f,f'{OUT}/brand/'+f)
with open('/mnt/user-data/outputs/image_audit.csv','w',newline='',encoding='utf-8') as fh:
    w=csv.writer(fh); w.writerow(['product_name','category','issue','image_source','licence','status'])
    for nm in resolved: w.writerow([nm,'','Photos matched from Images.zip (2 each)','Images.zip (supplied by you)','Confirm you have rights to use','Resolved'])
    for nm in unmatched_new: w.writerow([nm,'','Image file could not be matched to a product','','','UNMATCHED'])
    for nm in noimg: w.writerow([nm,'','No photo available','','','MISSING'])
    for nm in single: w.writerow([nm,'','Only one photo available (card hover and gallery show a single image)','Original images.zip','','Needs 2nd photo'])
    w.writerow([]); w.writerow(['--- Category icons (background removed) ---'])
    for k,fn in [('beds','bed.jpg'),('wardrobes','wardrobe.jpg'),('chairs','Chair.jpg'),('sofas','sofa.jpg'),('center-tables','center table.jpg'),('washing-machines','washing machine.jpg'),('refrigerators','refrigerator.jpg'),('study-tables','study table.jpg'),('dining-tables','dining table.jpg'),('patio-furniture','patio furniture.jpg'),('bookshelves','bookshelves.jpg'),('appliances','appliances.jpg')]: w.writerow([f'Top category icon: {k}','(category image)','Background removed from your supplied '+fn,'Supplied by you (Category.zip)','Confirm you have rights to use','Used'])
    w.writerow(['Most Popular card','(bed photo)','Used as supplied','Supplied by you (Most_Popular_image.jpg)','Confirm you have rights to use','Used'])
    for _,dst,alt in AW: w.writerow(['Award image',alt,'Used as supplied (resized)','Supplied by you (Award.zip)','Confirm you have rights to use','Used'])

# ---------- line-based replacements ----------
HERO='<section id="rk-hero" class="rk-hero2" aria-label="Move-in planner"></section>'
CATS='<section class="mb-14" id="categories-browser"><div id="rk-home-cats"></div></section>'
logo_footer='<div class="mb-4"><a class="rk-logo" data-path="home" href="#" aria-label="Rentickle home"><img class="rk-logo-d" src="brand/rentickle-logo.svg" alt="Rentickle" width="93" height="32" style="display:block"></a></div>'
HEADER='''<header class="fixed top-0 left-0 right-0 z-50 bg-surface-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-20 border-b border-border-subtle"><div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-6"><div class="flex items-center gap-3 shrink-0"><a class="rk-logo" data-path="home" href="#" aria-label="Rentickle home"><img class="rk-logo-d" src="brand/rentickle-logo.svg" alt="Rentickle" width="93" height="32"><img class="rk-logo-m" src="brand/rentickle-mobile-logo.svg" alt="" width="28" height="33"></a><span class="rk-hub" id="rk-brand-city">Gurgaon Hub</span></div>
<div class="rk-search-wrap" role="search"><span class="material-symbols-outlined">search</span><input type="text" placeholder="Search beds, sofas, fridges, washing machines…" aria-label="Search products" autocomplete="off"/></div>
<div class="flex items-center gap-4 shrink-0"><nav class="hidden lg:flex items-center gap-5" data-active-classes="text-primary font-bold"><a class="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors" data-path="offers" href="#">Offers</a><a class="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors" data-path="help-faqs" href="#">Help &amp; FAQs</a></nav><div class="flex items-center gap-3 pl-4 border-l border-border-subtle"><a aria-label="Cart" class="relative p-2 rounded-lg text-on-surface hover:bg-surface-container-low transition-colors" data-path="cart" href="#"><span class="material-symbols-outlined text-[24px]">shopping_bag</span><span class="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-red text-on-error font-label-sm text-[10px] flex items-center justify-center font-bold" id="rk-cart-count">0</span></a><div class="relative" id="rk-acct-wrap"><button aria-controls="rk-acct-menu" aria-expanded="false" aria-haspopup="menu" class="flex items-center gap-2 p-1 pl-2 pr-3 rounded-lg border border-border-subtle hover:bg-surface-container-low transition-colors" id="rk-acct-btn" type="button"><div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span class="material-symbols-outlined text-on-primary text-[18px]">person</span></div><span class="font-label-md text-label-md text-on-surface hidden md:inline">Account</span><span class="material-symbols-outlined text-[16px] text-on-surface-variant hidden md:inline">expand_more</span></button><div class="rk-menu" hidden id="rk-acct-menu" role="menu"><a data-path="account" href="#" role="menuitem">My account</a><button data-k="edit-details" role="menuitem" type="button">Edit details</button><a data-path="settings" href="#" role="menuitem">Settings</a></div></div></div></div></div></div>
<div class="h-12 bg-surface-white border-b border-border-subtle"><div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between"><nav class="flex items-center gap-7 overflow-x-auto h-full scrollbar-none" data-active-classes="text-primary font-bold border-b-2 border-primary">'''
for path,label in [('beds','Beds &amp; Mattresses'),('sofas','Sofas'),('dining-tables','Dining Tables'),('refrigerators','Refrigerators'),('washing-machines','Washing Machines'),('study-tables','Study Tables'),('wardrobes','Wardrobes')]:
    HEADER+=f'<a class="h-full flex items-center font-label-md text-label-md text-on-surface-variant hover:text-on-surface whitespace-nowrap transition-colors" data-path="cat/{path}" href="#">{label}</a>'
HEADER+='''</nav><div class="flex items-center gap-3 shrink-0"><a class="hidden xl:flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors py-1 pr-3" href="tel:18002701950"><span class="material-symbols-outlined text-[18px]">call</span><span class="font-label-md text-label-md">1800-270-1950</span></a><div class="hidden lg:flex items-center shrink-0"><button aria-label="Change delivery city" class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors text-left" onclick="openLocationModal()" type="button"><span class="material-symbols-outlined text-[18px] text-primary">location_on</span><div class="flex flex-col"><div class="flex items-center gap-1.5"><span class="font-label-md text-label-md text-on-surface" id="rk-city-label">122002 · Cyber City</span><span class="material-symbols-outlined text-[14px] text-on-surface-variant">expand_more</span></div><span class="font-label-sm text-label-sm text-trust-emerald font-bold" id="rk-city-sla">48h Delivery Certified</span></div></button></div></div></div></div></header>'''
assert src[29].startswith('<header') and src[29].rstrip().endswith('</header>')
assert src[360].strip()=='</section>' and src[33].startswith('<!-- Repositioned') and src[52].strip()=='</div>'
rep=[
 (4439,4444,logo_footer),
 (2060,2648,'<main class="w-full pt-32 bg-canvas-warm min-h-screen hidden" data-view="planner"><div class="rk-wrap" id="rk-combo-root"></div></main><main class="w-full pt-32 bg-canvas-warm min-h-screen hidden" data-view="settings"><div class="rk-wrap" id="rk-settings-root"></div></main>'),
 (1604,2059,'<main class="w-full pt-32 bg-canvas-warm min-h-screen hidden" data-view="product"><div class="rk-wrap" id="rk-prod-root"></div></main>'),
 (1019,1603,'<main class="w-full pt-32 bg-canvas-warm min-h-screen hidden" data-view="category"><div class="rk-wrap" id="rk-cat-root"></div></main>'),
 (611,749,'<section class="mb-14" id="rk-home-combos"></section>'),
 (468,609,'<section class="mb-14" id="rk-home-featured"></section>'),
 (210,361,HERO),
 (55,208,CATS),
 (34,53,''),
 (30,30,HEADER),
]
assert src[4438].startswith('<div class="flex items-center gap-2 mb-4">') and src[4443].strip()=='</div>'
for a,b,r in sorted(rep,key=lambda x:-x[0]): src[a-1:b]=[r]
html='\n'.join(src)
def sub(old,new):
    global html
    assert html.count(old)>=1, old[:70]; html=html.replace(old,new,1)

# remove the 'inspect pieces' block, add awards + mobile CTAs
k=html.index('Want to inspect pieces in person'); a=html.rfind('<section',0,k); b=html.index('</section>',k)+len('</section>')
AWARDS='<section class="mb-14" id="rk-awards" aria-labelledby="rk-aw-h"><div class="rk-aw-head"><div><span class="rk-eyebrow">Awards &amp; press</span><h2 class="rk-h2" id="rk-aw-h">Recognised for excellence</h2><p>Honoured by leading media and workplace institutions.</p></div><button class="rk-car-btn" data-k2="aw-pp" aria-label="Pause awards slider" type="button"><span class="material-symbols-outlined" id="rk-aw-pp">pause</span></button></div><div class="rk-aw-track" id="rk-aw-track" tabindex="0" role="list" aria-label="Awards and recognition">'
for _,dst,alt in AW: AWARDS+=f'<figure class="rk-aw" role="listitem"><img src="images/{dst}" alt="{alt}" width="960" height="540" loading="lazy" decoding="async"></figure>'
AWARDS+='</div></section>'
html=html[:a]+AWARDS+html[b:]
_d=html.index('data-view="dashboard"'); _h,_t=html[:_d],html[_d:]
_t=_t.replace('tracking-tight">Arnav Malhotra</h1>','tracking-tight" id="acct-name">Arnav Malhotra</h1>',1)
_t=re.sub(r'(<div class="w-16 h-16 rounded-full[^>]*>)\s*AM\s*(</div>)',r'\1<span id="acct-initials">AM</span>\2',_t,count=1)
_t=_t.replace('arnav.m@deloitte.com','<span id="acct-email">arnav.m@deloitte.com</span>',1)
html=_h+_t
i=html.index('data-view="dashboard"'); j=html.index('<button class="h-10 px-4 rounded-md bg-surface-container-low',i)
_pd=html.rfind('<div class="flex items-center gap-3"',0,j)
if _pd>0:
    html=html[:_pd]+'<div class="flex flex-wrap items-center gap-3"'+html[_pd+len('<div class="flex items-center gap-3"'):]
    j=html.index('<button class="h-10 px-4 rounded-md bg-surface-container-low',i)
html=html[:j]+'<button class="h-10 px-4 rounded-md bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md transition-colors flex items-center gap-2 cursor-pointer shadow-sm" data-k="edit-details" type="button"><span class="material-symbols-outlined text-[18px]">edit</span> Edit details</button> '+html[j:]
m=re.search(r'<div class="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4" id="saved-addresses">',html); st=m.start(); depth=0
for t in re.finditer(r'<div\b|</div>',html[st:]):
    depth+= 1 if t.group()=='<div' else -1
    if depth==0: en=st+t.end(); break
html=html[:st]+'<div class="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4" id="saved-addresses"></div>'+html[en:]
sub("const VIEWS = ['home', 'category', 'product', 'planner', 'cart', 'kyc', 'confirm', 'dashboard'];","const VIEWS = ['home', 'category', 'product', 'planner', 'cart', 'kyc', 'confirm', 'dashboard', 'settings'];")
sub("    dashboard: ['account'],","    dashboard: ['account'],\n    settings: ['settings'],")
sub("confirm: 'Order Confirmed · Rentickle', dashboard: 'My Subscriptions · Rentickle',","confirm: 'Order Confirmed · Rentickle', dashboard: 'My Subscriptions · Rentickle', settings: 'Settings · Rentickle',")
sub("    if (t === 'dashboard') return show('dashboard');","    if (t === 'dashboard') return show('dashboard');\n    if (t === 'settings') return show('settings');")

def tok(old,new,count=0):
    global html
    pat=re.escape(old).replace(r'\ ',r'\s+')
    rx=re.compile(r'>(\s*)'+pat+r'(\s*)<')
    assert rx.search(html), 'tokenise: '+old[:60]
    html=rx.sub(lambda m:'>'+new+'<',html)
def T(old,tpl): tok(old,'<span data-loc-t="'+tpl.replace('"','&quot;')+'">'+old+'</span>')
tok('Limited Moving-in Incentives · Gurgaon Hub','Limited Moving-in Incentives · <span data-loc="hub">Gurgaon Hub</span>')
T('All combos for Cyber City &amp; GGN','All combos for {city}')
T('Free GGN Relocation','Free {city} Relocation')
T('Moving from Golf Course to Cyber City? Our crew dismantles and sets up free.','Moving within {city}? Our crew dismantles and sets up free.')
T('See what happens to your cash, time, and flexibility over a 12-month Gurgaon assignment.','See what happens to your cash, time, and flexibility over a 12-month {city} assignment.')
T('Rentickle Gurgaon','Rentickle {city}')
T('Moving within Gurgaon or transitioning cities','Moving within {city} or transitioning cities')
T('Sector 28 &amp; DLF Cyber City Priority Corridor','{city} Priority Delivery')
T('Moving within Gurgaon? Our movers dismantle and re-setup at zero cost.','Moving within {city}? Our movers dismantle and re-setup at zero cost.')
T('Gurgaon Desk','{city} Desk')
tok('Arnav Malhotra (Gurgaon Hub ID #DEL-9921)','Arnav Malhotra (<span data-loc="hub">Gurgaon Hub</span> ID #DEL-9921)')
T('and priority dispatch across Cyber City &amp; Golf Course Ext.','and priority dispatch across {city}.')
T('Delivering to: Sector 28, Golf Course Rd, Gurugram 122002','Delivering to: {city}{pin}')
T('Gurgaon Certified 48h','{city} Certified 48h')
T('4th Floor (Typical High-rise DLF/Ireo/Central Park)','4th Floor (Typical high-rise)')
T('Gurgaon Society Entry Note:','Society Entry Note:')
T('If your gated society (e.g. DLF The Crest, Essel Towers, Hamilton Court) mandates a MyGate or visitor gate pass, please approve the technician entry request on delivery morning.','If your gated society mandates a MyGate or visitor gate pass, please approve the technician entry request on delivery morning.')
T('Free Gurgaon Relocation','Free {city} Relocation')
T('Gurgaon Team:','{city} Team:')
T('#RNK-GGN-88421','#RNK-{code}-88421')
T('· Pincode 122002 (Cyber City Hub Allocated)','· {pinText}{city} Hub Allocated')
T('Assigned Hub: Sector 28 Gurugram','Assigned Hub: {city}')
T('From Sector 28 Gurugram Hub','From {city} Hub')
T('Furniture items are currently undergoing sterile packaging and a 12-point Quality Audit at the Gurgaon Sector 28 Logistics Facility.','Furniture items are currently undergoing sterile packaging and a 12-point Quality Audit at the {city} Logistics Facility.')
T('Lead Technician · 840+ Cyber City &amp; Golf Course setups completed','Lead Technician · Certified Rentickle technician')
T('Pre-cleared Gate Pass for Gurugram Condos','Pre-cleared Gate Pass for {city} Societies')
T('Notify your society RWA or gate app in advance to prevent entry gate delays on Golf Course Road.','Notify your society RWA or gate app in advance to prevent entry gate delays.')
T('Shifting homes within Gurgaon or Delhi NCR? Rentickle packs, shifts, and reinstalls your furniture at zero cost.','Shifting homes within {city}? Rentickle packs, shifts, and reinstalls your furniture at zero cost.')
T('Priority Gurgaon Desk:','Priority {city} Desk:')
html=html.replace("Gurgaon's premier","<span data-loc=\"possessive\">Gurgaon's</span> premier",1)
k=html.index('Real Experience from Gurgaon Relocators'); a=html.rfind('<section',0,k); html=html[:a]+'<section data-loc-only="Gurgaon"'+html[a+len('<section'):]
# cart: price-confirmation note + account phone
html=html.replace('<!-- Offers & Coupons -->','<div class="rk-citynote"></div>\n<!-- Offers & Coupons -->',1)
html=re.sub(r'(id="acct-email">arnav\.m@deloitte\.com</span>\s*</span>)',r'\1 <span class="text-outline">•</span> <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px] text-outline">call</span><span id="acct-phone" data-k2="edit" role="button" tabindex="0">Add mobile number</span></span>',html,count=1)
assert 'id="acct-phone"' in html
# glue: one city state
sub("    const c = state.city;\n    const isG = c.city === 'Gurgaon';","    if (window.RKLOC) { window.RKLOC.apply(); return; }\n    const c = state.city;\n    const isG = c.city === 'Gurgaon';")
sub("  window.confirmCityAndProceed = function () {","  window.confirmCityAndProceed = function () { return; /* replaced by the confirm bar in ui_loc.js */")
sub("    if (target) target.click();\n    applyCity();","    applyCity();")
# offers block -> coupons dropdown
a=html.index('<!-- Coupons & Offer Application Drawer -->'); b=html.index('<!-- Rentickle Peace-of-Mind Assurances Bento -->')
OFFERS='''<!-- Offers & Coupons -->
<div class="rk-citynote"></div>
<div class="bg-surface-white rounded-xl p-6 shadow-sm flex flex-col gap-4" id="rk-offers"><div class="flex items-center justify-between"><div class="flex items-center gap-2.5"><div class="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary"><span class="material-symbols-outlined text-[20px]">local_offer</span></div><div><h3 class="font-label-lg text-label-lg font-bold text-primary">Offers &amp; Coupons</h3><p class="font-body-sm text-body-sm text-on-surface-variant">Pick an active code and apply it in one tap</p></div></div><span class="font-label-sm text-label-sm text-trust-emerald font-bold bg-trust-emerald/10 px-2.5 py-1 rounded" id="coupon-count">None applied</span></div>
<div class="flex items-center justify-between gap-3 bg-trust-emerald/10 p-3.5 rounded-lg" id="coupon-active-box"><div class="flex items-center gap-3"><span class="material-symbols-outlined text-trust-emerald text-[22px]">check_circle</span><div class="flex flex-col"><div class="flex items-center gap-2 flex-wrap"><span class="font-label-md text-label-md font-bold text-primary tracking-wider uppercase" id="coupon-code-badge"></span><span class="font-label-sm text-label-sm text-trust-emerald font-bold bg-surface-white px-2 py-0.5 rounded shadow-sm" id="coupon-title"></span></div><span class="font-body-sm text-body-sm text-on-surface-variant" id="coupon-note"></span></div></div><button class="text-on-surface-variant hover:text-accent-red font-label-sm text-label-sm font-bold uppercase transition-colors" data-act="coupon-remove" type="button">Remove</button></div>
<div class="rk-dd" id="rk-dd-root"></div></div>
'''
html=html[:a]+OFFERS+html[b:]
# remove obsolete planner script (its elements no longer exist)
a=html.index('  // Move-in Planner Interactive Logic (Streamlined)'); b=html.index('\n  })();\n',a)+len('\n  })();\n'); html=html[:a]+html[b:]
# IIFE patches
sub("const rentFor = (it) => (it.fixedRent != null ? it.fixedRent : Math.round(it.base12 * (RATIO[it.tenure] || 1)));","const rentFor = (it) => (it.fixedRent != null ? it.fixedRent : Math.round(it.base12 * (RATIO[it.tenure] || 1) * (1 - (it.disc || 0))));")
sub("if (ex) ex.qty += 1; else","if (ex) ex.qty += (spec.qty || 1); else")
sub("i.tenure === spec.tenure && i.fixedRent === spec.fixedRent);","i.tenure === spec.tenure && i.fixedRent === spec.fixedRent && i.disc === spec.disc);")
sub("  function navigate(path) {\n","  function navigate(path) {\n    if (/^cat\\//.test(path)) { window.RKUI.openCategory(path.slice(4)); return; }\n")
sub("      show('category');\n      if (SOFA_PATHS.indexOf(path) < 0) toast('Only the Sofas listing is built in this prototype, so you are seeing sofas.');\n      return;","      window.RKUI.openCategory(window.RKUI.pathToKey(path));\n      return;")
sub("    badge();\n    if (current === 'cart') renderCartPage();","    badge();\n    if (window.RKUI) window.RKUI.render(current);\n    if (window.RKX) window.RKX.render(current);\n    if (current === 'cart') renderCartPage();")
sub("window.RK = { state, addItem, totals, show };","window.RK = { state, addItem, totals, show, cur: () => current, coupons: COUPONS, persist };")
sub("const inp = $('#coupon-input'); const code = (inp.value || '').trim().toUpperCase();","const inp = $('#coupon-input'); const code = String(actEl.dataset.code || (inp && inp.value) || '').trim().toUpperCase();")
sub("state.coupon = code; inp.value = ''; persist();","state.coupon = code; if (inp) inp.value = ''; persist();")
html=re.sub(r'window\.RK_SEED = \[.*?\];\n','window.RK_SEED = [];\n',html,count=1,flags=re.S)
# head: favicon + config
css_all=open('ui.css').read().replace('.rk-steps{','.rk-oldsteps{').replace('.rk-step{','.rk-oldstep{').replace('.rk-step b{','.rk-oldstep b{').replace('.rk-step span{','.rk-oldstep span{')+'\n'+open('ui2.css').read()+'\n'+open('ui3.css').read().replace('.rk-step{font-size:11px','.rk-stepno{font-size:11px')+'\n'+open('ui4.css').read()
css_all='\n'.join(l for l in css_all.split('\n') if not re.search(r'#location-modal-overlay|#rk-loc-bar|\.rk-lb-|\.rk-pin-row',l))+'\n'+open('ui5.css').read()+'\n'+open('ui6.css').read()+'\n'+open('ui10.css').read()
sub('</head>','<link rel="icon" href="brand/rentickle-favicon.ico" sizes="any"/>\n<style id="rk-custom">\n'+css_all+'\n</style>\n</head>')
CONFIG='''<script>
/* ---- Site config (edit here) ----
   showSampleReviews: false = honest empty state "Be the first to review" (default).
                      true  = shows 2 clearly-labelled SAMPLE reviews per product (no customer names).
   imageOverrides:    { "product-id": ["file-in-images-folder.webp"] } to supply missing product photos.
   cityRules:         per-city overrides, e.g. { Mumbai: { priceMultiplier: 1.1, unavailableCats: ['Patio Furniture'], unavailableIds: [] } }. Empty = no per-city differences.
   api.baseUrl:       '' = account, settings and city waitlist save on this device only. Set your API root to use the real endpoints. */
window.RK_CONFIG = { showSampleReviews: false, imageOverrides: {}, api: { baseUrl: '' }, cityImages: {}, mobile: { showBundles: false }, orders: { sample: true } };
</script>'''
datajs='<script>window.RK_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';</script>'
js='<script>\n'+open('ui_v7.js').read()+'\n</script>\n<script>\n'+open('ui_extra4.js').read()+'\n</script>\n<script>\n'+open('ui_loc6.js').read()+'\n</script>\n<script id="rk-assistant-config">\n'+open('assistant_qa.js').read()+'\n</script>\n<script>\n'+open('ui_assist.js').read()+'\n</script>\n<script>\n'+open('ui_r7.js').read()+'\n</script>\n<script>\n'+open('mock_orders.js').read()+'\n</script>\n<script>\n'+open('ui_orders4.js').read()+'\n</script>\n<script>\n'+open('ui_pay.js').read()+'\n</script>\n<script>\n'+open('ui_acct.js').read()+'\n</script>\n<script>\n'+open('ui_nav2.js').read()+'\n</script>\n<script>\n'+open('ui_tour.js').read()+'\n</script>'
i=html.rfind('</body>'); html=html[:i]+CONFIG+'\n'+datajs+'\n'+js+'\n'+html[i:]

# ======== Round 4 structure ========
def hsub(old,new,count=1):
    global html
    assert old in html, 'r4: '+old[:80]; html=html.replace(old,new,count)
import re as _re
# 1. mobile header: notice bar + offers pill
hsub('<header class="fixed top-0 left-0 right-0 z-50 bg-surface-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">','<header class="fixed top-0 left-0 right-0 z-50 bg-surface-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="rk-m-notice" role="button" tabindex="0" aria-label="Change city" onclick="openLocationModal()" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openLocationModal()}"><span class="l"><i></i><span><b data-loc="city">Gurgaon</b> \u2022 <span data-loc="tag">Millennium City Hub</span></span><em>48h delivery</em></span><a href="tel:18002701950" onclick="event.stopPropagation()"><span class="material-symbols-outlined" style="font-size:14px;width:14px;overflow:hidden">call</span>Support</a></div>')
hsub('<a aria-label="Cart"','<a class="rk-m-offers" data-path="offers" href="#"><span class="material-symbols-outlined">sell</span>Offers</a><a aria-label="Cart"')
# 2. mobile category pills + section ids
PILLS=[('beds','bed','Beds &amp; Mattresses'),('sofas','weekend','Sofas'),('appliances','electrical_services','Appliances'),('study-tables','desk','Study Tables'),('wardrobes','door_sliding','Wardrobes'),('dining-tables','dining','Dining'),('patio-furniture','deck','Patio Furniture'),('bookshelves','auto_stories','Bookshelves')]
pills='<nav class="rk-m-pills" aria-label="Browse categories">'+''.join(f'<button type="button" data-k="cat-go" data-v="{k}"><span class="material-symbols-outlined">{i}</span>{t}</button>' for k,i,t in PILLS)+'</nav>'
hsub('<section class="mb-14" id="categories-browser">',pills+'<section class="mb-14" id="categories-browser">')
_k=html.index('Limited Moving-in Incentives'); _a=html.rfind('<section',0,_k); html=html[:_a]+'<section id="rk-offers-band"'+html[_a+len('<section'):]
_b=html.index('</section>',_a)+len('</section>'); _n=html.index('<section',_b); html=html[:_n]+'<section id="rk-trust"'+html[_n+len('<section'):]
_k=html.index('Clear Cost Analysis'); _a=html.rfind('<section',0,_k); html=html[:_a]+'<section id="rk-matrix"'+html[_a+len('<section'):]
hsub('<section data-loc-only="Gurgaon"','<section id="rk-reviews" data-loc-only="Gurgaon"')
# 3. assistant button belongs to the new assistant
import re as _re
html,_n=_re.subn(r"const assistant = document\.getElementById\('rk-assistant-btn'\);\s*if \(assistant\) assistant\.addEventListener\('click', \(\) => toast\('[^']*'\)\);","",html); assert _n==1,'assistant handler'
_ai=html.index('id="aadhaar-num"'); _ad=html.rfind('<div class="',0,_ai); html=html[:_ad]+'<div class="rk-aad '+html[_ad+len('<div class="'):]
# 4. KYC: Aadhaar badge, Authorize button
html,_n=_re.subn(r'check_circle</span>\s*Valid UID\s*</span>','check_circle</span><span class="rk-valid-t">Valid UID</span></span>',html); assert _n==1,'valid uid'
hsub('class="mt-5 w-full h-12 rounded-lg bg-accent-red','class="rk-auth mt-5 w-full h-12 rounded-lg bg-accent-red')
_cta='<span class="rk-cta-full">Authorize &amp; Complete Move-in</span><span class="rk-cta-short">Authorize &amp; Move In</span><span class="rk-cta-amt">(%s)</span>'
html,_n=_re.subn(r'<span id="kyc-cta-text">Authorize &amp; Complete Move-in \((₹[\d,]+)\)</span>',lambda m:'<span id="kyc-cta-text">'+_cta%m.group(1)+'</span>',html); assert _n==1,'cta static'
hsub("S('kyc-cta-text', 'Authorize & Complete Move-in (' + inr(t.total) + ')');","{ const ce = document.getElementById('kyc-cta-text'); if (ce) ce.innerHTML = '<span class=\"rk-cta-full\">Authorize &amp; Complete Move-in</span><span class=\"rk-cta-short\">Authorize &amp; Move In</span><span class=\"rk-cta-amt\">(' + inr(t.total) + ')</span>'; }")
# 5. order status: gate pass buttons, police text, timeline
hsub('Validated Haryana Police','<span data-loc-t="Police verification validated">Validated Haryana Police</span>')
hsub('<div class="p-4 rounded-2xl bg-secondary-container/30 space-y-2">','<div class="rk-gate p-4 rounded-2xl bg-secondary-container/30 space-y-2">')
_m=_re.search(r'<div class="grid grid-cols-2 gap-3 pt-1">\s*<button class="h-11[^>]*>.*?Call Crew \(Active in 18h\).*?</button>\s*<button class="h-11[^>]*>.*?WhatsApp Dispatch.*?</button>\s*</div>',html,_re.S); assert _m,'gate buttons'
html=html[:_m.start()]+'<div class="rk-acts2 pt-1"><button class="rk-act2 sec" data-act="toast" data-msg="This action is a placeholder in the prototype." type="button"><span class="material-symbols-outlined">call</span><span class="t"><span>Call Crew</span><small>Active in 18h</small></span></button><button class="rk-act2 pri" data-act="toast" data-msg="This action is a placeholder in the prototype." type="button"><span class="material-symbols-outlined">chat</span><span class="t"><span>WhatsApp Dispatch</span></span></button></div>'+html[_m.end():]
_g='<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">'; _s=html.index(_g); _e=html.index('<!-- Step 5',_s); _e=html.index('</div> </div> </div>',_e) if False else _e
_seg_end=html.index('</main>',_s); _seg=html[_s:_seg_end]
_parts=_re.split(r'(?=<!-- Step \d)',_seg); _out=[_parts[0].replace(_g,'<div class="rk-tl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">',1)]
for _p in _parts[1:]:
    _st='done' if 'Completed' in _p.split('<h3')[0] else ('active' if 'In Progress' in _p.split('<h3')[0] else 'todo')
    _p=_p.replace('<div class="flex flex-col items-start lg:items-center text-left lg:text-center space-y-3','<div data-st="'+_st+'" class="rk-tl-step flex flex-col items-start lg:items-center text-left lg:text-center space-y-3',1); _out.append(_p)
html=html[:_s]+''.join(_out)+html[_seg_end:]
html=html.replace('<div class="rk-citynote"></div>','')
# 6. compact account page
_st=html.rfind('<main',0,html.index('data-view="dashboard"')); _en=html.index('</main>',_st)+7
DASH='<main class="w-full pt-32 bg-canvas-warm min-h-screen hidden" data-view="dashboard"><div class="rk-wrap"><div class="rk-dash"><section class="rk-dh" aria-label="Profile"><div class="rk-dh-av" id="acct-initials"><span class="material-symbols-outlined">person</span></div><div class="rk-dh-tx"><h1 id="acct-name">Welcome to Rentickle</h1><div class="rk-dh-meta"><span><span class="material-symbols-outlined">call</span><span id="acct-phone" data-k2="edit" role="button" tabindex="0">Add mobile number</span></span><span><span class="material-symbols-outlined">mail</span><span id="acct-email">Add your email</span></span></div></div><button class="rk-btn sec" type="button" data-k="edit-details"><span class="material-symbols-outlined" style="font-size:18px">edit</span>Edit</button></section>'
DASH+='<div class="rk-qa-grid">'+''.join(f'<button type="button" class="rk-qa" {a}><span class="rk-qa-i"><span class="material-symbols-outlined">{i}</span></span><span><b>{t}</b><small>{d}</small></span></button>' for a,i,t,d in [('data-qa="orders"','receipt_long','Orders','Track and manage'),('data-k="edit-details"','person','Edit details','Name, phone, email'),('data-qa="settings"','settings','Settings','Alerts and security'),('data-qa="addresses"','location_on','Addresses','Saved delivery spots'),('data-qa="support"','support_agent','Support','Chat with us')])+'</div>'
DASH+='<section class="rk-dsec" aria-label="Active order"><h2>Active order</h2><div id="acct-order"></div></section><div id="saved-addresses"></div></div></div></main>'
html=html[:_st]+DASH+html[_en:]

# ======== Round 5 ========
def r5(old,new):
    global html
    assert html.count(old)>=1,'r5: '+old[:80]; html=html.replace(old,new,1)
r5("'dashboard', 'settings'];","'dashboard', 'settings', 'orders', 'track'];")
r5("    settings: ['settings'],","    settings: ['settings'],\n    orders: ['orders'],\n    track: ['track'],")
r5("settings: 'Settings · Rentickle',","settings: 'Settings · Rentickle', orders: 'Your Orders · Rentickle', track: 'Live Move-in Tracker · Rentickle',")
r5("    if (t === 'settings') return show('settings');","    if (t === 'settings') return show('settings');\n    if (t === 'orders') return show('orders');\n    if (t === 'track') return show('track');")
_se=html.index('</main>',html.index('data-view="settings"'))+7
html=html[:_se]+'<main class="w-full pt-32 bg-canvas-warm min-h-screen hidden" data-view="orders"><div class="rk-wrap" id="rk-orders-root"></div></main><main class="w-full pt-32 bg-canvas-warm min-h-screen hidden" data-view="track"><div class="rk-wrap" id="rk-track-root"></div></main>'+html[_se:]
r5('<a data-path="account" href="#" role="menuitem">My account</a>','<a data-path="account" href="#" role="menuitem">My account</a><a data-path="orders" href="#" role="menuitem">My orders</a>')
_m=html.index('<!-- Stepper Visualizer -->'); _st=html.index('<div class="relative py-4">',_m); _d=0
for _t in _re.finditer(r'<div\b|</div>',html[_st:]):
    _d+= 1 if _t.group()[:2]=='<d' else -1
    if _d==0: _en=_st+_t.end(); break
html=html[:_st]+'<div id="rk-tracker-confirm"></div>'+html[_en:]

# ======== Round 6 ========
def r8(old,new):
    global html
    assert html.count(old)>=1,'r8: '+old[:90]; html=html.replace(old,new,1)
def section(sid):
    k=html.index('id="%s"'%sid); a=html.rfind('<section',0,k); b=html.index('</section>',k)+len('</section>'); return a,b
# 1. routing: real history entries + back; /#account is the dashboard route
r8("  function show(view, opts) {","  const hashOf = (v) => (v === 'dashboard' ? 'account' : (v === 'pay' && window.__rkPay ? 'pay/' + encodeURIComponent(window.__rkPay) : v));\n  const viewOf = (h) => { const p = h.split('/'); if (p[0] === 'pay') { window.__rkPay = p[1] ? decodeURIComponent(p[1]) : ''; return 'pay'; } return p[0] === 'account' ? 'dashboard' : p[0]; };\n  function show(view, opts) {")
r8("if (location.hash !== '#' + view) { try { history.replaceState(null, '', '#' + view); } catch (e) { location.hash = view; } }","if (location.hash !== '#' + hashOf(view)) { try { if (changed && !opts.noPush && window.__rkReady) { window.__rkDepth = (window.__rkDepth || 0) + 1; history.pushState({ rk: 1, d: window.__rkDepth }, '', '#' + hashOf(view)); } else history.replaceState(history.state || { rk: 1, d: window.__rkDepth || 0 }, '', '#' + hashOf(view)); } catch (e) { location.hash = hashOf(view); } }")
r8("    const v = location.hash.replace('#', '');\n    if (VIEWS.indexOf(v) >= 0 && v !== current) show(v);","    const v = viewOf(location.hash.replace('#', ''));\n    if (VIEWS.indexOf(v) >= 0 && v !== current) show(v, { noPush: true });")
r8("const startView = VIEWS.indexOf(location.hash.replace('#', '')) >= 0 ? location.hash.replace('#', '') : 'home';","const startView = VIEWS.indexOf(viewOf(location.hash.replace('#', ''))) >= 0 ? viewOf(location.hash.replace('#', '')) : 'home';")
r8("  show(startView, { force: false });","  show(startView, { force: false });\n  try { history.replaceState({ rk: 1, d: 0 }, '', '#' + hashOf(startView)); } catch (e) {}\n  window.__rkDepth = 0; window.__rkReady = true;")
r8("'settings', 'orders', 'track'];","'settings', 'orders', 'track', 'pay'];")
r8("    track: ['track'],","    track: ['track'],\n    pay: ['pay'],")
r8("track: 'Live Move-in Tracker · Rentickle',","track: 'Live Move-in Tracker · Rentickle', pay: 'Pay Rent · Rentickle',")
r8("    if (t === 'track') return show('track');","    if (t === 'track') return show('track');\n    if (t === 'pay') return show('pay');")
_te=html.index('</main>',html.index('data-view="track"'))+7
html=html[:_te]+'<main class="w-full pt-32 bg-canvas-warm min-h-screen hidden" data-view="pay"><div class="rk-wrap" id="rk-pay-root"></div></main>'+html[_te:]
# 2. header: logo, city, search, cart, account
_a=html.index('<header'); _b=html.index('</header>')+len('</header>')
HDR='<header class="rk-hdr"><div class="rk-hdr-in"><a class="rk-logo" data-path="home" href="#" aria-label="Rentickle home"><img class="rk-logo-d" src="brand/rentickle-logo.svg" alt="Rentickle" width="93" height="32"><img class="rk-logo-m" src="brand/rentickle-mobile-logo.svg" alt="" width="28" height="33"></a><button class="rk-loc" id="rk-city-btn" type="button" onclick="openLocationModal()" aria-label="Change city"><span class="material-symbols-outlined">location_on</span><span id="rk-city-label">Gurgaon</span><span class="material-symbols-outlined">expand_more</span></button><div class="rk-search-wrap" role="search"><span class="material-symbols-outlined">search</span><input type="text" placeholder="Search beds, sofas, fridges\u2026" aria-label="Search products" autocomplete="off"></div><a class="rk-ic" aria-label="Cart" data-path="cart" href="#"><span class="material-symbols-outlined">shopping_bag</span><span id="rk-cart-count" class="rk-cnt">0</span></a><div class="rk-acct" id="rk-acct-wrap"><button type="button" class="rk-acct-btn" id="rk-acct-btn" aria-haspopup="menu" aria-expanded="false" aria-controls="rk-acct-menu" aria-label="Account menu"><span class="rk-acct-av"><span class="material-symbols-outlined">person</span></span><span class="rk-acct-lb">Account</span><span class="material-symbols-outlined rk-acct-chev">expand_more</span></button><div class="rk-acct-menu" id="rk-acct-menu" role="menu" hidden><div class="rk-acct-who"><b id="rk-who-n">Naman</b><small id="rk-who-p">+91 91302 08733</small></div><button type="button" role="menuitem" data-acct="dashboard"><span class="material-symbols-outlined">dashboard</span>Dashboard</button><button type="button" role="menuitem" data-acct="orders"><span class="material-symbols-outlined">receipt_long</span>Orders</button><button type="button" role="menuitem" data-acct="pay"><span class="material-symbols-outlined">payments</span>Pay Rent</button><button type="button" role="menuitem" data-acct="settings"><span class="material-symbols-outlined">settings</span>Settings</button><button type="button" role="menuitem" data-acct="logout"><span class="material-symbols-outlined">logout</span>Logout</button></div></div></div></header>'
html=html[:_a]+HDR+html[_b:]
# 3. footer: original footer, plus the tour replay button
_fa=html.index('<footer'); _fp=html.index('</p>',_fa)+4
html=html[:_fp]+'<button type="button" class="rk-ft-tour" data-tour><span class="material-symbols-outlined" style="font-size:18px;width:18px;overflow:hidden">tour</span>Take the tour</button>'+html[_fp:]
# 4. User dashboard (route /#account)
_st=html.rfind('<main',0,html.index('data-view="dashboard"')); _en=html.index('</main>',_st)+7
D='<main class="w-full pt-32 bg-canvas-warm min-h-screen hidden" data-view="dashboard"><div class="rk-wrap"><div class="rk-dash">'
D+='<section class="rk-dh" aria-label="Profile"><div class="rk-dh-av" id="acct-initials"><span class="material-symbols-outlined">person</span></div><div class="rk-dh-tx"><h1 id="acct-name">Welcome to Rentickle</h1><div class="rk-dh-meta"><span><span class="material-symbols-outlined">call</span><span id="acct-phone" data-k2="edit" role="button" tabindex="0">Add mobile number</span></span><span><span class="material-symbols-outlined">mail</span><span id="acct-email">Add your email</span></span></div></div><button class="rk-btn sec" type="button" data-k="edit-details"><span class="material-symbols-outlined" style="font-size:18px">edit</span>Edit</button></section>'
D+='<div id="rk-dash-alert"></div><div class="rk-qa-grid">'
for _a,_i,_t,_d in [('data-qa="orders"','receipt_long','Orders','Track and manage'),('data-qa="pay"','payments','Pay Rent','Dues and history'),('data-k="edit-details"','person','Edit details','Name, phone, email'),('data-qa="settings"','settings','Settings','Alerts and preferences'),('data-qa="addresses"','location_on','Addresses','Saved spots'),('data-qa="support"','support_agent','Support','Chat with us')]:
    D+='<button type="button" class="rk-qa" '+_a+'><span class="rk-qa-i"><span class="material-symbols-outlined">'+_i+'</span></span><span><b>'+_t+'</b><small>'+_d+'</small></span></button>'
D+='</div>'
D+='<section class="rk-dsec" aria-label="Active order"><h2 class="rk-dsec-h">Active order</h2><div id="acct-order"></div></section>'
D+='<section class="rk-dsec" aria-label="Orders"><h2 class="rk-dsec-h">Orders</h2><div id="rk-dash-orders"></div></section>'
D+='<div id="saved-addresses"></div>'
D+='<section class="rk-dsec" aria-label="Settings"><h2 class="rk-dsec-h">Settings</h2><div class="rk-sc"><button type="button" data-qa="settings"><span class="material-symbols-outlined">notifications</span>Notifications<span class="material-symbols-outlined">chevron_right</span></button><button type="button" data-k="edit-details"><span class="material-symbols-outlined">person</span>Edit details<span class="material-symbols-outlined">chevron_right</span></button><button type="button" data-qa="signout"><span class="material-symbols-outlined">logout</span>Logout<span class="material-symbols-outlined">chevron_right</span></button></div></section>'
D+='</div></div></main>'
html=html[:_st]+D+html[_en:]
for _o,_n in [('Arnav Malhotra','Naman'),('arnav.m@deloitte.com','snaman2310@gmail.com'),('Arnav','Naman')]: html=html.replace(_o,_n)
open(OUT+'/index.html','w',encoding='utf-8').write(html)
print('built',len(html)//1024,'KB; images',len(os.listdir(OUT+'/images')),'; audit rows',len(audit))
