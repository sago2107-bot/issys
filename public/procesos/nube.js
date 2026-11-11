/**
 * Capa de nube de ISSyS Procesos: sincronización de los datos con Firestore.
 * El ingreso con Google y los permisos los resuelve shared/auth.js (login único de los Sistemas ISSyS).
 *
 * La app sigue leyendo y escribiendo localStorage como siempre. Al ingresar se bajan los datos
 * de la nube al navegador, y cada escritura de una clave compartida se sube a Firestore (colección datos).
 * Abierta como archivo local (file://) no usa la nube: sólo ofrece exportar un respaldo.
 *
 * Las páginas esperan `window.nubeListo` antes de arrancar.
 * Requiere /shared/firebase-config.js y /shared/auth.js cargados antes que este archivo.
 */
(function () {
    const CLAVE_PROCESOS = 'issys-procesos-v1';
    const FUENTE = "'Encode Sans Condensed', 'Arial Narrow', Arial, sans-serif";

    // Claves compartidas entre usuarios; el resto (preferencias de vista) queda en cada navegador
    function esCompartida(k) {
        return k === CLAVE_PROCESOS || k === `${CLAVE_PROCESOS}:deletedSeeds` || String(k).startsWith('issys-bpmn:');
    }

    const setItemOrig = Storage.prototype.setItem;
    const removeItemOrig = Storage.prototype.removeItem;
    const local = location.protocol === 'file:';

    let listo;
    window.nubeListo = new Promise(r => { listo = r; });

    let ses = null;
    let db = null;
    let usuario = null;

    // ------------------------------------------------------------
    // Estilos de los avisos propios (el usuario va en el encabezado común: ISSyS.ponerEncabezado)
    // ------------------------------------------------------------
    const css = document.createElement('style');
    css.textContent = `
        .nube-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; border-radius: 10px; font-weight: 600;
            font-size: 15px; padding: 10px 16px; cursor: pointer; border: 1.5px solid #4657A0; background: #fff; color: #4657A0; font-family: inherit; }
        .nube-btn:hover { background: #E3E6F1; }
        .nube-btn.prim { background: #4657A0; border-color: #4657A0; color: #fff; }
        .nube-btn.prim:hover { background: #36457F; border-color: #36457F; }
        .nube-btn.chico { font-size: 12px; padding: 5px 10px; border-radius: 8px; }


        #nube-aviso { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 9980; background: #1D1D1B; color: #fff;
            border-radius: 10px; padding: 10px 12px 10px 16px; font: 14px ${FUENTE}; display: flex;
            gap: 12px; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,.3); max-width: calc(100vw - 32px); }
        #nube-aviso .nube-btn:not(.prim) { background: transparent; color: #fff; border-color: #878787; }
    `;
    document.head.appendChild(css);

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function alCargarDom(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
        else fn();
    }

    // ------------------------------------------------------------
    // Respaldo (JSON con las claves compartidas)
    // ------------------------------------------------------------
    function descargarRespaldo() {
        const claves = {};
        Object.keys(localStorage).filter(esCompartida).forEach(k => { claves[k] = localStorage.getItem(k); });
        const blob = new Blob([JSON.stringify({ app: 'issys-procesos', version: 1, fecha: new Date().toISOString(), claves }, null, 1)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `issys-procesos-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    // Abierta como archivo local: sin nube, con un botón para llevar los datos a la versión online
    if (local) {
        listo();
        alCargarDom(() => {
            const b = document.createElement('button');
            b.className = 'nube-btn chico';
            b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:900;box-shadow:0 2px 8px rgba(29,29,27,.2)';
            b.title = 'Descarga los procesos y diagramas de este navegador para importarlos en la versión online';
            b.textContent = '⬇ Exportar respaldo para la nube';
            b.onclick = descargarRespaldo;
            document.body.appendChild(b);
        });
        return;
    }

    // ------------------------------------------------------------
    // Sincronización
    // ------------------------------------------------------------
    const pendientes = new Map();   // clave -> valor (null = borrar)
    let timerSubida = null;
    let estadoActual = 'ok';

    function refDato(clave) {
        return db.collection('datos').doc(encodeURIComponent(clave));
    }

    let encabezado = null;   // { estado(e) } que devuelve ISSyS.ponerEncabezado

    function marcarEstado(e) {
        estadoActual = e;
        if (encabezado) encabezado.estado(e);   // punto sobre la foto + línea en el menú de cuenta
    }

    function encolar(clave, valor) {
        pendientes.set(clave, valor);
        marcarEstado('guardando');
        clearTimeout(timerSubida);
        timerSubida = setTimeout(subirPendientes, 400);
    }

    function subirPendientes() {
        clearTimeout(timerSubida);
        if (!pendientes.size) return Promise.resolve();
        const lote = db.batch();
        pendientes.forEach((valor, clave) => {
            if (valor === null) lote.delete(refDato(clave));
            else lote.set(refDato(clave), { clave, valor, por: usuario.email, fecha: ses.firebase.firestore.FieldValue.serverTimestamp() });
        });
        pendientes.clear();
        return lote.commit()
            .then(() => { if (!pendientes.size) marcarEstado('ok'); })
            .catch(e => {
                console.error('Nube:', e);
                marcarEstado('error');
                avisar('No se pudieron guardar los cambios en la nube. Revisá la conexión y volvé a guardar.');
            });
    }

    // La app escribe localStorage; las claves compartidas además se suben
    function interceptarStorage() {
        Storage.prototype.setItem = function (k, v) {
            setItemOrig.call(this, k, v);
            if (this === localStorage && esCompartida(k)) encolar(k, String(v));
        };
        Storage.prototype.removeItem = function (k) {
            removeItemOrig.call(this, k);
            if (this === localStorage && esCompartida(k)) encolar(k, null);
        };
        // Al salir de la página se manda lo pendiente (queda en la cola persistente de Firestore)
        window.addEventListener('pagehide', subirPendientes);
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') subirPendientes(); });
    }

    async function bajarDatos() {
        let snap;
        try {
            snap = await db.collection('datos').get({ source: 'server' });
        } catch (e) {
            snap = await db.collection('datos').get();   // sin conexión: lo último que se bajó
        }
        const enNube = new Set();
        snap.forEach(doc => {
            const d = doc.data();
            if (!d || typeof d.clave !== 'string' || !esCompartida(d.clave)) return;
            enNube.add(d.clave);
            setItemOrig.call(localStorage, d.clave, d.valor);
        });
        Object.keys(localStorage).filter(k => esCompartida(k) && !enNube.has(k)).forEach(k => removeItemOrig.call(localStorage, k));
    }

    // Cambios hechos por otros usuarios mientras la página está abierta
    function escucharCambios() {
        let primera = true;
        db.collection('datos').onSnapshot(snap => {
            if (primera) { primera = false; return; }
            const autores = new Set();
            snap.docChanges().forEach(ch => {
                if (ch.doc.metadata.hasPendingWrites) return;
                const d = ch.doc.data();
                if (!d || !esCompartida(d.clave) || d.por === usuario.email || pendientes.has(d.clave)) return;
                if (ch.type === 'removed') removeItemOrig.call(localStorage, d.clave);
                else setItemOrig.call(localStorage, d.clave, d.valor);
                autores.add(d.por || 'Otro usuario');
            });
            if (autores.size) {
                avisar(`${[...autores].join(', ')} actualizó los procesos.`, 'Recargar', () => location.reload());
            }
        }, e => console.error('Nube:', e));
    }

    function avisar(texto, accion, fn) {
        let el = document.getElementById('nube-aviso');
        if (el) el.remove();
        el = document.createElement('div');
        el.id = 'nube-aviso';
        el.innerHTML = `<span>${esc(texto)}</span>${accion ? `<button class="nube-btn chico prim">${esc(accion)}</button>` : ''}<button class="nube-btn chico" aria-label="Cerrar">✕</button>`;
        const botones = el.querySelectorAll('button');
        if (accion) botones[0].onclick = fn;
        botones[botones.length - 1].onclick = () => el.remove();
        document.body.appendChild(el);
        if (!accion) setTimeout(() => el.remove(), 8000);
    }

    async function salir() {
        await subirPendientes();
        Object.keys(localStorage).filter(esCompartida).forEach(k => removeItemOrig.call(localStorage, k));
        ses.salir();   // cierra la sesión de todos los Sistemas ISSyS y vuelve al portal
    }

    // ------------------------------------------------------------
    // Encabezado común: lanzador de sistemas + foto de perfil con el menú de cuenta
    // ------------------------------------------------------------
    function ponerEncabezado() {
        const items = [{ texto: 'Descargar respaldo', icono: 'descargar', accion: descargarRespaldo }];
        if (usuario.admin) items.push({ texto: 'Importar respaldo…', icono: 'subir', accion: importarRespaldo });
        // Va en el hueco #issys-encabezado del encabezado de la página (visor y modelador)
        const lugar = document.getElementById('issys-encabezado') || document.querySelector('header') || document.body;
        encabezado = ISSyS.ponerEncabezado(lugar, usuario, { sistema: 'procesos', items, alSalir: salir });
        marcarEstado(estadoActual);
    }

    function importarRespaldo() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async () => {
            const archivo = input.files[0];
            if (!archivo) return;
            let claves;
            try {
                const data = JSON.parse(await archivo.text());
                claves = data && data.app === 'issys-procesos' && data.claves;
                if (!claves || typeof claves !== 'object') throw new Error('formato');
            } catch (e) {
                return avisar('El archivo no es un respaldo de ISSyS Procesos.');
            }
            const nombres = Object.keys(claves).filter(esCompartida);
            if (!confirm(`Se van a reemplazar los procesos y diagramas de la nube por los del respaldo (${nombres.length} elementos). Esto afecta a todos los usuarios. ¿Continuar?`)) return;
            try {
                const actuales = await db.collection('datos').get();
                const lote = db.batch();
                actuales.forEach(doc => { if (!nombres.includes(doc.data().clave)) lote.delete(doc.ref); });
                nombres.forEach(k => lote.set(refDato(k), { clave: k, valor: String(claves[k]), por: usuario.email, fecha: ses.firebase.firestore.FieldValue.serverTimestamp() }));
                await lote.commit();
                location.reload();
            } catch (e) {
                console.error(e);
                avisar('No se pudo importar el respaldo.');
            }
        };
        input.click();
    }

    // ------------------------------------------------------------
    // Arranque: login único (shared/auth.js) y después los datos
    // ------------------------------------------------------------
    ISSyS.iniciar({
        sistema: 'procesos',
        titulo: 'Procesos BPMN',
        subtitulo: 'Modelado y optimización',
        texto: 'Ingresá con tu cuenta de Google para ver y editar los procesos.'
    }).then(async s => {
        ses = s;
        db = s.db;
        usuario = s.usuario;
        s.mensaje('Cargando procesos…');
        try {
            await bajarDatos();
        } catch (e) {
            console.error(e);
            return s.error('No se pudieron cargar los datos.');
        }
        interceptarStorage();
        escucharCambios();
        alCargarDom(() => {
            s.mostrar();
            ponerEncabezado();
            listo();
        });
    });
})();
