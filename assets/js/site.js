/* Radytec – comportamiento de la web estática (sustituye a los scripts de WordPress/Elementor). */
(function () {
  'use strict';

  var BREAK_POINT = 921; // mismo punto de corte que usaba el tema Astra
  var body = document.body;

  /* ---------- Marcar bloques para los ajustes de radytec-mejoras.css ---------- */
  function headingStarts(text) {
    return Array.prototype.filter.call(document.querySelectorAll('.elementor-heading-title'), function (h) {
      return h.textContent.trim().indexOf(text) === 0;
    });
  }
  function sectionOf(el) { return el && el.closest('.elementor-top-section'); }
  function mark(el, cls) { if (el) el.classList.add(cls); }

  function hasBgImage(el) { return getComputedStyle(el).backgroundImage !== 'none'; }
  var firstSection = document.querySelector('.elementor-top-section');
  if (firstSection && (hasBgImage(firstSection) ||
      Array.prototype.some.call(firstSection.querySelectorAll('.elementor-column, .elementor-widget-wrap, .elementor-background-overlay'), hasBgImage))) {
    mark(firstSection, 'rd-hero');
  }
  headingStarts('Contáctanos.').forEach(function (h) { mark(sectionOf(h), 'rd-cta'); });
  headingStarts('Expertos en Obras Hospitalarias').forEach(function (h) { mark(sectionOf(h), 'rd-band'); });
  headingStarts('Sobre Nosotros').forEach(function (h) { mark(sectionOf(h), 'rd-footer-links'); });
  document.querySelectorAll('img[src*="LOGOS"]').forEach(function (img) { mark(img.closest('.elementor-widget'), 'rd-logos'); });
  // Columnas con fondo propio (color, imagen o capa superpuesta): conservan su relleno original
  function paints(el) {
    if (!el) return false;
    var cs = getComputedStyle(el);
    return cs.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
  }
  document.querySelectorAll('.elementor-column').forEach(function (col) {
    var populated = col.querySelector(':scope > .elementor-element-populated, :scope > .elementor-column-wrap');
    var overlay = populated && populated.querySelector(':scope > .elementor-background-overlay');
    var wrap = col.querySelector(':scope .elementor-widget-wrap');
    if (paints(col) || paints(populated) || paints(overlay) || paints(wrap)) mark(col, 'rd-has-bg');
  });

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
        a11y: { enabled: true },
        observer: true,
        observeParents: true,
        // En móvil se ve una tarjeta cada vez: la altura se adapta a su texto
        autoHeight: window.innerWidth < 768 && widget.classList.contains('elementor-widget-testimonial-carousel')
      };
      var prev = widget.querySelector('.elementor-swiper-button-prev');
      var next = widget.querySelector('.elementor-swiper-button-next');
      if (prev && next) opts.navigation = { prevEl: prev, nextEl: next };
      var pag = widget.querySelector('.swiper-pagination');
      if (pag) opts.pagination = { el: pag, clickable: true, type: s.pagination === 'fraction' ? 'fraction' : 'bullets' };
      new window.Swiper(container, opts);
    });
  }

  /* ---------- Ventanas emergentes de Elementor ("Ver fotos") ---------- */
  var modal = null, modalBox = null, lastFocus = null;
  function closePopup() {
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    html.classList.remove('rd-modal-open');
    var current = modalBox.querySelector('.elementor-location-popup');
    if (current) { current.style.display = ''; document.body.appendChild(current); }
    if (lastFocus) lastFocus.focus();
  }
  function openPopup(id) {
    var popup = document.querySelector('.elementor-location-popup[data-elementor-id="' + id + '"]');
    if (!popup) return;
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'rd-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = '<div class="rd-modal__box"><button type="button" class="rd-modal__close" aria-label="Cerrar">&times;</button></div>';
      document.body.appendChild(modal);
      modalBox = modal.querySelector('.rd-modal__box');
      modal.addEventListener('click', function (e) { if (e.target === modal) closePopup(); });
      modal.querySelector('.rd-modal__close').addEventListener('click', closePopup);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });
    }
    lastFocus = document.activeElement;
    modalBox.appendChild(popup);
    popup.style.display = 'block';
    modal.classList.add('is-open');
    html.classList.add('rd-modal-open');
    popup.querySelectorAll('.swiper').forEach(function (s) {
      if (!s.swiper) return;
      s.swiper.update();
      if (s.swiper.params.loop) s.swiper.slideToLoop(0, 0); else s.swiper.slideTo(0, 0);
      if (s.swiper.autoplay) s.swiper.autoplay.start();
    });
    modal.querySelector('.rd-modal__close').focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#elementor-action"]');
    if (!a) return;
    e.preventDefault();
    try {
      var href = decodeURIComponent(a.getAttribute('href'));
      if (href.indexOf('popup:open') === -1) return;
      openPopup(JSON.parse(atob(href.split('settings=')[1])).id);
    } catch (err) { /* enlace sin datos válidos: no hacer nada */ }
  });

  /* ---------- Formularios: validación nativa + aviso al enviar ---------- */
  document.querySelectorAll('form.elementor-form').forEach(function (form) {
    // Tras enviar, Web3Forms redirige a la página "Gracias" del mismo sitio (github.io, radytec.es…)
    var redirect = form.querySelector('input[name="redirect"][data-gracias]');
    if (redirect && /^https?:$/.test(location.protocol)) {
      redirect.value = new URL(redirect.getAttribute('data-gracias'), location.href).href;
    }
    form.addEventListener('submit', function () {
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.classList.add('elementor-form-waiting'); }
    });
  });

  document.querySelectorAll('.rd-year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

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
