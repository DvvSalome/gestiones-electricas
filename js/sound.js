/* ============================================================
   Gestiones Eléctricas — audio sutil anclado al scroll (Web Audio)
   Pad ambiental + chimes pentatónicos en cada etapa del viaje.
   Se activa solo tras gesto del usuario (botón de sonido).
   ============================================================ */
window.GEAudio = (function () {
  var ctx, master, droneGain, drone = [], enabled = false, ready = false;

  function build() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    droneGain = ctx.createGain(); droneGain.gain.value = 0;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 620; lp.Q.value = 0.6;
    droneGain.connect(lp); lp.connect(master);
    [82.41, 123.47, 164.81].forEach(function (f, i) {       // E2, B2, E3 (quinta abierta)
      var o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = f * (1 + i * 0.0015);
      var g = ctx.createGain(); g.gain.value = i === 0 ? 0.6 : 0.3;
      o.connect(g); g.connect(droneGain); o.start();
      drone.push(o);
    });
    ready = true; return true;
  }

  function enable() {
    if (!ready && !build()) return;
    if (ctx.state === 'suspended') ctx.resume();
    enabled = true;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.5);
  }
  function disable() {
    if (!ready) { enabled = false; return; }
    enabled = false;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
  }
  function setAmbient(level) {
    if (!ready || !enabled) return;
    droneGain.gain.cancelScheduledValues(ctx.currentTime);
    droneGain.gain.linearRampToValueAtTime(0.16 * level, ctx.currentTime + 0.9);
  }
  function chime(idx) {
    if (!ready || !enabled) return;
    var scale = [523.25, 587.33, 659.25, 783.99, 880.0];   // C5 D5 E5 G5 A5
    var base = scale[((idx % 5) + 5) % 5];
    var t = ctx.currentTime;
    function voice(freq, type, peak, dur) {
      var o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
      var g = ctx.createGain(); g.gain.value = 0;
      o.connect(g); g.connect(master);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.05);
    }
    voice(base, 'triangle', 0.20, 1.4);
    voice(base * 2, 'sine', 0.07, 1.0);
  }

  return { enable: enable, disable: disable, setAmbient: setAmbient, chime: chime,
           isEnabled: function () { return enabled; } };
})();
