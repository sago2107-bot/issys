# Presentaciones

## Overview

Motor y editor de presentaciones con la identidad institucional ISSyS (sistema `presentaciones` del portal
Sistemas ISSyS, publicado en `https://issys-sistemas.web.app/presentaciones/`). No tiene compilación: todo el
código vive en dos archivos.

- `index.html`: un único archivo autocontenido que presenta y edita. Lleva incrustados los logos (constante
  `MARCA`), la tipografía Encode Sans Condensed (`@font-face` en base64) y el contenido por defecto
  (`<script type="application/json" id="deck">`). Funciona sin internet y guarda en IndexedDB del navegador.
- `nube.js`: capa de nube que sólo se carga en el sitio publicado (o en los emuladores). Resuelve el ingreso
  con el login único (`/shared/auth.js`) y reemplaza IndexedDB por Firestore para que las presentaciones sean
  compartidas.

El archivo que genera "Descargar" es el mismo `index.html` con la presentación adentro; no carga `nube.js`.

## Interface

### `index.html` (motor y editor)

- **Parámetros de URL**: `?editar` abre el editor; `?deck=<ruta.json>` carga otro tema por `fetch`
  (requiere servirlo por HTTP, no `file://`); `#<n>` abre la diapositiva `n` (`boot`).
- **Atajos de presentación**: → / espacio avanzar, ← retroceder, `O` vista general, `F` pantalla completa,
  `N` notas del orador, `E` editar, `?` ayuda. En el editor: Ctrl+Z / Ctrl+Y (historial), Ctrl+S (guardar),
  Ctrl+D (duplicar), F5 (`presentar`), Alt+↑/↓ (`mover`), Supr (`eliminar`).
- **Modelo de datos (deck)**: `{ id, titulo, area, movimiento, pie, actualizado, diapositivas[] }`.
  - `area` ∈ claves de `AREAS` (`institucional`, `seros`, `prevision`, `turismo`); `movimiento` ∈
    `camara` | `suave`.
  - Tipos de diapositiva (`plantilla(tipo)` y renderizadores en `R`): `portada`, `seccion`, `texto`, `lista`,
    `imagen`, `cifras`, `mapa`, `grafico`, `webapp`, `galeria`, `cita`, `cierre`. Campos opcionales comunes:
    `fondo` (claves de `FONDOS`: `surface`, `azul`, `verde`), `logo`, `notas`, `cajas`, `mov`, `dim`, `forma`.
- **Funciones principales**: `normalizar(deck)` (filtro de entrada), `build`, `go`, `next`, `prev`,
  `toggleOv`, `presentar`, `abrirEditor`, `usarDeck`, `nuevoDeck`, `plantilla`, `convertir`,
  `abrirBiblioteca`, `guardarYa`, `programarGuardado`, `descargarHTML`, `exportarJSON`.
- **Capa de guardado intercambiable**: `leerDoc`, `listarDocs`, `borrarDoc`, `ponerDoc` delegan en `NUBE`
  si existe y si no en IndexedDB (`abrirDB`, base `issys-presentaciones`, almacén `decks`).
- **Selección de modo**: `ES_NUBE` es verdadero sólo para los hosts `issys-sistemas` / `issys-presentaciones`
  (`.web.app` / `.firebaseapp.com`) y `localhost`; en ese caso `cargarNube()` inyecta `nube.js` y espera
  `window.nubeListo`.

### `nube.js` (capa de nube)

- Expone `window.nubeListo`: una `Promise` que resuelve, una vez que hay usuario, con
  `{ leer, listar, poner, borrar, avisar, usuario }`.
  - `leer(id)` → `{ id, titulo, actualizado, por, deck }` o `undefined`.
  - `listar()` → filas con sólo la primera diapositiva y `n` (cantidad total) para la biblioteca.
  - `poner(deck)` → guarda en cola, con control de revisión; rechaza con `{ conflicto: true, por }` si otra
    persona guardó antes.
  - `borrar(id)` → borra la presentación y las imágenes que ya nadie usa.
  - `avisar(texto, acciones)` → delega en `ISSyS.avisar`.
- Arranque: carga `/shared/firebase-config.js` y `/shared/auth.js`, llama a
  `ISSyS.iniciar({ sistema: 'presentaciones', … })` y luego
  `ISSyS.ponerEncabezado(document.getElementById('e-top'), usuario, { sistema: 'presentaciones', alSalir: salir })`.

## Invariants

- Todo contenido que entra (JSON del bloque `deck`, `?deck=`, archivo importado, documento de Firestore) pasa
  por `normalizar`: exige `diapositivas` no vacío, sanea HTML con `limpiar`, valida URLs en las claves
  `url` / `src` / `imagen` (`CLAVES_URL`), fuerza `tipo` desconocido a `texto` y limita `imagenes` a 6.
- El diseño es fijo (manual de marca); sólo cambia el contenido. No agregar colores ni fuentes fuera de la
  paleta ISSyS.
- `FUENTE` se copia del DOM antes de pintar nada: "Descargar" depende de que el HTML original esté intacto.
- `index.html` debe seguir funcionando sin `nube.js` (archivo descargado, `file://`). Sólo `nube.js` habla
  con Firebase y con `/shared/`.
- El ingreso es sólo por `ISSyS.iniciar` y el encabezado sólo por `ISSyS.ponerEncabezado` (lanzador de
  sistemas y foto de perfil); no dibujar menús de usuario propios.
- En Firestore, cada imagen se guarda aparte por hash SHA-256 (`presentacionesImagenes/{hash}`) y la
  presentación referencia `nube:<hash>`; las imágenes que superan `TOPE_IMAGEN` (1.000.000 caracteres) se
  reducen a WebP con `achicar` para respetar el límite de 1 MiB por documento.
- Los guardados en la nube van de a uno (`cola`) y dentro de una transacción que compara `rev`: nunca se pisa
  una versión guardada por otra persona o pestaña.
- Las reglas (`/firestore.rules`) exigen `deck` string y `rev` int en `presentaciones/{id}`, y hash
  `^[0-9a-f]{64}$` con `data` string en `presentacionesImagenes/{hash}`; acceso con
  `habilitado('presentaciones')` (o la lista legada `presentacionesAcceso`).

## Side Effects

- **IndexedDB** (modo local): base `issys-presentaciones`, almacén `decks` (`put`, `get`, `getAll`, `delete`).
- **localStorage**: clave `issys-presentaciones:ultima` (última presentación abierta); `nube.js` la borra al
  salir.
- **Firestore** (modo nube): `presentaciones/{id}` con `{ rev, por, actualizado, deck (JSON), imagenes[] }`;
  `presentacionesImagenes/{hash}` con `{ data, por }`. `borrar` consulta `array-contains` y elimina imágenes
  huérfanas.
- **Red**: `fetch` de `?deck=`; carga dinámica de `nube.js`, `/shared/firebase-config.js` y
  `/shared/auth.js`; ingreso con Google vía `ISSyS.iniciar`.
- **Navegador**: pantalla completa, descargas por `Blob` (`.html` y `.json`), guardado automático en
  `pagehide` / `visibilitychange` y aviso `beforeunload` si quedan cambios sin guardar en la nube.
- Salir (`salir` en `nube.js`) guarda, limpia la última presentación y cierra la sesión de todos los
  Sistemas ISSyS (`ses.salir()`).

## Verification

- Run: `firebase emulators:start` y abrir `http://localhost:5000/presentaciones/` (modo nube con login).
- Modo local: abrir `index.html` directamente (o `?editar`) y verificar que presenta, edita y descarga sin
  internet.
