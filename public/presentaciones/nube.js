/**
 * Capa de nube del editor de presentaciones ISSyS: guardado compartido en Firestore (proyecto issys-procesos).
 * El ingreso con Google y los permisos los resuelve shared/auth.js (login único de los Sistemas ISSyS).
 *
 * Sólo se carga en el sitio publicado (ver ES_NUBE en index.html). El archivo que genera
 * "Descargar" no la usa: sigue funcionando sin internet y guardando en el navegador.
 *
 * presentaciones/{id}: la presentación como JSON, con cada imagen reemplazada por "nube:<hash>".
 * presentacionesImagenes/{hash}: cada imagen, porque un documento de Firestore admite hasta 1 MiB.
 *
 * El motor espera `window.nubeListo`, que entrega las operaciones de guardado una vez que hay usuario.
 */
(function () {
    const TOPE_IMAGEN = 1000000;   // caracteres; deja margen dentro del límite de 1 MiB por documento

    let listo;
    window.nubeListo = new Promise(r => { listo = r; });

    let ses = null;
    let db = null;
    let usuario = null;

    // ------------------------------------------------------------
    // Imágenes: en la presentación abierta van completas; en Firestore, aparte y por hash
    // ------------------------------------------------------------
    const imagenes = new Map();    // hash -> data URL
    const subidas = new Map();     // data URL -> Promise del hash

    const COL_DECKS = () => db.collection('presentaciones');
    const COL_IMAGENES = () => db.collection('presentacionesImagenes');

    // Las imágenes de un archivo importado pueden superar el límite: se reducen hasta que entren
    async function achicar(dataUrl) {
        const im = new Image();
        im.src = dataUrl;
        await im.decode();
        let escala = 1;
        let calidad = 0.85;
        let salida = dataUrl;
        while (salida.length > TOPE_IMAGEN) {
            escala *= 0.85;
            calidad = Math.max(0.6, calidad - 0.05);
            const c = document.createElement('canvas');
            c.width = Math.max(1, Math.round(im.naturalWidth * escala));
            c.height = Math.max(1, Math.round(im.naturalHeight * escala));
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            salida = c.toDataURL('image/webp', calidad);
        }
        return salida;
    }

    async function hashDe(texto) {
        const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
        return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function subirImagen(dataUrl) {
        if (subidas.has(dataUrl)) return subidas.get(dataUrl);
        const p = (async () => {
            const data = dataUrl.length > TOPE_IMAGEN ? await achicar(dataUrl) : dataUrl;
            const hash = await hashDe(data);
            await COL_IMAGENES().doc(hash).set({ data, por: usuario.email });
            imagenes.set(hash, data);
            return hash;
        })();
        subidas.set(dataUrl, p);
        p.catch(() => subidas.delete(dataUrl));
        return p;
    }

    async function bajarImagen(hash) {
        if (imagenes.has(hash)) return imagenes.get(hash);
        const doc = await COL_IMAGENES().doc(hash).get();
        const data = doc.exists ? doc.data().data : '';
        imagenes.set(hash, data);
        if (data) subidas.set(data, Promise.resolve(hash));   // ya está en la nube: no se vuelve a subir
        return data;
    }

    // Recorre la presentación y reemplaza cada texto que cumpla la condición
    async function transformar(valor, cumple, fn) {
        if (Array.isArray(valor)) return Promise.all(valor.map(v => transformar(v, cumple, fn)));
        if (valor && typeof valor === 'object') {
            const pares = await Promise.all(Object.entries(valor).map(async ([k, v]) => [k, await transformar(v, cumple, fn)]));
            return Object.fromEntries(pares);
        }
        return typeof valor === 'string' && cumple(valor) ? fn(valor) : valor;
    }

    const conImagenes = valor => transformar(valor, v => v.startsWith('nube:'), v => bajarImagen(v.slice(5)));

    // ------------------------------------------------------------
    // Presentaciones
    // ------------------------------------------------------------
    const revisiones = new Map();   // id -> revisión sobre la que se está editando
    let cola = Promise.resolve();   // los guardados van de a uno para que la revisión sea consistente

    async function escribir(deck) {
        const hashes = new Set();
        const sinImagenes = await transformar(deck, v => v.startsWith('data:image/') || v.startsWith('nube:'), async v => {
            const hash = v.startsWith('nube:') ? v.slice(5) : await subirImagen(v);
            hashes.add(hash);
            return `nube:${hash}`;
        });
        const ref = COL_DECKS().doc(deck.id);
        const rev = await db.runTransaction(async tx => {
            const actual = await tx.get(ref);
            // Otra persona (u otra pestaña) guardó después de que esta versión se abriera: no se pisa
            if (actual.exists && actual.data().rev !== (revisiones.get(deck.id) || 0)) {
                throw Object.assign(new Error('conflicto'), { conflicto: true, por: actual.data().por || 'Otra persona' });
            }
            const nueva = (actual.exists ? actual.data().rev : 0) + 1;
            const datos = {
                rev: nueva,
                por: usuario.email,
                actualizado: deck.actualizado || new Date().toISOString(),
                deck: JSON.stringify(sinImagenes)
            };
            if (hashes.size) datos.imagenes = firebase.firestore.FieldValue.arrayUnion(...hashes);
            tx.set(ref, datos, { merge: true });
            return nueva;
        });
        revisiones.set(deck.id, rev);
    }

    function poner(deck) {
        const p = cola.then(() => escribir(deck));
        cola = p.catch(() => {});
        return p;
    }

    async function leer(id) {
        const doc = await COL_DECKS().doc(id).get();
        if (!doc.exists) return undefined;
        const d = doc.data();
        const deck = normalizar(await conImagenes(JSON.parse(d.deck)));   // lo guardado pasa por el mismo filtro que un archivo
        deck.id = id;
        revisiones.set(id, d.rev);
        return { id, titulo: deck.titulo, actualizado: d.actualizado, por: d.por, deck };
    }

    // Para la biblioteca alcanza con la primera diapositiva; la presentación completa se baja al abrirla
    async function listar() {
        const snap = await COL_DECKS().get();
        const filas = await Promise.all(snap.docs.map(async doc => {
            const d = doc.data();
            try {
                const crudo = JSON.parse(d.deck);
                const n = crudo.diapositivas.length;
                crudo.diapositivas = [await conImagenes(crudo.diapositivas[0])];
                const deck = normalizar(crudo);
                return { id: doc.id, titulo: deck.titulo, actualizado: d.actualizado, por: d.por, n, deck };
            } catch (e) {
                console.error('Nube: presentación ilegible', doc.id, e);
                return null;
            }
        }));
        return filas.filter(Boolean);
    }

    // Al borrar se limpian las imágenes que ninguna otra presentación usa
    async function borrar(id) {
        const ref = COL_DECKS().doc(id);
        const doc = await ref.get();
        const hashes = (doc.exists && doc.data().imagenes) || [];
        await ref.delete();
        revisiones.delete(id);
        await Promise.all(hashes.map(async hash => {
            const usos = await COL_DECKS().where('imagenes', 'array-contains', hash).limit(1).get();
            if (usos.empty) {
                await COL_IMAGENES().doc(hash).delete();
                imagenes.delete(hash);
            }
        }));
        subidas.clear();
    }


    const avisar = (texto, acciones = []) => ISSyS.avisar(texto, acciones);

    async function salir() {
        await guardarYa();
        try { localStorage.removeItem(CLAVE_ULTIMA); } catch (e) { /* sin almacenamiento */ }
        ses.salir();   // cierra la sesión de todos los Sistemas ISSyS y vuelve al portal
    }

    // ------------------------------------------------------------
    // Arranque: carga el login único y espera al usuario
    // ------------------------------------------------------------
    function cargarScript(src) {
        return new Promise((ok, mal) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = ok;
            s.onerror = mal;
            document.head.appendChild(s);
        });
    }

    cargarScript('/shared/firebase-config.js')
        .then(() => cargarScript('/shared/auth.js'))
        .then(() => ISSyS.iniciar({
            sistema: 'presentaciones',
            titulo: 'Presentaciones',
            subtitulo: 'Editor institucional',
            texto: 'Ingresá con tu cuenta de Google para crear, editar y presentar.'
        }))
        .then(s => {
            ses = s;
            db = s.db;
            usuario = s.usuario;
            ISSyS.alCargarDom(() => {
                s.mostrar();
                ISSyS.ponerUsuario(document.getElementById('e-top'), usuario, { alSalir: salir });
                listo({ leer, listar, poner, borrar, avisar, usuario });
            });
        })
        .catch(e => {
            console.error(e);
            document.body.innerHTML = '<p style="font:20px sans-serif;padding:40px">No se pudo conectar con el servidor. <a href="">Reintentar</a></p>';
        });
})();
