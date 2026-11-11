/**
 * Capa de nube de Estatuto (editor y mapa de conceptos) sobre el login único de los Sistemas ISSyS.
 *
 * Antes Estatuto vivía en el proyecto issys-eer con usuario y contraseña y su propia colección users/{uid}.
 * Ahora ingresa con Google por shared/auth.js y el rol sale de usuarios/{email}.roles.estatuto.
 *
 * Para no reescribir las páginas, este archivo expone las mismas funciones que antes daba el SDK modular
 * (window._fbDb, _fbDoc, _fbGetDoc, _fbSetDoc, _fbFirestore, _fbOnAuthChanged, _fbSignOut) y el perfil
 * en window._issysEstatuto.perfil = { email, name, role, active }.
 *
 * Se carga en el <head>, después de /shared/firebase-config.js y /shared/auth.js:
 *   <script src="nube.js" data-pagina="editor"></script>   (o data-pagina="mapa")
 */
(function () {
    const pagina = (document.currentScript && document.currentScript.dataset.pagina) || 'editor';
    const CLAVE_EDITOR = 'eerEditorState';

    let ses = null;
    let usuarioFb = null;
    const esperando = [];

    // ------------------------------------------------------------
    // Misma forma que el SDK modular (doc, getDoc, setDoc, getDocs, collection)
    // ------------------------------------------------------------
    const envolver = s => ({ id: s.id, ref: s.ref, exists: () => s.exists, data: () => s.data() });
    window._fbDoc = (db, coleccion, id) => db.collection(coleccion).doc(id);
    window._fbGetDoc = ref => ref.get().then(envolver);
    window._fbSetDoc = (ref, datos, opciones) => ref.set(datos, opciones || {});
    window._fbFirestore = {
        collection: (db, coleccion) => db.collection(coleccion),
        getDocs: q => q.get().then(s => {
            const docs = s.docs.map(envolver);
            return { empty: s.empty, size: s.size, docs, forEach: f => docs.forEach(f) };
        })
    };
    window._fbSignIn = () => Promise.reject(Object.assign(new Error('El ingreso es con Google'), { code: 'auth/google' }));
    window._fbSignOut = () => (ses ? ses.salir() : ISSyS.salir());
    window._fbOnAuthChanged = cb => {
        if (ses) cb(usuarioFb);
        else esperando.push(cb);
        return () => {};
    };
    window._issysEstatuto = { perfil: null };

    // El mapa arrancaba su login desde el script de Firebase; ahora lo dispara esta capa
    if (pagina === 'mapa') {
        ISSyS.alCargarDom(() => { if (typeof window.initAuth === 'function') window.initAuth(); });
    }

    // El editor arranca con lo que tiene en el navegador: si la nube tiene algo más nuevo, lo baja y recarga
    async function sincronizarEditor(db) {
        const snap = await db.collection('eerEditor').doc('state').get();
        if (!snap.exists) return false;
        const nube = snap.data();
        let local = 0;
        try { local = (JSON.parse(localStorage.getItem(CLAVE_EDITOR) || 'null') || {})._ts || 0; } catch (e) { /* caché ilegible */ }
        if ((nube._ts || 0) <= local) return false;
        localStorage.setItem(CLAVE_EDITOR, JSON.stringify(nube));
        location.reload();
        return true;
    }

    ISSyS.iniciar({
        sistema: 'estatuto',
        titulo: pagina === 'mapa' ? 'Mapa de Conceptos' : 'Estatuto',
        subtitulo: 'Escalafón Reglamentario',
        texto: 'Ingresá con tu cuenta de Google para consultar y trabajar el Estatuto.'
    }).then(async s => {
        const u = s.usuario;
        window._issysEstatuto.perfil = { email: u.email, name: u.nombre || u.email, role: ISSyS.rolEn(u, 'estatuto'), active: true };

        if (pagina === 'editor') {
            s.mensaje('Cargando el Estatuto…');
            try {
                if (await sincronizarEditor(s.db)) return;   // recarga con el estado de la nube
            } catch (e) {
                console.error(e);
                return s.error('No se pudo cargar el Estatuto.');
            }
        }

        ses = s;
        usuarioFb = s.auth.currentUser || { email: s.usuario.email, displayName: s.usuario.nombre, uid: s.usuario.email };
        window._fbDb = s.db;
        ISSyS.alCargarDom(() => {
            s.mostrar();
            // Encabezado común de los Sistemas ISSyS: lanzador de sistemas + foto con el rol en Estatuto
            const items = pagina === 'mapa'
                ? [{ texto: 'Ir al editor del Estatuto', icono: 'editor', href: 'index.html' }]
                : [{ texto: 'Mapa de conceptos', icono: 'mapa', href: 'mapa.html' }];
            ISSyS.ponerEncabezado(document.getElementById('issys-encabezado') || document.querySelector('.hdr') || document.body, s.usuario, {
                sistema: 'estatuto',
                rol: `Estatuto · ${ISSyS.nombreRol(s.usuario, 'estatuto')}`,
                items
            });
            esperando.splice(0).forEach(cb => cb(usuarioFb));
        });
    });
})();
