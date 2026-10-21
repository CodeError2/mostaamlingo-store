// قائمة المقالات الديناميكية: بتقرا data/articles.json وتدعم البحث
(() => {
  const list = document.getElementById('blogList');
  const input = document.getElementById('blogSearch');
  if (!list) return;
  let all = [];
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const date = (d) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  function card(a) {
    const art = h('article', 'acard');
    const link = h('a');
    link.href = `blog/${encodeURIComponent(a.slug)}.html`;
    link.append(h('span', 'acat', a.category), h('h2', '', a.title), h('p', '', a.description), h('span', 'ameta', `${date(a.date)} • قراءة ${a.minutes} دقائق`));
    art.append(link);
    return art;
  }
  function render() {
    const q = (input?.value || '').trim().toLowerCase();
    const items = all.filter((a) => !q || `${a.title} ${a.description} ${a.category}`.toLowerCase().includes(q));
    list.replaceChildren(...(items.length ? items.map(card) : [h('p', 'msg', 'مفيش مقالات مطابقة للبحث.')]));
  }
  fetch('data/articles.json').then((r) => r.json()).then((d) => { all = d; render(); }).catch(() => { /* الصفحة فيها نسخة ثابتة جاهزة */ });
  if (input) input.addEventListener('input', render);
})();
