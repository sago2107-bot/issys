/**
 * Ingreso único de los Sistemas ISSyS: Google + permisos por sistema en Firestore.
 *
 * Requiere shared/firebase-config.js cargado antes. Todos los sistemas viven en el mismo sitio
 * (issys-sistemas.web.app), así que la sesión de Google es una sola: quien ingresó en el portal
 * entra directo a cada sistema habilitado, y "Cerrar sesión" cierra todo.
 *
 * Permisos: usuarios/{email} = { admin: bool, activo: bool, sistemas: ['procesos', ...], roles: { estatuto: 'editor', ... } }
 *   - Se indexa por email (y no por uid) para poder dar de alta a alguien antes de su primer ingreso.
 *   - El administrador fijo (config.dueno) entra siempre a todo.
 *   - admin: true habilita todos los sistemas y la gestión de usuarios en el portal.
 *   - roles: rol dentro de un sistema que los tiene (hoy sólo Estatuto: admin, editor, revisor, lector).
 *     Lo interpreta cada sistema; ver ISSyS.rolEn(usuario, sistema).
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
    const FUENTES = `${BASE}fuentes/fuentes.css`; // servidas desde el sitio (sin Google Fonts)
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
    if (!document.querySelector('link[href*="fuentes/fuentes.css"]')) {
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
        if (email === DUENO) return { admin: true, activo: true, sistemas: IDS.slice(), roles: {}, dueno: true };
        const doc = await db.collection('usuarios').doc(email).get();
        if (!doc.exists) return null;
        const d = doc.data();
        if (d.activo === false) return null;
        return {
            admin: d.admin === true, activo: true, dueno: false,
            sistemas: Array.isArray(d.sistemas) ? d.sistemas : [],
            roles: d.roles && typeof d.roles === 'object' ? d.roles : {}
        };
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
                        usuario: { email, nombre: user.displayName, foto: user.photoURL, admin: perfil.admin, dueno: perfil.dueno, sistemas: perfil.admin ? IDS.slice() : perfil.sistemas, roles: perfil.roles },
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
    // Íconos de los sistemas (portal y lanzador). Trazos de 24×24; la clave es config.sistemas[].icono
    // ------------------------------------------------------------
    const ICONOS = {
        portal: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
        procesos: '<rect x="3" y="3" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
        presentaciones: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
        estatuto: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
        delegaciones: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        consultorios: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        usuarios: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
        salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
        descargar: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
        subir: '<path d="M12 20V8M7 13l5-5 5 5M4 4h16"/>',
        mapa: '<circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M8.5 7.5 11 15.5M15.5 7.5 13 15.5M9 6h6"/>',
        editor: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>'
    };
    const icono = (id, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${ICONOS[id] || ICONOS.portal}</svg>`;
    // Botón del lanzador: 9 puntos, como el de Google
    const NUEVE_PUNTOS = '<svg viewBox="0 0 24 24" aria-hidden="true">' + [5, 12, 19].map(y => [5, 12, 19].map(x => `<circle cx="${x}" cy="${y}" r="2.1"/>`).join('')).join('') + '</svg>';

    // ------------------------------------------------------------
    // ENCABEZADO COMÚN (regla general de los Sistemas ISSyS; ver README → "Encabezado común")
    //
    // Agrega al final del contenedor (el extremo derecho del encabezado):
    //   [lanzador de sistemas ⋮⋮⋮]  [foto de perfil]
    // · Lanzador: panel con los sistemas que la persona tiene habilitados (sale de config.sistemas),
    //   el sistema actual marcado y acceso al portal. Reemplaza al viejo botón "Sistemas ISSyS".
    // · Foto de perfil (la de Google; si no hay, la inicial): menú de cuenta con nombre, correo,
    //   rol en el sistema, estado de guardado (opcional), acciones propias y "Cerrar sesión".
    //
    //   const enc = ISSyS.ponerEncabezado(contenedor, ses.usuario, {
    //       sistema: 'procesos',                              // id del sistema actual (null en el portal)
    //       rol: 'Editor',                                    // opcional: se muestra en la tarjeta de cuenta
    //       items: [{ texto, accion | href, icono? }],        // opcional: acciones propias del sistema
    //       alSalir: fn                                       // opcional: en vez de ISSyS.salir
    //   });
    //   enc.estado('guardando' | 'ok' | 'error');            // opcional: punto de estado sobre la foto
    // ------------------------------------------------------------
    let abierto = null;   // { boton, panel } del panel abierto (uno a la vez en toda la página)

    function cerrarPanel(volverFoco) {
        if (!abierto) return;
        const { boton, panel } = abierto;
        abierto = null;
        panel.remove();
        boton.setAttribute('aria-expanded', 'false');
        if (volverFoco) boton.focus();
    }
    document.addEventListener('click', e => { if (abierto && !abierto.panel.contains(e.target) && !abierto.boton.contains(e.target)) cerrarPanel(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && abierto) cerrarPanel(true); });
    // Debajo del botón, alineado a su borde derecho; se reubica si cambia el tamaño de la ventana
    function ubicarPanel() {
        if (!abierto) return;
        const r = abierto.boton.getBoundingClientRect();
        const ancho = document.documentElement.clientWidth;
        // Nunca fuera de pantalla: ni pasado el borde derecho ni el izquierdo
        const derecha = Math.min(Math.max(12, Math.round(ancho - r.right)), Math.max(12, ancho - abierto.panel.offsetWidth - 12));
        abierto.panel.style.top = `${Math.round(r.bottom + 8)}px`;
        abierto.panel.style.right = `${derecha}px`;
    }
    window.addEventListener('resize', ubicarPanel);

    function alternarPanel(boton, armar, teclado) {
        const eraEste = abierto && abierto.boton === boton;
        cerrarPanel();
        if (eraEste) return;
        // El panel cuelga del body (posición fija): así no lo recortan ni lo pisan los estilos del encabezado de cada sistema
        const panel = armar();
        document.body.appendChild(panel);
        boton.setAttribute('aria-expanded', 'true');
        abierto = { boton, panel };
        ubicarPanel();
        // Con teclado (Enter/Espacio) el foco entra al panel; con el mouse no, para no mostrar el contorno de foco
        const primero = teclado && panel.querySelector('a,button');
        if (primero) primero.focus({ preventScroll: true });
    }

    const ESTADOS = {
        ok: '✓ Cambios guardados en la nube',
        guardando: 'Guardando en la nube…',
        error: '⚠ No se pudieron guardar los cambios'
    };

    function ponerEncabezado(contenedor, usuario, opciones = {}) {
        const actual = opciones.sistema || null;
        const nombre = usuario.nombre || usuario.email;
        const inicial = esc(nombre.charAt(0).toUpperCase());
        let estado = null;

        const caja = document.createElement('div');
        caja.className = 'issys-encabezado';
        caja.innerHTML = `
            <div class="issys-ancla">
                <button class="issys-lanzador" type="button" title="Sistemas ISSyS" aria-label="Sistemas ISSyS" aria-haspopup="true" aria-expanded="false">${NUEVE_PUNTOS}</button>
            </div>
            <div class="issys-ancla">
                <button class="issys-avatar" type="button" title="Cuenta de ISSyS&#10;${esc(nombre)}&#10;${esc(usuario.email)}" aria-label="Cuenta de ${esc(usuario.email)}" aria-haspopup="true" aria-expanded="false">
                    <span class="foto">${inicial}</span><span class="punto" hidden></span>
                </button>
            </div>`;
        contenedor.appendChild(caja);

        // Foto de Google con respaldo a la inicial si no carga
        const foto = caja.querySelector('.issys-avatar .foto');
        if (usuario.foto) {
            const img = new Image();
            img.alt = '';
            img.referrerPolicy = 'no-referrer';
            img.onload = () => { foto.textContent = ''; foto.appendChild(img); };
            img.src = usuario.foto;
        }

        // ---- Lanzador de sistemas ----
        const lanzador = caja.querySelector('.issys-lanzador');
        lanzador.onclick = e => {
            e.stopPropagation();
            alternarPanel(lanzador, () => {
                const visibles = CFG.sistemas.filter(s => s.estado === 'activo' ? usuario.sistemas.includes(s.id) : usuario.admin);
                const p = document.createElement('div');
                p.className = 'issys-panel issys-apps';
                p.setAttribute('role', 'dialog');
                p.setAttribute('aria-label', 'Sistemas ISSyS');
                const mosaico = (s) => {
                    const es = s.id === actual;
                    const color = s.color === 'green' ? 'verde' : 'azul';
                    if (s.estado !== 'activo') {
                        return `<div class="app prox" aria-disabled="true" title="${esc(s.descripcion || '')}"><span class="ico ${color}">${icono(s.icono)}</span><span class="nom">${esc(s.nombre)}</span><span class="sub">Próximamente</span></div>`;
                    }
                    return `<a class="app${es ? ' actual' : ''}" href="${esc(s.url)}" title="${esc(s.descripcion || s.nombre)}"${es ? ' aria-current="page"' : ''}><span class="ico ${color}">${icono(s.icono)}</span><span class="nom">${esc(s.nombre)}</span>${es ? '<span class="sub">Estás acá</span>' : ''}</a>`;
                };
                p.innerHTML = `
                    <div class="cab"><b>Sistemas ISSyS</b><span>Tu sesión sirve para todos</span></div>
                    <div class="favoritos">
                        <div class="grilla">
                            <a class="app${actual === null ? ' actual' : ''}" href="/"><span class="ico gris">${icono('portal')}</span><span class="nom">Inicio</span>${actual === null ? '<span class="sub">Estás acá</span>' : ''}</a>
                            ${visibles.filter(s => s.estado === 'activo').map(mosaico).join('')}
                        </div>
                    </div>
                    ${visibles.some(s => s.estado !== 'activo') ? `<div class="grilla resto">${visibles.filter(s => s.estado !== 'activo').map(mosaico).join('')}</div>` : ''}
                    ${usuario.admin ? `<a class="pie" href="/#usuarios">${icono('usuarios')}Usuarios y permisos</a>` : ''}`;
                return p;
            }, e.detail === 0);
        };

        // ---- Menú de cuenta ----
        const items = (opciones.items || []).slice();
        const avatar = caja.querySelector('.issys-avatar');
        const tituloAvatar = avatar.title;
        avatar.onclick = e => {
            e.stopPropagation();
            alternarPanel(avatar, () => {
                const p = document.createElement('div');
                p.className = 'issys-panel issys-cuenta';
                p.setAttribute('role', 'dialog');
                p.setAttribute('aria-label', 'Cuenta');
                const etiquetas = [];
                if (usuario.admin) etiquetas.push('<span class="issys-tag">Administrador ISSyS</span>');
                if (opciones.rol) etiquetas.push(`<span class="issys-tag verde">${esc(opciones.rol)}</span>`);
                p.innerHTML = `
                    <div class="correo">${esc(usuario.email)}</div>
                    <div class="foto-grande">${foto.innerHTML}</div>
                    <div class="hola">¡Hola, ${esc((usuario.nombre || '').split(' ')[0] || usuario.email)}!</div>
                    ${etiquetas.length ? `<div class="etiquetas">${etiquetas.join('')}</div>` : ''}
                    <div class="estado" ${estado ? '' : 'hidden'}></div>
                    <div class="acciones">
                        ${items.map((it, i) => it.href
                            ? `<a class="item" href="${esc(it.href)}">${it.icono ? icono(it.icono) : ''}<span>${esc(it.texto)}</span></a>`
                            : `<button class="item" type="button" data-i="${i}">${it.icono ? icono(it.icono) : ''}<span>${esc(it.texto)}</span></button>`).join('')}
                        <button class="item salir" type="button" data-salir>${icono('salir')}<span>Cerrar sesión</span></button>
                    </div>
                    <div class="pie">Instituto de Seguridad Social y Seguros del Chubut</div>`;
                pintarEstado(p);
                p.onclick = ev => {
                    const b = ev.target.closest('[data-i],[data-salir]');
                    if (!b) return;
                    cerrarPanel();
                    if (b.hasAttribute('data-salir')) (opciones.alSalir || salir)();
                    else items[+b.dataset.i].accion();
                };
                return p;
            }, e.detail === 0);
        };

        function pintarEstado(p) {
            const el = p && p.querySelector('.estado');
            if (!el || !estado) return;
            el.hidden = false;
            el.className = `estado ${estado}`;
            el.textContent = ESTADOS[estado] || '';
        }

        return {
            elemento: caja,
            estado(e) {
                estado = e;
                const punto = avatar.querySelector('.punto');
                punto.hidden = false;
                punto.className = `punto ${e}`;
                // El estado también en texto: al pasar el mouse y para lectores de pantalla
                avatar.title = `${tituloAvatar}\n${ESTADOS[e] || ''}`;
                avatar.setAttribute('aria-label', `Cuenta de ${usuario.email}. ${ESTADOS[e] || ''}`);
                if (abierto && abierto.boton === avatar) pintarEstado(abierto.panel);
            }
        };
    }

    // Compatibilidad con la versión anterior (sólo avatar). Ahora pone el encabezado completo.
    function ponerUsuario(contenedor, usuario, opciones = {}) {
        return ponerEncabezado(contenedor, usuario, opciones).elemento;
    }

    // Rol de la persona en un sistema con roles (config.sistemas[].roles). El dueño es siempre el primer rol (admin);
    // sin rol asignado: un administrador global toma el primero y el resto el último (el de menos permisos).
    function rolEn(usuario, sistema) {
        const def = CFG.sistemas.find(s => s.id === sistema);
        const roles = (def && def.roles) ? def.roles.map(r => r.id) : [];
        if (!roles.length) return null;
        if (usuario.dueno) return roles[0];
        const r = usuario.roles && usuario.roles[sistema];
        if (roles.includes(r)) return r;
        return usuario.admin ? roles[0] : roles[roles.length - 1];
    }

    // Nombre visible del rol de la persona en un sistema (ej. 'Editor'), o null si el sistema no tiene roles
    function nombreRol(usuario, sistema) {
        const id = rolEn(usuario, sistema);
        const def = CFG.sistemas.find(s => s.id === sistema);
        const r = id && def && def.roles.find(x => x.id === id);
        return r ? r.nombre : null;
    }

    window.ISSyS = { config: CFG, iniciar, salir, ponerEncabezado, ponerUsuario, icono, avisar, esc, cargarScript, alCargarDom, rolEn, nombreRol };
})();
