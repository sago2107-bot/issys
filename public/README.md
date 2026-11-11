# public — sitio publicado (issys-sistemas)

## Overview

Raíz de Hosting del sitio `issys-sistemas` (`firebase.json` → `"public": "public"`). Todo lo que está acá se publica tal cual,
sin compilar, salvo los archivos ocultos y los `*.md` (`"ignore"` en `firebase.json`), así que estos README no se publican.

`index.html` es el **portal**: ingreso único con Google, selector de sistemas y, para administradores, la gestión de
**Usuarios y permisos** sobre `usuarios/{email}`. Cada sistema vive en su propia carpeta y comparte login, encabezado y marca
desde `shared/`.

## Interface

- `index.html` (portal, script inline en una IIFE; no exporta nada a `window`):
  - `ISSyS.iniciar({ sistema: null, titulo: 'Sistemas ISSyS', subtitulo: 'Acceso institucional', texto })`.
  - `ISSyS.ponerEncabezado($('usuario'), u, { sistema: null })`: encabezado común sin sistema actual.
  - `pintarSistemas(u)`: muestra `ISSYS_CONFIG.sistemas` con `estado === 'activo'` incluidos en `u.sistemas`; los
    `proximamente` sólo a administradores, en gris y sin enlace.
  - `iniciarAdmin(ses)` (sólo si `u.admin`): alta (`#alta`), lista en vivo (`#lista`, `onSnapshot`), cambio de sistemas, rol
    por sistema (`select[data-rol]`, sólo sistemas con `roles`), `admin`, Suspender/Reactivar (`activo`), Quitar, e
    **Importar accesos anteriores** (`#importar`).
  - `#usuarios` en la URL desplaza a la sección de usuarios (sólo administradores).
- Subcarpetas:
  - [shared](./shared/README.md): `firebase-config.js` (`ISSYS_CONFIG`), `auth.js` (`window.ISSyS`), `issys.css`,
    `issys-tailwind.js`; `shared/marca/` (logos PNG, sin contrato).
  - [procesos](./procesos/README.md): visor y modelador BPMN; datos en `datos/{clave}`.
  - [presentaciones](./presentaciones/README.md): motor y editor de presentaciones; `presentaciones/{id}`,
    `presentacionesImagenes/{hash}`.
  - [estatuto](./estatuto/README.md): editor del Estatuto y mapa de conceptos; `eerEditor/state`, `eerGraph/*`.
  - [herramientas](./herramientas/README.md): `migrar-estatuto.html` (uso único, sólo administradores).

## Invariants

- Carga de `/shared/firebase-config.js` antes de `/shared/auth.js` en todas las páginas.
- El portal no dibuja encabezado propio: usa `ISSyS.ponerEncabezado` igual que los sistemas (CLAUDE.md, regla 2).
- `CFG.dueno` (administrador fijo) no se puede dar de alta ni aparece editable: se muestra fijo como "Administrador fijo".
- Los correos se guardan en minúsculas (`toLowerCase()`), igual que exige `firestore.rules` (`mail == mail.lower()`).
- El alta usa `set(..., { merge: true })`: no borra campos existentes del usuario.
- La importación sólo **agrega** (`arrayUnion`) los sistemas `procesos` / `presentaciones` desde `acceso` y
  `presentacionesAcceso`; nunca marca `admin` y omite `CFG.dueno`.
- La UI de usuarios es una comodidad: quien autoriza es `firestore.rules` (`adminGlobal()` para escribir `usuarios`).

## Side Effects

- Firestore `usuarios/{email}`: `set` (alta), `update` (`sistemas`, `roles`, `admin`, `activo`), `delete` (Quitar); siempre con
  `actualizadoPor` y `actualizado: serverTimestamp()`.
- Lectura de `acceso` y `presentacionesAcceso` y escritura en lote (`db.batch()`) a `usuarios` al importar (campo `importado`).
- Escucha en vivo de toda la colección `usuarios` mientras un administrador tiene el portal abierto.
- Diálogos `confirm()` antes de Quitar e Importar.

## Verification

- Run: `firebase emulators:start` y abrir http://localhost:5000 (en `localhost` se usan los emuladores de Auth y Firestore).
