# Consultorios Comodoro Rivadavia (`public/consultorios/`)

## Overview

Cronograma de atención de los consultorios del 3.er piso de Mitre 837 (Delegación Comodoro Rivadavia): qué profesional
atiende en qué consultorio, qué días y en qué horario; croquis de la planta; y requisitos de habilitación según la
Resolución N° 461/11-MS de Chubut.

Es una sola página (`index.html`, sin compilación). Vino del proyecto Firebase `issys-consultorios`
(`issys-consultorios.web.app`) y se integró al portal el 11/11/2026 (README raíz → "Plan de migración — Etapa 3").

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | La aplicación completa (estilos, datos iniciales, lógica y pantallas). |
| `croquis-3er_piso.svg` | Plano fuente del croquis. La página usa una copia incorporada (`CROQUIS_SVG`). |
| `requisitos-resolucion-461-11.md` | Texto de la norma que se usó para armar la lista de requisitos (no se publica). |

## Interface

### Pestañas

| Pestaña | Quién la ve | Qué hace |
| --- | --- | --- |
| Cronograma | todos | Semana día por día (una fila por consultorio), asignación por consultorio y avisos. Imprimir. |
| Croquis | todos | Plano del 3.er piso; al hacer clic en un consultorio, sus profesionales, horarios y requisitos. Imprimir / PDF y PNG. |
| Profesionales | editor | Alta, edición y baja de profesionales y sus horarios. |
| Consultorios | editor | Nombre, número de croquis (C1 a C9), uso general o exclusivo y especialidad exclusiva. |
| Requisitos | todos (marcar: editor) | Lista de control por consultorio, matriz de resumen, establecimiento, equipamiento compartido y cobertura. |

Los permisos se dan en el portal → **Usuarios y permisos** (sistema "Consultorios Comodoro Rivadavia", rol Editor o Lector).

### Datos (Firestore, proyecto `issys-procesos`)

- `consultoriosCronogramas/mitre837` → `{ nombre, salas[], establecimiento, compartidos[], actualizado, por }`.
  `salas[]`: `{ id, nro, nombre, tipo: 'general' | 'exclusivo', especialidad, ficha? }` (la `ficha` guarda la lista de control).
- `consultoriosCronogramas/mitre837/profesionales/{id}` → `{ nombre, corto, especialidad, sala, bloques[] }`.
  `bloques[]`: `{ dia (0 = lunes … 5 = sábado), ini, fin (minutos desde las 0), conf (a confirmar), sala? }`.

### Cómo asigna los consultorios

- Cada profesional va al consultorio exclusivo de su especialidad, si existe. El resto se reparte entre los generales.
- «Reasignar consultorios» busca una distribución sin superposiciones en la que cada profesional conserve el mismo
  consultorio toda la semana, moviendo la menor cantidad posible de personas. Antes de aplicar muestra los cambios.
- Si no existe una distribución con consultorio fijo, propone consultorios distintos según el día.
- Si en un horario hay más profesionales que consultorios, lo informa y deja a esa persona sin asignar.
- Un consultorio general cuya superficie, lado o planta (pestaña Requisitos) no cumplen lo exigido para una especialidad,
  o al que le falta el acceso directo al baño cuando se exige, no se usa para esa especialidad. El equipamiento faltante
  sólo genera un aviso.

### Requisitos de habilitación (Res. 461/11-MS)

- **Por consultorio:** lista de control según las especialidades que atienden ahí; cada ítem cita el punto de la norma.
  Estados: cumple, falta, sin dato, no necesario.
- **Resumen:** matriz de consultorios × requisitos. **Establecimiento:** sala de espera, baños, secretaría y seguridad.
  **Cobertura:** días hábiles sin profesionales de cada especialidad (Anexo I, I-4).
- **Equipamiento adicional** por consultorio y **equipamiento compartido** entre varios consultorios.
- Los faltantes aparecen como avisos en el Cronograma; no impiden guardar ni asignar.

## Invariants

- Ingreso por `ISSyS.iniciar({ sistema: 'consultorios' })`: hay que tener `consultorios` en `usuarios/{email}.sistemas`
  (o ser administrador global). No hay lectura pública (decisión del 11/11/2026).
- Rol (`ISSyS.rolEn`): `editor` o `lector`. Un administrador global sin rol asignado es editor. Las reglas
  (`editaConsultorios()` en `firestore.rules`) aplican lo mismo: un lector no puede escribir aunque modifique la página.
- Cada guardado es un lote: los profesionales cambiados (documento entero) y, en el documento principal, sólo los campos
  que cambiaron (`mergeFields`). Dos editores que cambian el mismo profesional a la vez: gana el último.
- Encabezado común (`ISSyS.ponerEncabezado`); el estado de guardado va en el punto sobre la foto.
- Colores sólo de la guía de marca. Cada especialidad tiene un tinte de fondo y un borde (`--<clave>-bg` / `--<clave>-bd`,
  claves en `COLORES`); las especialidades no previstas toman una de cuatro combinaciones extra (`x1` a `x4`) según su
  nombre. El nombre siempre acompaña al color.
- Si cambia el plano, hay que actualizar `CROQUIS_SVG` en `index.html` (y `croquis-3er_piso.svg`).

## Side Effects

- Lee y escribe `consultoriosCronogramas/mitre837` y su subcolección `profesionales` (escucha cambios en vivo).
- Imprimir (cronograma, faltantes, listado, croquis) usa el diálogo del navegador; «Descargar imagen» genera un PNG del croquis.

## Verification

- `firebase emulators:start` desde la raíz y abrir http://localhost:5000/consultorios/. Con el emulador vacío, un editor
  ve «Cargar el cronograma inicial» (14 profesionales y 9 consultorios del archivo original).
- Probar con un lector: no ve las pestañas Profesionales ni Consultorios y no puede marcar requisitos.
