/* Radytec – comportamiento de la web estática (sustituye a los scripts de WordPress/Elementor). */
(function () {
  'use strict';

  var BREAK_POINT = 921; // mismo punto de corte que usaba el tema Astra
  var body = document.body;

  /* ---------- Cabecera de escritorio / móvil (clases que ponía Astra) ---------- */
  function updateBreakPoint() {
    var mobile = window.innerWidth <= BREAK_POINT;
    body.classList.toggle('ast-header-break-point', mobile);
    body.classList.toggle('ast-desktop', !mobile);
    if (!mobile) closeMenu();
  }

  /* ---------- Menú móvil ---------- */
  var toggleBtn = document.querySelector('.main-header-menu-toggle');
  var nav = document.querySelector('.main-header-bar-navigation');

  var html = document.documentElement;

  // Menú lateral (flyout) de Astra: se abre con clases en <html> y se cierra con la X o pulsando fuera
  function setMenu(open) {
    if (!toggleBtn || !nav) return;
    toggleBtn.classList.toggle('toggled', open);
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('toggle-on', open);
    body.classList.toggle('ast-main-header-nav-open', open);
    html.classList.toggle('ast-flyout-menu-overlay', open);
    html.classList.toggle('ast-offcanvas-active', open);
  }
  function closeMenu() { setMenu(false); }

  if (toggleBtn && nav) {
    var close = document.createElement('div');
    close.className = 'close';
    close.setAttribute('role', 'button');
    close.setAttribute('aria-label', 'Cerrar menú');
    nav.insertBefore(close, nav.firstChild);
    close.addEventListener('click', closeMenu);
    nav.addEventListener('click', function (e) { if (e.target === nav) closeMenu(); });
    toggleBtn.addEventListener('click', function () {
      setMenu(!toggleBtn.classList.contains('toggled'));
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  // Submenús: en móvil se despliegan con el botón o con el enlace sin destino
  document.querySelectorAll('.main-header-menu .menu-item-has-children').forEach(function (li) {
    var btn = li.querySelector(':scope > .ast-menu-toggle');
    var link = li.querySelector(':scope > .menu-link');
    var sub = li.querySelector(':scope > .sub-menu');
    function toggleSub(e) {
      if (!body.classList.contains('ast-header-break-point')) return;
      e.preventDefault();
      var open = !li.classList.contains('ast-submenu-expanded');
      li.classList.toggle('ast-submenu-expanded', open);
      if (sub) sub.style.display = open ? 'block' : '';
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (btn) btn.addEventListener('click', toggleSub);
    if (link && !link.getAttribute('href')) link.addEventListener('click', toggleSub);
  });

  // Submenús en escritorio: también accesibles con teclado
  document.querySelectorAll('.main-header-menu .menu-item').forEach(function (li) {
    li.addEventListener('focusin', function () { li.classList.add('focus'); });
    li.addEventListener('focusout', function () { li.classList.remove('focus'); });
  });

  updateBreakPoint();
  window.addEventListener('resize', updateBreakPoint);

  /* ---------- Acordeones (widget "toggle" de Elementor) ---------- */
  document.querySelectorAll('.elementor-toggle .elementor-tab-title').forEach(function (title) {
    var content = document.getElementById(title.getAttribute('aria-controls'));
    if (!content) return;
    function toggle() {
      var open = !title.classList.contains('elementor-active');
      title.classList.toggle('elementor-active', open);
      content.classList.toggle('elementor-active', open);
      title.setAttribute('aria-expanded', open ? 'true' : 'false');
      content.style.display = open ? 'block' : 'none';
    }
    title.addEventListener('click', toggle);
    title.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  /* ---------- Carruseles (testimonios y slides) ---------- */
  function settingsOf(el) {
    try { return JSON.parse(el.getAttribute('data-settings') || '{}'); } catch (e) { return {}; }
  }
  function size(v, def) { return v && typeof v.size === 'number' ? v.size : def; }

  if (window.Swiper) {
    document.querySelectorAll('.elementor-widget-testimonial-carousel, .elementor-widget-slides, .elementor-widget-image-carousel').forEach(function (widget) {
      var container = widget.querySelector('.swiper, .swiper-container');
      if (!container) return;
      var s = settingsOf(widget);
      var perView = parseInt(s.slides_per_view || (widget.classList.contains('elementor-widget-slides') ? 1 : 3), 10) || 1;
      var perViewTablet = parseInt(s.slides_per_view_tablet, 10) || Math.min(perView, 2);
      var perViewMobile = parseInt(s.slides_per_view_mobile, 10) || 1;
      var autoplay = s.autoplay === 'yes' || s.autoplay === undefined && widget.classList.contains('elementor-widget-slides');
      var opts = {
        loop: s.loop === 'yes' || s.infinite === 'yes',
        speed: s.speed || s.transition_speed || 500,
        effect: s.transition === 'fade' ? 'fade' : 'slide',
        slidesPerView: perViewMobile,
        spaceBetween: size(s.space_between_mobile, size(s.space_between, 10)),
        breakpoints: {
          768: { slidesPerView: perViewTablet, spaceBetween: size(s.space_between_tablet, size(s.space_between, 10)) },
          1025: { slidesPerView: perView, spaceBetween: size(s.space_between, 10) }
        },
        autoplay: autoplay ? {
          delay: s.autoplay_speed || 5000,
          pauseOnMouseEnter: s.pause_on_hover === 'yes',
          disableOnInteraction: s.pause_on_interaction === 'yes'
        } : false,
        a11y: { enabled: true }
      };
      var prev = widget.querySelector('.elementor-swiper-button-prev');
      var next = widget.querySelector('.elementor-swiper-button-next');
      if (prev && next) opts.navigation = { prevEl: prev, nextEl: next };
      var pag = widget.querySelector('.swiper-pagination');
      if (pag) opts.pagination = { el: pag, clickable: true, type: s.pagination === 'fraction' ? 'fraction' : 'bullets' };
      new window.Swiper(container, opts);
    });
  }

  /* ---------- Formularios: validación nativa + aviso al enviar ---------- */
  document.querySelectorAll('form.elementor-form').forEach(function (form) {
    form.addEventListener('submit', function () {
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.classList.add('elementor-form-waiting'); }
    });
  });

  /* ---------- Fondos con carga diferida (Elementor) ---------- */
  document.querySelectorAll('.e-con.e-parent, .elementor-section').forEach(function (el) {
    el.classList.add('e-lazyloaded');
  });
  document.querySelectorAll('.elementor-invisible').forEach(function (el) {
    el.classList.remove('elementor-invisible');
  });
})();

/* Al abrir la web como archivo local (doble clic), los enlaces a carpetas necesitan "index.html". */
(function () {
  if (location.protocol !== 'file:') return;
  document.querySelectorAll('a[href]').forEach(function (a) {
    var h = a.getAttribute('href');
    if (/^(https?:|mailto:|tel:|#)/.test(h)) return;
    var parts = h.split('#');
    if (parts[0] === '' || parts[0].slice(-1) === '/' || parts[0] === '.' || parts[0] === './') {
      parts[0] = (parts[0] === '.' || parts[0] === './' ? '' : parts[0]) + 'index.html';
      a.setAttribute('href', parts.join('#'));
    }
  });
})();
