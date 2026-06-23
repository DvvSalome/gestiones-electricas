/* ============================================================
   Gestiones Eléctricas — Escena WebGL (Three.js r137 global)
   Una sola escena fija. El scroll mueve la cámara a través de:
     1. Nube de nodos de red (grid graph)
     2. Red neuronal / malla de IA (zona sección IA)
     3. Corredor de torres de alta tensión (zona sección "La red")
     4. Horizonte: plano-rejilla energético
   Verde lima #C7E52F sobre negro.
   ============================================================ */
window.GEScene = (function () {
  var LIME = 0xc7e52f;
  var LIME2 = 0xc9e400;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer, scene, camera, clock;
  var progress = 0;          // 0..1 scroll global (suavizado)
  var targetProgress = 0;
  var mouse = { x: 0, y: 0 }, mTarget = { x: 0, y: 0 };
  var pulses = [];           // sprites de corriente
  var nodeMat, lineMat, pulseGeo, neuralNodeMat, corridorLineMat;
  var W = 1, H = 1;
  var running = false;
  var paused = false;          // se pausa el render cuando el video lo tapa
  // estado expuesto al panel de Tweaks
  var intensity = 0.55;          // 0..1 — intensidad actual (animada)
  var targetIntensity = 0.18;    // objetivo — lo fija el scroll por sección
  var swayAmp = 1;               // multiplicador de deriva de cámara
  var accentColor = new THREE.Color(LIME);
  var gridMat, haloMat, wireMatRef;
  // cruce torres <-> red neuronal (1 = neuronal, 0 = torres)
  var neuralBlend = 0, neuralTarget = 0, geNeuralRoutes = 0;

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* --------- construir el mundo --------- */
  function buildNodeCloud() {
    var g = new THREE.Group();
    var count = reduced ? 35 : 40;   // grafo de fondo aligerado (antes 170) — menos puntos, se lee mejor
    var positions = [];
    var pts = [];
    for (var i = 0; i < count; i++) {
      var x = (Math.random() - 0.5) * 70;
      var y = (Math.random() - 0.5) * 38;
      var z = -Math.random() * 60 + 8;       // z 8 .. -52
      pts.push(new THREE.Vector3(x, y, z));
      positions.push(x, y, z);
    }
    // nodos (puntos)
    var pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    nodeMat = new THREE.PointsMaterial({
      color: LIME, size: 0.55, sizeAttenuation: true,
      transparent: true, opacity: 0.9, depthWrite: false
    });
    g.add(new THREE.Points(pg, nodeMat));

    // aristas a vecinos cercanos
    var linePos = [];
    for (var a = 0; a < pts.length; a++) {
      var connected = 0;
      for (var b = a + 1; b < pts.length && connected < 3; b++) {
        if (pts[a].distanceTo(pts[b]) < 19) {
          linePos.push(pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z);
          connected++;
        }
      }
    }
    var lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    lineMat = new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.18 });
    g.add(new THREE.LineSegments(lg, lineMat));
    return g;
  }

  // ---- Red neuronal / malla de IA (zona de la sección IA, poco profunda) ----
  // Capas de nodos a lo largo de Z por las que vuela la cámara; las conexiones
  // entre capas son las rutas por las que viajan los "datos" (pulsos).
  var wireRoutes = [];
  function buildNeuralCorridor() {
    var g = new THREE.Group();
    var layers = reduced ? 9 : 15;
    var startZ = -42, spacing = 17;
    var nodePos = [];
    var layerNodes = [];
    for (var L = 0; L < layers; L++) {
      var z = startZ - L * spacing;
      var count = reduced ? 6 : (7 + (L % 4) * 2);
      var ring = [];
      for (var i = 0; i < count; i++) {
        var ang = (i / count) * Math.PI * 2 + L * 0.42;
        var rad = 8 + Math.random() * 10;
        var x = Math.cos(ang) * rad;
        var y = Math.sin(ang) * rad * 0.72 - 3;
        var v = new THREE.Vector3(x, y, z);
        ring.push(v);
        nodePos.push(x, y, z);
      }
      layerNodes.push(ring);
    }
    // nodos como puntos
    var pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(nodePos, 3));
    neuralNodeMat = new THREE.PointsMaterial({
      color: LIME, size: 0.72, sizeAttenuation: true,
      transparent: true, opacity: 0.85, depthWrite: false
    });
    g.add(new THREE.Points(pg, neuralNodeMat));
    // conexiones entre capas adyacentes = sinapsis (y rutas de pulsos)
    var linePos = [];
    corridorLineMat = new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.14 });
    wireMatRef = corridorLineMat;
    for (var La = 0; La < layerNodes.length - 1; La++) {
      var A = layerNodes[La], B = layerNodes[La + 1];
      for (var n = 0; n < A.length; n++) {
        var conns = 2 + Math.floor(Math.random() * 2);
        for (var cc = 0; cc < conns; cc++) {
          var target = B[Math.floor(Math.random() * B.length)];
          linePos.push(A[n].x, A[n].y, A[n].z, target.x, target.y, target.z);
          if (!reduced) wireRoutes.push([A[n].clone(), target.clone()]);
        }
      }
    }
    var lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    g.add(new THREE.LineSegments(lg, corridorLineMat));
    geNeuralRoutes = wireRoutes.length;   // rutas neuronales = las primeras en wireRoutes
    return g;
  }

  // ---- Torres de transmisión (zona de la sección "La red", al fondo) ----
  // una torre esquemática hecha de líneas
  function buildTower(height) {
    var seg = [];
    var w = 2.4, w2 = 0.7;
    function push(x1, y1, z1, x2, y2, z2) { seg.push(x1, y1, z1, x2, y2, z2); }
    var legs = [[-w, -w], [w, -w], [w, w], [-w, w]];
    var top = [[-w2, -w2], [w2, -w2], [w2, w2], [-w2, w2]];
    for (var i = 0; i < 4; i++) push(legs[i][0], 0, legs[i][1], top[i][0], height, top[i][1]);
    var levels = 5;
    for (var L = 0; L <= levels; L++) {
      var t = L / levels;
      var hw = lerp(w, w2, t), hy = lerp(0, height, t);
      push(-hw, hy, -hw, hw, hy, -hw); push(hw, hy, -hw, hw, hy, hw);
      push(hw, hy, hw, -hw, hy, hw); push(-hw, hy, hw, -hw, hy, -hw);
      if (L < levels) {
        var nt = (L + 1) / levels, nhw = lerp(w, w2, nt), nhy = lerp(0, height, nt);
        push(-hw, hy, -hw, nhw, nhy, -nhw);
        push(hw, hy, hw, -nhw, nhy, nhw);
      }
    }
    var arm = 4.2, ay = height * 0.78, ay2 = height * 0.92;
    push(-arm, ay, 0, arm, ay, 0);
    push(-arm, ay2, 0, arm, ay2, 0);
    push(0, height, 0, 0, ay2, 0);
    var gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    return { geo: gg, arm: arm, ay: ay, ay2: ay2, top: height };
  }

  var towerLineMat, towerCableMat;
  function buildCorridor() {
    var g = new THREE.Group();
    towerLineMat = new THREE.LineBasicMaterial({ color: 0x9fb24a, transparent: true, opacity: 0.55 });
    towerCableMat = new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.32 });
    var startZ = -132, spacing = 26, pairs = reduced ? 5 : 7;
    var sideX = 13, height = 22;
    var prev = null;
    for (var i = 0; i < pairs; i++) {
      var z = startZ - i * spacing;
      [-sideX, sideX].forEach(function (sx, si) {
        var tw = buildTower(height);
        var m = new THREE.LineSegments(tw.geo, towerLineMat);
        m.position.set(sx, -14, z);
        g.add(m);
        if (!prev) prev = {};
        var key = si;
        var anchors = [
          new THREE.Vector3(sx + (-tw.arm), -14 + tw.ay, z),
          new THREE.Vector3(sx + (tw.arm), -14 + tw.ay, z),
          new THREE.Vector3(sx + (-tw.arm), -14 + tw.ay2, z),
          new THREE.Vector3(sx + (tw.arm), -14 + tw.ay2, z),
          new THREE.Vector3(sx, -14 + tw.top, z)
        ];
        if (prev[key]) {
          for (var a = 0; a < anchors.length; a++) addWire(g, prev[key][a], anchors[a], towerCableMat);
        }
        prev[key] = anchors;
      });
    }
    return g;
  }

  // cable con catenaria entre dos puntos (y ruta de pulso)
  function addWire(group, p1, p2, mat) {
    var pts = [], n = 14, sag = 2.6;
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var x = lerp(p1.x, p2.x, t), y = lerp(p1.y, p2.y, t), z = lerp(p1.z, p2.z, t);
      y -= Math.sin(t * Math.PI) * sag;
      pts.push(new THREE.Vector3(x, y, z));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(geo, mat));
    if (!reduced) wireRoutes.push(pts);
  }

  function buildHorizon() {
    var g = new THREE.Group();
    var grid = new THREE.GridHelper(420, 60, LIME, 0x143a14);
    grid.material.transparent = true; grid.material.opacity = 0.22;
    grid.position.set(0, -16, -380);
    gridMat = grid.material;
    g.add(grid);
    // halo
    haloMat = new THREE.MeshBasicMaterial({ color: LIME2, transparent: true, opacity: 0.10 });
    var halo = new THREE.Mesh(new THREE.CircleGeometry(60, 48), haloMat);
    halo.position.set(0, 6, -470);
    g.add(halo);
    return g;
  }

  function buildPulses() {
    if (reduced) return;
    pulseGeo = new THREE.SphereGeometry(0.35, 8, 8);
    var pm = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var n = Math.min(wireRoutes.length, 26);
    for (var i = 0; i < n; i++) {
      var idx = Math.floor(Math.random() * wireRoutes.length);
      var mesh = new THREE.Mesh(pulseGeo, pm.clone());
      var isLime = Math.random() > 0.5;
      mesh.material.color.set(isLime ? accentColor.getHex() : 0xffffff);
      scene.add(mesh);
      var sp = 0.12 + Math.random() * 0.25;
      pulses.push({ mesh: mesh, route: wireRoutes[idx], t: Math.random(), speed: sp, baseSpeed: sp, isLime: isLime, isNeural: idx < geNeuralRoutes });
    }
  }

  /* --------- ciclo de render --------- */
  function onResize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    // En móvil/táctil, pixelRatio 1 (la alta densidad no se nota y alivia GPU+batería).
    var smallScreen = W <= 720 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    renderer.setPixelRatio(smallScreen ? 1 : Math.min(window.devicePixelRatio, 1.5));
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }

  // ruta de cámara por keyframes (z avanza hacia -Z)
  var camKeys = [
    { p: 0.00, z: 24, y: 2, x: 0 },
    { p: 0.18, z: 2, y: 1, x: -2 },
    { p: 0.40, z: -42, y: 0, x: 2 },
    { p: 0.62, z: -130, y: -2, x: -1 },
    { p: 0.82, z: -230, y: -4, x: 1 },
    { p: 1.00, z: -330, y: -6, x: 0 }
  ];
  function camAt(p) {
    var a = camKeys[0], b = camKeys[camKeys.length - 1];
    for (var i = 0; i < camKeys.length - 1; i++) {
      if (p >= camKeys[i].p && p <= camKeys[i + 1].p) { a = camKeys[i]; b = camKeys[i + 1]; break; }
    }
    var t = (b.p === a.p) ? 0 : (p - a.p) / (b.p - a.p);
    t = t * t * (3 - 2 * t); // smoothstep
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      z: lerp(a.z, b.z, t)
    };
  }

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    if (paused) { clock.getDelta(); return; }   // render en pausa (video al frente)
    var dt = clock.getDelta();
    var time = clock.elapsedTime;

    // suavizado del progreso y mouse
    progress += (targetProgress - progress) * Math.min(1, dt * 4);
    mouse.x += (mTarget.x - mouse.x) * Math.min(1, dt * 3);
    mouse.y += (mTarget.y - mouse.y) * Math.min(1, dt * 3);

    // suavizado de intensidad — transición buttery entre secciones
    intensity += (targetIntensity - intensity) * Math.min(1, dt * 2.4);
    if (lineMat) lineMat.opacity = 0.05 + intensity * 0.30;
    if (gridMat) gridMat.opacity = 0.10 + intensity * 0.26;

    // cruce torres <-> red neuronal (también aplica en reduced-motion)
    neuralBlend += (neuralTarget - neuralBlend) * Math.min(1, dt * 3);
    if (towerLineMat) towerLineMat.opacity = 0.55 * (1 - neuralBlend);
    if (towerCableMat) towerCableMat.opacity = 0.32 * (1 - neuralBlend);
    if (neuralNodeMat) neuralNodeMat.opacity = (0.32 + intensity * 0.5) * neuralBlend;
    if (corridorLineMat) corridorLineMat.opacity = (0.06 + intensity * 0.34) * neuralBlend;

    var keepN = Math.round(pulses.length * (0.18 + intensity * 0.82));
    for (var pv = 0; pv < pulses.length; pv++) {
      var Pz = pulses[pv];
      var zoneOk = Pz.isNeural ? (neuralBlend > 0.5) : (neuralBlend < 0.5);
      Pz.mesh.visible = (pv < keepN) && zoneOk;
    }
    if (reduced && nodeMat) nodeMat.opacity = 0.25 + intensity * 0.6;

    var c = camAt(progress);
    camera.position.x = c.x + mouse.x * 4 * swayAmp;
    camera.position.y = c.y + mouse.y * 2.4 * swayAmp + (reduced ? 0 : Math.sin(time * 0.4) * 0.4 * swayAmp);
    camera.position.z = c.z;
    camera.lookAt(mouse.x * 2 * swayAmp, c.y - 1 + mouse.y * 1.5 * swayAmp, c.z - 40);

    if (!reduced) {
      // latido de nodos — amplitud ligada a la intensidad
      var nodeBase = 0.25 + intensity * 0.6;
      nodeMat.opacity = nodeBase + Math.sin(time * 1.6) * 0.18 * (0.4 + intensity);
      nodeMat.size = (0.42 + intensity * 0.34) + Math.sin(time * 1.2) * 0.12;
      // nodos de la red neuronal — parpadeo sináptico (atenuado por el cruce)
      if (neuralNodeMat) {
        neuralNodeMat.opacity = ((0.30 + intensity * 0.6) + Math.sin(time * 2.1) * 0.14) * neuralBlend;
        neuralNodeMat.size = (0.55 + intensity * 0.4) + Math.sin(time * 1.5) * 0.1;
      }
      if (corridorLineMat) corridorLineMat.opacity = (0.06 + intensity * 0.34) * neuralBlend;
      // pulsos de corriente — velocidad ligada a la intensidad
      var speedMul = 0.3 + intensity * 2.0;
      for (var i = 0; i < pulses.length; i++) {
        var P = pulses[i];
        if (!P.mesh.visible) continue;
        P.t += dt * P.baseSpeed * speedMul;
        if (P.t > 1) P.t -= 1;
        var route = P.route, fi = P.t * (route.length - 1);
        var i0 = Math.floor(fi), i1 = Math.min(route.length - 1, i0 + 1), ft = fi - i0;
        P.mesh.position.lerpVectors(route[i0], route[i1], ft);
      }
    }
    renderer.render(scene, camera);
  }

  /* --------- API --------- */
  function init(canvas) {
    if (!window.THREE) { console.warn('THREE no disponible'); return false; }
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { console.warn('WebGL no disponible', e); return false; }
    renderer.setClearColor(0x060707, 1);
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060707, 0.0055);
    camera = new THREE.PerspectiveCamera(62, 1, 0.1, 800);
    clock = new THREE.Clock();

    scene.add(buildNodeCloud());
    scene.add(buildNeuralCorridor());
    scene.add(buildCorridor());
    scene.add(buildHorizon());
    buildPulses();

    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', function (e) {
      mTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mTarget.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    });
    running = true;
    window.__geInfo = { children: scene.children.length, wireRoutes: wireRoutes.length, pulses: pulses.length, reduced: reduced };
    // primer frame correcto (cámara en progreso 0) aunque rAF tarde en arrancar
    var c0 = camAt(0);
    camera.position.set(c0.x, c0.y, c0.z);
    camera.lookAt(0, c0.y - 1, c0.z - 40);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);                      // …y luego animación continua / por scroll
    return true;
  }

  function setProgress(p) { targetProgress = Math.max(0, Math.min(1, p)); }
  function setPaused(p) { paused = !!p; }
  function setNeuralMode(v) { neuralTarget = Math.max(0, Math.min(1, v)); }

  // --- API para el panel de Tweaks ---
  function setIntensity(v) { targetIntensity = Math.max(0, Math.min(1, v)); }
  function setSway(a) { swayAmp = Math.max(0, a); }
  function setAccent(hex) {
    accentColor = new THREE.Color(hex);
    if (nodeMat) nodeMat.color.copy(accentColor);
    if (lineMat) lineMat.color.copy(accentColor);
    if (neuralNodeMat) neuralNodeMat.color.copy(accentColor);
    if (corridorLineMat) corridorLineMat.color.copy(accentColor);
    if (towerCableMat) towerCableMat.color.copy(accentColor);
    if (wireMatRef) wireMatRef.color.copy(accentColor);
    if (haloMat) haloMat.color.copy(accentColor);
    for (var i = 0; i < pulses.length; i++) { if (pulses[i].isLime) pulses[i].mesh.material.color.copy(accentColor); }
  }

  return { init: init, setProgress: setProgress, setPaused: setPaused, setNeuralMode: setNeuralMode, setIntensity: setIntensity, setSway: setSway, setAccent: setAccent };
})();
