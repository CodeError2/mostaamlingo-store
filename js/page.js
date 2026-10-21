// سكربت الصفحات الثابتة (من نحن / اتصل بنا / ...)
(() => {
  const C = window.STORE_CONFIG || {};
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
  document.querySelectorAll('.upd').forEach((e) => {
    e.textContent = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  });
  const wa = document.getElementById('wa');
  if (wa) wa.href = `https://wa.me/${encodeURIComponent(C.WHATSAPP || '')}`;
  const mail = document.getElementById('mail');
  if (mail && !C.CONTACT_EMAIL && mail.previousElementSibling) { mail.parentElement.hidden = true; if (mail.parentElement.previousElementSibling) mail.parentElement.previousElementSibling.hidden = true; }
  if (mail && /^[^\s@<>"']+@[^\s@<>"']+$/.test(C.CONTACT_EMAIL || '')) {
    mail.textContent = C.CONTACT_EMAIL;
    mail.href = `mailto:${C.CONTACT_EMAIL}`;
  }
})();
