# Prompt para Claude Code — `public/eer-graph.html`

## Contexto del proyecto

Estoy trabajando en el repositorio `github.com/sago2107-bot/issys`.
Ya existe `public/estatuto_editor.html`, un editor del Estatuto Escalafón Reglamentario (EER) del ISSyS (Instituto de Seguridad Social y Seguros de la Provincia del Chubut). Ese archivo usa Firebase (proyecto `issys-eer`, ID de app `1:300033149212:web:93d951869e8a02c01d12d9`) con Firestore para persistir el estado del editor en la colección `eerEditor/state`.

Necesito que crees un **nuevo archivo** `public/eer-graph.html` en el mismo repo. Este archivo es completamente independiente del editor pero **comparte la misma base de datos Firebase**.

---

## Objetivo

Construir un **grafo de pensamiento en red estilo Obsidian** que visualice:

1. **Nodos Tipo A — Artículos del EER**: cargados desde Firebase (`eerEditor/state`), que ya contiene el array `RAW_DATA` serializado y el estado del editor.
2. **Nodos Tipo B — Conceptos externos**: definidos y editables desde el grafo mismo, guardados en una nueva colección Firestore `eerGraph/concepts`.
3. **Aristas automáticas**: detectadas al parsear los `htmlTexts` del estado buscando chips de referencia con formato `data-ref="artId"` en el HTML, o el formato de texto plano `[[artId:texto]]` en `texts`.
4. **Aristas manuales**: que el usuario puede agregar entre cualquier nodo (A↔A, A↔B, B↔B), guardadas en `eerGraph/links`.

---

## Firebase — Colecciones

### Ya existe (solo lectura desde el grafo):
- `eerEditor/state` → documento con los campos:
  - `texts`: `{ [artId]: string }` — texto plano de cada artículo
  - `htmlTexts`: `{ [artId]: string }` — HTML del editor (puede contener `<span class="ref-chip" data-ref="artId">`)
  - `flags`: `{ [artId]: 'pending'|'review'|'approved' }` — estado de revisión
  - `comments`: `{ [artId]: Array<{text, author, date, type, resolved}> }`
  - `capAssoc`: `{ [key]: artId }` — vínculo reglamento↔estatuto
  - `order`: `string[]` — array con los IDs de los artículos en orden

### Nueva (lectura y escritura desde el grafo):
- `eerGraph/concepts` → documento con campo `items`: array de objetos:
  ```json
  { "id": "uuid", "label": "Ley 3339", "description": "Ley Orgánica ISSyS", "category": "normativa" }
  ```
  Categorías posibles: `normativa`, `organismo`, `concepto`, `persona`, `otro`

- `eerGraph/links` → documento con campo `items`: array de objetos:
  ```json
  { "id": "uuid", "source": "nodeId", "target": "nodeId", "label": "string", "manual": true }
  ```

---

## RAW_DATA — Cómo reconstruirlo

El editor original define `RAW_DATA` como un array de objetos con esta forma:
```js
{ id: "art_001", nombre: "Artículo 1° — Objeto", titulo: "TÍTULO I — DISPOSICIONES GENERALES", capitulo: "CAPÍTULO I", tipo: "estatuto" | "reglamento" }
```

El campo `order` en `eerEditor/state` tiene los IDs en orden. Sin embargo, el HTML del editor original (que también está en el repo en `public/estatuto_editor.html`) contiene el `RAW_DATA` completo embebido. 

**Para el grafo**, reconstruí los nodos Tipo A así:
1. Leer `eerEditor/state` desde Firestore
2. Usar el campo `order` para conocer qué artículos existen
3. Para cada `artId` en `order`, crear un nodo con id = artId
4. El nombre/titulo/capitulo/tipo de cada artículo viene del HTML del editor — **leé `public/estatuto_editor.html` del mismo repo vía fetch a GitHub raw**, o mejor aún: **incluí el RAW_DATA parseado del editor como JSON embebido** en el `eer-graph.html` al momento de crearlo (copiando los datos del editor).

> **Instrucción específica**: Abrí `public/estatuto_editor.html` en el repo, extraé el array `RAW_DATA` completo que está definido como constante en el script, y embebilo como `const RAW_DATA_STATIC = [...]` en el nuevo `eer-graph.html`. Esto evita dependencia de red para los metadatos de los artículos.

---

## Detección automática de aristas desde `htmlTexts`

Para construir las aristas entre artículos automáticamente:

```js
// Para cada artículo sourceId en htmlTexts:
const html = state.htmlTexts[sourceId] || '';
const tmp = document.createElement('div');
tmp.innerHTML = html;
tmp.querySelectorAll('[data-ref]').forEach(chip => {
  const targetId = chip.dataset.ref;
  if (targetId && targetId !== sourceId) {
    edges.push({ source: sourceId, target: targetId, auto: true });
  }
});

// También parsear el formato texto plano [[artId:texto]]:
const raw = state.texts[sourceId] || '';
const refReg = /\[\[([^\]:]+):([^\]]+)\]\]/g;
let m;
while ((m = refReg.exec(raw)) !== null) {
  const targetId = m[1];
  if (targetId !== sourceId) edges.push({ source: sourceId, target: targetId, auto: true });
}
```

Deduplicar aristas (mismo source+target, no importa dirección para visualización).

---

## Tecnologías a usar

- **D3.js v7** (desde CDN: `https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js`) — force-directed graph
- **Firebase SDK v9 modular** (mismo CDN que usa el editor) — leer estado, escribir conceptos y links
- **Sin frameworks** — HTML + CSS + JS puro, un solo archivo `.html`
- **Paleta ISSyS BrandBook 2023**:
  ```css
  --issys-verde: #59B57E;
  --issys-azul:  #4657A0;
  --issys-gris:  #878787;
  --issys-gris-cl: #C6C6C6;
  --issys-amarillo: #F9D76B;
  ```
- **Fuentes**: mismas que el editor (Google Fonts): `Encode Sans Condensed` (sans), `Lora` (serif), `JetBrains Mono` (mono)

---

## Firebase SDK — Inicialización

Usar exactamente la misma configuración que el editor. La `apiKey` real está en `public/estatuto_editor.html` (buscala en el archivo). Usar el mismo patrón con `window._fbDb`, `window._fbGetDoc`, `window._fbDoc`, `window._fbSetDoc` para consistencia, o bien importar el SDK modular directamente con `import` desde CDN:

```html
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
  import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
  import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

  const firebaseConfig = { /* COPIÁ LA CONFIG DEL EDITOR */ };
  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);
  const auth = getAuth(app);
  // ...
</script>
```

**IMPORTANTE**: Usar el mismo sistema de autenticación que el editor (Firebase Auth email/password). El overlay de login debe ser idéntico visualmente al del editor.

---

## Layout de la interfaz

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (igual al editor: logo + título + botones de acción)    │
├──────────────────────────┬──────────────────────────────────────┤
│  PANEL IZQUIERDO (280px) │  CANVAS D3 (flex: 1)                │
│  ─────────────────────── │                                      │
│  🔍 Buscar nodo          │  [grafo interactivo]                 │
│                          │                                      │
│  Filtros:                │                                      │
│  ☑ Artículos EER         │                                      │
│  ☑ Conceptos externos    │                                      │
│  ─────────────────────── │                                      │
│  Agrupar por:            │                                      │
│  ○ Ninguno               │                                      │
│  ● Título                │                                      │
│  ○ Capítulo              │                                      │
│  ─────────────────────── │                                      │
│  Estado del artículo:    │                                      │
│  ☑ Sin marca             │                                      │
│  ☑ Pendiente             │                                      │
│  ☑ Para revisión         │                                      │
│  ☑ Aprobado              │                                      │
│  ─────────────────────── │                                      │
│  [+ Agregar concepto]    │                                      │
│  [↗ Abrir editor]        │                                      │
│                          │                                      │
├──────────────────────────┴──────────────────────────────────────┤
│  PANEL INFERIOR / LATERAL DERECHO — detalle del nodo            │
│  (slide-in desde la derecha al hacer click en un nodo)          │
└─────────────────────────────────────────────────────────────────┘
```

El panel de detalle (derecha, 360px, slide-in) muestra:
- Número y nombre del artículo (o label del concepto)
- Título y Capítulo (si es artículo)
- Flag/estado con badge de color
- Texto completo del artículo (si es Tipo A, desde `htmlTexts`)
- Comentarios (lista)
- Nodos conectados (lista con links clickeables)
- Botones: "Ver en editor" (abre `estatuto_editor.html` en nueva pestaña, no hay hash routing, simplemente que abra el editor) | "Agregar relación" | "Eliminar concepto" (solo Tipo B)

---

## Visualización del grafo D3

### Nodos

**Tipo A — Artículos EER:**
- Forma: círculo (radio 8px base, escalado si tiene más conexiones)
- Color por Título: asignar un color de la paleta secuencialmente (usar `d3.schemeTableau10` como base, sobreescribir los primeros con la paleta ISSyS)
- Borde (stroke) según `flag`:
  - Sin marca: `#C6C6C6`
  - `pending`: `#F9D76B` (amarillo ISSyS)
  - `review`: `#4657A0` (azul ISSyS)
  - `approved`: `#59B57E` (verde ISSyS)
  - Grosor del stroke: 2.5px
- Texto: número del artículo (ej: "12") centrado dentro del nodo, font `JetBrains Mono` 9px

**Tipo B — Conceptos externos:**
- Forma: diamante (rombo, rotado 45°) — implementar como `<rect>` rotado o `<polygon>`
- Color: `#878787` (gris ISSyS) con borde `#4657A0`
- Texto: label corto centrado, font `Encode Sans Condensed` 10px

### Aristas

- **Automáticas** (detectadas de refs): línea sólida, `opacity: 0.5`, color `#C6C6C6`
- **De capAssoc** (reglamento↔estatuto): línea punteada `stroke-dasharray: 4,3`, color `#4657A0`, opacity 0.6
- **Manuales**: línea sólida, color `#59B57E`, opacity 0.8, ancho 1.5px
- Flechas (markers `<marker>` SVG) en el extremo target para aristas manuales

### Interacciones

- **Hover sobre nodo**: resaltar nodo + sus conexiones directas, difuminar el resto (opacity 0.15)
- **Click en nodo**: abrir panel lateral derecho con detalle
- **Doble click en canvas vacío**: centrar/resetear zoom
- **Drag nodo**: fijarlo en esa posición (`fx`, `fy` en D3), click derecho para liberarlo
- **Zoom y pan**: `d3.zoom()` con límites `[0.1, 4]`
- **Hover sobre arista**: mostrar tooltip con label (si tiene)

### Agrupación por Título

Cuando está activo "Agrupar por Título": dibujar polígonos convexos (`d3.polygonHull`) alrededor de los artículos del mismo Título, con relleno semitransparente y label del Título.

---

## Funcionalidad: Agregar concepto externo

Modal con:
- Label (obligatorio)
- Descripción (opcional)
- Categoría: `normativa` | `organismo` | `concepto` | `persona` | `otro`

Al confirmar: generar UUID (`crypto.randomUUID()`), agregar al array en `eerGraph/concepts`, actualizar el grafo en tiempo real sin recargar.

---

## Funcionalidad: Agregar relación manual

Al hacer click en "Agregar relación" desde el panel de detalle de un nodo:
1. El cursor cambia a crosshair
2. Se muestra un toast: "Hacé click en el nodo destino"
3. Al hacer click en otro nodo: abrir mini-modal para ingresar label opcional
4. Guardar en `eerGraph/links`
5. Actualizar grafo

---

## Funcionalidad: Eliminar concepto / relación

- Eliminar concepto (Tipo B): confirmar → quitar de `eerGraph/concepts` + quitar todos los links que lo referencian
- Eliminar relación manual: click derecho sobre la arista → menú contextual con opción "Eliminar"

---

## Header del archivo

Igual al editor, incluir:
- Logo `logo128x128_blanco.png` (mismo src relativo)
- Título: "Mapa de Conceptos EER — ISSyS · Chubut"
- Botones: Recargar datos 🔄 | Centrar grafo ⊙ | Pantalla completa ⛶ | Usuario (menú) 👤
- Indicador de versión/última carga

---

## Auth

- Misma pantalla de login que el editor (overlay full-screen con el formulario)
- Solo usuarios con rol `admin`, `editor`, `revisor` o `lector` pueden ver el grafo
- Solo `admin` y `editor` pueden agregar/eliminar conceptos y relaciones manuales
- Lector y revisor: solo pueden navegar y visualizar

---

## Conceptos externos iniciales a pre-cargar

Al detectar que `eerGraph/concepts` está vacío (primera vez), pre-poblar con estos conceptos externos de referencia:

```json
[
  { "label": "Ley 3339", "description": "Ley Orgánica del ISSyS", "category": "normativa" },
  { "label": "Ley 24.241", "description": "Sistema Integrado de Jubilaciones y Pensiones", "category": "normativa" },
  { "label": "LCT", "description": "Ley de Contrato de Trabajo N° 20.744", "category": "normativa" },
  { "label": "ANSES", "description": "Administración Nacional de la Seguridad Social", "category": "organismo" },
  { "label": "Directorio ISSyS", "description": "Órgano de conducción superior del Instituto", "category": "organismo" },
  { "label": "Gerencia General", "description": "Máxima autoridad ejecutiva del ISSyS", "category": "organismo" },
  { "label": "Afiliado activo", "description": "Agente en actividad que aporta al sistema", "category": "concepto" },
  { "label": "Afiliado pasivo", "description": "Beneficiario jubilado o pensionado", "category": "concepto" },
  { "label": "BCRA", "description": "Banco Central de la República Argentina", "category": "organismo" },
  { "label": "Convenio Colectivo", "description": "Acuerdo paritario aplicable al personal", "category": "normativa" },
  { "label": "Escalafón", "description": "Sistema de clasificación y categorización del personal", "category": "concepto" },
  { "label": "Carrera administrativa", "description": "Progresión del agente en el sistema escalafonario", "category": "concepto" }
]
```

---

## Consideraciones de rendimiento

- Con ~139 artículos + ~12 conceptos externos, el grafo es manejable sin virtualización
- Usar `simulation.alphaDecay(0.03)` y `velocityDecay(0.4)` para que el layout se estabilice rápido
- Guardar posiciones fijadas por el usuario en `eerGraph/positions` (colección separada) para que el layout persista entre sesiones: `{ [nodeId]: { x, y } }`

---

## Archivos a crear/modificar

- **Crear**: `public/eer-graph.html` (archivo principal, todo en un solo HTML)
- **No modificar**: `public/estatuto_editor.html`

---

## Notas finales

- Usar `console.group` / `console.groupEnd` para logging ordenado durante la carga
- Mostrar spinner de carga mientras se obtienen datos de Firebase
- Si Firebase no está configurado (apiKey placeholder), mostrar mensaje claro igual que el editor
- Manejar el caso de `eerEditor/state` vacío (no hay datos del editor aún)
- El grafo debe funcionar en modo **solo lectura** aunque Firebase falle al cargar `eerGraph` (mostrando solo los artículos sin conceptos externos ni links manuales)
- Agregar en el footer del panel lateral un link "Abrir estatuto_editor.html" que abra el editor en nueva pestaña
