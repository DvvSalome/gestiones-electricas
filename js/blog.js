/* ============================================================
   Gestiones Eléctricas — Explorador de Blog
   Lógica dedicada para blog.html (búsqueda, filtros, modal, i18n, audio)
   ============================================================ */
(function () {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var doc = document;
  var lenis = null;
  
  // Referencias a elementos
  var gridEl = doc.getElementById('blog-grid');
  var noResultsEl = doc.getElementById('blog-no-results');
  var searchInput = doc.getElementById('blog-search');
  var filterButtons = doc.querySelectorAll('.filter-pill');
  
  var activeCategory = 'all';
  var activePostId = null;

  /* ---------- idioma (i18n) ---------- */
  var lang = localStorage.getItem('ge-lang') || 'es';
  
  function applyLang(l) {
    var dict = (window.GE_I18N && window.GE_I18N[l]) || {};
    doc.documentElement.lang = l;
    
    // Traducir textos estándar
    doc.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (dict[k] != null) el.textContent = dict[k];
    });
    
    // Traducir atributos aria-label
    doc.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      if (dict[k] != null) el.setAttribute('aria-label', dict[k]);
    });

    // Traducir placeholders
    doc.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-placeholder');
      if (dict[k] != null) el.setAttribute('placeholder', dict[k]);
    });

    lang = l;
    localStorage.setItem('ge-lang', l);
    
    // Volver a renderizar los posts con el idioma correcto
    if (gridEl) {
      renderPosts();
    }
    
    // Actualizar modal si está abierto
    if (activePostId) {
      updateModalContent(activePostId);
    }
  }

  // Inicializar idioma
  applyLang(lang);
  
  var toggle = doc.getElementById('lang-toggle');
  if (toggle) toggle.addEventListener('click', function () {
    applyLang(lang === 'es' ? 'en' : 'es');
  });

  /* ---------- año ---------- */
  var y = doc.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- menú móvil (burger) ---------- */
  var navEl = doc.getElementById('nav');
  var burger = doc.getElementById('nav-burger');
  var navLinks = doc.getElementById('nav-links');
  if (navEl && burger && navLinks) {
    var setMenu = function (o) {
      navEl.classList.toggle('is-open', o);
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    };
    burger.addEventListener('click', function () {
      setMenu(!navEl.classList.contains('is-open'));
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    doc.addEventListener('click', function (e) {
      if (navEl.classList.contains('is-open') && !navEl.contains(e.target)) setMenu(false);
    });
  }

  /* ---------- escena WebGL de fondo ---------- */
  var canvas = doc.getElementById('bg-canvas');
  var sceneOk = false;
  try { sceneOk = window.GEScene && window.GEScene.init(canvas); } catch (e) { sceneOk = false; }
  if (sceneOk) {
    if (window.GEScene.setIntensity) window.GEScene.setIntensity(0.3);
    if (window.GEScene.setNeuralMode) window.GEScene.setNeuralMode(0);
    if (window.GEScene.setTowersMode) window.GEScene.setTowersMode(1);
    if (window.GEScene.setPaused) window.GEScene.setPaused(false);
  } else if (canvas) {
    canvas.style.display = 'none';
    doc.body.style.background = 'radial-gradient(120% 90% at 50% 0%, #0f120a 0%, #060707 60%)';
  }

  /* ---------- Lenis (smooth scroll) ---------- */
  if (window.Lenis) {
    lenis = new Lenis({
      lerp: reduced ? 1 : 0.1,
      smoothWheel: !reduced,
      wheelMultiplier: 1
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Lógica de renderizado y filtros ---------- */
  function renderPosts() {
    if (!gridEl) return;
    
    var html = '';
    var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    var categoryMapping = {
      'solar': ['energía solar', 'solar energy'],
      'subestaciones': ['subestaciones', 'substations', 'transformadores', 'transformers'],
      'tierra': ['puesta a tierra', 'grounding'],
      'mantenimiento': ['mantenimiento', 'maintenance', 'soporte técnico', 'technical support'],
      'eficiencia': ['eficiencia energética', 'energy efficiency', 'trámites / gestión', 'utility permits', 'sector eléctrico', 'electrical sector', 'redes eléctricas', 'electrical grids', 'ingeniería', 'engineering']
    };

    var filtered = (window.GE_BlogPosts || []).filter(function (post) {
      // Filtrar por categoría
      if (activeCategory !== 'all') {
        var postCatEs = (post.category['es'] || '').toLowerCase();
        var postCatEn = (post.category['en'] || '').toLowerCase();
        var allowedCategories = categoryMapping[activeCategory] || [];
        var match = allowedCategories.some(function (cat) {
          return postCatEs === cat || postCatEn === cat;
        });
        if (!match) return false;
      }
      
      // Filtrar por búsqueda
      if (query) {
        var titleMatch = (post.title[lang] || '').toLowerCase().indexOf(query) >= 0;
        var descMatch = (post.desc[lang] || '').toLowerCase().indexOf(query) >= 0;
        var contentMatch = (post.content[lang] || '').toLowerCase().indexOf(query) >= 0;
        return titleMatch || descMatch || contentMatch;
      }
      
      return true;
    });

    if (filtered.length === 0) {
      if (noResultsEl) noResultsEl.style.display = 'block';
      gridEl.innerHTML = '';
      return;
    }
    
    if (noResultsEl) noResultsEl.style.display = 'none';

    filtered.forEach(function (post) {
      var title = post.title[lang] || post.title['es'] || '';
      var desc = post.desc[lang] || post.desc['es'] || '';
      var category = post.category[lang] || post.category['es'] || '';
      var city = post.city[lang] || post.city['es'] || '';
      var readMore = lang === 'en' ? 'Read article →' : 'Leer artículo →';
      
      html += 
        '<article class="blog__card reveal panel" data-post-id="' + post.id + '" style="cursor:pointer; opacity:1; transform:none">' +
        '  <div class="blog__card-media" style="position:relative;overflow:hidden;border-radius:12px;aspect-ratio:16/10">' +
        '    <img src="' + post.image + '" alt="' + title + '" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;transition:transform .4s var(--ease)" />' +
        '    <span class="blog__card-tag" style="position:absolute;top:12px;left:12px;background:rgba(8,9,8,.75);backdrop-filter:blur(6px);border:1px solid var(--line);padding:4px 10px;border-radius:999px;font-size:0.75rem;font-weight:600;color:var(--lime)">' + category + '</span>' +
        '  </div>' +
        '  <div class="blog__card-body" style="padding:1.4rem 0.5rem 0.5rem">' +
        '    <span class="blog__card-meta" style="font-family:var(--font-mono);font-size:0.75rem;color:var(--muted-2);display:block;margin-bottom:0.6rem">' +
        post.read_time + ' · <span>' + city + '</span>' +
        '    </span>' +
        '    <h3 style="font-size:1.3rem;margin-bottom:0.7rem;line-height:1.2;color:#fff">' + title + '</h3>' +
        '    <p style="font-size:0.95rem;color:var(--muted);margin-bottom:1.2rem">' + desc + '</p>' +
        '    <button class="blog__card-btn" style="background:none;border:none;color:var(--lime);font-weight:600;font-size:0.9rem;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:0.4rem">' + readMore + '</button>' +
        '  </div>' +
        '</article>';
    });

    gridEl.innerHTML = html;
    
    // Evento click en tarjetas
    gridEl.querySelectorAll('.blog__card').forEach(function (card) {
      card.addEventListener('click', function () {
        var postId = card.getAttribute('data-post-id');
        openModal(postId);
      });
    });
  }

  // Listeners de búsqueda y filtrado
  if (searchInput) {
    searchInput.addEventListener('input', renderPosts);
  }

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterButtons.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      activeCategory = btn.getAttribute('data-category');
      renderPosts();
    });
  });

  /* ---------- Modal de Lectura ---------- */
  var blogModal = doc.getElementById('blog-modal');
  var blogModalContent = doc.getElementById('blog-modal-content');
  var blogModalClose = blogModal ? blogModal.querySelector('.blog-modal__close') : null;
  var blogModalOverlay = blogModal ? blogModal.querySelector('.blog-modal__overlay') : null;

  function updateModalContent(postId) {
    if (!blogModalContent) return;
    
    // Posts dinámicos
    var post = (window.GE_BlogPosts || []).find(function(p) { return p.id === postId; });
    if (post) {
      var content = post.content[lang] || post.content['es'] || '';
      var titleText = post.title[lang] || post.title['es'] || '';
      var categoryText = post.category[lang] || post.category['es'] || '';
      var authorMeta = lang === 'en' ? 'Engineering Department' : 'Departamento de Ingeniería';
      var authorTitle = 'Gestiones Eléctricas SAS';
      var readTimeMeta = lang === 'en' ? post.read_time : post.read_time.toLowerCase().replace('min read', 'min de lectura');
      
      var htmlContent = "<article class='post-content'><header class='post-header'>";
      htmlContent += "<span class='post-cat' style='color:var(--lime); font-family:\"DM Mono\",monospace; font-size:0.72rem; letter-spacing:0.22em; text-transform:uppercase;'>" + categoryText + "</span>";
      htmlContent += "<h1 style='font-size: clamp(1.8rem, 4vw, 2.8rem); line-height: 1.1; margin-top: 0.8rem; margin-bottom:1rem; color:#fff'>" + titleText + "</h1>";
      htmlContent += "<div class='post-meta' style='font-family:\"DM Mono\",monospace; font-size:0.82rem; color:var(--muted-2); margin-top:0.5rem; margin-bottom:1.5rem;'>" + readTimeMeta + "</div>";
      htmlContent += "<div class='author-box' style='display:flex; align-items:center; gap:12px; margin-top:1.5rem; margin-bottom: 2rem; padding:12px 18px; background:rgba(255, 255, 255, 0.03); border:1px solid var(--line); border-radius:12px; max-width:fit-content;'>";
      htmlContent += "  <div class='author-avatar' style='width:44px; height:44px; border-radius:50%; background:var(--lime); color:#0A0A0A; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1rem; font-family:\"DM Sans\",sans-serif;'>GE</div>";
      htmlContent += "  <div class='author-info' style='text-align:left;'>";
      htmlContent += "    <h4 style='font-size:0.9rem; color:#fff; margin:0; font-weight:600;'>" + authorMeta + "</h4>";
      htmlContent += "    <p style='font-size:0.78rem; color:var(--muted-2); margin:0; line-height:1.2;'>" + authorTitle + "</p>";
      htmlContent += "  </div>";
      htmlContent += "</div>";
      htmlContent += "</header>" + content + "</article>";
      
      blogModalContent.innerHTML = htmlContent;
    }
  }

  function openModal(postId) {
    if (!blogModal) return;
    updateModalContent(postId);
    blogModal.classList.add('is-open');
    blogModal.setAttribute('aria-hidden', 'false');
    activePostId = postId;
    doc.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    
    // Actualizar hash de la url de forma limpia
    try {
      history.pushState(null, null, '#' + postId);
    } catch(e) {}
  }

  function closeModal() {
    if (!blogModal) return;
    blogModal.classList.remove('is-open');
    blogModal.setAttribute('aria-hidden', 'true');
    activePostId = null;
    doc.body.style.overflow = '';
    if (lenis) lenis.start();
    
    // Limpiar hash de la url
    try {
      history.pushState(null, null, window.location.pathname + window.location.search);
    } catch(e) {}
  }

  if (blogModalClose) blogModalClose.addEventListener('click', closeModal);
  if (blogModalOverlay) blogModalOverlay.addEventListener('click', closeModal);

  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && blogModal && blogModal.classList.contains('is-open')) {
      closeModal();
    }
  });

  /* ---------- Sonido y Audio ---------- */
  var sndBtn = doc.getElementById('sound-toggle');
  var sndOn = localStorage.getItem('ge-sound') === 'on';
  
  var applySound = function () {
    if (sndBtn) {
      sndBtn.classList.toggle('is-on', sndOn);
      sndBtn.setAttribute('aria-pressed', String(sndOn));
    }
  };
  
  applySound();
  
  if (sndBtn) {
    sndBtn.addEventListener('click', function () {
      sndOn = !sndOn;
      localStorage.setItem('ge-sound', sndOn ? 'on' : 'off');
      if (window.GEAudio) {
        if (sndOn) window.GEAudio.enable();
        else window.GEAudio.disable();
      }
      applySound();
    });
  }

  /* ---------- Carga inicial y Deep Linking ---------- */
  function init() {
    renderPosts();
    
    // Revisar hash para deep linking
    var hash = window.location.hash;
    if (hash && hash.length > 1) {
      var cleanHash = hash.substring(1);
      var postExists = (window.GE_BlogPosts || []).some(function(p) { return p.id === cleanHash; });
      if (postExists || cleanHash === 'solar-barranquilla' || cleanHash === 'subestaciones-costa' || cleanHash === 'puesta-tierra') {
        setTimeout(function() {
          openModal(cleanHash);
        }, 300);
      }
    }
  }

  if (doc.readyState === 'complete' || doc.readyState === 'interactive') init();
  else doc.addEventListener('DOMContentLoaded', init);
})();
