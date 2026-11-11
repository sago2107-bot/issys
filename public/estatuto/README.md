# Estatuto (`public/estatuto/`)

## Overview

Sistema **Estatuto** (Escalafón Reglamentario) del portal de Sistemas ISSyS. Son dos páginas
estáticas sin compilación, con la lógica en `<script>` dentro del HTML:

- `index.html`: **editor del Estatuto**. Árbol de títulos, capítulos y artículos (incluye
  reglamentaciones), edición de textos e incisos, comentarios, marcas (flags), referencias
  cruzadas entre artículos, vínculos a conceptos del mapa, exportación de cambios, impresión y modo
  presentación.
- `mapa.html`: **mapa de conceptos** (grafo con D3 v7 desde jsDelivr). Conceptos, relaciones,
  categorías, posiciones de nodos e importación desde Markdown.
- `nube.js`: capa de compatibilidad que conecta las dos páginas al login único ISSyS
  (`/shared/auth.js`). Expone las mismas funciones que antes daba el SDK modular de Firebase del
  proyecto viejo `issys-eer`, para no reescribir las páginas.
- `estatuto-marca.css`: identidad de marca. Redefine los tokens propios de las páginas (`--navy`,
  `--accent`, `--font-serif`, …) sobre las variables `--issys-*` de `/shared/issys.css`.

Antes vivía en el proyecto `issys-eer` con usuario y contraseña y la colección `users/{uid}`. La
migración está en `/herramientas/migrar-estatuto.html` (ver el README raíz).

## Interface

### Páginas y parámetros de URL

- `/estatuto/` (`index.html`): editor. `?art=<id>` abre ese artículo si existe en `RAW_DATA`
  (`index.html:initAuth`).
- `/estatuto/mapa.html`: mapa. `?node=<id>` abre el detalle de ese concepto
  (`mapa.html:loadGraphFromFirebase`). El editor abre `mapa.html?node=<cid>` desde los chips de
  conceptos vinculados.

### `nube.js` (se carga en el `<head>` después de `/shared/firebase-config.js` y `/shared/auth.js`)

```html
<script src="nube.js" data-pagina="editor"></script>   <!-- o data-pagina="mapa" -->
```

Funciones globales que expone (misma forma que el SDK modular):

| Símbolo | Qué hace |
| --- | --- |
| `window._fbDb` | `s.db` de la sesión ISSyS (se asigna recién después del ingreso) |
| `window._fbDoc(db, coleccion, id)` | `db.collection(coleccion).doc(id)` |
| `window._fbGetDoc(ref)` | `ref.get()` envuelto como `{ id, ref, exists(), data() }` |
| `window._fbSetDoc(ref, datos, opciones)` | `ref.set(datos, opciones \|\| {})` |
| `window._fbFirestore.collection` / `.getDocs` | colección y consulta envuelta (`empty`, `size`, `docs`, `forEach`) |
| `window._fbOnAuthChanged(cb)` | llama a `cb(usuario)` cuando la sesión está lista (o en el acto si ya lo está) |
| `window._fbSignOut()` | `ses.salir()` / `ISSyS.salir()` |
| `window._fbSignIn()` | siempre rechaza con `code: 'auth/google'` (el ingreso es sólo con Google) |
| `window._issysEstatuto.perfil` | `{ email, name, role, active: true }`, con `role = ISSyS.rolEn(usuario, 'estatuto')` |

Usa de `/shared/auth.js`: `ISSyS.iniciar`, `ISSyS.ponerEncabezado`, `ISSyS.rolEn`,
`ISSyS.nombreRol`, `ISSyS.alCargarDom`, `ISSyS.salir`.

### Páginas (funciones globales principales)

- `index.html`: `initAuth`, `loadState`, `saveState`, `scheduleAutoSave`, `saveToFirebase`,
  `loadFromFirebase`, `fetchGraphConcepts`, `renderTree`, `selectArt`, `renderEditPanel`,
  `exportChanges`, `printDoc`, `openSlideshow`, y los permisos `canEdit`, `canComment`, `canFlag`,
  `canSave`, `isAdmin`, `isLector`.
- `mapa.html`: `initAuth` (la dispara `nube.js`), `canEdit`, `loadGraphFromFirebase`,
  `push{Concepts,Links,Positions,Categories}ToFirebase`, `loadArticleLinksFromEditor`,
  `importMarkdownToGraph`, `renderGraph`.

### Datos

- `index.html` trae el texto base embebido: `RAW_DATA` (artículos) y `SAVED_STATE` (estado inicial
  entre los marcadores `/*__GH_STATE_START__*/`).
- Firestore `eerEditor/state`: estado del editor (`texts`, `htmlTexts`, `comments`, `flags`,
  `newArticles`, `artMeta`, `customTitulos`, `customCapitulos`, `capAssoc`, `incisos`,
  `graphLinks`, `order`, `version`, `_ts`, `_savedAt`) y `articleCatalog` (`{ id, label }`, lo lee
  el mapa).
- Firestore `eerGraph/{concepts|links|positions|categories}`: `{ items, _ts }`.

## Invariants

- **Ingreso:** sólo por `ISSyS.iniciar({ sistema: 'estatuto', … })` en `nube.js`. No agregar
  login propio; `_fbSignIn` existe sólo por compatibilidad y siempre falla.
- **Orden de carga:** `/shared/firebase-config.js` → `/shared/auth.js` → `nube.js` (en el
  `<head>`) y `estatuto-marca.css` después de los estilos propios de cada página.
- **Encabezado común:** lo arma `nube.js` con `ISSyS.ponerEncabezado` sobre `#issys-encabezado`
  (o `.hdr`, o `body`), con rol `Estatuto · <rol>` y un ítem que cruza entre editor y mapa.
  `updateUserMenu` en `index.html` queda vacío a propósito.
- **Roles** (`usuarios/{email}.roles.estatuto`): `admin`, `editor`, `revisor`, `lector`.
  - `canEdit`/`canSave`: `admin`, `editor`. `canFlag`: además `revisor`. `canComment`: todos.
  - En el mapa, `body[data-role="lector"|"revisor"] .role-edit-only` se oculta y toda edición del
    grafo pide `canEdit()`.
  - Las reglas lo refuerzan: `eerEditor/**` lo lee y escribe todo el que tiene el sistema
    (comentarios y marcas van en el mismo documento); `eerGraph/**` sólo lo escribe
    `editaEstatuto()` (`firestore.rules`).
- **Sincronización del editor:** gana el `_ts` mayor. Al entrar, `sincronizarEditor` compara
  `eerEditor/state._ts` con `localStorage.eerEditorState._ts`; si la nube es más nueva, copia y
  recarga la página. Sin caché local, `loadState` usa `SAVED_STATE`.
- **Identidad visual:** no cambiar colores ni fuentes en las páginas; se corrigen en
  `estatuto-marca.css` sobre `/shared/issys.css` (sin degradados, sin serif, sin encabezado
  oscuro).
- **Pendiente heredado:** la gestión de usuarios de `index.html` (`openUserMgmt`, `loadUserList`,
  `changeUserRole`, `toggleUserActive`, `createUser`) todavía apunta a la colección vieja
  `users` y a la API `identitytoolkit` `accounts:signUp`. Ningún botón llama a `openUserMgmt`, y
  `firestore.rules` no tiene regla para `users`, así que esas escrituras se rechazarían. Los
  permisos se administran en `usuarios/{email}`.

## Side Effects

- **Firestore (lectura):** `eerEditor/state` (editor al entrar y `loadFromFirebase`; mapa en
  `loadArticleLinksFromEditor`), `eerGraph/*` (mapa; editor en `fetchGraphConcepts`).
- **Firestore (escritura):** `eerEditor/state` con `scheduleAutoSave` (2 s después de cada
  `saveState`) y `saveToFirebase`; `eerGraph/{concepts,links,positions,categories}` desde el
  mapa (si `concepts` no existe y el rol edita, se siembra con `SEED_CONCEPTS`).
- **localStorage:** `eerEditorState` (editor); `eerGraphTestConcepts`, `eerGraphTestLinks`,
  `eerGraphPositions`, `eerGraphCategories` (mapa, como caché).
- **Navegación:** `location.reload()` cuando la nube trae un estado más nuevo; `window.open` para
  impresión y para abrir conceptos del mapa.
- **Red externa:** D3 desde `cdn.jsdelivr.net` (mapa); `identitytoolkit.googleapis.com` sólo desde
  el `createUser` heredado (hoy sin uso).

## Verification

- Run: `firebase emulators:start` y abrir http://localhost:5000/estatuto/ (editor) y
  http://localhost:5000/estatuto/mapa.html (mapa). Probar con roles `editor` y `lector` en
  `usuarios/{email}.roles.estatuto`.
