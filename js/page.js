// سكربت الصفحات الثابتة (من نحن / اتصل بنا / المدونة ...)
(() => {
  const C = window.STORE_CONFIG || {};
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  const wa = document.getElementById('wa');
  if (wa) wa.href = `https://wa.me/${encodeURIComponent(C.WHATSAPP || '')}`;

  // الإيميل: يظهر فقط لو اتحط في config.js
  const mail = document.getElementById('mail');
  if (mail) {
    if (/^[^\s@<>"']+@[^\s@<>"']+$/.test(C.CONTACT_EMAIL || '')) {
      mail.textContent = C.CONTACT_EMAIL;
      mail.href = `mailto:${C.CONTACT_EMAIL}`;
    } else {
      const sec = mail.closest('section');
      if (sec) sec.hidden = true;
    }
  }

  const consent = {
    get() {
      try { if (localStorage.getItem('cookie_ok')) return true; } catch { /* ignore */ }
      return /(?:^|; )cookie_ok=1/.test(document.cookie);
    },
    set() {
      try { localStorage.setItem('cookie_ok', '1'); } catch { /* ignore */ }
      document.cookie = 'cookie_ok=1; max-age=31536000; path=/; SameSite=Lax';
    },
  };

  // تنويه الكوكيز في كل الصفحات (الصفحة الرئيسية بيها تنويهها الخاص)
  if (!document.getElementById('cookie')) {
    if (!consent.get()) {
      const box = document.createElement('div');
      box.className = 'cookie';
      const span = document.createElement('span');
      span.append('الموقع بيستخدم ملفات تعريف الارتباط لتحسين التجربة وعرض إعلانات. ');
      const a = document.createElement('a');
      a.href = document.querySelector('a[href$="privacy.html"]')?.getAttribute('href') || 'privacy.html';
      a.textContent = 'اعرف أكتر';
      span.append(a);
      const b = document.createElement('button');
      b.textContent = 'تمام';
      b.onclick = () => { box.remove(); consent.set(); };
      box.append(span, b);
      document.body.append(box);
    }
  }
})();
