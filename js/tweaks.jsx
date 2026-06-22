/* ============================================================
   Gestiones Eléctricas — Panel de Tweaks
   3 controles expresivos que reconfiguran la SENSACIÓN del sitio:
     · Intensidad de la red viva  (escena WebGL: pulsos, brillo, densidad)
     · Atmósfera cinematográfica  (velo, deriva de cámara, suavidad de scroll)
     · Acento de marca            (recolorea acentos + escena 3D)
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "intensidad": 50,
  "atmosfera": "Cinemático",
  "acento": "#C7E52F"
}/*EDITMODE-END*/;

// Presets de atmósfera: cada uno mueve VARIAS propiedades a la vez.
const GE_ATMOS = {
  "Sobrio":     { veil: 0.45, sway: 0.35, smooth: 0.055 },
  "Cinemático": { veil: 1.0,  sway: 1.0,  smooth: 0.10 },
  "Inmersivo":  { veil: 1.5,  sway: 1.9,  smooth: 0.14 }
};

// Espera a que la escena y la orquestación estén listas antes de aplicar.
function geWhenReady(fn, n) {
  n = n || 0;
  if (window.GEScene && window.GEApp) { fn(); }
  else if (n < 90) { requestAnimationFrame(function () { geWhenReady(fn, n + 1); }); }
}

// La intensidad de la red ahora es AUTOMÁTICA por sección (baja en el hero,
// alta en las torres). Este control sólo desplaza toda la curva: bias −0.5..+0.5.
function geApplyEnergy(v) {
  geWhenReady(function () { if (window.GEApp.setEnergyBias) window.GEApp.setEnergyBias((v - 50) / 100); });
}
function geApplyAtmos(label) {
  const p = GE_ATMOS[label] || GE_ATMOS["Cinemático"];
  geWhenReady(function () {
    if (window.GEScene.setSway) window.GEScene.setSway(p.sway);
    if (window.GEApp.setVeil) window.GEApp.setVeil(p.veil);
    if (window.GEApp.setSmooth) window.GEApp.setSmooth(p.smooth);
  });
}
function geApplyAccent(hex) {
  document.documentElement.style.setProperty('--lime', hex);
  document.documentElement.style.setProperty('--lime-2', hex);
  geWhenReady(function () { if (window.GEScene.setAccent) window.GEScene.setAccent(hex); });
}

function GETweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(function () { geApplyEnergy(t.intensidad); }, [t.intensidad]);
  React.useEffect(function () { geApplyAtmos(t.atmosfera); }, [t.atmosfera]);
  React.useEffect(function () { geApplyAccent(t.acento); }, [t.acento]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="La red viva" />
      <TweakSlider label="Energía base" value={t.intensidad} min={0} max={100} step={1} unit="%"
                   onChange={(v) => setTweak('intensidad', v)} />

      <TweakSection label="Atmósfera" />
      <TweakRadio label="Cinematografía" value={t.atmosfera}
                  options={["Sobrio", "Cinemático", "Inmersivo"]}
                  onChange={(v) => setTweak('atmosfera', v)} />

      <TweakSection label="Marca" />
      <TweakColor label="Acento" value={t.acento}
                  options={["#C7E52F", "#22E3C6", "#FFB020", "#7FE7FF"]}
                  onChange={(v) => setTweak('acento', v)} />
    </TweaksPanel>
  );
}

(function () {
  var mount = document.getElementById('tweaks-root');
  if (mount && window.ReactDOM && ReactDOM.createRoot) {
    ReactDOM.createRoot(mount).render(<GETweaks />);
  }
})();
