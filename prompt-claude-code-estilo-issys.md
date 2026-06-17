# PROMPT PARA CLAUDE CODE — IDENTIDAD DE MARCA ISSyS 2023
## Fuente: BrandBook ISSyS — Manual de usos y aplicaciones (2023)

Adapta el estilo visual y la colorimetría de esta aplicación web para que se alinee estrictamente con el **Manual de Marca (BrandBook) del ISSyS — Instituto de Seguridad Social y Seguros del Chubut**, edición 2023, producido por el área de Comunicaciones del Instituto.

---

## 1. PALETA CROMÁTICA OFICIAL

Estos son los únicos colores autorizados por el BrandBook. No uses aproximaciones ni colores similares.

```css
:root {
  /* — PRIMARIOS — */
  --issys-verde:   #59B57E;   /* C:66 M:1 Y:63 K:0  | R:89  G:181 B:126 */
  --issys-azul:    #4657A0;   /* C:82 M:66 Y:2  K:0  | R:70  G:87  B:160 */

  /* — SECUNDARIOS — */
  --issys-gris:    #878787;   /* C:47 M:37 Y:37 K:17 | R:135 G:135 B:135 */
  --issys-gris-cl: #C6C6C6;   /* C:26 M:19 Y:20 K:2  | R:198 G:198 B:198 */
  --issys-amarillo:#F9D76B;   /* C:4  M:15 Y:67 K:0  | R:249 G:215 B:107 */

  /* — NEUTROS DE SOPORTE (no definidos en BrandBook, inferidos de piezas) — */
  --issys-blanco:  #FFFFFF;
  --issys-negro:   #1A1A1A;   /* Para tipografía sobre fondos claros */
  --issys-bg:      #F4F4F4;   /* Fondo de página muy claro, neutro */
}
```

**Reglas de aplicación cromática del BrandBook:**
- El **verde `#59B57E`** y el **azul `#4657A0`** son los colores primarios del isologo; usarlos como colores de marca en la UI (botones principales, encabezados, acentos activos).
- El **gris `#878787`** y el **gris claro `#C6C6C6`** son secundarios: texto de apoyo, bordes, etiquetas, estados deshabilitados.
- El **amarillo `#F9D76B`** es un color secundario de acento; usar con moderación para destacar elementos específicos (badges, notificaciones, indicadores).
- **Nunca usar fondos oscuros como color principal** — el sistema de identidad opera sobre blanco o gris claro.
- Los gradientes y transparencias del BrandBook son fusiones a 100%/0% entre los dos colores primarios; si se usan fondos decorativos, seguir este patrón.

---

## 2. TIPOGRAFÍA OFICIAL

La familia tipográfica del ISSyS es **Encode Sans Condensed** (Google Fonts, de libre acceso). Es la única fuente autorizada para comunicaciones institucionales digitales.

```css
/* Importar desde Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Encode+Sans+Condensed:wght@300;600;900&display=swap');

:root {
  --font-issys: 'Encode Sans Condensed', sans-serif;

  /* Pesos autorizados */
  --fw-light:    300;   /* Encode Sans Condensed Light    — texto largo, cuerpo */
  --fw-semibold: 600;   /* Encode Sans Condensed Semibold — subtítulos, labels  */
  --fw-black:    900;   /* Encode Sans Condensed Black    — títulos, headings    */

  /* Escala tipográfica sugerida */
  --fs-xs:   12px;
  --fs-sm:   14px;
  --fs-base: 16px;
  --fs-md:   18px;
  --fs-lg:   22px;
  --fs-xl:   28px;
  --fs-2xl:  36px;
}

body {
  font-family: var(--font-issys);
  font-weight: var(--fw-light);
  font-size: var(--fs-base);
  color: var(--issys-negro);
  background-color: var(--issys-bg);
}

h1, h2, h3 {
  font-family: var(--font-issys);
  font-weight: var(--fw-black);
  color: var(--issys-azul);
}

h4, h5, label, .badge {
  font-family: var(--font-issys);
  font-weight: var(--fw-semibold);
}
```

**Nota:** En vistas de documentos administrativos formales (Resoluciones, Disposiciones, Memorandos) que deban imprimirse o guardarse como PDF, mantener **Times New Roman 12pt con interlineado 1,5** según el Manual de Estilo Institucional. La tipografía Encode Sans Condensed aplica a la **interfaz web**, no al cuerpo del documento administrativo.

---

## 3. LOGOTIPO — REGLAS DE USO

El BrandBook define versiones y restricciones estrictas. Claude Code debe respetarlas al posicionar el logo en la UI:

### Versiones disponibles
| Versión | Uso recomendado |
|---|---|
| Horizontal (isotipo + "ISSyS" + nombre completo) | Header principal de la app |
| Vertical (isotipo arriba, "ISSyS" abajo) | Splash, login, presentaciones |
| Isologo (solo isotipo) | Favicon, avatar, botón ícono |
| Botón / ícono (isotipo en cuadrado redondeado) | App icon, notificaciones |

### Zona de seguridad
Respetar un margen mínimo alrededor del logo equivalente a **5x** el ancho de la franja inferior del isotipo en todas las direcciones (aprox. 16px en contexto digital para logo de 4cm).

```css
.logo-wrapper {
  padding: 16px; /* zona de seguridad mínima */
  display: inline-flex;
  align-items: center;
}
```

### Aplicación sobre fondos
```
✅ CORRECTO:
  - Logo original (color) sobre fondo blanco
  - Logo negro sobre fondos claros
  - Logo blanco sobre fondos oscuros (azul o verde institucional)

❌ INCORRECTO (NO hacer):
  - Cuadrado blanco detrás del logo sobre fondo de color
  - Logo expandido, condensado o distorsionado
  - Logo con outline (solo relleno plano)
  - Logo inclinado o con efectos
  - Logo con proporciones alteradas
```

### Tamaños mínimos
- Versión horizontal: mínimo **4 cm** de ancho (≈ 151px a 96dpi)
- Versión reducida: mínimo **4 cm** de ancho
- Por debajo de esos tamaños, usar solo el isologo o el botón/ícono.

---

## 4. COMPONENTES DE UI

### Botones

```css
/* Primario — verde institucional */
.btn-primary {
  background-color: var(--issys-verde);
  color: var(--issys-blanco);
  font-family: var(--font-issys);
  font-weight: var(--fw-semibold);
  border: none;
  border-radius: 4px;
  padding: 10px 24px;
  font-size: var(--fs-base);
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.btn-primary:hover { background-color: #4a9a6a; } /* verde oscurecido */

/* Secundario — azul institucional */
.btn-secondary {
  background-color: var(--issys-azul);
  color: var(--issys-blanco);
  /* mismas propiedades de forma que btn-primary */
  border-radius: 4px;
}
.btn-secondary:hover { background-color: #3a4a88; }

/* Outline / terciario */
.btn-outline {
  background-color: transparent;
  color: var(--issys-azul);
  border: 2px solid var(--issys-azul);
  border-radius: 4px;
}
```

### Encabezado / Header de la aplicación

```css
.app-header {
  background-color: var(--issys-blanco);
  border-bottom: 3px solid var(--issys-verde);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Variante oscura (nav lateral o mobile) */
.app-header--dark {
  background-color: var(--issys-azul);
  border-bottom: 3px solid var(--issys-verde);
  color: var(--issys-blanco);
}
```

### Navegación y sidebar

```css
.nav-item {
  font-family: var(--font-issys);
  font-weight: var(--fw-semibold);
  color: var(--issys-gris);
  padding: 10px 16px;
  border-left: 3px solid transparent;
  transition: all 0.15s ease;
}

.nav-item:hover,
.nav-item.active {
  color: var(--issys-azul);
  border-left-color: var(--issys-verde);
  background-color: rgba(89, 181, 126, 0.08);
}
```

### Tarjetas / Cards

```css
.card {
  background: var(--issys-blanco);
  border: 1px solid var(--issys-gris-cl);
  border-top: 4px solid var(--issys-verde);
  border-radius: 4px;
  padding: 20px;
  font-family: var(--font-issys);
}

.card--azul { border-top-color: var(--issys-azul); }
.card--alerta { border-top-color: var(--issys-amarillo); }
```

### Tablas

```css
table.issys {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-issys);
  font-size: var(--fs-sm);
}

table.issys thead th {
  background-color: var(--issys-azul);
  color: var(--issys-blanco);
  font-weight: var(--fw-semibold);
  padding: 10px 14px;
  text-align: left;
}

table.issys tbody td {
  padding: 8px 14px;
  border-bottom: 1px solid var(--issys-gris-cl);
  color: var(--issys-negro);
}

table.issys tbody tr:hover {
  background-color: rgba(89, 181, 126, 0.06);
}
```

### Badges / estados

```css
.badge-verde   { background: var(--issys-verde);    color: #fff; }
.badge-azul    { background: var(--issys-azul);     color: #fff; }
.badge-gris    { background: var(--issys-gris-cl);  color: var(--issys-gris); }
.badge-alerta  { background: var(--issys-amarillo); color: var(--issys-negro); }

/* Base común */
[class^="badge-"] {
  font-family: var(--font-issys);
  font-weight: var(--fw-semibold);
  font-size: var(--fs-xs);
  padding: 3px 10px;
  border-radius: 12px;
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Formularios

```css
input, select, textarea {
  font-family: var(--font-issys);
  font-weight: var(--fw-light);
  font-size: var(--fs-base);
  border: 1px solid var(--issys-gris-cl);
  border-radius: 4px;
  padding: 8px 12px;
  color: var(--issys-negro);
  background: var(--issys-blanco);
  width: 100%;
  transition: border-color 0.2s;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--issys-verde);
  outline: none;
  box-shadow: 0 0 0 3px rgba(89, 181, 126, 0.2);
}

label {
  font-family: var(--font-issys);
  font-weight: var(--fw-semibold);
  font-size: var(--fs-sm);
  color: var(--issys-gris);
  margin-bottom: 4px;
  display: block;
}
```

---

## 5. ICONOGRAFÍA

El BrandBook contempla un sistema de íconos propios del ISSyS. En la UI:
- Usar íconos de **línea fina** (stroke, no relleno) en color `var(--issys-azul)` o `var(--issys-verde)`.
- Si se usa una librería externa (Lucide, Heroicons), elegir la variante `outline` y colorear con las variables institucionales.
- Tamaño base: **20px** para iconos inline, **24px** para acciones, **32px** para ilustraciones de sección.
- **No** usar íconos con relleno sólido de colores ajenos a la paleta.

---

## 6. CONSIDERACIONES GENERALES PARA CLAUDE CODE

- Si el proyecto usa **Tailwind CSS**, extender `tailwind.config.js` con los tokens de color:
```js
theme: {
  extend: {
    colors: {
      'issys-verde':   '#59B57E',
      'issys-azul':    '#4657A0',
      'issys-gris':    '#878787',
      'issys-gris-cl': '#C6C6C6',
      'issys-amarillo':'#F9D76B',
    },
    fontFamily: {
      'issys': ['"Encode Sans Condensed"', 'sans-serif'],
    },
    fontWeight: {
      'light':    '300',
      'semibold': '600',
      'black':    '900',
    },
  }
}
```

- **No modificar el logo.** Si el asset del logo está en el proyecto, usarlo tal cual. No recrearlo con CSS ni SVG propio.
- **No usar fondos oscuros** como color de fondo principal de la aplicación; el sistema de marca opera sobre blanco.
- **No introducir colores fuera de la paleta.** Si se necesita un estado de error, usar un rojo neutro (`#D32F2F`) solo para eso y sin llamarlo color de marca.
- Mantener toda la lógica de la aplicación intacta; este prompt aplica exclusivamente a presentación visual.
- Para componentes de previsualización o exportación de documentos administrativos (PDF, print), aplicar las reglas del Manual de Estilo Institucional (Times New Roman 12pt, márgenes específicos) en `@media print`, independientemente de la tipografía de la UI.
