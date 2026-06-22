/* ============================================================
   Gestiones Eléctricas — orquestación
   Lenis (smooth scroll) + GSAP ScrollTrigger + escena WebGL
   ============================================================ */
(function () {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
            opacity: 0, y: 34, duration: 0.9, ease: 'power2.out', immediateRender: false,
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
    var video = doc.getElementById('drive-video');
    if (video) {
      var stages = doc.querySelectorAll('#viaje .drive__stage');
      var dots = doc.querySelectorAll('#viaje .drive__dot');
      var curStage = -1;
      var setStage = function (i) {
        if (i === curStage) return; curStage = i;
        stages.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
        dots.forEach(function (d, idx) { d.classList.toggle('is-active', idx <= i); });
        if (sndOn && viajeActive && window.GEAudio) window.GEAudio.chime(i);
      };
      // Límites de etapa como fracción del video (tiempos reales del render):
      // 01 Solar 0–1.0s · 02 Hidro 1.0–1.75s · 03 Transmisión 1.75–4.65s
      // 04 Subestación 4.65–6.4s · 05 Consumo 6.4–8.0s
      var bounds = [0.125, 0.219, 0.581, 0.800];
      var stageForFrac = function (f) {
        for (var i = 0; i < bounds.length; i++) { if (f < bounds[i]) return i; }
        return 4;
      };
      var vDur = 8, targetT = 0, inView = false, raf = null, lastSeek = 0;
      video.addEventListener('loadedmetadata', function () { vDur = video.duration || 8; });
      var paint = function () { try { video.currentTime = 0.04; } catch (e) {} };
      if (video.readyState >= 1) paint(); else video.addEventListener('loadeddata', paint);

      var loop = function () {
        if (!inView) { raf = null; if (!video.paused) video.pause(); return; }
        raf = requestAnimationFrame(loop);
        if (video.seeking) { return; }   // un solo seek en vuelo: evita acumulación al subir
        var t = video.currentTime, dt = targetT - t;
        if (dt > 0.06) {
          // adelante → reproducir (más rápido si está lejos): decodificación fluida
          video.playbackRate = Math.min(6, 1 + dt * 2.6);
          if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        } else if (dt < -0.12) {
          // scroll hacia arriba → seek: SOLO uno a la vez (gobernado por 'seeking'),
          // así nunca se acumulan y el hilo principal no se satura
          if (!video.paused) video.pause();
          try { video.currentTime = Math.max(0, targetT); } catch (e) {}
        } else {
          // suficientemente cerca → fijar el frame
          if (!video.paused) video.pause();
        }
        setStage(stageForFrac(video.currentTime / vDur));
      };
      video.addEventListener('seeked', function () { setStage(stageForFrac(video.currentTime / vDur)); });

      ScrollTrigger.create({
        trigger: '#viaje', start: 'top top', end: '+=3400',
        pin: true, scrub: true, anticipatePin: 1, refreshPriority: 1,
        onToggle: function (self) {
          inView = self.isActive; viajeActive = inView;
          if (sceneOk && window.GEScene.setPaused) window.GEScene.setPaused(inView); // libera GPU para el video
          if (window.GEAudio && sndOn) window.GEAudio.setAmbient(inView ? 1 : 0);
          if (inView) { if (!raf) loop(); }
          else if (!video.paused) video.pause();
        },
        onUpdate: function (self) {
          targetT = Math.min(vDur - 0.05, Math.max(0, self.progress * vDur));
          if (reduced) { try { video.currentTime = targetT; } catch (e) {} setStage(stageForFrac(self.progress)); }
        }
      });
      setStage(0);
    }

    /* ---- IA que opera la red: video Flow guiado por scroll (mismo motor fluido) ---- */
    var iaVideo = doc.getElementById('ia-video');
    if (iaVideo) {
      var iaStages = doc.querySelectorAll('#ia-viaje .drive__stage');
      var iaDots = doc.querySelectorAll('#ia-viaje .drive__dot');
      var iaCur = -1;
      var iaSetStage = function (i) {
        if (i === iaCur) return; iaCur = i;
        iaStages.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
        iaDots.forEach(function (d, idx) { d.classList.toggle('is-active', idx <= i); });
      };
      var iaBounds = [0.25, 0.5, 0.75];
      var iaStageFor = function (f) { for (var i = 0; i < iaBounds.length; i++) { if (f < iaBounds[i]) return i; } return 3; };
      var iaDur = 10, iaTarget = 0, iaIn = false, iaRaf = null;
      iaVideo.addEventListener('loadedmetadata', function () { iaDur = iaVideo.duration || 10; });
      var iaPaint = function () { try { iaVideo.currentTime = 0.04; } catch (e) {} };
      if (iaVideo.readyState >= 1) iaPaint(); else iaVideo.addEventListener('loadeddata', iaPaint);
      var iaLoop = function () {
        if (!iaIn) { iaRaf = null; if (!iaVideo.paused) iaVideo.pause(); return; }
        iaRaf = requestAnimationFrame(iaLoop);
        if (iaVideo.seeking) { return; }
        var t = iaVideo.currentTime, dt = iaTarget - t;
        if (dt > 0.06) {
          iaVideo.playbackRate = Math.min(6, 1 + dt * 2.6);
          if (iaVideo.paused) { var p = iaVideo.play(); if (p && p.catch) p.catch(function () {}); }
        } else if (dt < -0.12) {
          if (!iaVideo.paused) iaVideo.pause();
          try { iaVideo.currentTime = Math.max(0, iaTarget); } catch (e) {}
        } else {
          if (!iaVideo.paused) iaVideo.pause();
        }
        iaSetStage(iaStageFor(iaVideo.currentTime / iaDur));
      };
      iaVideo.addEventListener('seeked', function () { iaSetStage(iaStageFor(iaVideo.currentTime / iaDur)); });
      ScrollTrigger.create({
        trigger: '#ia-viaje', start: 'top top', end: '+=3400',
        pin: true, scrub: true, anticipatePin: 1, refreshPriority: 2,
        onToggle: function (self) {
          iaIn = self.isActive;
          if (sceneOk && window.GEScene && window.GEScene.setPaused) window.GEScene.setPaused(iaIn);
          if (iaIn) { if (!iaRaf) iaLoop(); }
          else if (!iaVideo.paused) iaVideo.pause();
        },
        onUpdate: function (self) {
          iaTarget = Math.min(iaDur - 0.05, Math.max(0, self.progress * iaDur));
          if (reduced) { try { iaVideo.currentTime = iaTarget; } catch (e) {} iaSetStage(iaStageFor(self.progress)); }
        }
      });
      iaSetStage(0);
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
        var subject = 'Cotización · ' + tipo + ' · ' + nombre;
        var body = 'Nombre: ' + nombre + '\nCorreo: ' + email + '\nTeléfono: ' + tel +
                   '\nTipo de proyecto: ' + tipo + '\n\nMensaje:\n' + msg;
        var mailto = 'mailto:cotizacionesia2025@gmail.com?subject=' + encodeURIComponent(subject) +
                     '&body=' + encodeURIComponent(body);
        var sent = doc.getElementById('cta-sent');
        form.style.display = 'none';
        if (sent) { sent.hidden = false; }
        window.location.href = mailto;
      });
      // limpiar estado inválido al escribir
      form.addEventListener('input', function (e) {
        var f = e.target.closest('.field'); if (f) f.classList.remove('invalid');
      });
    }

    ScrollTrigger.refresh();
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  if (doc.readyState === 'complete' || doc.readyState === 'interactive') boot();
  else doc.addEventListener('DOMContentLoaded', boot);
})();
