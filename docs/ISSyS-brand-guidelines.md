# ISSyS — Manual de marca para Web Apps

> Especificación técnica derivada del **BrandBook ISSyS – Manual de usos y aplicaciones**.
> Objetivo: que toda web app institucional (HTML single-file / Firebase Hosting) respete la identidad visual del Instituto de Seguridad Social y Seguros del Chubut.
>
> **Regla de oro:** los valores marcados como **[Manual]** son oficiales y no se modifican. Los marcados como **[Derivado]** son extensiones técnicas para uso digital (hover, accesibilidad, fondos) y no aparecen en el BrandBook.

---

## 1. Paleta cromática

### 1.1 Primarios [Manual]

| Token | Nombre | HEX | RGB | CMYK | Uso |
|---|---|---|---|---|---|
| `--issys-green` | Verde ISSyS | `#59B57E` | 89, 181, 126 | 66 / 1 / 63 / 0 | Mitad superior del isologo, acentos, estados positivos, fondos de bloques |
| `--issys-blue` | Azul ISSyS | `#4657A0` | 70, 87, 160 | 82 / 66 / 2 / 0 | Mitad inferior del isologo, botones primarios, links, encabezados |

### 1.2 Secundarios [Manual]

| Token | Nombre | HEX | RGB | CMYK | Uso |
|---|---|---|---|---|---|
| `--issys-gray` | Gris medio | `#878787` | 135, 135, 135 | 47 / 37 / 37 / 17 | Texto secundario grande, íconos, bordes fuertes |
| `--issys-gray-light` | Gris claro | `#C6C6C6` | 198, 198, 198 | 26 / 19 / 20 / 2 | Bordes, divisores, estados deshabilitados |
| `--issys-yellow` | Amarillo | `#F9D76B` | 249, 215, 107 | 4 / 15 / 67 / 0 | Destacados, advertencias, badges (siempre con texto oscuro) |

### 1.3 Neutros y derivados digitales [Derivado]

| Token | HEX | Uso |
|---|---|---|
| `--issys-ink` | `#1D1D1B` | Texto principal y color del logotipo "ISSyS" (negro de marca) |
| `--issys-white` | `#FFFFFF` | Fondo principal (el logo original va siempre sobre blanco) |
| `--issys-surface` | `#F5F6F8` | Fondo de página alternativo / tarjetas sobre fondo blanco |
| `--issys-blue-dark` | `#36457F` | Hover/active de botones azules |
| `--issys-blue-tint` | `#E3E6F1` | Fondos suaves azulados (como los triángulos del BrandBook) |
| `--issys-green-dark` | `#2F7D50` | **Texto** en verde sobre blanco (accesible) y hover de botones verdes |
| `--issys-green-tint` | `#E6F3EB` | Fondos suaves verdes, filas destacadas, alertas de éxito |

### 1.4 Colores de áreas (logotipos secundarios)

| Área | Logotipo | Color de acento |
|---|---|---|
| Obra Social | SEROS Chubut ISSyS | `#59B57E` (verde) [Manual] |
| Caja Previsional | Previsión ISSyS | `#4657A0` (azul) [Manual] |
| Turismo | Turismo ISSyS | `#B5B94B` aprox. (verde oliva) [Derivado — muestreado; el manual no publica el HEX, confirmar con Comunicaciones] |

Si una app pertenece a un área específica, usar el color del área como acento principal y mantener el resto de la paleta institucional.

### 1.5 Fusión y transparencia [Manual]
El BrandBook admite superponer verde y azul con transparencia (100% / 0%). En web: degradés o superposiciones decorativas usando `--issys-green` y `--issys-blue` con opacidad, **nunca** sobre el logo.

---

## 2. Accesibilidad (contraste WCAG sobre blanco)

| Color | Contraste vs `#FFF` | Texto normal (AA 4.5:1) | Texto grande / UI (3:1) |
|---|---|---|---|
| `#1D1D1B` ink | ~17:1 | ✅ | ✅ |
| `#4657A0` azul | ~6.7:1 | ✅ | ✅ |
| `#2F7D50` verde oscuro | ~5:1 | ✅ | ✅ |
| `#878787` gris | ~3.6:1 | ❌ | ✅ |
| `#59B57E` verde | ~2.5:1 | ❌ | ❌ (solo decorativo) |
| `#F9D76B` amarillo | ~1.4:1 | ❌ | ❌ (solo fondo) |

**Reglas prácticas:**
- Texto sobre blanco: usar `ink`, `blue` o `green-dark`. **Nunca** texto en `#59B57E` ni `#F9D76B`.
- Botón verde (`#59B57E`): texto en `ink` (`#1D1D1B`), no en blanco. Si se quiere texto blanco, usar `--issys-green-dark`.
- Botón azul (`#4657A0`): texto blanco ✅.
- Amarillo: siempre como fondo con texto `ink`.

---

## 3. Tipografía [Manual]

**Familia única:** `Encode Sans Condensed` (Google Fonts).

| Rol | Peso | CSS `font-weight` | Uso |
|---|---|---|---|
| Primaria | Black | 900 | Títulos principales (H1), cifras destacadas, numeración de secciones |
| Secundaria | Semibold | 600 | Subtítulos (H2–H4), botones, etiquetas, encabezados de tabla |
| Secundaria | Light | 300 | Texto corrido, descripciones, bajadas |

> Nota digital [Derivado]: Light (300) en tamaños menores a 16px pierde legibilidad en pantalla. Para cuerpo de texto en apps (tablas, formularios) se recomienda **Regular 400**; reservar 300 para bajadas y textos de 16px o más.

**Carga:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Encode+Sans+Condensed:wght@300;400;600;900&display=swap" rel="stylesheet">
```

**Escala sugerida [Derivado]:**

| Elemento | Tamaño | Peso | Color |
|---|---|---|---|
| H1 | 2.5rem (40px) | 900 | `ink` o `gray` (como en el BrandBook) |
| H2 | 1.75rem (28px) | 600–900 | `ink` |
| H3 | 1.25rem (20px) | 600 | `blue` |
| Cuerpo | 1rem (16px) | 400 | `ink` |
| Bajada / ayuda | 0.875rem (14px) | 400 | `gray` (solo si es texto auxiliar) |
| Botón | 1rem | 600 | según botón |

Estilo editorial del BrandBook: título en **Black** + segunda línea en **Light** del mismo tamaño o menor (ej. "**Tamaños y proporciones** / Logotipo").

---

## 4. Logotipo

### 4.1 Archivos (carpeta `assets/brand/`)

| Archivo sugerido | Versión | Cuándo usarlo |
|---|---|---|
| `issys-logo-completo.png` | Horizontal con isologo + "ISSyS" + "Instituto de Seguridad Social y Seguros del Chubut" | Encabezados de página, login, reportes imprimibles, pantallas de inicio |
| `issys-logo.png` | Horizontal con isologo + "ISSyS" (sin bajada) | Barras de navegación, headers compactos, cuando el espacio es reducido |
| `issys-logo-blanco.png` | Versión en blanco | Sobre fondos oscuros (azul, `ink`, fotos oscuras) |
| `issys-isologo.png` / `.svg` *(si se dispone)* | Solo el símbolo verde/azul | Favicon, ícono de app (PWA), avatar, loaders |

> Preferir **SVG** cuando esté disponible (nitidez en cualquier resolución). Si solo hay PNG, exportar a 2× del tamaño de uso.

Versiones oficiales previstas en el manual: **horizontal**, **vertical** (isologo arriba, "ISSyS" abajo), **isologo** y **botón/ícono** (isologo dentro de un cuadrado redondeado o círculo blanco con sombra suave).

### 4.2 Tamaño mínimo

| Medio | Mínimo |
|---|---|
| Impreso [Manual] | 4 cm de ancho |
| Pantalla [Derivado] | 120 px de ancho para la versión completa; 90 px para la versión sin bajada; 24 px para el isologo solo |

Si la bajada "Instituto de Seguridad Social…" queda ilegible, usar la versión sin bajada.

### 4.3 Zona de seguridad [Manual]
El logo debe tener un margen libre alrededor, sin texto, bordes ni otros elementos. En web: **margen mínimo = altura de la letra "S" de ISSyS** en todos los lados (aprox. 25% de la altura total del logo).

```css
.issys-logo { padding: 0.25em; /* espacio libre mínimo */ }
```

### 4.4 Aplicación sobre fondos [Manual]

✅ **Correcto**
- Logo a color sobre **fondo blanco** (versión original).
- Sobre fondos **claros**: logo en **negro**.
- Sobre fondos **oscuros**: logo en **blanco** (`issys-logo-blanco.png`).
- Buscar siempre contraste suficiente.

❌ **Incorrecto**
- Poner el logo dentro de un **recuadro blanco** sobre un fondo de color.
- Logo a color sobre fondo azul u otro color de marca.
- Logo gris oscuro sobre negro o gris claro sobre blanco (bajo contraste).
- **Expandir, condensar, estirar o alargar** (en CSS: nunca fijar `width` y `height` a la vez sin `object-fit: contain`).
- Alterar la inclinación, rotar o torcer.
- Cambiar proporciones, colores o elementos internos.
- Aplicarlo en **outline** (solo contorno).
- Agregarle sombras, brillos o efectos.

```css
/* Uso seguro de la imagen del logo */
.issys-logo img { height: 40px; width: auto; display: block; }
```

---

## 5. Elementos gráficos

- **Triángulos/diagonales:** el BrandBook usa grandes formas diagonales en las esquinas superiores con tintes suaves (`--issys-blue-tint`, `--issys-green-tint`, `#E9E9E9`). Uso recomendado como decoración de headers o portadas, nunca detrás de texto denso.
- **Patrón de isologos:** fondos con el isologo repetido en grilla (banners de lona). En web, solo como fondo muy sutil (opacidad ≤ 8%).
- **Íconos:** estilo lineal, trazo simple, dentro de círculos con borde (ver cartel Playa Unión). Sugerencia: [Lucide](https://lucide.dev) o Material Symbols *Outlined*, en `blue` o `gray`.

---

## 6. Tokens listos para usar

### 6.1 CSS (variables)

```css
:root {
  /* Marca [Manual] */
  --issys-green: #59B57E;
  --issys-blue: #4657A0;
  --issys-gray: #878787;
  --issys-gray-light: #C6C6C6;
  --issys-yellow: #F9D76B;

  /* Derivados [Derivado] */
  --issys-ink: #1D1D1B;
  --issys-white: #FFFFFF;
  --issys-surface: #F5F6F8;
  --issys-blue-dark: #36457F;
  --issys-blue-tint: #E3E6F1;
  --issys-green-dark: #2F7D50;
  --issys-green-tint: #E6F3EB;
  --issys-turismo: #B5B94B;

  /* Semánticos */
  --color-bg: var(--issys-white);
  --color-surface: var(--issys-surface);
  --color-text: var(--issys-ink);
  --color-text-muted: #5F5F5F;
  --color-border: var(--issys-gray-light);
  --color-primary: var(--issys-blue);
  --color-primary-hover: var(--issys-blue-dark);
  --color-accent: var(--issys-green);
  --color-success: var(--issys-green-dark);
  --color-success-bg: var(--issys-green-tint);
  --color-warning-bg: var(--issys-yellow);
  --color-danger: #B3261E;
  --color-link: var(--issys-blue);

  /* Tipografía */
  --font-family: 'Encode Sans Condensed', 'Arial Narrow', Arial, sans-serif;
  --fw-light: 300;
  --fw-regular: 400;
  --fw-semibold: 600;
  --fw-black: 900;

  /* Forma */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-card: 0 2px 8px rgba(29, 29, 27, 0.08);
}

body {
  font-family: var(--font-family);
  font-weight: var(--fw-regular);
  color: var(--color-text);
  background: var(--color-bg);
}
h1 { font-weight: var(--fw-black); }
h2, h3, h4, th, button { font-weight: var(--fw-semibold); }
a { color: var(--color-link); }
```

### 6.2 Componentes base

```css
.btn {
  font-family: var(--font-family);
  font-weight: var(--fw-semibold);
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
}
.btn-primary   { background: var(--issys-blue);  color: #fff; }
.btn-primary:hover { background: var(--issys-blue-dark); }
.btn-secondary { background: var(--issys-green); color: var(--issys-ink); }
.btn-secondary:hover { background: var(--issys-green-dark); color: #fff; }
.btn-outline   { background: transparent; color: var(--issys-blue); border: 1.5px solid var(--issys-blue); }

.card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.header-bar {
  background: #fff;
  border-bottom: 4px solid var(--issys-green);  /* acento de marca */
}

.badge-warning { background: var(--issys-yellow); color: var(--issys-ink); }
.badge-success { background: var(--issys-green-tint); color: var(--issys-green-dark); }
```

### 6.3 Tailwind (CDN)

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          issys: {
            green: '#59B57E',
            'green-dark': '#2F7D50',
            'green-tint': '#E6F3EB',
            blue: '#4657A0',
            'blue-dark': '#36457F',
            'blue-tint': '#E3E6F1',
            gray: '#878787',
            'gray-light': '#C6C6C6',
            yellow: '#F9D76B',
            ink: '#1D1D1B',
            surface: '#F5F6F8',
          },
        },
        fontFamily: {
          sans: ['"Encode Sans Condensed"', '"Arial Narrow"', 'Arial', 'sans-serif'],
        },
      },
    },
  };
</script>
```

### 6.4 Gráficos (Chart.js / Tableau / similares)

Orden de serie recomendado:
`#4657A0`, `#59B57E`, `#F9D76B`, `#878787`, `#36457F`, `#2F7D50`, `#C6C6C6`

---

## 7. Favicon y PWA

```html
<link rel="icon" type="image/png" href="assets/brand/issys-isologo.png">
<meta name="theme-color" content="#4657A0">
```
Para el ícono de app usar la versión **botón/ícono** del manual: isologo centrado sobre fondo blanco, con esquinas redondeadas.

---

## 8. Encabezado de los Sistemas ISSyS [Regla interna]

Todas las web apps del Instituto comparten el mismo encabezado, con la misma lógica que las apps de Google:

- **Barra blanca** con borde inferior verde (`--issys-green`, 4 px) y sombra suave. Nunca encabezados azules u oscuros.
- **Izquierda:** logo a color + línea vertical gris + nombre del sistema (Black 900) y bajada (Light 300).
- **Derecha, siempre en este orden:** herramientas propias del sistema → **lanzador de sistemas** (botón de 9 puntos que abre
  el panel con los sistemas habilitados) → **foto de perfil** (la de Google; abre el menú de cuenta).
- Panel del lanzador: fondo `--issys-surface`, bloque blanco con los sistemas activos, íconos en cuadrados redondeados
  azul (`--issys-blue`, ícono blanco) o verde (`--issys-green`, ícono en `--issys-ink`); los "próximamente" en gris.
- Menú de cuenta: correo, foto con anillo verde, "¡Hola, Nombre!", etiquetas de rol, acciones y "Cerrar sesión" en `--issys-danger`.
- Estado de guardado: punto sobre la foto (verde guardado, amarillo guardando, rojo error).

Implementación única: `ISSyS.ponerEncabezado()` en `public/shared/auth.js` + estilos en `public/shared/issys.css`.
Detalle de uso en el README del repositorio ("Encabezado común").

---

## 9. Checklist antes de publicar

- [ ] El encabezado sigue la sección 8 (lanzador ⋮⋮⋮ y foto de perfil arriba a la derecha, con `ISSyS.ponerEncabezado`).
- [ ] Se usa `Encode Sans Condensed` en toda la interfaz.
- [ ] Solo colores de la paleta (o derivados de este documento).
- [ ] Ningún texto en verde `#59B57E` ni amarillo sobre blanco.
- [ ] Logo sin deformar (`height` fija + `width: auto`).
- [ ] Logo con zona de seguridad libre.
- [ ] Sobre fondo oscuro → logo blanco; sobre fondo claro → logo color o negro; nunca recuadro blanco.
- [ ] Tamaño del logo ≥ 120 px (completo) / ≥ 90 px (sin bajada).
- [ ] Contraste AA verificado en botones y textos.

---

*Fuente: BrandBook ISSyS — Manual de usos y aplicaciones (Área de Comunicaciones, ISSyS). Elaborado como guía técnica para desarrollos web internos.*
