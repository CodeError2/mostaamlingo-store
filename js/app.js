(() => {
  'use strict';
  const C = window.STORE_CONFIG;
  const $ = (id) => document.getElementById(id);
  const ID_RE = /^[a-f0-9]{16}$/;
  const state = { products: [], categories: [], cat: 'الكل', status: 'available', sort: 'new', q: '' };

  // عنصر DOM آمن (بنستخدم textContent بس، مفيش innerHTML بأي بيانات جاية من السيرفر)
  const h = (tag, props = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v);
    }
    kids.forEach((k) => k && e.append(k));
    return e;
  };
  const imgUrl = (id) => (ID_RE.test(id) ? `${C.API_BASE}/api/img/${id}` : '');
  const money = (n) => `${Number(n).toLocaleString('ar-EG')} جنيه`;

  /* ---------- splash ---------- */
  const splash = $('splash');
  setTimeout(() => {
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 700);
  }, 900);

  /* ---------- data ---------- */
  async function load() {
    $('msg').hidden = true;
    const grid = $('grid');
    grid.replaceChildren(...Array.from({ length: 8 }, () => h('div', { class: 'skel' })));
    try {
      const r = await fetch(`${C.API_BASE}/api/products`, { headers: { accept: 'application/json' } });
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      state.products = Array.isArray(d.products) ? d.products : [];
      state.categories = Array.isArray(d.categories) ? d.categories : [];
      renderChips();
      render();
      openFromHash();
    } catch {
      grid.replaceChildren();
      const b = h('button', { text: 'حاول تاني' });
      b.onclick = load;
      showMsg('مقدرناش نحمل المنتجات دلوقتي. اتأكد من النت وحاول تاني.', b);
    }
  }
  function showMsg(text, extra) {
    const m = $('msg');
    m.replaceChildren(h('p', { text }), ...(extra ? [extra] : []));
    m.hidden = false;
  }

  /* ---------- render ---------- */
  function renderChips() {
    const wrap = $('cats');
    wrap.replaceChildren(
      ...['الكل', ...state.categories].map((c) => {
        const b = h('button', { class: 'chip' + (c === state.cat ? ' on' : ''), type: 'button', text: c });
        b.onclick = () => { state.cat = c; renderChips(); render(); };
        return b;
      }),
    );
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    let list = state.products.filter((p) =>
      (state.cat === 'الكل' || p.category === state.cat) &&
      (state.status === 'all' || p.status === state.status) &&
      (!q || (p.title + ' ' + p.description).toLowerCase().includes(q)));
    if (state.sort === 'low') list.sort((a, b) => a.price - b.price);
    else if (state.sort === 'high') list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }

  function card(p) {
    const ph = h('div', { class: 'ph' });
    if (p.images && p.images[0]) ph.append(h('img', { src: p.thumb && /^data:image\/(webp|jpeg|png);base64,/.test(p.thumb) ? p.thumb : imgUrl(p.images[0]), alt: p.title, loading: 'lazy', decoding: 'async' }));
    else ph.append(h('div', { class: 'none', text: '📦' }));
    if (p.status === 'sold') ph.append(h('span', { class: 'ribbon', text: 'تم البيع' }));
    const el = h('button', { class: 'card' + (p.status === 'sold' ? ' sold' : ''), type: 'button' },
      ph,
      h('div', { class: 'b' }, h('h3', { text: p.title }), h('div', { class: 'p', text: money(p.price) }), p.description ? h('p', { class: 'd', text: p.description }) : null, h('div', { class: 'm', text: `${p.condition} • ${p.category}` })));
    el.onclick = () => openModal(p);
    return el;
  }

  function render() {
    const list = filtered();
    $('grid').replaceChildren(...list.map(card));
    $('count').textContent = list.length ? `${list.length.toLocaleString('ar-EG')} منتج` : '';
    if (!list.length) showMsg(state.products.length ? 'مفيش منتجات مطابقة للبحث.' : 'مفيش منتجات حاليا، ارجع تاني قريب!');
    else $('msg').hidden = true;
    syncAds(list.length > 0);
  }

  /* ---------- modal ---------- */
  let lastFocus = null;
  function openModal(p) {
    lastFocus = document.activeElement;
    const imgs = (p.images || []).map(imgUrl).filter(Boolean);
    const main = $('mImg');
    const setMain = (i) => {
      main.src = imgs[i] || '';
      main.alt = p.title;
      [...$('mThumbs').children].forEach((t, j) => t.classList.toggle('on', j === i));
    };
    $('mThumbs').replaceChildren(...(imgs.length > 1 ? imgs.map((u, i) => {
      const t = h('img', { src: u, alt: `صورة ${i + 1}`, loading: 'lazy' });
      t.onclick = () => setMain(i);
      return t;
    }) : []));
    main.hidden = !imgs.length;
    setMain(0);
    $('mTitle').textContent = p.title;
    $('mPrice').textContent = money(p.price);
    $('mDesc').textContent = p.description || '';
    const sold = p.status === 'sold';
    $('mSold').hidden = !sold;
    $('mPrice').classList.toggle('struck', sold);
    $('mTags').replaceChildren(
      h('span', { class: 'tag', text: p.category }), h('span', { class: 'tag', text: `الحالة: ${p.condition}` }),
      h('span', { class: 'tag ' + (sold ? 'sold' : 'ok'), text: sold ? 'تم البيع' : 'متاح' }));
    const buy = $('mBuy');
    if (sold) {
      buy.textContent = 'المنتج ده اتباع';
      buy.className = 'buy off';
      buy.removeAttribute('href');
    } else {
      const msg = `أهلا، عايز أشتري "${p.title}" بسعر ${money(p.price)} من مستعملينجو.\n${C.SITE_URL}/#p=${p.id}`;
      buy.textContent = 'تواصل واتساب للشراء';
      buy.className = 'buy';
      buy.href = `https://wa.me/${encodeURIComponent(C.WHATSAPP)}?text=${encodeURIComponent(msg)}`;
    }
    $('modal').hidden = false;
    document.body.style.overflow = 'hidden';
    history.replaceState(null, '', `#p=${p.id}`);
    $('mClose').focus();
  }
  function closeModal() {
    $('modal').hidden = true;
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openFromHash() {
    const m = /^#p=([a-f0-9]{16})$/.exec(location.hash);
    const p = m && state.products.find((x) => x.id === m[1]);
    if (p) openModal(p);
  }
  $('mClose').onclick = closeModal;
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('zoom').hidden) closeZoom();
    else if (!$('modal').hidden) closeModal();
  });

  /* ---------- زوم الصورة ---------- */
  const Z = { s: 1, x: 0, y: 0 };
  const zimg = $('zImg');
  const zApply = () => {
    if (Z.s <= 1) { Z.x = 0; Z.y = 0; }
    zimg.style.transform = `translate(${Z.x}px,${Z.y}px) scale(${Z.s})`;
    zimg.style.cursor = Z.s > 1 ? 'grab' : 'zoom-in';
  };
  const zSet = (s) => { Z.s = Math.min(5, Math.max(1, s)); zApply(); };
  function openZoom() {
    if (!$('mImg').src || $('mImg').hidden) return;
    zimg.src = $('mImg').src;
    Z.s = 1; zApply();
    $('zoom').hidden = false;
  }
  function closeZoom() { $('zoom').hidden = true; zimg.removeAttribute('src'); }
  $('mImg').onclick = openZoom;
  $('zClose').onclick = closeZoom;
  $('zIn').onclick = () => zSet(Z.s * 1.5);
  $('zOut').onclick = () => zSet(Z.s / 1.5);
  $('zoom').addEventListener('wheel', (e) => { e.preventDefault(); zSet(Z.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
  $('zoom').addEventListener('click', (e) => { if (e.target === $('zoom') || e.target.classList.contains('zstage')) closeZoom(); });
  zimg.addEventListener('dblclick', () => zSet(Z.s > 1 ? 1 : 2.5));
  // سحب + قرص بإصبعين
  const ptrs = new Map();
  let pinch = 0;
  zimg.addEventListener('pointerdown', (e) => { zimg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, e); pinch = 0; });
  zimg.addEventListener('pointermove', (e) => {
    const prev = ptrs.get(e.pointerId);
    if (!prev) return;
    ptrs.set(e.pointerId, e);
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pinch) zSet(Z.s * (d / pinch));
      pinch = d;
    } else if (ptrs.size === 1 && Z.s > 1) {
      Z.x += e.clientX - prev.clientX;
      Z.y += e.clientY - prev.clientY;
      zApply();
    }
  });
  const zUp = (e) => { ptrs.delete(e.pointerId); pinch = 0; };
  zimg.addEventListener('pointerup', zUp);
  zimg.addEventListener('pointercancel', zUp);

  /* ---------- controls ---------- */
  let t;
  $('q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; render(); }, 150); });
  $('status').onchange = (e) => { state.status = e.target.value; render(); };
  $('sort').onchange = (e) => { state.sort = e.target.value; render(); };
  $('year').textContent = new Date().getFullYear();
  const qs = new URLSearchParams(location.search).get('status');
  if (['available', 'sold', 'all'].includes(qs)) { state.status = qs; $('status').value = qs; }

  /* ---------- cookie notice ---------- */
  try {
    if (!localStorage.getItem('cookie_ok')) $('cookie').hidden = false;
  } catch { $('cookie').hidden = false; }
  $('cookieOk').onclick = () => {
    $('cookie').hidden = true;
    try { localStorage.setItem('cookie_ok', '1'); } catch { /* ignore */ }
  };

  /* ---------- AdSense (يشتغل تلقائي لما تملا ADSENSE_CLIENT في config.js) ---------- */
  // سياسة أدسنس: ممنوع إعلانات على صفحة فاضية أو من غير محتوى، فبنعرضها بس لما فيه منتجات ظاهرة
  let adsStarted = false;
  function syncAds(hasContent) {
    if (hasContent && !adsStarted) { adsStarted = true; initAds(); }
    if (adsStarted) ['adTop', 'adBottom'].forEach((id) => { const b = $(id); if (b.firstChild) b.hidden = !hasContent; });
  }
  function initAds() {
    if (!/^ca-pub-\d{10,20}$/.test(C.ADSENSE_CLIENT || '')) return;
    const s = h('script', { async: '', src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${C.ADSENSE_CLIENT}`, crossorigin: 'anonymous' });
    document.head.append(s);
    [['adTop', C.ADSENSE_SLOT_TOP], ['adBottom', C.ADSENSE_SLOT_BOTTOM]].forEach(([id, slot]) => {
      if (!/^\d{5,20}$/.test(slot || '')) return;
      const box = $(id);
      box.append(h('ins', { class: 'adsbygoogle', style: 'display:block', 'data-ad-client': C.ADSENSE_CLIENT, 'data-ad-slot': slot, 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' }));
      box.hidden = false;
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }

  load();
})();
