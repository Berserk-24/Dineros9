(function(){
  const jsStatus = document.getElementById('js-status');
  if (jsStatus) {
    jsStatus.textContent = 'JS: cargado ✅';
    jsStatus.classList.replace('bg-secondary','bg-success');
  }

  const salida = document.getElementById('respuesta');
  const debug  = document.getElementById('debug');
  const lbl    = document.getElementById('modo-label');
  const btnPing    = document.getElementById('btnPing');
  const btnMensaje = document.getElementById('btnMensaje');
  const btnLocal   = document.getElementById('btnLocal');
  const btnNuevaVentana = document.getElementById('btnNuevaVentana');
  const lblPuerto  = document.getElementById('puerto');

  // Detectar puerto de la URL actual
  const puerto = window.location.port || '80';
  if (lblPuerto) lblPuerto.textContent = `Puerto: ${puerto}`;

  let USE_BACKEND = false;
  const BASE_HREF = new URL('.', window.location.href).href;

  function setModeLocalUI(){
    USE_BACKEND = false;
    if (lbl) lbl.textContent = 'LOCAL';
    if (salida){
      salida.className = 'alert alert-warning';
      salida.textContent = 'Modo LOCAL activado.';
    }
    if (debug) debug.textContent = 'Modo = LOCAL (sin red).';
  }
  function setModeBackendUI(){
    USE_BACKEND = true;
    if (lbl) lbl.textContent = 'BACKEND';
    if (salida){
      salida.className = 'alert alert-info';
      salida.textContent = 'Modo BACKEND activado. Listo para llamar al servidor.';
    }
    if (debug) debug.textContent = 'Modo = BACKEND (usando fetch).';
  }

  setModeLocalUI();

  if (btnLocal) {
    btnLocal.addEventListener('click', () => {
      setModeLocalUI();
      renderOk({ mensaje: '¡Hola desde el modo LOCAL (inmediato)!' }, true);
    });
  }

  if (btnPing) {
    btnPing.addEventListener('click', () => handleClick(['ping','api/ping'], false));
  }
  if (btnMensaje) {
    btnMensaje.addEventListener('click', () => handleClick(['mensaje','api/mensaje'], true));
  }

  if (btnNuevaVentana) {
    btnNuevaVentana.addEventListener('click', () => {
      const url = `${window.location.protocol}//${window.location.hostname}:${puerto}/ping`;
      window.open(url, '_blank');
    });
  }

  async function handleClick(paths, parseJson) {
    if (salida) { salida.className = 'alert alert-secondary'; salida.textContent = 'Procesando...'; }
    if (debug)  { debug.textContent  = ''; }

    try {
      if (!USE_BACKEND) {
        const usingPing = paths[0].includes('ping');
        const data = usingPing
          ? { ok:true, ts:Date.now(), via:'local' }
          : { mensaje:'¡Hola desde el modo LOCAL!' };
        renderOk(data, parseJson);
        if (debug) debug.textContent = 'Respuesta generada localmente.';
        return;
      }

      let lastErr = null;
      for (const p of paths) {
        try {
          const url = new URL(p, BASE_HREF).toString();
          if (debug) debug.textContent = 'Fetch -> ' + url;
          const res = await fetch(url, { headers: { 'Accept':'application/json' } });
          if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()));
          const data = await res.json();
          renderOk(data, parseJson);
          if (debug) debug.textContent = 'OK: ' + url;
          return;
        } catch (e) {
          lastErr = e;
        }
      }
      setModeLocalUI();
      const fallbackData = paths[0].includes('ping')
        ? { ok:true, ts:Date.now(), via:'local-fallback' }
        : { mensaje:'(fallback) No se pudo contactar servidor; usando respuesta LOCAL.' };
      renderOk(fallbackData, parseJson);
      if (debug) debug.textContent = 'Ambas rutas fallaron. Error: ' + String(lastErr);

    } catch (e) {
      if (salida){
        salida.className = 'alert alert-danger';
        salida.innerHTML = '<strong>Falló la solicitud.</strong>';
      }
      if (debug) debug.textContent = String(e);
    }
  }

  function renderOk(data, parseJson) {
    if (!salida) return;
    if (parseJson) {
      salida.className = 'alert alert-success';
      salida.innerHTML = '<strong>' + (data.mensaje ?? '(sin mensaje)') + '</strong>';
    } else {
      const txt = 'ok=' + data.ok + ' | ts=' + data.ts + ' | via=' + (data.via || 'backend');
      salida.className = 'alert alert-success';
      salida.innerHTML = '<strong>' + txt + '</strong>';
    }
  }
})();

