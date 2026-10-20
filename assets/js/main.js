/* Radytec Innovación — interacción de la web (sin dependencias). */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;

  /* ---------- Cabecera: sombra al hacer scroll ---------- */
  var header = document.querySelector('.header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('.nav-toggle');
  function setNav(open) {
    if (open && header) root.style.setProperty('--nav-top', Math.max(0, header.getBoundingClientRect().bottom) + 'px');
    body.classList.toggle('nav-open', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    }
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setNav(!body.classList.contains('nav-open')); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 960) setNav(false); });

  // Desplegable "Servicios": clic en móvil y teclado en escritorio
  document.querySelectorAll('.nav__item--drop').forEach(function (item) {
    var btn = item.querySelector('.nav__link');
    btn.addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget) && window.innerWidth > 960) {
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });
  // Al pulsar un enlace interno del menú móvil, se cierra
  document.querySelectorAll('.nav a').forEach(function (a) {
    a.addEventListener('click', function () { setNav(false); });
  });

  /* ---------- Aparición suave de bloques ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Visor de fotos ---------- */
  var galleries = {};
  document.querySelectorAll('script[type="application/json"][data-gallery]').forEach(function (s) {
    try { galleries[s.getAttribute('data-gallery')] = JSON.parse(s.textContent); } catch (e) { /* datos no válidos */ }
  });
  var lb = null, lbImg, lbCap, lbCount, current = [], index = 0, lastFocus = null;
  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Galería de fotos');
    lb.innerHTML =
      '<span class="lightbox__count"></span>' +
      '<button type="button" class="lightbox__btn lightbox__close" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '<button type="button" class="lightbox__btn lightbox__prev" aria-label="Foto anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="lightbox__btn lightbox__next" aria-label="Foto siguiente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>';
    body.appendChild(lb);
    lbImg = lb.querySelector('img');
    lbCap = lb.querySelector('figcaption');
    lbCount = lb.querySelector('.lightbox__count');
    lb.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    lb.querySelector('.lightbox__prev').addEventListener('click', function () { show(index - 1); });
    lb.querySelector('.lightbox__next').addEventListener('click', function () { show(index + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    var startX = null;
    lb.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    });
  }
  function show(i) {
    index = (i + current.length) % current.length;
    var item = current[index];
    lbImg.src = item.src;
    lbImg.alt = item.alt || '';
    lbCap.textContent = item.caption || '';
    lbCount.textContent = (index + 1) + ' / ' + current.length;
    // precarga la siguiente
    var next = new Image();
    next.src = current[(index + 1) % current.length].src;
  }
  function openLightbox(name, start) {
    if (!galleries[name]) return;
    if (!lb) buildLightbox();
    current = galleries[name];
    lastFocus = document.activeElement;
    show(start || 0);
    lb.classList.add('is-open');
    root.classList.add('no-scroll');
    lb.querySelector('.lightbox__close').focus();
  }
  function closeLightbox() {
    lb.classList.remove('is-open');
    root.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('[data-open-gallery]').forEach(function (btn) {
    btn.addEventListener('click', function () { openLightbox(btn.getAttribute('data-open-gallery')); });
  });

  /* ---------- Formulario de contacto (Web3Forms) ---------- */
  document.querySelectorAll('form[data-contact-form]').forEach(function (form) {
    var redirect = form.querySelector('input[name="redirect"]');
    var thanksUrl = new URL(form.getAttribute('data-thanks'), location.href).href;
    if (redirect && /^https?:$/.test(location.protocol)) redirect.value = thanksUrl;
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      if (!window.fetch || !window.FormData) return; // sin JS moderno: envío normal
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      button.classList.add('is-loading');
      button.disabled = true;
      if (status) { status.className = 'form-status'; status.textContent = ''; }
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
        .then(function (data) {
          if (data && data.success) { window.location.href = thanksUrl; return; }
          throw new Error((data && data.message) || 'Error');
        })
        .catch(function () {
          button.classList.remove('is-loading');
          button.disabled = false;
          if (status) {
            status.className = 'form-status is-error';
            status.textContent = 'No hemos podido enviar el mensaje. Inténtalo de nuevo o escríbenos a info@radytec.es.';
          }
        });
    });
  });

  /* ---------- Año del pie ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

/* Al abrir la web como archivo local (doble clic), los enlaces a carpetas necesitan "index.html". */
(function () {
  if (location.protocol !== 'file:') return;
  document.querySelectorAll('a[href]').forEach(function (a) {
    var h = a.getAttribute('href');
    if (/^(https?:|mailto:|tel:|#)/.test(h)) return;
    var parts = h.split('#');
    if (parts[0] === '' && parts.length > 1) return;
    if (parts[0] === '' || parts[0] === './' || parts[0].slice(-1) === '/') {
      parts[0] = (parts[0] === './' ? '' : parts[0]) + 'index.html';
      a.setAttribute('href', parts.join('#'));
    }
  });
})();
