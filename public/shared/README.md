# shared — ingreso único, encabezado común e identidad visual

## Overview

Recursos comunes que cargan todos los sistemas del portal (`/shared/` en el sitio publicado).
Se cargan con `<script>`/`<link>` sin compilar ni empaquetar:

1. `firebase-config.js` define `window.ISSYS_CONFIG` (proyecto Firebase, administrador fijo, catálogo de sistemas).
2. `auth.js` (se carga **después** de la configuración) define `window.ISSyS`: ingreso con Google, permisos por
   sistema en Firestore (`usuarios/{email}`), pantalla de ingreso, encabezado común (lanzador + foto de perfil) y utilidades.
3. `issys.css` tiene los tokens de marca (`--issys-*`) y los componentes con prefijo `issys-*`. `auth.js` lo inyecta solo
   si la página no lo cargó (`link[data-issys-css]`).
4. `issys-tailwind.js` es opcional y solo lo usan los sistemas con Tailwind (hoy `public/procesos/index.html` y
   `public/procesos/modelador.html`). Redefine las escalas de Tailwind sobre la paleta institucional.

`marca/` contiene solo imágenes de logo (PNG) y no tiene contrato propio; `auth.js` usa `marca/issys-logo-recorte.png`.

Reglas generales del proyecto: [README del repositorio](/README.md) (sección "Encabezado común") y
[manual de marca](/docs/ISSyS-brand-guidelines.md).

## Interface

### `firebase-config.js` → `window.ISSYS_CONFIG`

- `firebase`: credenciales web del proyecto `issys-procesos` (públicas por diseño; la seguridad está en `firestore.rules`).
- `sdk`: URL base del SDK compat de Firebase (`https://www.gstatic.com/firebasejs/10.14.1/`).
- `dueno`: correo del administrador fijo.
- `emuladoresEnLocalhost`: con `true`, en `localhost` se usan los emuladores de Auth (9099) y Firestore (8080).
- `sistemas[]`: catálogo `{ id, nombre, estado: 'activo' | 'proximamente', url, color: 'blue' | 'green', icono, descripcion, roles? }`.
  Hoy: `procesos`, `presentaciones`, `estatuto` (con `roles` admin/editor/revisor/lector), `consultorios` (con `roles` editor/lector) y `delegaciones` (próximamente).

### `auth.js` → `window.ISSyS`

| Símbolo | Descripción |
| --- | --- |
| `config` | Referencia a `window.ISSYS_CONFIG`. |
| `iniciar(opc)` | `opc = { sistema, titulo, subtitulo, texto }`. Bloquea la página, muestra la pantalla de ingreso y resuelve con la sesión `{ firebase, auth, db, usuario, mensaje(t), error(t), mostrar(), salir }`. `usuario = { email, nombre, foto, admin, dueno, sistemas, roles }`. Con `sistema: null` (portal) alcanza con un usuario activo. La promesa queda pendiente mientras no haya acceso. |
| `salir()` | Cierra la sesión de Google, termina Firestore, borra la caché local y va a `/`. |
| `ponerEncabezado(contenedor, usuario, { sistema, rol, items, alSalir })` | Agrega al final del contenedor el lanzador de sistemas (⋮⋮⋮) y la foto de perfil con su menú de cuenta. `items = [{ texto, accion \| href, icono? }]`. Devuelve `{ elemento, estado('guardando' \| 'ok' \| 'error') }`. |
| `ponerUsuario(contenedor, usuario, opciones)` | Compatibilidad con la versión anterior: llama a `ponerEncabezado` y devuelve el elemento. |
| `rolEn(usuario, sistema)` | Id del rol en un sistema con `roles`, o `null` si el sistema no tiene roles. |
| `nombreRol(usuario, sistema)` | Nombre visible del rol (ej. `'Editor'`) o `null`. |
| `icono(id, extra?)` | SVG de trazo 24×24. Claves: `portal`, `procesos`, `presentaciones`, `estatuto`, `delegaciones`, `consultorios`, `usuarios`, `salir`, `descargar`, `subir`, `mapa`, `editor`. Si la clave no existe, devuelve `portal`. |
| `avisar(texto, acciones?)` | Aviso flotante `#issys-aviso` con botones `[[etiqueta, fn], …]`. Sin acciones, se cierra solo a los 8 s. |
| `esc(s)` | Escapa HTML (`& < > " '`). |
| `cargarScript(src)` | Inserta un `<script>` y devuelve una promesa. |
| `alCargarDom(fn)` | Ejecuta `fn` cuando el DOM está listo. |

### `issys.css`

- Variables `--issys-*` (paleta de marca y derivados digitales).
- Componentes: `#issys-gate`, `#issys-aviso`, `.issys-encabezado`, `.issys-ancla`, `.issys-lanzador`, `.issys-avatar`,
  `.issys-panel`, `.issys-apps`, `.issys-cuenta`, `.issys-btn`, `.issys-tag`, `.issys-spin`, `.issys-logo`,
  `.issys-volver`, `.marca-diagonales`.

### `issys-tailwind.js`

- Asigna `tailwind.config` (debe cargarse antes del CDN de Tailwind o junto a él): `slate/gray/zinc` → neutros,
  `cyan/sky/blue/indigo` → azul ISSyS, `teal/emerald/green` → verde, `amber/yellow/orange` → amarillo, `rose/red` → rojo,
  y además los colores `issys-*`. Agranda la escala de `fontSize` en 2 px, define la fuente `sans` como Encode Sans Condensed
  y mapea los pesos `medium`/`bold` a 600 y `extrabold` a 900.

## Invariants

- `auth.js` lanza un error si `window.ISSYS_CONFIG` no existe: `firebase-config.js` debe cargarse antes.
- `auth.js` se ejecuta una sola vez por página (`if (window.ISSyS) return`) y el SDK se inicializa una sola vez (`conectar()` memoriza la promesa; `firebase.apps.length`).
- Los permisos se indexan por **email en minúsculas** (`usuarios/{email}`), no por uid, para poder dar de alta a alguien antes de su primer ingreso.
- `dueno` entra siempre a todo (`perfilDe` no consulta Firestore). El mismo correo está fijo en `firestore.rules`: si se cambia, hay que cambiarlo en los dos lugares.
- `activo === false` o la falta del documento implican sin acceso. `admin: true` habilita todos los sistemas (`habilitado`).
- El `id` de cada sistema en `sistemas[]` es el valor guardado en `usuarios/{email}.sistemas` y el que piden las reglas. Un sistema nuevo se agrega solo aquí y aparece en el portal y en el lanzador.
- `roles` de un sistema van de más a menos permisos. `rolEn`: el dueño recibe el primero; sin rol válido, un administrador recibe el primero y el resto, el último.
- Lanzador: los sistemas `activo` se muestran si están en `usuario.sistemas`; los `proximamente` solo a administradores (deshabilitados). Siempre incluye "Inicio" (`/`) y, para administradores, "Usuarios y permisos" (`/#usuarios`).
- Hay un solo panel abierto por página (lanzador o cuenta). Se cierra con un clic afuera o con Escape, cuelga de `body` con posición fija y nunca queda fuera de la pantalla.
- Mientras la página está bloqueada (`html.issys-bloqueada`), todo lo que no sea `#issys-gate` queda oculto. `mostrar()` lo libera.
- Los sistemas no deben dibujar a mano botones de "volver", avatares ni menús de usuario: usan `ponerEncabezado`.
- `issys.css` solo define clases con prefijo `issys-` (más `.marca-diagonales`) para no pisar los estilos propios de cada sistema.

## Side Effects

- Al cargar `auth.js`: inserta un `<style>` de bloqueo, `<link>` a `/shared/issys.css` (si falta) y a `/shared/fuentes/fuentes.css` (Encode Sans Condensed y JetBrains Mono, servidas desde el sitio). También registra listeners globales de `click`, `keydown` y `resize`.
- Red: descarga el SDK de Firebase desde `gstatic.com`, inicia sesión con Google (`signInWithPopup` y, si el popup se bloquea, `signInWithRedirect`) y lee `usuarios/{email}` en Firestore.
- Activa la persistencia offline de Firestore (`enablePersistence({ synchronizeTabs: true })`).
- En `localhost`, con `emuladoresEnLocalhost`, conecta Auth y Firestore a los emuladores locales.
- Si la sesión se cierra en otra pestaña u otro sistema, recarga la página (`onAuthStateChanged`).
- `salir()` cierra la sesión de Google (afecta a todos los sistemas del sitio), borra la caché de Firestore y redirige a `/`.
- Muestra la foto de Google con `referrerPolicy = 'no-referrer'`.
- `issys-tailwind.js` escribe `window.tailwind.config`.

## Verification

- Ejecutar `firebase emulators:start` (desde la raíz del repositorio) y abrir http://localhost:5000. Ingresar en el portal y en cada sistema, y revisar el lanzador ⋮⋮⋮, el menú de cuenta y "Cerrar sesión".
