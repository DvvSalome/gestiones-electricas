/* Conversiones de Google Ads (AW-756881146).
   Tres señales, las tres marcadas como principales en la cuenta:
     - formulario enviado
     - clic a WhatsApp (8 botones en la página)
     - clic al teléfono

   ponytail: el formulario se detecta observando cuándo #cta-sent deja de estar hidden,
   en vez de tocar app.js, que está minificado en una sola línea. Esa es exactamente la
   misma señal de éxito que ve el visitante, y app.js solo lo muestra si la validación
   pasó y el POST al CRM resolvió.

   ponytail: el chat del CRM es un iframe de otro origen y NO se puede medir desde acá.
   Si algún día pesa como canal, se resuelve con postMessage desde el widget. */
(function () {
  var ID = 'AW-756881146';
  var LABELS = {
    form: ID + '/UBIqCLihptocEPqt9OgC',
    whatsapp: ID + '/gxUcCLuhptocEPqt9OgC',
    tel: ID + '/RLs-CL6hptocEPqt9OgC'
  };

  // Una vez por carga de página: Google ya deduplica por clic, esto solo evita ruido.
  var enviado = {};

  function conversion(tipo) {
    if (enviado[tipo] || typeof window.gtag !== 'function') return;
    enviado[tipo] = true;
    window.gtag('event', 'conversion', { send_to: LABELS[tipo] });
  }

  // Clics a WhatsApp y a teléfono. Delegado en document para cubrir los enlaces que
  // el blog inyecta después y los del footer.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('wa.me') > -1 || href.indexOf('api.whatsapp.com') > -1) conversion('whatsapp');
    else if (href.indexOf('tel:') === 0) conversion('tel');
  }, true);

  // Formulario: #cta-sent pasa de hidden a visible cuando el envío salió bien.
  var ok = document.getElementById('cta-sent');
  if (ok && window.MutationObserver) {
    new MutationObserver(function () {
      if (!ok.hasAttribute('hidden')) conversion('form');
    }).observe(ok, { attributes: true, attributeFilter: ['hidden'] });
  }
})();
