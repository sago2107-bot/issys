# Procesos BPMN (`/procesos/`)

## Overview

Sistema **Procesos** de los Sistemas ISSyS: catálogo, visor y modelador de procesos
(relevamiento AS-IS, etapa de Transición y propuesta TO-BE) de la Sección Enlace Delegaciones.
Es una app web sin build: HTML con `<script>` en línea más archivos `.js` globales (sin módulos).

- `index.html` — visor: catálogo de procesos, visor BPMN (bpmn-js `NavigatedViewer`), análisis de
  recorridos/presentación paso a paso, y un editor interno para los procesos "legacy" (no BPMN).
- `modelador.html` — editor BPMN 2.0 (bpmn-js `Modeler` + extensiones) de un proceso/escenario.
- `bpmn-modelos.js` — código compartido por ambas páginas (modelos, colores, almacenamiento, análisis).
- `bpmn-diagramado.js` — diagramado automático respetando pools y carriles (sólo modelador).
- `bpmn-extensiones.js` — bundle generado con esbuild (minimap, panel de propiedades, color picker
  de bpmn.io, licencia MIT). No editar a mano.
- `nube.js` — sincroniza `localStorage` con Firestore y monta el encabezado común.

Ingreso y encabezado vienen de [`/shared/auth.js`](../shared/auth.js) (`ISSyS.iniciar`,
`ISSyS.ponerEncabezado`); ver el [README raíz](../../README.md).

## Interface

### Páginas y rutas

- `index.html#/` — inicio (grilla de procesos).
- `index.html#/p/<proceso>/<asis|trans|tobe>` — visor (`parseRoute`, `viewerHash`).
- `index.html#/p/<proceso>/<modelo>/editar` — editor; si el proceso es BPMN (`engine: 'bpmn'`)
  redirige con `location.replace` a `modeladorUrl()`.
- `modelador.html?proceso=<id>&modelo=<asis|trans|tobe>` — modelador (default
  `proceso=reintegros`, `modelo` vía `parseModelKey`). El enlace "volver" apunta a
  `index.html#/p/<proceso>/<modelo>`.

### `bpmn-modelos.js` (globales)

- Escenarios: `MODEL_KEYS`, `MODEL_LABEL`, `MODEL_TITLE`, `parseModelKey(value)`.
- Marca y XML: `ISSYS_NS`, `COLORS`, `COLORES_ANTERIORES`, `colorearConMarca(xml)`,
  `ISSYS_FLAGS` (`presencial`, `hipotesis`, `doblecarga`), `TYPE_ES`, `EVENT_DEF_ES`, `SIZES`,
  `escapeXml`, `buildBpmnXml(def)`, `emptyDefinition()`.
- Modelos originales: `REINTEGROS_ASIS`, `ORIGINALS` (`reintegros.asis`), `originalBpmnDefinition(processId, modelKey)`.
- Almacenamiento: `bpmnStorageKey(processId, modelKey)`, `readStoredBpmn`, `removeStoredBpmn`,
  `getBpmnXml(processId, modelKey)`.
- Análisis/render: `analyzeBpmnXml`, `issysFlag(bo, key)`, `bpmnTypeLabel`, `drawIssysOverlays(bpmn)`,
  `SwimlaneLabelRenderer`, `SwimlaneLabelModule`, `analyzeProcessPaths(definitions)`
  (con `simulatePath`, `describePath`, `MAX_PATHS = 60`, `MAX_VISITS = 3`), `expectedFlowOf`, `isExpectedFlow`.

### `bpmn-diagramado.js`

- `LAYOUT` (constantes de grilla) y `ordenarDiagrama(modeler)` → `false` si no hay contenedor a ordenar.

### `bpmn-extensiones.js`

- `window.bpmnExtensiones = { minimap, propertiesPanel, colorPicker }` (consumido por
  `loadPlugins()` en `modelador.html`).

### `nube.js`

- `window.nubeListo` — Promise que ambas páginas esperan antes de arrancar.
- Llama a `ISSyS.iniciar({ sistema: 'procesos', … })` y a
  `ISSyS.ponerEncabezado(#issys-encabezado, usuario, { sistema: 'procesos', items, alSalir })`;
  ítems de cuenta: "Descargar respaldo" (todos) e "Importar respaldo…" (sólo `usuario.admin`).

## Invariants

- **Orden de carga de scripts:** `/shared/firebase-config.js` → `/shared/auth.js` → `nube.js`
  (en `modelador.html` además `bpmn-extensiones.js` → `bpmn-modelos.js` → `bpmn-diagramado.js` antes).
  Las páginas sólo inician tras `await window.nubeListo`.
- Ambas páginas deben tener un `<div id="issys-encabezado">` donde `nube.js` monta el encabezado común;
  no dibujar botones de usuario/lanzador propios (regla del `CLAUDE.md` raíz).
- **Claves compartidas** (`esCompartida` en `nube.js`): `issys-procesos-v1` (catálogo, JSON array),
  `issys-procesos-v1:deletedSeeds` y todo `issys-bpmn:<proceso>:<asis|trans|tobe>`
  (`{ xml, savedAt }`). El resto (p. ej. `issys-modelador:<pref>` y otras preferencias
  `issys-procesos-v1:<pref>`) queda sólo en el navegador. Agregar una clave nueva que deba
  compartirse exige actualizar `esCompartida`.
- La app sólo usa `localStorage`; nunca llama a Firestore directamente. `nube.js` intercepta
  `Storage.prototype.setItem/removeItem`.
- `getBpmnXml`: si hay versión guardada se devuelve con `colorearConMarca`; si no, `trans`
  arranca como copia del AS-IS y el resto usa `ORIGINALS` o `emptyDefinition()`.
- La etapa `trans` sólo existe en procesos con `engine: 'bpmn'`; los demás se redirigen a `asis`.
- `loadProcesses` agrega los `SEED_PROCESSES` faltantes salvo los listados en `deletedSeeds`, y
  migra un `reintegros` no-BPMN a `reintegros-anterior`.
- Abierta como `file://`, `nube.js` no usa la nube: resuelve `nubeListo` de inmediato y sólo ofrece
  "Exportar respaldo para la nube".
- Los respaldos tienen formato `{ app: 'issys-procesos', version: 1, fecha, claves }`;
  `importarRespaldo` rechaza otro `app`.
- `bpmn-extensiones.js` debe seguir siendo compatible con `bpmn-js@17.11.1` (versión cargada desde unpkg).

## Side Effects

- **Firestore** colección `datos/{encodeURIComponent(clave)}` con `{ clave, valor, por, fecha }`
  (permiso `puedeProcesos()` en `firestore.rules`):
  - al ingresar `bajarDatos()` reemplaza las claves compartidas locales por las de la nube (borra
    las que no están en la nube);
  - cada escritura compartida se encola y sube en lote (`db.batch()`) con un debounce de 400 ms, y
    también en `pagehide` / `visibilitychange`;
  - `onSnapshot` aplica cambios de otros usuarios a `localStorage` y muestra un aviso "Recargar";
  - `importarRespaldo` (admin) borra los documentos que no están en el respaldo y reemplaza el
    resto para **todos** los usuarios; luego recarga.
- `salir()` sube pendientes, borra las claves compartidas de `localStorage` y llama a `ses.salir()`.
- Descargas locales: respaldo JSON (`issys-procesos-respaldo-<fecha>.json`); en el modelador
  `.bpmn`, `.svg`, `.png`; en el visor exportación Mermaid/BPMN/JSON.
- Carga de CDN externos: Tailwind (`cdn.tailwindcss.com`), Lucide y bpmn-js desde unpkg.
- `ordenarDiagrama` modifica la DI del modelo cargado; el modelador luego reexporta/reimporta el XML.

## Verification

No hay tests automatizados. Prueba manual:

- Run: `firebase emulators:start` y abrir <http://localhost:5000/procesos/> (desde la raíz del repo).
- Revisar: ingreso con Google, encabezado común, apertura de un proceso BPMN en el visor, edición y
  guardado en `modelador.html`, y que el cambio aparezca en otra pestaña/usuario.
