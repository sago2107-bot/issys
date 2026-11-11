# Sistemas ISSyS — reglas del proyecto

Portal único (issys-sistemas.web.app) con varios sistemas en `public/<id>/`. Leer `README.md` antes de integrar o tocar un sistema.

## Reglas generales (obligatorias)

1. **Identidad visual:** sólo la paleta, tipografía (Encode Sans Condensed) y componentes de `docs/ISSyS-brand-guidelines.md`
   y `public/shared/issys.css`. Sin degradados suaves (sólo cortes netos, guía §1.5), sin encabezados azules/oscuros, sin fuentes con serifa.
2. **Encabezado común en todos los sistemas** (README → "Encabezado común"):
   - Barra blanca, borde inferior verde de 4 px, logo a color + línea gris + nombre (900) y bajada (300).
   - Arriba a la derecha, siempre al final y en este orden: lanzador de sistemas (⋮⋮⋮) y foto de perfil.
   - Se arma con `ISSyS.ponerEncabezado(contenedor, ses.usuario, { sistema, rol, items, alSalir })` de `public/shared/auth.js`.
     No dibujar a mano botones "Sistemas ISSyS"/"volver", avatares ni menús de usuario propios.
   - Un sistema nuevo se agrega en `public/shared/firebase-config.js` (`sistemas`) y aparece solo en el portal y en el lanzador.
3. **Ingreso:** siempre por `ISSyS.iniciar({ sistema: '<id>', … })` (Google + permisos en `usuarios/{email}`).
4. **Reglas de Firestore:** sólo se publican desde este repo (`firestore.rules`).

## Publicar

`firebase deploy --only hosting:sistemas` (y `firestore:rules` si cambiaron las reglas). Publica todo `public/`.
