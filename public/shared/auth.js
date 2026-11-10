/**
 * Ingreso único de los Sistemas ISSyS: Google + permisos por sistema en Firestore.
 *
 * Requiere shared/firebase-config.js cargado antes. Todos los sistemas viven en el mismo sitio
 * (issys-sistemas.web.app), así que la sesión de Google es una sola: quien ingresó en el portal
 * entra directo a cada sistema habilitado, y "Cerrar sesión" cierra todo.
 *
 * Permisos: usuarios/{email} = { admin: bool, activo: bool, sistemas: ['procesos', ...] }
 *   - Se indexa por email (y no por uid) para poder dar de alta a alguien antes de su primer ingreso.
 *   - El administrador fijo (config.dueno) entra siempre a todo.
 *   - admin: true habilita todos los sistemas y la gestión de usuarios en el portal.
 *
 * Uso en un sistema:
 *   const ses = await ISSyS.iniciar({ sistema: 'procesos', titulo: 'Procesos BPMN', subtitulo: 'Modelado y optimización' });
 *   ses.mensaje('Cargando…');   // sigue la pantalla de espera mientras el sistema baja sus datos
 *   ses.mostrar();              // saca la pantalla de ingreso
 *   ses → { firebase, auth, db, usuario: { email, nombre, foto, admin, sistemas }, mensaje, error, mostrar, salir }
 *
 * Con sistema: null (el portal) alcanza con tener un usuario activo.
 */
(function () {
    if (window.ISSyS) return;

    const CFG = window.ISSYS_CONFIG;
    if (!CFG) throw new Error('ISSyS: falta cargar shared/firebase-config.js antes de shared/auth.js');

    const BASE = '/shared/';
    const LOGO = `${BASE}marca/issys-logo-recorte.png`;
    const FUENTES = 'https://fonts.googleapis.com/css2?family=Encode+Sans+Condensed:wght@300;400;600;900&display=swap';
    const DUENO = CFG.dueno.toLowerCase();
    const IDS = CFG.sistemas.map(s => s.id);

    // Bloqueo inmediato (antes de que llegue issys.css) para que no se vea la app sin login
    const bloqueo = document.createElement('style');
    bloqueo.textContent = 'html.issys-bloqueada body > *:not(#issys-gate){visibility:hidden}';
    document.head.appendChild(bloqueo);

    if (!document.querySelector('link[data-issys-css]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = `${BASE}issys.css`;
        l.dataset.issysCss = '';
        document.head.appendChild(l);
    }
    if (!document.querySelector('link[href*="Encode+Sans+Condensed"]')) {
        const f = document.createElement('link');
        f.rel = 'stylesheet';
        f.href = FUENTES;
        document.head.appendChild(f);
    }

    // ------------------------------------------------------------
    // Utilidades
    // ------------------------------------------------------------
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function alCargarDom(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
        else fn();
    }

    function cargarScript(src) {
        return new Promise((ok, mal) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = ok;
            s.onerror = mal;
            document.head.appendChild(s);
        });
    }

    function avisar(texto, acciones = []) {
        let el = document.getElementById('issys-aviso');
        if (el) el.remove();
        el = document.createElement('div');
        el.id = 'issys-aviso';
        el.setAttribute('role', 'alert');
        const span = document.createElement('span');
        span.textContent = texto;
        el.appendChild(span);
        const aviso = el;
        acciones.forEach(([etiqueta, fn]) => {
            const b = document.createElement('button');
            b.className = 'issys-btn chico';
            b.textContent = etiqueta;
            b.onclick = () => { aviso.remove(); fn(); };
            el.appendChild(b);
        });
        const x = document.createElement('button');
        x.className = 'issys-btn chico';
        x.setAttribute('aria-label', 'Cerrar');
        x.textContent = '✕';
        x.onclick = () => aviso.remove();
        el.appendChild(x);
        document.body.appendChild(el);
        if (!acciones.length) setTimeout(() => aviso.remove(), 8000);
    }

    // ------------------------------------------------------------
    // Firebase (una sola inicialización por página)
    // ------------------------------------------------------------
    let sdk = null;
    function conectar() {
        if (sdk) return sdk;
        sdk = cargarScript(`${CFG.sdk}firebase-app-compat.js`)
            .then(() => Promise.all([
                cargarScript(`${CFG.sdk}firebase-auth-compat.js`),
                cargarScript(`${CFG.sdk}firebase-firestore-compat.js`)
            ]))
            .then(() => {
                if (!firebase.apps.length) firebase.initializeApp(CFG.firebase);
                const auth = firebase.auth();
                const db = firebase.firestore();
                if (CFG.emuladoresEnLocalhost && location.hostname === 'localhost') {
                    auth.useEmulator('http://localhost:9099', { disableWarnings: true });
                    db.useEmulator('localhost', 8080);
                }
                db.enablePersistence({ synchronizeTabs: true }).catch(() => { /* sin caché local: sigue online */ });
                return { auth, db };
            });
        return sdk;
    }

    // ------------------------------------------------------------
    // Permisos
    // ------------------------------------------------------------
    async function perfilDe(db, email) {
        if (email === DUENO) return { admin: true, activo: true, sistemas: IDS.slice(), dueno: true };
        const doc = await db.collection('usuarios').doc(email).get();
        if (!doc.exists) return null;
        const d = doc.data();
        if (d.activo === false) return null;
        return { admin: d.admin === true, activo: true, sistemas: Array.isArray(d.sistemas) ? d.sistemas : [], dueno: false };
    }

    function habilitado(perfil, sistema) {
        return perfil.admin || perfil.sistemas.includes(sistema);
    }

    // ------------------------------------------------------------
    // Pantalla de ingreso
    // ------------------------------------------------------------
    const LOGO_GOOGLE = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';

    function crearGate(opc, obtenerAuth) {
        const titulo = opc.titulo || 'Sistemas ISSyS';
        const subtitulo = opc.subtitulo || '';
        const nombreSistema = (CFG.sistemas.find(s => s.id === opc.sistema) || {}).nombre || titulo;

        function pintar(html, alPintar) {
            alCargarDom(() => {
                let gate = document.getElementById('issys-gate');
                if (!gate) {
                    gate = document.createElement('div');
                    gate.id = 'issys-gate';
                    document.body.appendChild(gate);
                }
                gate.innerHTML = `<div class="caja" role="dialog" aria-label="${esc(titulo)}"><img class="logo" src="${LOGO}" alt="ISSyS">
                    <h1>${esc(titulo)}</h1>${subtitulo ? `<div class="sub">${esc(subtitulo)}</div>` : ''}${html}
                    <div class="pie">Instituto de Seguridad Social y Seguros del Chubut</div></div>`;
                if (alPintar) alPintar(gate);
            });
        }

        async function ingresar() {
            const auth = obtenerAuth();
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            try {
                await auth.signInWithPopup(provider);
            } catch (e) {
                if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
                    return auth.signInWithRedirect(provider);
                }
                if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
                    console.error(e);
                    g.login('No se pudo ingresar. Probá de nuevo.');
                }
            }
        }

        const g = {
            cargando(texto) {
                pintar(`<p>${esc(texto)}</p><div class="issys-spin" aria-hidden="true"></div>`);
            },
            error(texto) {
                pintar(`<p class="err">${esc(texto)}</p><button class="issys-btn" type="button" data-a="reintentar">Reintentar</button>`,
                    gate => { gate.querySelector('[data-a=reintentar]').onclick = () => location.reload(); });
            },
            login(error) {
                pintar(`<p>${esc(opc.texto || 'Ingresá con tu cuenta de Google.')}</p>
                    ${error ? `<p class="err">${esc(error)}</p>` : ''}
                    <button class="issys-btn" type="button" data-a="login">${LOGO_GOOGLE}Ingresar con Google</button>`,
                    gate => { gate.querySelector('[data-a=login]').onclick = ingresar; });
            },
            sinAcceso(email, registrado) {
                const texto = registrado
                    ? `<p>La cuenta <b>${esc(email)}</b> no tiene habilitado <b>${esc(nombreSistema)}</b>.</p><p>Pedile al administrador que lo habilite.</p>`
                    : `<p>La cuenta <b>${esc(email)}</b> no está autorizada.</p><p>Pedile al administrador que la agregue a la lista de usuarios.</p>`;
                pintar(`${texto}
                    ${registrado ? '<a class="issys-btn prim" href="/">Ir a Sistemas ISSyS</a>' : ''}
                    <button class="issys-btn" type="button" data-a="otra">Ingresar con otra cuenta</button>`,
                    gate => { gate.querySelector('[data-a=otra]').onclick = () => obtenerAuth().signOut(); });
            },
            quitar() {
                alCargarDom(() => {
                    const gate = document.getElementById('issys-gate');
                    if (gate) gate.remove();
                    document.documentElement.classList.remove('issys-bloqueada');
                });
            }
        };
        return g;
    }

    // ------------------------------------------------------------
    // Sesión
    // ------------------------------------------------------------
    let conexion = null;
    let saliendo = false;

    async function salir() {
        saliendo = true;
        const c = conexion || await conectar();
        try { await c.auth.signOut(); } catch (e) { /* igual se sale */ }
        try { await c.db.terminate(); await c.db.clearPersistence(); } catch (e) { /* sin caché que borrar */ }
        location.href = '/';
    }

    function iniciar(opc = {}) {
        const sistema = opc.sistema || null;
        document.documentElement.classList.add('issys-bloqueada');
        const gate = crearGate(opc, () => conexion.auth);
        gate.cargando('Conectando…');

        return new Promise(resolver => {
            conectar().then(c => {
                conexion = c;
                const { auth, db } = c;
                auth.getRedirectResult().catch(e => { console.error(e); gate.login('No se pudo ingresar. Probá de nuevo.'); });

                let sesion = null;
                auth.onAuthStateChanged(async user => {
                    if (sesion) {
                        if (!user && !saliendo) location.reload();   // se cerró la sesión desde otra pestaña u otro sistema
                        return;
                    }
                    if (!user) return gate.login();
                    const email = (user.email || '').toLowerCase();
                    gate.cargando('Verificando acceso…');
                    let perfil;
                    try {
                        perfil = await perfilDe(db, email);
                    } catch (e) {
                        console.error(e);
                        return gate.error('No se pudo verificar el acceso.');
                    }
                    if (!perfil) return gate.sinAcceso(email, false);
                    if (sistema && !habilitado(perfil, sistema)) return gate.sinAcceso(email, true);

                    sesion = {
                        firebase, auth, db,
                        usuario: { email, nombre: user.displayName, foto: user.photoURL, admin: perfil.admin, dueno: perfil.dueno, sistemas: perfil.admin ? IDS.slice() : perfil.sistemas },
                        mensaje: t => gate.cargando(t),
                        error: t => gate.error(t),
                        mostrar: () => gate.quitar(),
                        salir
                    };
                    resolver(sesion);
                });
            }).catch(e => {
                console.error(e);
                gate.error('No se pudo conectar con el servidor.');
            });
        });
    }

    // ------------------------------------------------------------
    // Avatar con menú (portal y sistemas que lo quieran usar)
    //   items: [{ texto, href } | { texto, accion, rojo }] — se agregan antes de "Cerrar sesión"
    // ------------------------------------------------------------
    function ponerUsuario(contenedor, usuario, opciones = {}) {
        const items = [];
        if (opciones.portal !== false) items.push({ texto: '▦ Sistemas ISSyS', href: '/' });
        if (usuario.admin && opciones.usuarios !== false) items.push({ texto: '👥 Usuarios y permisos', href: '/#usuarios' });
        (opciones.items || []).forEach(i => items.push(i));
        items.push({ texto: 'Cerrar sesión', rojo: true, accion: opciones.alSalir || salir });

        const chip = document.createElement('div');
        chip.className = 'issys-usuario';
        const inicial = esc((usuario.nombre || usuario.email).charAt(0).toUpperCase());
        chip.innerHTML = `<button class="avatar" type="button" title="${esc(usuario.email)}" aria-label="Cuenta de ${esc(usuario.email)}" aria-haspopup="menu">${usuario.foto ? `<img src="${esc(usuario.foto)}" alt="" referrerpolicy="no-referrer">` : inicial}</button>`;
        contenedor.appendChild(chip);

        const cerrar = () => { const m = chip.querySelector('.issys-menu'); if (m) m.remove(); };
        chip.querySelector('.avatar').onclick = (e) => {
            e.stopPropagation();
            if (chip.querySelector('.issys-menu')) return cerrar();
            const menu = document.createElement('div');
            menu.className = 'issys-menu';
            menu.setAttribute('role', 'menu');
            menu.innerHTML = `<div class="cab"><b>${esc(usuario.nombre || usuario.email)}</b><span>${esc(usuario.email)}${usuario.admin ? ' · administrador' : ''}</span></div>`
                + items.map((it, i) => it.href
                    ? `<a class="item" role="menuitem" href="${esc(it.href)}">${esc(it.texto)}</a>`
                    : `<button class="item${it.rojo ? ' rojo' : ''}" role="menuitem" type="button" data-i="${i}">${esc(it.texto)}</button>`).join('');
            menu.onclick = (ev) => {
                const b = ev.target.closest('[data-i]');
                if (!b) return;
                cerrar();
                items[+b.dataset.i].accion();
            };
            chip.appendChild(menu);
        };
        document.addEventListener('click', (e) => { if (!chip.contains(e.target)) cerrar(); });
        return chip;
    }

    window.ISSyS = { config: CFG, iniciar, salir, ponerUsuario, avisar, esc, cargarScript, alCargarDom };
})();
