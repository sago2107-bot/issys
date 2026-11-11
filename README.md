# Sistemas ISSyS

Portal único con ingreso de Google y selector de sistemas del Instituto de Seguridad Social y Seguros del Chubut.
Reemplaza tres sitios con ingresos y listas de acceso separadas (Procesos, Presentaciones y Estatuto) por un solo ingreso y
una sola lista de permisos. Delegaciones y Consultorios todavía no están incluidos (ver "Próximas etapas").

- **Proyecto Firebase:** `issys-procesos` (Firestore + Auth + Hosting)
- **Sitio de Hosting:** `issys-sistemas` → https://issys-sistemas.web.app
- **Repo:** https://github.com/sago2107-bot/issys
- **Carpeta local:** `D:\issys`
- **Sistemas anteriores:** `D:\issys-procesos` (repo viejo de Procesos, del que se publicaban las reglas),
  `issys-presentaciones` (sitio) e `issys-eer` (proyecto Firebase aparte de Estatuto). Se retiran con el plan de migración.

## Estructura

```
issys/
├── .firebaserc            proyecto issys-procesos + target "sistemas" → sitio issys-sistemas
├── firebase.json          hosting (public/), reglas y emuladores
├── firestore.rules        reglas de todo el proyecto (se publican sólo desde acá)
├── docs/                  manual de marca para web apps
├── recursos/              material que no se publica (temas JSON de ejemplo, etc.)
├── eer/                   copia de referencia del repo anterior de Estatuto (en .gitignore)
└── public/
    ├── index.html         portal: login + selector + usuarios y permisos
    ├── shared/
    │   ├── firebase-config.js   credenciales, administrador fijo y catálogo de sistemas
    │   ├── auth.js              login único (ISSyS.iniciar) y encabezado común
    │   ├── issys.css            tokens de marca y componentes comunes
    │   ├── issys-tailwind.js    paleta de marca para sistemas con Tailwind
    │   └── marca/               logos oficiales
    ├── procesos/          index.html, modelador.html, bpmn-*.js, nube.js
    ├── presentaciones/    index.html, nube.js
    ├── estatuto/          index.html (editor), mapa.html (mapa de conceptos), nube.js,
    │                      estatuto-marca.css (identidad común: se carga después de los estilos propios)
    └── herramientas/      migrar-estatuto.html (uso puntual, sólo administradores; se borra después de migrar)
```

## Cómo se integra un sistema

1. Carpeta propia en `public/<id>/` con su `index.html`.
2. En el `<head>`: `/shared/firebase-config.js` y después `/shared/auth.js`. `auth.js` agrega `issys.css` y la fuente si
   faltan.
3. Al arrancar: `const ses = await ISSyS.iniciar({ sistema: '<id>', titulo, subtitulo })`.
   Devuelve `{ firebase, auth, db, usuario, mensaje, error, mostrar, salir }` cuando la persona está autorizada para ese
   sistema. Si no lo está, muestra la pantalla de "sin acceso" y la promesa no se resuelve.
   `ses.mostrar()` cierra la pantalla de ingreso (llamarlo cuando el sistema ya cargó sus datos); `ses.salir()` cierra la
   sesión de todos los sistemas. Detalle completo en [public/shared/README.md](./public/shared/README.md).
4. Agregar sus colecciones en `firestore.rules` con `habilitado('<id>')`.
5. Agregar el sistema en `firebase-config.js` (`sistemas`, con `estado: 'activo'`; `'proximamente'` lo muestra en gris sólo a
   administradores). Con eso aparece automáticamente en el portal y en el lanzador de todos los sistemas. Si necesita un
   ícono nuevo, agregarlo en `ICONOS` de `shared/auth.js` (si falta, usa el del portal).
6. Armar el encabezado según "Encabezado común" y llamar a `ISSyS.ponerEncabezado(...)` después de `ses.mostrar()`.

## Encabezado común (regla general)

**Todos los sistemas usan este encabezado.** No se dibujan a mano botones de "volver", avatares ni menús de usuario: el
extremo derecho lo arma `shared/auth.js` para que sea idéntico en todos los sistemas.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ [logo ISSyS] │ Nombre del sistema          [buscador / herramientas propias]   ⋮⋮⋮  (foto) │
│              │ bajada                                                                     │
└══════════════════════════════════════ borde verde 4px ════════════════════════════════════┘
```

- Barra blanca con borde inferior verde de 4 px; nunca azul ni oscura.
- Logo a color, línea vertical gris, nombre (peso 900) y bajada (peso 300).
- Las herramientas propias del sistema van entre el título y el lanzador.
- Siempre al final y en este orden: lanzador ⋮⋮⋮ (Inicio, sistemas habilitados, "Usuarios y permisos" para administradores)
  y foto de perfil (menú de cuenta y "Cerrar sesión").

Medidas, colores y estados: sección 8 del [manual de marca](./docs/ISSyS-brand-guidelines.md). Estilos en
`shared/issys.css` (sección "ENCABEZADO COMÚN").

Uso:

```html
<header class="…">
  <img class="issys-logo" src="/shared/marca/issys-logo-recorte.png" alt="ISSyS">
  <div class="titulo">…</div>
  … herramientas del sistema …
  <div id="issys-encabezado"></div>   <!-- siempre al final -->
</header>
```

```js
const enc = ISSyS.ponerEncabezado(document.getElementById('issys-encabezado'), ses.usuario, {
    sistema: '<id>',                                   // marca el sistema actual en el lanzador (null en el portal)
    rol: 'Texto del rol',                              // opcional; Estatuto usa ISSyS.nombreRol(ses.usuario, 'estatuto')
    items: [{ texto: 'Descargar respaldo', icono: 'descargar', accion: fn }],   // opcional; en vez de accion, href: '/…'
    alSalir: fn                                        // opcional: si hay que guardar algo antes de salir
});
enc.estado('guardando');                               // opcional: 'guardando', 'ok' o 'error' (punto sobre la foto)
```

Los paneles cuelgan del `body` (posición fija), así que el encabezado del sistema puede tener sus propios estilos.

## Permisos

`usuarios/{email}` → `{ admin: bool, activo: bool, sistemas: ['procesos', 'presentaciones', …], roles: { estatuto: 'editor' } }`

- Se indexa por **correo** y no por uid: así se puede dar de alta a alguien antes de su primer ingreso (el uid recién existe
  cuando la persona entra por primera vez).
- Hay tres "administradores" distintos:
  - **Administrador fijo** (`dueno`, en `firebase-config.js` y `firestore.rules`): entra siempre, aunque no tenga documento.
    Sirve para el primer ingreso, cuando `usuarios` está vacío.
  - **Administrador global** (`admin: true`): todos los sistemas y la gestión de usuarios.
  - **Rol Administrador de Estatuto** (`roles.estatuto: 'admin'`): sólo dentro de Estatuto.
- `roles`: rol dentro de los sistemas que los tienen. Hoy sólo Estatuto: `admin`, `editor`, `revisor`, `lector` (qué hace cada
  uno: [public/estatuto/README.md](./public/estatuto/README.md)). Sin rol asignado, un administrador global es `admin` y el
  resto `lector`.
- En las reglas, `habilitado('<id>')` es verdadero si la persona está activa y es administradora global o tiene `<id>` en
  `sistemas`.
- Se gestiona desde el portal → sección **Usuarios y permisos** (sólo administradores globales).

## Decisiones

- **Un solo proyecto Firebase:** Procesos y Presentaciones ya lo compartían, así que no hubo que mover sus datos.
- **Permisos en Firestore y no en *custom claims*:** los claims necesitan un servidor o Cloud Functions; así alcanza con
  reglas y un sitio estático.
- **Sitio estático sin compilación:** se publica tal cual está en `public/`. La excepción es `procesos/bpmn-extensiones.js`,
  un bundle que ya viene generado (ver su README).
- **Adaptador `estatuto/nube.js`** en vez de reescribir Estatuto: las páginas siguen usando su API anterior.

## Riesgos aceptados

- Las credenciales web son públicas: **las reglas son la única barrera**. Se prueban a mano (ver "System Verification").
- Hasta el paso 9 de la Etapa 1, el bloque LEGADO también da acceso: suspender a alguien en el portal no alcanza.
- Estatuto: el rol sobre el texto (`eerEditor`) lo aplica sólo el navegador; las reglas lo aplican sólo al mapa (`eerGraph`).
  Dos personas que guardan a la vez se pisan (se guarda el documento entero). Se revisa si hay más de un editor habitual.
- `eerEditor/state` es un solo documento con el límite de 1 MiB de Firestore. Si lo supera, el guardado falla y el
  encabezado muestra el error.
- Las reglas exigen el correo verificado: una cuenta de Google creada con un correo que no es de Gmail tiene que verificarlo.
- Tailwind (CDN de desarrollo) y D3 (`d3@7`) no tienen versión exacta ni control de integridad.
- El ingreso usa `authDomain: 'issys-sistemas.web.app'`. Requiere que ese dominio esté autorizado en Auth y que
  `https://issys-sistemas.web.app/__/auth/handler` figure como URI de redirección del cliente OAuth (Etapa 1, paso 4).

---

## Contrato del repositorio (EGM)

Títulos en inglés: los pide la plantilla EGM (contratos de cada carpeta, para personas y asistentes de código).

### System Overview

Sitio estático sin compilación servido por Firebase Hosting desde `public/`, con un único proyecto Firebase
(`issys-procesos`) para Auth (Google) y Firestore. Cada sistema es una carpeta de `public/` que entra por
`ISSyS.iniciar` y arma su encabezado con `ISSyS.ponerEncabezado` (`public/shared/auth.js`). Los permisos de todos los
sistemas viven en `usuarios/{email}` y los aplica `firestore.rules`. La raíz no tiene código propio, sólo configuración
(`firebase.json`, `.firebaserc`, `firestore.rules`).

### Subdirectories & System Boundaries

- `public`: [./public/README.md](./public/README.md) — sitio publicado; `index.html` es el portal (selector y Usuarios y permisos).
  - `public/shared`: [./public/shared/README.md](./public/shared/README.md) — `ISSYS_CONFIG` (credenciales, `dueno`, catálogo `sistemas`), `window.ISSyS` (login, encabezado común, roles), tokens y componentes de marca.
  - `public/procesos`: [./public/procesos/README.md](./public/procesos/README.md) — visor y modelador BPMN; `nube.js` sincroniza `localStorage` con `datos/{clave}`.
  - `public/presentaciones`: [./public/presentaciones/README.md](./public/presentaciones/README.md) — editor de presentaciones institucionales; modo local (IndexedDB) y en la nube con `presentaciones/{id}` + `presentacionesImagenes/{hash}`.
  - `public/estatuto`: [./public/estatuto/README.md](./public/estatuto/README.md) — editor del Estatuto y mapa de conceptos; `eerEditor/state`, `eerGraph/*`; roles admin/editor/revisor/lector.
  - `public/herramientas`: [./public/herramientas/README.md](./public/herramientas/README.md) — `migrar-estatuto.html`: copia desde `issys-eer` (uso puntual, sólo administradores; se borra en la Etapa 2, paso 8).
- `docs`: manual de marca (`ISSyS-brand-guidelines.md`), sin código.
- `recursos`: material que no se publica (temas JSON de ejemplo), sin código.
- `eer`: copia de referencia del repo anterior de Estatuto; está en `.gitignore`.

### Global Invariants

- Orden de carga: `/shared/firebase-config.js` antes que `/shared/auth.js`, y los dos antes de usar `ISSyS`.
  Presentaciones arranca sola y los inyecta desde su `nube.js`.
- El `id` de cada entrada de `ISSYS_CONFIG.sistemas` es el valor guardado en `usuarios/{email}.sistemas` y el argumento de
  `habilitado('<id>')` en `firestore.rules`; los tres tienen que coincidir.
- El administrador fijo (`dueno`) está repetido en `public/shared/firebase-config.js` y en `firestore.rules` (`dueno()`):
  si cambia, se cambia en los dos.
- `usuarios/{email}` usa el correo en minúsculas. `activo: false` o la falta del documento implica sin acceso, con dos
  excepciones: el administrador fijo entra sin documento y, mientras exista el bloque LEGADO, las listas viejas también dan
  acceso. `admin: true` da todos los sistemas.
- Roles de Estatuto: `ISSyS.rolEn` (cliente) y `editaEstatuto()` (reglas) coinciden para el mapa (`eerGraph`): sin rol, un
  administrador global es `admin` y el resto `lector`. El texto (`eerEditor`) lo puede escribir cualquiera con Estatuto;
  ahí el rol lo aplica sólo el navegador (ver "Riesgos aceptados").
- `firestore.rules` se publica sólo desde este repo; publicarlo desde `D:\issys-procesos` borra la regla de `usuarios`. Por
  eso el `firebase.json` de esa carpeta deja de tener `"firestore"` (Etapa 1, paso 1).
- El bloque LEGADO de `firestore.rules` (`acceso`, `presentacionesAcceso`) se mantiene hasta el paso 9 de la Etapa 1.

### Global Side Effects

- Firebase Auth (Google) en el proyecto `issys-procesos`: ventana emergente; si el navegador la bloquea, redirección.
- Firestore `issys-procesos`: `usuarios`, `datos`, `presentaciones`, `presentacionesImagenes`, `eerEditor`, `eerGraph`
  (más `acceso` y `presentacionesAcceso` hasta el paso 9 de la Etapa 1).
- `migrar-estatuto.html` lee el proyecto `issys-eer` (Auth con usuario y contraseña + Firestore).
- Almacenamiento del navegador: persistencia de Firestore, `localStorage` (Procesos, Presentaciones, Estatuto), IndexedDB
  (Presentaciones).
- Scripts de CDN: SDK de Firebase (gstatic), Tailwind/Lucide/bpmn-js (Procesos), D3 y Paged.js (Estatuto), Google Fonts.

### System Verification

- Run: `firebase emulators:start` y abrir http://localhost:5000 (Auth 9099, Firestore 8080, Hosting 5000). No hay tests
  automatizados.
- Cuando cambian las reglas, probar en el emulador estos 5 casos:
  1. el administrador fijo, sin documento, entra al portal;
  2. una persona con `activo: false` no lee `datos`;
  3. una persona sin el sistema no lee sus colecciones;
  4. un `lector` de Estatuto no puede escribir `eerGraph`;
  5. sólo un administrador global puede escribir `usuarios`.
- Después de publicar: ingresar, cambiar de sistema desde el lanzador, abrir "Usuarios y permisos" y cerrar la sesión.

---

## Plan de migración — Etapa 1: Procesos y Presentaciones

### Hallazgos del relevamiento (10/11/2026)

| | Procesos | Presentaciones |
|---|---|---|
| Proyecto Firebase | issys-procesos | **issys-procesos** (sitio `issys-presentaciones`) |
| Datos | `datos/{clave}` | `presentaciones/{id}`, `presentacionesImagenes/{hash}` |
| Lista de acceso | `acceso/{email}` | `presentacionesAcceso/{email}` |
| Reglas | se publican desde `D:\issys-procesos` | no tiene (usa las de Procesos) |

**Conclusión:** los dos sistemas ya comparten el mismo Firestore y los nombres de colección no chocan. **No hay que mover datos entre proyectos.** Lo único que se unifica son las dos listas de acceso → `usuarios`.

### Pasos

Estado (10/11/2026): hecho el paso 2; los demás, pendientes. Todos los comandos se corren en `D:\issys`.

1. **Proteger las reglas** (obligatorio, antes de publicar nada): borrar la clave `"firestore"` de
   `D:\issys-procesos\firebase.json`. No archivar esa carpeta hasta el paso 8. A partir de este paso, `firestore.rules` se
   publica sólo desde `D:\issys`: publicarlo desde la carpeta vieja reemplaza todas las reglas del proyecto y borra la de
   `usuarios`.

2. **Crear el sitio de Hosting** — **hecho**. No repetir. Se creó con:
   ```
   cd D:\issys
   firebase login
   firebase hosting:sites:create issys-sistemas
   ```

3. **Publicar reglas y sitio.** Antes, commitear lo pendiente en `unificacion` (ver el paso 7a de la Etapa 2), para que lo
   publicado esté en Git:
   ```
   cd D:\issys
   firebase deploy --only firestore:rules
   firebase deploy --only hosting:sistemas
   ```
   Este deploy publica **todo** `public/`, incluidos `/estatuto/` y `/herramientas/` (los datos de Estatuto ya están
   migrados: ver la Etapa 2).

4. **Configurar el dominio de ingreso** (`authDomain` es `issys-sistemas.web.app`):
   - Firebase Console → Authentication → Settings → *Authorized domains*: tiene que figurar `issys-sistemas.web.app` (si no
     está, agregarlo).
   - Google Cloud Console (proyecto `issys-procesos`) → APIs y servicios → Credenciales → cliente OAuth "Web client (auto
     created by Google Service)" → *URI de redireccionamiento autorizados*: agregar
     `https://issys-sistemas.web.app/__/auth/handler`.
   - Comprobar: ingresar en https://issys-sistemas.web.app en una ventana privada de Firefox o Safari. Ingresa sin errores
     `redirect_uri_mismatch`.

5. **Importar los accesos:** ingresar a https://issys-sistemas.web.app con sago2107@gmail.com (administrador fijo) →
   **Usuarios y permisos** → **Importar accesos anteriores**. A cada correo de `acceso` le suma Procesos y a cada uno de
   `presentacionesAcceso`, Presentaciones (no quita nada) y deja a todos activos. Nadie queda como administrador.
   Decisión tomada (11/11/2026): por ahora el único administrador es el administrador fijo (sago2107@gmail.com); no se marca
   a nadie más, aunque haya sido administrador de Procesos o de Presentaciones (`admin: true` daría todos los sistemas y la
   gestión de usuarios).

6. **Probar.** Dar de alta desde el portal una cuenta de Google de prueba con Procesos y Presentaciones (el administrador
   fijo no sirve: ve todo). Con esa cuenta:
   - Ingresar en https://issys-sistemas.web.app/procesos/, pasar a Presentaciones desde el lanzador ⋮⋮⋮ y comprobar que no
     vuelve a pedir Google.
   - Comparar con los sitios viejos la cantidad y los títulos de procesos y presentaciones.
   - En https://issys-procesos.web.app y https://issys-presentaciones.web.app, una cuenta de las listas viejas entra y ve sus
     datos (el bloque LEGADO de `firestore.rules` mantiene las listas viejas).

7. **Esperar 7 días corridos** sin reportes de acceso fallido antes de los pasos 8 y 9. Si llega un reporte, corregirlo y
   reiniciar el conteo. Durante la espera:
   - Mientras exista el LEGADO, suspender a alguien en el portal **no** le corta el acceso a los datos: también hay que
     borrarlo de `acceso` o `presentacionesAcceso`.
   - No volver a apretar **Importar accesos anteriores**: deja a todos activos, incluso a los suspendidos.
   - Al final, en Firebase Console → Firestore Database, comparar los correos de `acceso` y `presentacionesAcceso` con los de
     `usuarios`, y dar de alta a mano en el portal a los que falten.

8. **Retirar los sitios viejos** (publicando desde `D:\issys`, nunca desde la carpeta vieja):
   - En `.firebaserc`, en `targets` → `issys-procesos` → `hosting`, agregar `"procesos-viejo": ["issys-procesos"]` y
     `"presentaciones-viejo": ["issys-presentaciones"]`.
   - En `firebase.json`, convertir `"hosting"` en una lista: el bloque actual (`"target": "sistemas"`) más uno por sitio viejo.
     Las redirecciones tienen prioridad sobre los archivos, así que pueden reutilizar `"public": "public"`. Usar `302`
     (temporal) hasta el paso 9: los navegadores guardan las `301` y no se pueden deshacer.
     ```json
     { "target": "procesos-viejo", "public": "public",
       "redirects": [{ "source": "**", "destination": "https://issys-sistemas.web.app/procesos/", "type": 302 }] },
     { "target": "presentaciones-viejo", "public": "public",
       "redirects": [{ "source": "**", "destination": "https://issys-sistemas.web.app/presentaciones/", "type": 302 }] }
     ```
   - Publicar: `firebase deploy --only hosting:procesos-viejo,hosting:presentaciones-viejo`.
   - Comprobar: https://issys-procesos.web.app/modelador.html e https://issys-presentaciones.web.app/ llevan a la dirección
     nueva, y el ingreso con Google en `issys-sistemas` sigue andando.
   - Recién ahora se pueden archivar `D:\issys-procesos` y `D:\issys-presentaciones` (publicar desde cualquiera de las dos
     deshace la redirección).

9. **Retirar el bloque LEGADO** (después del paso 8):
   - Exportar antes `acceso` y `presentacionesAcceso` (Firebase Console → Firestore Database → *Import/Export*, o copiar los
     correos a mano): borrarlas no se puede deshacer.
   - En `firestore.rules`:
     - borrar el bloque entre `LEGADO` y `fin LEGADO`;
     - quitar `|| legadoProcesos()` de `puedeProcesos()` y `|| legadoPres()` de `puedePresentaciones()` (si no, las reglas
       no compilan);
     - borrar el comentario TRANSICIÓN del comienzo del archivo.
   - Publicar: `firebase deploy --only firestore:rules`.
   - En Firebase Console → Firestore Database, borrar las colecciones `acceso` y `presentacionesAcceso`.
   - En `public/index.html`, quitar el botón **Importar accesos anteriores** **y** su manejador `$('importar').onclick` (si
     queda el manejador sin el botón, el portal no termina de cargar para los administradores).
   - En `public/presentaciones/index.html`, quitar `issys-presentaciones` del `ES_NUBE`.
   - En `firebase.json`, pasar las dos redirecciones a `301`.
   - Actualizar la documentación: `public/presentaciones/README.md`, `public/README.md` (importación) y, en este README, la
     invariante del LEGADO y la línea de `acceso`/`presentacionesAcceso` en "Global Side Effects".
   - Commitear y publicar: `firebase deploy --only hosting:sistemas,hosting:procesos-viejo,hosting:presentaciones-viejo`.

**Vuelta atrás:**
- **Reglas** (si después del paso 3 los sitios viejos dejan de andar): volver a la versión anterior en Firebase Console →
  Firestore Database → Reglas (historial).
- **Sitios** (si falla el paso 8): Firebase Console → Hosting → cada sitio → historial de versiones → **Revertir**.
- **Paso 9:** no tiene vuelta atrás, salvo la exportación.

### Prueba local

`firebase emulators:start` y abrir http://localhost:5000. En `localhost` los sistemas usan los emuladores de Auth y Firestore
(`emuladoresEnLocalhost` en `firebase-config.js`). Firestore arranca vacío: entrar con `sago2107@gmail.com` en el emulador de
Auth (administrador fijo) y dar de alta usuarios desde el portal. Excepción: `migrar-estatuto.html` lee del `issys-eer` **real**
aunque se use el emulador.

### Git

Hecho el 10/11/2026: el repositorio local ya existe, con la rama `unificacion` (commit 4558187) publicada en
`origin/unificacion`. No repetir `git init` ni empujar a `main`: `origin/main` es la historia de Estatuto y se une en el
paso 7 de la Etapa 2.

---

## Plan de migración — Etapa 2: Estatuto

### Hallazgos del relevamiento (10/11/2026)

- Proyecto propio **issys-eer**, ingreso con **usuario y contraseña**, usuarios en `users/{uid}` con rol (admin, editor, revisor, lector).
- Datos: `eerEditor/state` (texto, comentarios, marcas, orden; se autoguarda) y `eerGraph/{concepts, links, positions, categories}` (mapa de conceptos). No chocan con nada de issys-procesos.
- Botón "Guardar en GitHub": reescribía el HTML en la rama `main` del repo y el workflow publicaba en issys-eer.
- El repo `sago2107-bot/issys` (rama `main`) es el de Estatuto; lo unificado está en la rama `unificacion`.

### Decisiones

- Todos ingresan **con Google** (quien no tenga cuenta de Google la crea con su correo actual).
- Se **mantienen los 4 roles**: en el portal, al habilitar Estatuto aparece el selector de rol.
- Hecho: **se quitó "Guardar en GitHub"**; el botón ahora guarda en la nube (Firestore), como el autoguardado. Pendiente (pasos 5 y 7): eliminar el workflow de GitHub; desde entonces se publica a mano con `firebase deploy`.
- La gestión de usuarios de Estatuto pasa al portal.

### Pasos

Estado (11/11/2026): hechos los pasos 1, 2 y 5 (sitio publicado, datos migrados, workflow desactivado y redirección 302
publicada en `issys-eer`; nadie editó en el sistema viejo después de migrar) y los pasos 3, 4, 4b y 6; faltan los pasos 7
y 8. Todos los
comandos se corren en `D:\issys`.

**Antes de empezar:**
- **Copias locales anteriores a la migración** (ya migrado: aplica sólo a navegadores que abrieron `/estatuto/` en el sitio
  nuevo **antes** del paso 2). El editor guarda una copia local en el navegador y sólo la reemplaza por la de la nube si la
  de la nube es más nueva. Una copia local creada antes de migrar puede tener fecha posterior y subirse encima de los datos
  migrados. En esos navegadores, borrar `eerEditorState` del `localStorage` (herramientas de desarrollo → Application →
  Local Storage) antes de volver a abrirlo. Si el texto que se ve coincide con el del respaldo, no pasó.
- **Avisar a los usuarios de Estatuto** que cierren el sistema viejo (`issys-eer`) y no editen hasta recibir la dirección nueva
  (paso 6): lo que se guarde ahí después del paso 2 se pierde.

1. **Publicar** reglas y sitio. Si la Etapa 1 no llegó a su paso 3, hacer primero su paso 1. Si `public/` cambió desde el
   último deploy, publicar igual:
   ```
   firebase deploy --only firestore:rules,hosting:sistemas
   ```
2. **Migrar los datos:** entrar con el administrador fijo a
   https://issys-sistemas.web.app/herramientas/migrar-estatuto.html
   - Paso 1 de la herramienta: usuario y contraseña de un **Administrador** del Estatuto anterior.
   - Paso 2 de la herramienta: revisar las cantidades de usuarios, artículos y conceptos, y anotar la "Última edición".
     **Descargar el respaldo** (lo baja a Descargas) y moverlo a `D:\issys\respaldos\` (está en `.gitignore`). La herramienta
     no obliga a descargarlo antes de copiar: no saltear este paso.
   - Paso 3 de la herramienta: **Copiar ahora**. Escribe cada documento de `eerEditor` y `eerGraph` encima del que tenga el
     mismo id (no borra los que sólo existan en el destino). A cada usuario activo en `issys-eer` le suma Estatuto, le fija
     el rol que tenía (un rol desconocido pasa a `lector`) y lo deja activo. Quedan afuera los usuarios sin correo y el
     administrador fijo.
3. **Revisar permisos** en el portal → Usuarios y permisos: comparar los roles de Estatuto con los de `users/{uid}` del
   respaldo y corregir en el portal.
4. **Probar** `/estatuto/` (editor) y `/estatuto/mapa.html` (mapa) con dos cuentas de prueba dadas de alta en el portal, una
   `editor` y una `lector`. Comprobar que:
   - los artículos y conceptos coinciden con el respaldo;
   - el editor puede guardar (deshacer después el cambio de prueba: se guarda en el Estatuto real);
   - el lector no ve los controles de edición.

   Al terminar, quitar las cuentas de prueba.
   - **4b. Administradores:** por ahora no se marca a nadie: el único administrador es el administrador fijo (ver la Etapa 1,
     paso 5). Si más adelante se suma alguien, marcarlo en el portal → Usuarios y permisos.
5. **Cerrar issys-eer** (enseguida, antes de avisar):
   - Desactivar el workflow que publica `issys-eer`: GitHub → `sago2107-bot/issys` → Actions → *Disable workflow*. Si no se
     desactiva, un "Guardar en GitHub" desde una pestaña vieja vuelve a publicar el sitio viejo.
   - Publicar la redirección desde una carpeta temporal fuera del repo, con un `firebase.json` que tenga **sólo** `hosting`
     (sin `firestore`, para no tocar sus reglas). Usar `302` hasta el paso 7 por si hay que volver atrás:
     ```json
     { "hosting": { "public": ".", "redirects": [
         { "source": "**", "destination": "https://issys-sistemas.web.app/estatuto/", "type": 302 } ] } }
     ```
     y correr `firebase deploy --only hosting --project issys-eer`.
   - Comprobar: volver a la herramienta de migración (su paso 1) y comparar la "Última edición" con la anotada en el paso 2.
     Si es más nueva, alguien editó en el sistema viejo: ver "Si hay que repetir la migración".
6. **Avisar a los usuarios** de Estatuto: la dirección nueva es https://issys-sistemas.web.app/estatuto/ y se ingresa con
   Google con el mismo correo. Quien no tenga cuenta de Google la crea con su correo actual y **verifica el correo** (las
   reglas rechazan correos sin verificar).
7. **Unir las ramas en GitHub** (deja `main` igual a lo unificado, conserva la historia de Estatuto y elimina el workflow).
   - **7a. Commitear lo pendiente** en `unificacion`, sin los informes de revisión de la raíz:
     ```
     git checkout unificacion
     git add -A
     git reset -- "*_report*.md"
     git status                      # revisar: no debe quedar ningún *_report*.md agregado
     git commit -m "Unificación: Estatuto, herramientas y documentación"
     ```
   - **7b. Verificar `main`:**
     ```
     git fetch origin
     git log origin/main -1
     git -C D:\issys\eer\issys log -1
     ```
     Si los dos muestran el mismo commit, seguir. Si `origin/main` tiene commits más nuevos (por un "Guardar en GitHub"),
     revisar sus cambios en `public/` con `git diff <commit de eer/issys> origin/main -- public/`. Si sólo cambia
     `SAVED_STATE`, se pueden descartar: los datos ya pasaron por Firestore. Si hay otros cambios, pasarlos a
     `public/estatuto/` y commitear antes de seguir.
   - **7c. Unir y publicar:**
     ```
     git merge -s ours origin/main --allow-unrelated-histories -m "Unificación: Estatuto pasa a Sistemas ISSyS"
     git push origin unificacion:main
     ```
   - **7d. Limpiar:**
     - en GitHub → Settings → Branches, verificar que `main` sea la rama por defecto;
     - borrar la rama `unificacion`: `git push origin --delete unificacion`, después `git checkout -b main origin/main` y
       `git branch -D unificacion`;
     - borrar el secreto `FIREBASE_SERVICE_ACCOUNT_ISSYS_EER` (Settings → Secrets), que ya no se usa;
     - pasar la redirección de `issys-eer` a `301` y volver a publicarla.
8. **Retirar la herramienta:**
   - Borrar `public/herramientas/migrar-estatuto.html`. Sigue disponible en el historial de Git.
   - Actualizar sus menciones en `public/herramientas/README.md`, `public/README.md` y este README.
   - Commitear en `main` y publicar `hosting:sistemas`.

**Si hay que repetir la migración** (alguien editó en `issys-eer` después del paso 2): repetir el paso 2. Pisa todo lo
editado en el sistema nuevo y vuelve a fijar roles y `activo: true`. Después repetir los pasos 3 y 4b.

**Vuelta atrás:**
- **Antes del paso 5:** seguir usando `issys-eer`. El respaldo del paso 2 es la copia de seguridad; no hay herramienta para
  restaurarlo.
- **Después del paso 5:** Firebase Console (proyecto `issys-eer`) → Hosting → historial de versiones → **Revertir**, y volver
  a activar el workflow si hace falta.

> La carpeta `D:\issys\eer` es una carpeta de referencia con el repo anterior y está en `.gitignore`. El repo (con su propio
> `.git`) está en `D:\issys\eer\issys`; `organigrama_comodoro.html` y los SVG de las delegaciones, en
> `D:\issys\eer\issys\git\`, sirven para la etapa de Delegaciones.

---

## Próximas etapas

- **Delegaciones** (`issys-delegaciones`): está en **otro proyecto Firebase**, así que hay migración de datos. Antes de migrar, revisar nombres de colección: Procesos usa `datos`, un nombre genérico que podría chocar. Si Delegaciones también usa `datos`, renombrar el suyo con prefijo (ej. `delegacionesDatos`).
- **Consultorios Mitre 837:** relevar primero.
- **Celular:** Procesos y Estatuto no están adaptados a pantallas chicas. Falta definir el criterio (por ejemplo, usables
  en 360 px de ancho sin desplazamiento horizontal).

El diseño unificado está hecho (10/11/2026): todas las páginas usan el encabezado común (`ISSyS.ponerEncabezado`), y
Estatuto usa la identidad de marca (`estatuto-marca.css`).
