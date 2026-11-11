# ISSyS — Guía de marca para aplicaciones web

Basada en el **BrandBook ISSyS – Manual de usos y aplicaciones** (Área de Comunicaciones). Versión 2 · 11/11/2026 ·
Responsable: administrador de los Sistemas ISSyS.

---

## 0. Alcance y convenciones

### 0.1 Alcance

- **Obliga a:** toda aplicación web del Instituto publicada en los Sistemas ISSyS (`public/<sistema>/`). El resumen
  obligatorio está en [CLAUDE.md](../CLAUDE.md).
  - El checklist (§8) se exige completo a los sistemas nuevos y a las pantallas que se modifiquen. Lo que los sistemas
    actuales todavía no cumplen está en §9.
- **Cubre:** la interfaz en pantalla (colores, tipografía, logo, encabezado, componentes y estados).
- **No cubre:**
  - impresos, cartelería y piezas de comunicación: ver el BrandBook;
  - el contenido de las diapositivas que se arman en Presentaciones: sigue su propio tema;
  - el modo oscuro: no se usa.

### 0.2 Etiquetas de origen

| Etiqueta | Significa | ¿Se puede cambiar? |
| --- | --- | --- |
| **[BrandBook]** | Valor oficial del BrandBook. | No. |
| **[Derivado]** | Extensión para pantalla que el BrandBook no define (hover, tintes, texto accesible). | Sí, con un motivo escrito. |
| **[WCAG]** | Requisito de accesibilidad (WCAG 2.1, nivel AA). | No. |
| **[Regla interna]** | Decisión de los Sistemas ISSyS (encabezado común, componentes). | Sí, actualizando esta guía y el código. |

La etiqueta de un título vale para toda la sección, salvo que una fila diga otra cosa.

### 0.3 Obligatorio y recomendado

- **Debe / no debe:** obligatorio. Todo lo obligatorio que se puede verificar está en el checklist (§8).
- **Conviene:** recomendado; se puede apartar con un motivo.

### 0.4 Dónde vive cada dato

| Dato | Dueño | Esta guía |
| --- | --- | --- |
| Reglas de marca y accesibilidad | esta guía | — |
| Valores (HEX, tamaños, radios, sombras) | [issys.css](../public/shared/issys.css) | nombra el token, no copia el valor |
| Paleta para Tailwind | [issys-tailwind.js](../public/shared/issys-tailwind.js) | — |
| Uso del encabezado y de `ISSyS.iniciar` | [README → Encabezado común](../README.md#encabezado-común-regla-general) | — |
| Reglas obligatorias en una línea | [CLAUDE.md](../CLAUDE.md) | — |

Sólo los colores [BrandBook] se escriben con su HEX en esta guía (§1.1), porque son la referencia oficial y el código debe
coincidir con ellos.

### 0.5 Glosario

- **Logo:** el conjunto completo (isologo + logotipo, con o sin bajada).
- **Isologo:** el símbolo verde y azul solo.
- **Logotipo:** la palabra "ISSyS".
- **Bajada:** "Instituto de Seguridad Social y Seguros del Chubut" (en el logo). En el encabezado, "bajada" es la segunda
  línea, debajo del nombre del sistema.
- **Logo de área:** SEROS Chubut ISSyS, Previsión ISSyS, Turismo ISSyS.

---

## 1. Color

### 1.1 Paleta [BrandBook]

| Token | Nombre | HEX | RGB | CMYK |
| --- | --- | --- | --- | --- |
| `--issys-green` | Verde ISSyS | `#59B57E` | 89, 181, 126 | 66 / 1 / 63 / 0 |
| `--issys-blue` | Azul ISSyS | `#4657A0` | 70, 87, 160 | 82 / 66 / 2 / 0 |
| `--issys-gray` | Gris medio | `#878787` | 135, 135, 135 | 47 / 37 / 37 / 17 |
| `--issys-gray-light` | Gris claro | `#C6C6C6` | 198, 198, 198 | 26 / 19 / 20 / 2 |
| `--issys-yellow` | Amarillo | `#F9D76B` | 249, 215, 107 | 4 / 15 / 67 / 0 |

Verde y azul son los primarios (mitades del isologo); gris, gris claro y amarillo, los secundarios.

### 1.2 Tokens derivados [Derivado]

Los valores están en [issys.css](../public/shared/issys.css).

| Función | Token |
| --- | --- |
| Texto principal ("negro de marca") | `--issys-ink` |
| Texto auxiliar (gemelo de texto del gris) | `--issys-muted` |
| Fondo principal / alternativo | `--issys-white` / `--issys-surface` |
| Divisores suaves, fondo de etiqueta gris | `--issys-line` |
| Hover de botón azul, texto azul fuerte | `--issys-blue-dark` |
| Texto verde sobre blanco o `surface`; texto blanco sobre verde | `--issys-green-dark` |
| Texto verde sobre tintes | `--issys-green-deep` |
| Fondos azules y verdes (tintes) | `--issys-blue-tint` / `--issys-green-tint` |
| Fondo amarillo claro / texto sobre amarillo | `--issys-yellow-tint` / `--issys-yellow-ink` |
| Error, acción destructiva | `--issys-danger` |
| Radio, sombras, fuente | `--issys-radius`, `--issys-shadow`, `--issys-shadow-lg`, `--issys-font` |

### 1.3 Colores de área

| Área | Logo de área | Acento |
| --- | --- | --- |
| Obra Social | SEROS Chubut ISSyS | `--issys-green` [BrandBook] |
| Caja Previsional | Previsión ISSyS | `--issys-blue` [BrandBook] |
| Turismo | Turismo ISSyS | `--issys-turismo` [Derivado, **provisorio**: valor muestreado, a confirmar (§9)] |

Una aplicación de un área puede usar su acento **dentro del contenido** (destacados, gráficos, fondos). El encabezado no
cambia: borde verde siempre (§5). Para texto o botones, el acento debe cumplir §1.4; si no, usar su gemelo de texto (§1.4)
o `ink`.

### 1.4 Contraste [WCAG]

- **Texto normal:** debe tener contraste de 4.5:1 o más. **Texto grande** (24 px o más, o 18,66 px o más en peso 600 o
  superior) e íconos o bordes que transmiten información: 3:1 o más.
- **No debe** transmitirse información sólo con color (estados, errores, obligatorios): sumar texto, ícono o forma.

Pares permitidos para **texto normal** (contraste calculado):

| Texto \ Fondo | `white` | `surface` | `line` | `blue-tint` | `green-tint` | `yellow-tint` | `yellow` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ink` | 16.88 | 15.61 | 14.55 | 13.55 | 14.78 | 15.23 | 12.03 |
| `blue` | 6.71 | 6.20 | 5.78 | 5.38 | 5.87 | 6.05 | 4.78 |
| `blue-dark` | 9.07 | 8.39 | 7.82 | 7.28 | 7.94 | 8.18 | 6.46 |
| `muted` | 6.39 | 5.91 | 5.50 | 5.13 | 5.59 | 5.76 | 4.55 |
| `green-dark` | 5.04 | 4.66 | ❌ 4.34 | ❌ 4.04 | ❌ 4.41 | 4.54 | ❌ 3.59 |
| `green-deep` | 6.67 | 6.17 | 5.75 | 5.36 | 5.84 | 6.02 | 4.75 |
| `yellow-ink` | 7.47 | 6.90 | 6.43 | 5.99 | 6.54 | 6.73 | 5.32 |
| `danger` | 6.54 | 6.04 | 5.63 | 5.25 | 5.72 | 5.89 | 4.66 |

Sobre fondos de color: texto `white` sobre `blue` (6.71) o sobre `green-dark` (5.04); texto `ink` sobre `green` (6.70).

Valores calculados con los colores de `issys.css` al 11/11/2026. Si cambia un token, hay que recalcular la tabla (§9).

**Reglas:**
- Los colores [BrandBook] `green`, `yellow`, `gray` y `gray-light` **no deben** usarse para texto: van en fondos, bordes,
  íconos decorativos y acentos. Para texto se usa su gemelo: `green-dark` o `green-deep`, `yellow-ink`, `muted`.
- Fondo `green` (por ejemplo, los íconos del lanzador): contenido en `ink`. Botón azul: texto `white`. Amarillo: siempre
  fondo, con texto `ink` o `yellow-ink`.

### 1.5 Fusión, degradados y transparencia

- [BrandBook] Verde y azul pueden superponerse con transparencia.
- [Regla interna] En la interfaz **no se usan degradados suaves**. La fusión se aplica sólo como cortes netos (las diagonales
  de `.marca-diagonales`, §4) o como superposición con opacidad en piezas decorativas. Nunca sobre el logo.

---

## 2. Tipografía

- [BrandBook] **Familia única:** `Encode Sans Condensed`. La carga [auth.js](../public/shared/auth.js) (Google Fonts, pesos
  300, 400, 600 y 900); no hace falta agregarla a mano.
- [BrandBook] **Pesos:** Black 900 (títulos principales, cifras destacadas), Semibold 600 (subtítulos, botones, rótulos,
  encabezados de tabla), Light 300 (texto corrido y bajadas, en el estilo editorial).
- [Derivado] **Regular 400** para el cuerpo de texto en pantalla (tablas, formularios): Light pierde legibilidad por debajo
  de 16 px. Light 300 sólo desde 16 px.
  - Excepción [Regla interna]: la bajada del encabezado y del lanzador va en 300 a 14 px, en `muted`. Repite información
    que ya está en el nombre del sistema.
- [Derivado] Los pesos 500 y 700 no se cargan: en Tailwind, `font-medium` y `font-bold` equivalen a 600 y `font-extrabold`
  a 900.
- [Derivado] **Roles de texto:** cuerpo → `ink`, peso 400; auxiliar (ayudas, fechas, notas) → `muted`; títulos → `ink`,
  900 o 600.
- [Derivado] **Tamaños:** la condensada se lee más chica que una tipografía común, por eso la base de pantalla es de
  16-18 px (Tailwind usa 18 px). Los tamaños concretos quedan en el código. **Tamaño mínimo:** 12 px, y sólo para etiquetas
  y notas de pie.
- [BrandBook] **Estilo editorial:** título en Black y segunda línea en Light del mismo tamaño o menor (ej.
  "**Tamaños y proporciones** / Logotipo").

---

## 3. Logo

### 3.1 Archivos

Están en [`public/shared/marca/`](../public/shared/marca/) y se usan con ruta absoluta (`/shared/marca/…`).

| Archivo | Versión | Uso |
| --- | --- | --- |
| `issys-logo-recorte.png` | Isologo + logotipo, sin bajada, recortado | **Encabezado común**, barras compactas y pantalla de ingreso (la arma `auth.js`, con el nombre del Instituto al pie) |
| `issys-logo-completo-recorte.png` | Con bajada, recortado | Portadas y reportes |
| `issys-logo-blanco-recorte.png` | Blanco, recortado | Sobre fondos oscuros (`blue`, `ink`, fotos oscuras) |
| `issys-logo.png`, `issys-logo-completo.png`, `issys-logo-blanco.png` | Las mismas, con margen original | Cuando el margen lo da la imagen |
| `issys-isologo.png` | Isologo solo | Favicon, ícono de aplicación, avatar |

No disponibles en el repo: versión vertical, logo en negro, versión botón/ícono y SVG (§9). Mientras no estén, sobre fondos
claros se usa el logo a color.

### 3.2 Tamaño mínimo

| Versión | Pantalla [Derivado] | Impreso [BrandBook] |
| --- | --- | --- |
| Con bajada | 120 px de ancho | 4 cm de ancho |
| Sin bajada | 24 px de alto (el encabezado usa 32 px) | — |
| Isologo solo | 24 px de alto | — |

Si el logo con bajada mide menos de 120 px de ancho, se debe usar la versión sin bajada.

### 3.3 Zona de seguridad [BrandBook]

Margen libre en los cuatro lados igual a la altura de la "S" de ISSyS.

[Derivado] En pantalla se toma como **25 % de la altura del logo**. En el encabezado, la clase `.issys-logo` lo aplica
(32 px de alto + 8 px de margen): usar esa clase en lugar de CSS propio.

### 3.4 Fondos y usos prohibidos [BrandBook]

**Debe:**
- logo a color sobre blanco o fondos claros (`surface`, tintes);
- logo blanco sobre fondos oscuros;
- contraste de 3:1 o más entre el logo y el fondo.

**No debe:**
- poner el logo dentro de un recuadro blanco sobre un fondo de color;
- poner el logo a color sobre azul u otro color de marca;
- deformarlo: expandir, condensar, estirar, rotar o inclinar ([Derivado] en CSS: fijar sólo `height` y dejar
  `width: auto`);
- cambiar sus proporciones, colores o elementos, ni aplicarlo sólo en contorno;
- agregarle sombras, brillos u otros efectos.

### 3.5 Favicon e ícono de aplicación [Regla interna]

```html
<link rel="icon" type="image/png" href="/shared/marca/issys-isologo.png">
```

`theme-color`: no se define (la barra del navegador queda blanca, como el encabezado).

---

## 4. Elementos gráficos

- **Diagonales** [BrandBook]: formas diagonales en la esquina superior con `blue-tint` y `green-tint`. En pantalla: clase
  `.marca-diagonales`. Van sólo detrás de títulos o portadas, nunca detrás de párrafos ni tablas.
- **Patrón de isologos** [BrandBook]: isologo repetido en grilla. En pantalla, sólo como fondo con opacidad de 8 % o menos.
- **Íconos** [Regla interna]: estilo lineal y trazo simple.
  - En el encabezado y el lanzador se usan los del propio encabezado (`ICONOS` en `auth.js`). Un sistema nuevo agrega ahí el
    suyo.
  - Dentro de cada sistema, [Lucide](https://lucide.dev) con versión fija, en `blue`, `ink` o `muted`.

---

## 5. Encabezado común [Regla interna]

Toda aplicación de los Sistemas ISSyS **debe** usar el encabezado común. Uso y API:
[README → Encabezado común](../README.md#encabezado-común-regla-general).

- **Barra:** blanca, borde inferior `--issys-green` de 4 px, sombra `--issys-shadow`. Nunca azul ni oscura.
- **Izquierda:** logo (`.issys-logo`, `issys-logo-recorte.png`), línea vertical `--issys-gray-light`, nombre del sistema
  (900) y bajada (300, `muted`, ver §2).
- **Derecha, siempre en este orden:**
  1. herramientas propias del sistema;
  2. lanzador de sistemas;
  3. foto de perfil.

  El lanzador y la foto los arma `ISSyS.ponerEncabezado()`: **no deben** dibujarse a mano.
- **Pantallas chicas:** por debajo de 900 px se oculta la bajada; por debajo de 640 px, el nombre del sistema. El logo, el
  lanzador y la foto quedan siempre.

---

## 6. Componentes y estados

### 6.1 Componentes [Regla interna]

Clases de [issys.css](../public/shared/issys.css), con prefijo para no pisar los estilos de cada sistema:

| Necesidad | Clase |
| --- | --- |
| Botón secundario (blanco, borde azul) | `.issys-btn` |
| Botón principal (uno por pantalla) | `.issys-btn.prim` |
| Botón chico | `.issys-btn.chico` |
| Acción destructiva | `.issys-btn.peligro` |
| Etiqueta azul / verde / gris / amarilla | `.issys-tag`, `.verde`, `.gris`, `.amarillo` |
| Logo | `.issys-logo` |
| Diagonales decorativas | `.marca-diagonales` |
| Aviso flotante | `ISSyS.avisar(texto)` (crea `#issys-aviso`) |

No hay botón verde: la acción principal es azul.

### 6.2 Estados [Regla interna]

| Estado | Regla |
| --- | --- |
| Foco | **Debe** verse: contorno de 2 px en `blue` (`:focus-visible` de `issys.css`) o, en campos de texto, borde `blue` más un anillo `blue-tint`. Quitar el contorno sólo si se reemplaza por uno de estos. |
| Deshabilitado | Opacidad 0,5 y cursor normal (`.issys-btn[disabled]`). Conviene explicar el motivo con un texto de ayuda. |
| Error | Texto en `danger` con un mensaje que diga qué corregir; nunca sólo el borde rojo. |
| Guardado | Punto sobre la foto (`green`, `yellow`, `danger`) **más** el texto en el menú de cuenta. El punto todavía distingue los estados sólo por color (§9). |
| Movimiento | Respetar `prefers-reduced-motion` en animaciones de más de 0,2 s. |

---

## 7. Sistema nuevo [Regla interna]

1. Seguir [README → Cómo se integra un sistema](../README.md#cómo-se-integra-un-sistema): carga de archivos,
   `ISSyS.iniciar`, alta en `firebase-config.js` y encabezado (§5). Para la marca, además:
2. Si el sistema usa Tailwind: cargar `/shared/issys-tailwind.js` **antes** del CDN de Tailwind. Las escalas `slate`,
   `blue`, `emerald`, `amber`, `rose`, etc. ya apuntan a la paleta de marca. Para texto, **debe** usarse uno de estos tonos
   o uno más oscuro, y sólo sobre los fondos que permite §1.4:

   | Escala | Token |
   | --- | --- |
   | `slate-500` / `gray-500` | `muted` |
   | `slate-900` | `ink` |
   | `blue-600` / `blue-700` | `blue` / `blue-dark` |
   | `emerald-600` | `green-dark` (no sobre `*-50`/`*-100`: ahí `emerald-700`) |
   | `emerald-700` | `green-deep` |
   | `amber-700` | `yellow-ink` |
   | `rose-600` | `danger` |

3. Usar las clases de §6 antes de crear estilos propios. Si hace falta un color, usar un token de §1.

---

## 8. Checklist antes de publicar

- [ ] El encabezado sigue §5 y usa `ISSyS.ponerEncabezado`.
- [ ] Toda la interfaz usa `Encode Sans Condensed`.
- [ ] Sólo colores de §1 (tokens de `issys.css` o escalas de `issys-tailwind.js`).
- [ ] Ningún texto en `green`, `yellow`, `gray` ni `gray-light`. En Tailwind, la búsqueda no debe encontrar nada:
  - `text-(green|emerald|teal|amber|yellow|orange)-(50|100|200|300|400|500)`;
  - `text-(gray|slate|zinc|cyan|sky|blue|indigo|rose|red)-(50|100|200|300|400)`;
  - `text-issys-(green|yellow|gray|gray-light)` sin sufijo `-dark`/`-deep`.

  Además, `text-emerald-600` no va sobre fondos `*-50` ni `*-100`.
- [ ] Todo par de texto y fondo figura como permitido en §1.4.
- [ ] Ninguna información se indica sólo con color.
- [ ] El logo usa `.issys-logo` (altura fija, ancho automático y zona de seguridad).
- [ ] El logo blanco va sobre fondos oscuros; nunca va dentro de un recuadro blanco.
- [ ] El favicon es `/shared/marca/issys-isologo.png`.
- [ ] Ningún texto mide menos de 12 px.

---

## 9. Pendientes y riesgos aceptados

| Tema | Estado |
| --- | --- |
| Color de Turismo | Valor muestreado; confirmar con Comunicaciones. Ningún sistema lo usa todavía. |
| `ink` (#1D1D1B) | Marcado [Derivado]; confirmar con Comunicaciones si figura en el BrandBook. |
| Logo vertical, en negro, botón/ícono y SVG | No hay archivos; pedirlos a Comunicaciones. |
| BrandBook | No está en el repo; conviene guardar una copia en `docs/`. |
| Fuente por Google Fonts | Si no carga, el respaldo (`Arial Narrow`, Arial) es más ancho y recorta títulos; cada visita informa la IP a Google. Alternativa: servirla desde `/shared/` (licencia OFL). |
| Tailwind por CDN | Versión de desarrollo, sin versión fija. |
| Paleta copiada en `issys-tailwind.js` | Las escalas repiten valores de `issys.css`; si cambia un color, cambiarlo en los dos. |
| Matriz de contraste (§1.4) | Depende de los HEX de `issys.css`; si cambia un token, recalcularla. |
| Excepciones al mínimo de 12 px | En Estatuto quedan más chicos sólo los símbolos de adorno dentro de círculos (flechas de `.section-tgl` y `.cap-tgl`, cruz de `.ref-chip-del`) y las etiquetas del grafo de `mapa.html`, que se agrandan con el zoom. |
| Colores de categorías del mapa de Estatuto | Pasados a la paleta el 11/11/2026 (`mapa.html` migra los colores de fábrica viejos al cargar). Con 7 categorías y 5 colores de marca, algunas se parecen (Normativa y Organismo, dos azules): el nombre del nodo y la leyenda las distinguen. |
| Impresión de Estatuto | La vista de impresión usa Times New Roman en negro: es un documento impreso, fuera del alcance de esta guía (§0.1). |
| Estado de guardado | El punto sobre la foto distingue los estados sólo por color; el texto está en el menú. Pendiente: forma o `title`. |
| Spinner de ingreso | Gira aunque se pida movimiento reducido. |
