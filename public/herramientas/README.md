# herramientas

## Overview

Herramientas de administración de uso puntual, servidas desde Hosting en `/herramientas/`. No son un sistema
del portal: no figuran en `sistemas` de `public/shared/firebase-config.js` ni aparecen en el lanzador.

Hoy contiene una sola página, `migrar-estatuto.html`: la migración única de Estatuto desde el proyecto
Firebase anterior (`issys-eer`) al proyecto de Sistemas ISSyS. Es el paso 2 de "Pasos" de la migración
descrita en `/README.md` (raíz del repo).

## Interface

- `migrar-estatuto.html` (página sin build, script inline en una IIFE; no exporta nada a `window`).
  - Ingreso: `ISSyS.iniciar({ sistema: null, titulo: 'Migrar Estatuto', … })`. Si `ses.usuario.admin` es falso,
    reemplaza `<main>` por "Sin permiso." y no hace nada más.
  - Encabezado: `ISSyS.ponerEncabezado($('usuario'), ses.usuario, { sistema: null })` sobre una barra `.top`
    propia (logo + nombre).
  - Asistente en tres pasos (`section.paso` `#p1`, `#p2`, `#p3`; `#p2` y `#p3` arrancan con `aria-disabled="true"`):
    1. `#f-origen` (correo `#o-mail` + contraseña `#o-pass`): ingresa a `issys-eer` y lee las colecciones
       `eerEditor`, `eerGraph` y `users` en memoria (`datos`).
    2. `#b-respaldo`: descarga `issys-eer-respaldo-AAAA-MM-DD.json` con `{ origen, fecha, datos }`.
    3. `#b-copiar`: tras `confirm()`, escribe en el proyecto de destino (ver Efectos secundarios).
  - Constantes internas: `ORIGEN` (config web de Firebase de `issys-eer`), `COLECCIONES = ['eerEditor', 'eerGraph']`,
    `ROLES` (ids de `config.sistemas[id='estatuto'].roles`: `admin`, `editor`, `revisor`, `lector`).
  - Funciones internas: `iniciar(ses)`, `usuariosAMigrar()`, `mostrarResumen()`.
- Depende de `/shared/firebase-config.js`, `/shared/auth.js` (`ISSyS.iniciar`, `ponerEncabezado`, `esc`, `config`)
  y `/shared/issys.css`.

## Invariants

- Sólo administradores: la página corta si `ses.usuario.admin` es falso, y además `firestore.rules` exige
  `adminGlobal()` para escribir en `usuarios/{mail}`.
- En `issys-eer` sólo se lee: no hay escrituras ni borrados sobre `origenDb`. La sesión de origen usa
  `Auth.Persistence.NONE` y vive en una app Firebase secundaria llamada `'eer'` (no toca la sesión de Sistemas ISSyS).
- Selección de usuarios (`usuariosAMigrar`): `users/{uid}` con `email`, `active !== false` y distinto de
  `config.dueno`. El correo se pasa a minúsculas (las reglas exigen `mail == mail.lower()`). Un `role` que no
  esté en `ROLES` se migra como `lector`.
- Los permisos se agregan con `merge: true` y `FieldValue.arrayUnion('estatuto')`: no se quitan otros
  sistemas que la persona ya tenga. Sí se sobrescribe `roles.estatuto` y se fija `activo: true`.
- Los documentos de `eerEditor` y `eerGraph` se escriben uno por uno con `set()` (sin lote, porque
  `eerEditor/state` puede acercarse al límite de tamaño de un lote) y reemplazan por completo el documento
  de destino con el mismo id.
- Idempotente: se puede repetir; cada corrida vuelve a copiar lo último de `issys-eer`. Si falla a mitad,
  la indicación es repetir la copia completa (no hay reanudación parcial).
- Documentos que existan en destino y no en origen no se borran.

## Side Effects

- Red / Auth: `signInWithEmailAndPassword` contra el proyecto `issys-eer` (correo y contraseña del Estatuto anterior).
- Lectura Firestore (`issys-eer`): `eerEditor/*`, `eerGraph/*`, `users/*`.
- Escritura Firestore (destino, `ses.db`):
  - `eerEditor/{id}` y `eerGraph/{id}`: `set(d)` con los datos tal cual.
  - `usuarios/{email}` (un lote): `{ sistemas: arrayUnion('estatuto'), roles: { estatuto: rol }, activo: true,
    migradoDe: 'issys-eer', actualizadoPor: <email del admin>, actualizado: serverTimestamp() }` con `merge: true`.
- Disco local: descarga del respaldo JSON por el navegador (Blob + `URL.createObjectURL`). Contiene todos los
  datos de Estatuto y usuarios: guardarlo fuera del repo.

## Verification

- Ejecutar: `firebase emulators:start` y abrir http://localhost:5000/herramientas/migrar-estatuto.html
  (requiere un usuario administrador; el paso 1 se conecta al proyecto real `issys-eer`, no al emulador).
