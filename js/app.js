/* ============================================================
   Gestiones Eléctricas — orquestación
   Lenis (smooth scroll) + GSAP ScrollTrigger + escena WebGL
   ============================================================ */
(function () {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Táctil / pantalla pequeña: el scroll-scrub con seek de <video> bloquea el
  // scroll en iOS. En ese modo los videos corren en autoplay-loop (sin pin).
  var mobileMode = !!(window.matchMedia && window.matchMedia('(max-width: 720px), (pointer: coarse)').matches);
  var doc = document;

  /* ---------- idioma ---------- */
  var lang = localStorage.getItem('ge-lang') || 'es';
  function applyLang(l) {
    var dict = (window.GE_I18N && window.GE_I18N[l]) || {};
    doc.documentElement.lang = l;
    doc.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (dict[k] != null) el.textContent = dict[k];
    });
    lang = l;
    localStorage.setItem('ge-lang', l);
    if (window.GE_onLangChange) {
      try { window.GE_onLangChange(l); } catch (e) {}
    }
  }
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

  /* ---------- escena WebGL ---------- */
  var canvas = doc.getElementById('bg-canvas');
  var sceneOk = false;
  try { sceneOk = window.GEScene && window.GEScene.init(canvas); } catch (e) { sceneOk = false; }
  if (!sceneOk && canvas) {
    canvas.style.display = 'none';
    doc.body.style.background = 'radial-gradient(120% 90% at 50% 0%, #0f120a 0%, #060707 60%)';
  }

  /* ---------- GSAP / ScrollTrigger / Lenis ---------- */
  function boot() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    var lenis = null;
    if (window.Lenis) {
      lenis = new Lenis({
        lerp: reduced ? 1 : 0.1,
        smoothWheel: !reduced,
        wheelMultiplier: 1
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      // anclas suaves
      doc.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href');
          if (id.length < 2) return;
          var t = doc.querySelector(id);
          if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: 0, duration: reduced ? 0 : 1.2 }); }
        });
      });
    }

    /* progreso global → cámara + veil + nav */
    var nav = doc.getElementById('nav');
    var veil = doc.getElementById('scene-veil');
    var sections = Array.prototype.slice.call(doc.querySelectorAll('section[data-veil]'));
    var lastVeil = -1, veilMul = 1, energyBias = 0;
    var activeSection = sections[0] || null;

    // Aplica veil + intensidad de UNA sección (sin leer layout por frame).
    function applySection(sec) {
      if (!sec) return;
      activeSection = sec;
      if (veil) {
        var v = parseFloat(sec.getAttribute('data-veil')) * veilMul;
        v = Math.max(0, Math.min(0.95, v));
        if (v !== lastVeil) { veil.style.opacity = v; lastVeil = v; }
      }
      if (sceneOk && window.GEScene.setIntensity) {
        var bi = parseFloat(sec.getAttribute('data-intensity'));
        if (!isNaN(bi)) window.GEScene.setIntensity(Math.max(0, Math.min(1, bi + energyBias)));
      }
      // En la sección de IA: ocultar torres y mostrar la malla neuronal.
      if (sceneOk && window.GEScene.setNeuralMode) {
        window.GEScene.setNeuralMode(sec.id === 'ia' ? 1 : 0);
      }
      // En la sección de proyectos (Dashboard): ocultar las torres.
      if (sceneOk && window.GEScene.setTowersMode) {
        window.GEScene.setTowersMode(sec.id === 'proyectos' ? 0 : 1);
      }
    }

    // Un trigger por sección: dispara solo al cruzar el centro del viewport.
    sections.forEach(function (sec) {
      ScrollTrigger.create({
        trigger: sec, start: 'top center', end: 'bottom center',
        onToggle: function (self) { if (self.isActive) applySection(sec); }
      });
    });

    ScrollTrigger.create({
      trigger: doc.body, start: 'top top', end: 'bottom bottom',
      onUpdate: function (self) {
        if (sceneOk) window.GEScene.setProgress(self.progress);
        if (nav) nav.classList.toggle('scrolled', self.scroll() > 50);
      }
    });
    applySection(activeSection);

    /* ---- API para el panel de Tweaks (atmósfera) ---- */
    window.GEApp = {
      setVeil: function (m) { veilMul = m; lastVeil = -1; applySection(activeSection); },
      setSmooth: function (l) { if (lenis) { if (lenis.options) lenis.options.lerp = l; lenis.lerp = l; } },
      setEnergyBias: function (b) { energyBias = b; applySection(activeSection); }
    };

    /* reveals — contenido visible por defecto; GSAP anima la entrada.
       - En viewport al cargar: se muestran al instante (nunca ocultos).
       - Bajo el pliegue: entran al hacer scroll (immediateRender:false). */
    if (!reduced && window.gsap) {
      var delayOf = function (el) {
        if (el.classList.contains('d3')) return 0.24;
        if (el.classList.contains('d2')) return 0.16;
        if (el.classList.contains('d1')) return 0.08;
        return 0;
      };
      gsap.utils.toArray('.reveal').forEach(function (el) {
        var r = el.getBoundingClientRect();
        var inView = r.top < window.innerHeight * 0.92;
        if (inView) {
          gsap.from(el, { opacity: 0, y: 30, duration: 0.9, ease: 'power2.out', delay: 0.1 + delayOf(el) });
        } else {
          gsap.from(el, {
            opacity: 0, y: 34, duration: 0.9, ease: 'power2.out',
            // ponytail: removed immediateRender: false so elements start at opacity 0 immediately on load and do not flash when entering viewport
            delay: delayOf(el),
            scrollTrigger: { trigger: el, start: 'top 88%' }
          });
        }
      });
    }

    /* contadores */
    doc.querySelectorAll('.stat-count').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-target'), 10) || 0;
      if (reduced) { el.textContent = target; return; }
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () {
          var obj = { v: 0 };
          gsap.to(obj, {
            v: target, duration: 1.6, ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.round(obj.v); }
          });
        }
      });
    });

    /* ---- toggle de sonido (audio anclado al viaje) ---- */
    var sndBtn = doc.getElementById('sound-toggle');
    var sndOn = localStorage.getItem('ge-sound') === 'on';
    var viajeActive = false;
    var applySound = function () { if (sndBtn) { sndBtn.classList.toggle('is-on', sndOn); sndBtn.setAttribute('aria-pressed', String(sndOn)); } };
    applySound();
    if (sndBtn) sndBtn.addEventListener('click', function () {
      sndOn = !sndOn;
      localStorage.setItem('ge-sound', sndOn ? 'on' : 'off');
      if (window.GEAudio) {
        if (sndOn) { window.GEAudio.enable(); window.GEAudio.setAmbient(viajeActive ? 1 : 0); }
        else { window.GEAudio.disable(); }
      }
      applySound();
    });

    /* ---- viaje de la energía: reproducción guiada por scroll ----
       Seeking frame-a-frame es entrecortado en videos con keyframes escasos.
       En su lugar REPRODUCIMOS hacia adelante (decodificación fluida) hacia el
       tiempo objetivo que marca el scroll; solo el scroll hacia arriba hace seek. */
    /* ---- global canvas rendering and frame preloader helpers ---- */
    function drawFrame(canvas, ctx, img) {
      if (!img || !img.naturalWidth) return;
      var W = canvas.clientWidth;
      var H = canvas.clientHeight;
      var DPR = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(W * DPR) || canvas.height !== Math.round(H * DPR)) {
        canvas.width = Math.round(W * DPR);
        canvas.height = Math.round(H * DPR);
      }
      var iw = img.naturalWidth, ih = img.naturalHeight;
      var cw = canvas.width, ch = canvas.height;
      var cr = cw / ch, ir = iw / ih;
      var sx, sy, sw, sh;
      if (cr > ir) { sw = iw; sh = iw / cr; sx = 0; sy = (ih - sh) / 2; }
      else { sh = ih; sw = ih * cr; sx = (iw - sw) / 2; sy = 0; }
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    }

    function preloadFrames(prefix, count, array, callback) {
      // 1. Load only the first frame immediately to render initial canvas state
      var firstImg = new Image();
      firstImg.onload = function() {
        array[0] = firstImg;
        if (callback) callback();
        
        // 2. Defer loading of remaining frames until page has fully loaded
        var startDeferredLoad = function() {
          var idx = 1;
          function loadBatch() {
            if (idx >= count) return;
            var batchEnd = Math.min(idx + 10, count);
            for (; idx < batchEnd; idx++) {
              (function(i) {
                var img = new Image();
                img.onload = function() { array[i] = img; };
                img.src = 'assets/frames/' + prefix + '/f_' + String(i + 1).padStart(3, '0') + '.webp';
              })(idx);
            }
            if (idx < count) {
              // Use a 50ms interval between batches to prevent network congestion
              setTimeout(loadBatch, 50);
            }
          }
          // Start background loading after 300ms idle time
          setTimeout(loadBatch, 300);
        };

        if (document.readyState === 'complete') {
          startDeferredLoad();
        } else {
          window.addEventListener('load', startDeferredLoad);
        }
      };
      firstImg.onerror = function() {
        if (callback) callback();
      };
      firstImg.src = 'assets/frames/' + prefix + '/f_001.webp';
    }

    /* ---- viaje de la energía: secuencia de imágenes en canvas ---- */
    var flowCanvas = doc.getElementById('drive-canvas');
    var flowCtx = flowCanvas ? flowCanvas.getContext('2d', { alpha: false }) : null;
    var flowFrames = [];
    var flowFrameCount = 192;
    var lastDrawnFlowFrame = 0;

    if (flowCanvas && flowCtx) {
      preloadFrames('flow', flowFrameCount, flowFrames, function() {
        if (flowFrames[0]) drawFrame(flowCanvas, flowCtx, flowFrames[0]);
      });

      var stages = doc.querySelectorAll('#viaje .drive__stage');
      var dots = doc.querySelectorAll('#viaje .drive__dot');
      var curStage = -1;
      var setStage = function (i) {
        if (i === curStage) return; curStage = i;
        stages.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
        dots.forEach(function (d, idx) { d.classList.toggle('is-active', idx <= i); });
        if (sndOn && viajeActive && window.GEAudio) window.GEAudio.chime(i);
      };
      
      var bounds = [0.125, 0.219, 0.581, 0.800];
      var stageForFrac = function (f) {
        for (var i = 0; i < bounds.length; i++) { if (f < bounds[i]) return i; }
        return 4;
      };

      if (mobileMode) {
        var curFrame = 0;
        var animId = null;
        var fps = 24;
        var fpsInterval = 1000 / fps;
        var lastTime = performance.now();
        var animLoop = function(currentTime) {
          if (!viajeActive) { animId = null; return; }
          animId = requestAnimationFrame(animLoop);
          var elapsed = currentTime - lastTime;
          if (elapsed >= fpsInterval) {
            lastTime = currentTime - (elapsed % fpsInterval);
            curFrame = (curFrame + 1) % flowFrameCount;
            var img = flowFrames[curFrame];
            if (img) drawFrame(flowCanvas, flowCtx, img);
          }
        };

        ScrollTrigger.create({
          trigger: '#viaje', start: 'top 80%', end: 'bottom 20%',
          onToggle: function (self) {
            viajeActive = self.isActive;
            if (window.GEAudio && sndOn) window.GEAudio.setAmbient(self.isActive ? 1 : 0);
            if (self.isActive) {
              if (!animId) {
                lastTime = performance.now();
                animLoop(lastTime);
              }
            }
          }
        });
      } else {
        ScrollTrigger.create({
          trigger: '#viaje', start: 'top top', end: '+=3400',
          pin: true, scrub: true, anticipatePin: 1, refreshPriority: 1,
          onToggle: function (self) {
            viajeActive = self.isActive;
            if (sceneOk && window.GEScene && window.GEScene.setPaused) window.GEScene.setPaused(viajeActive);
            if (window.GEAudio && sndOn) window.GEAudio.setAmbient(viajeActive ? 1 : 0);
          },
          onUpdate: function (self) {
            var progress = self.progress;
            var frameIndex = Math.min(flowFrameCount - 1, Math.floor(progress * flowFrameCount));
            var img = flowFrames[frameIndex];
            if (img) {
              drawFrame(flowCanvas, flowCtx, img);
              lastDrawnFlowFrame = frameIndex;
            }
            setStage(stageForFrac(progress));
          }
        });
      }
      setStage(0);

      window.addEventListener('resize', function() {
        var img = flowFrames[lastDrawnFlowFrame] || flowFrames[0];
        if (img) drawFrame(flowCanvas, flowCtx, img);
      });
    }

    /* ---- IA que opera la red: secuencia de imágenes en canvas ---- */
    var iaCanvas = doc.getElementById('ia-canvas');
    var iaCtx = iaCanvas ? iaCanvas.getContext('2d', { alpha: false }) : null;
    var iaFrames = [];
    var iaFrameCount = 240;
    var lastDrawnIaFrame = 0;
    var iaActive = false;

    if (iaCanvas && iaCtx) {
      preloadFrames('ai-icons', iaFrameCount, iaFrames, function() {
        if (iaFrames[0]) drawFrame(iaCanvas, iaCtx, iaFrames[0]);
      });

      var iaStages = doc.querySelectorAll('#ia-viaje .drive__stage');
      var iaDots = doc.querySelectorAll('#ia-viaje .drive__dot');
      var iaCur = -1;
      var iaSetStage = function (i) {
        if (i === iaCur) return; iaCur = i;
        iaStages.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
        iaDots.forEach(function (d, idx) { d.classList.toggle('is-active', idx <= i); });
      };
      
      var iaBounds = [0.25, 0.5, 0.75];
      var iaStageFor = function (f) {
        for (var i = 0; i < iaBounds.length; i++) { if (f < iaBounds[i]) return i; }
        return 3;
      };

      if (mobileMode) {
        var curIaFrame = 0;
        var iaAnimId = null;
        var iaFps = 24;
        var iaFpsInterval = 1000 / iaFps;
        var lastIaTime = performance.now();
        var iaAnimLoop = function(currentTime) {
          if (!iaActive) { iaAnimId = null; return; }
          iaAnimId = requestAnimationFrame(iaAnimLoop);
          var elapsed = currentTime - lastIaTime;
          if (elapsed >= iaFpsInterval) {
            lastIaTime = currentTime - (elapsed % iaFpsInterval);
            curIaFrame = (curIaFrame + 1) % iaFrameCount;
            var img = iaFrames[curIaFrame];
            if (img) drawFrame(iaCanvas, iaCtx, img);
          }
        };

        ScrollTrigger.create({
          trigger: '#ia-viaje', start: 'top 80%', end: 'bottom 20%',
          onToggle: function (self) {
            iaActive = self.isActive;
            if (self.isActive) {
              if (!iaAnimId) {
                lastIaTime = performance.now();
                iaAnimLoop(lastIaTime);
              }
            }
          }
        });
      } else {
        ScrollTrigger.create({
          trigger: '#ia-viaje', start: 'top top', end: '+=3400',
          pin: true, scrub: true, anticipatePin: 1, refreshPriority: 2,
          onToggle: function (self) {
            iaActive = self.isActive;
            if (sceneOk && window.GEScene && window.GEScene.setPaused) window.GEScene.setPaused(iaActive);
          },
          onUpdate: function (self) {
            var progress = self.progress;
            var frameIndex = Math.min(iaFrameCount - 1, Math.floor(progress * iaFrameCount));
            var img = iaFrames[frameIndex];
            if (img) {
              drawFrame(iaCanvas, iaCtx, img);
              lastDrawnIaFrame = frameIndex;
            }
            iaSetStage(iaStageFor(progress));
          }
        });
      }
      iaSetStage(0);

      window.addEventListener('resize', function() {
        var img = iaFrames[lastDrawnIaFrame] || iaFrames[0];
        if (img) drawFrame(iaCanvas, iaCtx, img);
      });
    }

    /* ---- dashboard vivo (proyectos) ---- */
    var dash = doc.getElementById('dash');
    if (dash) {
      var animateDash = function () {
        dash.classList.add('is-live');
        // alturas de barra en px (el % no resuelve dentro de flex en algunos motores)
        var barsBox = dash.querySelector('.dash__bars');
        var plotH = barsBox ? barsBox.clientHeight : 188;
        dash.querySelectorAll('.bar').forEach(function (bar) {
          var pct = parseFloat(getComputedStyle(bar).getPropertyValue('--h')) || 0;
          var span = bar.querySelector('.fill');
          var px = Math.round(plotH * pct / 100);
          if (reduced) { span.style.height = px + 'px'; }
          else { requestAnimationFrame(function () { span.style.height = px + 'px'; }); }
        });
        dash.querySelectorAll('.kpi__val').forEach(function (el) {
          var target = parseFloat(el.getAttribute('data-count')) || 0;
          var suffix = el.getAttribute('data-suffix') || '';
          var decimals = (String(target).split('.')[1] || '').length;
          if (reduced || !window.gsap) { el.textContent = target.toFixed(decimals) + suffix; return; }
          var obj = { v: 0 };
          gsap.to(obj, {
            v: target, duration: 1.5, ease: 'power2.out',
            onUpdate: function () { el.textContent = obj.v.toFixed(decimals) + suffix; }
          });
        });
      };
      if (reduced || !window.ScrollTrigger) { animateDash(); }
      else { ScrollTrigger.create({ trigger: dash, start: 'top 82%', once: true, onEnter: animateDash }); }
    }

    /* ---- CTA: glow que sigue al cursor ---- */
    var cta = doc.getElementById('cta');
    if (cta && !reduced) {
      cta.addEventListener('pointermove', function (e) {
        var r = cta.getBoundingClientRect();
        cta.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        cta.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    }

    /* ---- formulario de contacto: valida y compone correo ---- */
    var form = doc.getElementById('cta-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var dict = (window.GE_I18N && window.GE_I18N[lang]) || {};
        var ok = true;
        ['nombre', 'email', 'mensaje'].forEach(function (n) {
          var inp = form.elements[n];
          var bad = !inp.value.trim() || (n === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value));
          inp.closest('.field').classList.toggle('invalid', bad);
          if (bad) ok = false;
        });
        if (!ok) return;
        var nombre = form.elements['nombre'].value.trim();
        var email = form.elements['email'].value.trim();
        var tel = form.elements['telefono'].value.trim();
        var tipo = form.elements['tipo'].value;
        var msg = form.elements['mensaje'].value.trim();
        // Lead → FourG CRM (widget webchat de Gestiones). no-cors + text/plain =
        // request "simple" (sin preflight CORS); el endpoint parsea el JSON igual con req.json().
        // Fire-and-forget: la respuesta es opaca, pero el lead se crea en el inbox.
        var lead = '🔔 Nuevo lead — formulario web\n' +
                   'Nombre: ' + nombre + '\nEmail: ' + email + '\nTeléfono: ' + (tel || '—') +
                   '\nTipo de proyecto: ' + tipo + '\n\nMensaje:\n' + msg;
        var vid = localStorage.getItem('ge-form-visitor');
        if (!vid) { vid = 'form_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem('ge-form-visitor', vid); }
        var sent = doc.getElementById('cta-sent');
        var fail = doc.getElementById('cta-fail');
        var showSent = function () { form.style.display = 'none'; if (sent) sent.hidden = false; };
        var showFail = function () {
          form.style.display = 'none';
          if (fail) {
            fail.hidden = false;
            var mailBtn = doc.getElementById('cta-mail-btn');
            if (mailBtn) {
              var subject = 'Cotización · ' + tipo + ' · ' + nombre;
              mailBtn.href = 'mailto:servicios@gestioneselectricas.com?subject=' +
                encodeURIComponent(subject) + '&body=' + encodeURIComponent(lead);
            }
          }
        };
        fetch('https://crm.fourgsolutions.com/api/widget/wc_gestiones_main', {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify({ visitor_id: vid, text: lead, context: { current_url: location.href, source: 'contact_form' } })
        }).then(showSent).catch(showFail);
      });
      // limpiar estado inválido al escribir
      form.addEventListener('input', function (e) {
        var f = e.target.closest('.field'); if (f) f.classList.remove('invalid');
      });
    }
    /* ---------- modal del blog ---------- */
    var blogModal = doc.getElementById('blog-modal');
    var blogModalContent = doc.getElementById('blog-modal-content');
    var blogModalClose = blogModal ? blogModal.querySelector('.blog-modal__close') : null;
    var blogModalOverlay = blogModal ? blogModal.querySelector('.blog-modal__overlay') : null;
    var activePostId = null;

    if (blogModal && blogModalContent) {
      var openModal = function (postId) {
        var bodyKey = '';
        if (postId === 'solar-barranquilla') bodyKey = 'blog.post1.body';
        else if (postId === 'subestaciones-costa') bodyKey = 'blog.post2.body';
        else if (postId === 'puesta-tierra') bodyKey = 'blog.post3.body';

        if (bodyKey) {
          var dict = (window.GE_I18N && window.GE_I18N[lang]) || {};
          if (dict[bodyKey]) {
            blogModalContent.innerHTML = dict[bodyKey];
            blogModal.classList.add('is-open');
            blogModal.setAttribute('aria-hidden', 'false');
            activePostId = postId;
            doc.body.style.overflow = 'hidden';
            if (lenis) lenis.stop();
          }
        }
      };

      var closeModal = function () {
        blogModal.classList.remove('is-open');
        blogModal.setAttribute('aria-hidden', 'true');
        activePostId = null;
        doc.body.style.overflow = '';
        if (lenis) lenis.start();
      };

      doc.querySelectorAll('.blog__card').forEach(function (card) {
        card.addEventListener('click', function () {
          var postId = card.getAttribute('data-post-id');
          openModal(postId);
        });
      });

      if (blogModalClose) blogModalClose.addEventListener('click', closeModal);
      if (blogModalOverlay) blogModalOverlay.addEventListener('click', closeModal);

      doc.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && blogModal.classList.contains('is-open')) {
          closeModal();
        }
      });

      // Reload the active post body when language changes
      window.GE_onLangChange = function (newLang) {
        if (activePostId) {
          var bodyKey = '';
          if (activePostId === 'solar-barranquilla') bodyKey = 'blog.post1.body';
          else if (activePostId === 'subestaciones-costa') bodyKey = 'blog.post2.body';
          else if (activePostId === 'puesta-tierra') bodyKey = 'blog.post3.body';
          
          var dict = (window.GE_I18N && window.GE_I18N[newLang]) || {};
          if (bodyKey && dict[bodyKey]) {
            blogModalContent.innerHTML = dict[bodyKey];
          }
        }
      };
    }

    ScrollTrigger.refresh();
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  if (doc.readyState === 'complete' || doc.readyState === 'interactive') boot();
  else doc.addEventListener('DOMContentLoaded', boot);
})();
