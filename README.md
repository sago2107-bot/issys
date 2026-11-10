# Sistemas ISSyS

Portal único con ingreso de Google y selector de sistemas del Instituto de Seguridad Social y Seguros del Chubut.

- **Proyecto Firebase:** `issys-procesos` (Firestore + Auth + Hosting)
- **Sitio de Hosting:** `issys-sistemas` → https://issys-sistemas.web.app
- **Repo:** github.com/sago2107-bot/issys
- **Carpeta local:** `D:\issys`

## Estructura

```
issys/
├── .firebaserc            proyecto issys-procesos + target "sistemas" → sitio issys-sistemas
├── firebase.json          hosting (public/), reglas y emuladores
├── firestore.rules        reglas de TODO el proyecto (se publican sólo desde acá)
├── docs/                  manual de marca para web apps
├── recursos/              material que no se publica (temas JSON de ejemplo, etc.)
└── public/
    ├── index.html         portal: login + selector + usuarios y permisos
    ├── shared/
    │   ├── firebase-config.js   credenciales, administrador fijo y catálogo de sistemas
    │   ├── auth.js              login único (ISSyS.iniciar) y menú de usuario
    │   ├── issys.css            tokens de marca y componentes comunes
    │   ├── issys-tailwind.js    paleta de marca para sistemas con Tailwind (ex marca.js)
    │   └── marca/               logos oficiales
    ├── procesos/          index.html, modelador.html, bpmn-*.js, nube.js
    └── presentaciones/    index.html (ex presentacion-issys.html), nube.js
```

## Cómo se integra un sistema

1. Carpeta propia en `public/<id>/` con su `index.html`.
2. En el `<head>`: `/shared/firebase-config.js` y `/shared/auth.js` (y `/shared/issys.css`).
3. Al arrancar: `const ses = await ISSyS.iniciar({ sistema: '<id>', titulo, subtitulo })`.
   Devuelve `{ db, auth, firebase, usuario }` cuando la persona ya está autorizada para ese sistema.
   `ses.mostrar()` saca la pantalla de ingreso; `ses.salir()` cierra la sesión de todos los sistemas.
4. Agregar el sistema en `firebase-config.js` (`sistemas`, con `estado: 'activo'`).
5. Agregar sus colecciones en `firestore.rules` con `habilitado('<id>')`.

## Permisos

`usuarios/{email}` → `{ admin: bool, activo: bool, sistemas: ['procesos', 'presentaciones', …] }`

- Se indexa por **email** y no por uid: así se puede dar de alta a alguien antes de su primer ingreso (el uid recién existe cuando la persona entra por primera vez).
- `admin: true` = todos los sistemas + gestión de usuarios. El administrador fijo está en `firebase-config.js` y en `firestore.rules`.
- Se gestiona desde el portal → sección **Usuarios y permisos** (sólo administradores).

---

## Plan de migración — Etapa 1: Procesos y Presentaciones

### Hallazgos del relevamiento (10/11/2026)

| | Procesos | Presentaciones |
|---|---|---|
| Proyecto Firebase | issys-procesos | **issys-procesos** (sitio `issys-presentaciones`) |
| Datos | `datos/{clave}` | `presentaciones/{id}`, `presentacionesImagenes/{hash}` |
| Lista de acceso | `acceso/{email}` | `presentacionesAcceso/{email}` |
| Reglas | se publican desde `D:\issys-procesos` | no tiene (usa las de Procesos) |

**Conclusión:** los dos sistemas ya comparten el mismo Firestore y los nombres de colección no chocan. **No hay que mover datos entre proyectos.** Lo único que se unifica son las dos listas de acceso → `usuarios`.

### Pasos

1. **Crear el sitio de Hosting** (una sola vez):
   ```
   cd D:\issys
   firebase login
   firebase hosting:sites:create issys-sistemas
   ```
   Si el nombre está tomado, elegir otro (ej. `issys-chubut`) y cambiarlo en `.firebaserc`.

2. **Publicar reglas y sitio:**
   ```
   firebase deploy --only firestore:rules
   firebase deploy --only hosting:sistemas
   ```
   Las reglas nuevas mantienen las listas viejas (bloque LEGADO): los sitios `issys-procesos.web.app` e `issys-presentaciones.web.app` siguen funcionando igual.

3. **Verificar el dominio en Auth:** Firebase Console → Authentication → Settings → *Authorized domains*: tiene que figurar `issys-sistemas.web.app` (si no está, agregarlo).

4. **Ingresar** a https://issys-sistemas.web.app con sago2107@gmail.com (administrador fijo) → **Usuarios y permisos → Importar accesos anteriores**. Copia `acceso` y `presentacionesAcceso` a `usuarios`, sin dar permisos de administrador (eso se marca a mano).

5. **Probar** Procesos (`/procesos/`) y Presentaciones (`/presentaciones/`): deberían entrar directo, sin volver a pedir Google, con los mismos datos de siempre.

6. **Dejar de publicar desde las carpetas viejas.** En particular, **no correr más `firebase deploy` en `D:\issys-procesos`**: publicaría las reglas viejas y borraría la regla de `usuarios`. Conviene sacar la sección `"firestore"` de `D:\issys-procesos\firebase.json` o directamente archivar la carpeta.

7. **Retiro de los sitios viejos** (cuando todo ande unos días):
   - Publicar en `issys-procesos` y `issys-presentaciones` un `firebase.json` con redirección 301 a `https://issys-sistemas.web.app/procesos/` y `/presentaciones/`.
   - Borrar del `firestore.rules` el bloque LEGADO y, en la consola, las colecciones `acceso` y `presentacionesAcceso`.

### Prueba local

`firebase emulators:start` y abrir http://localhost:5000. En `localhost` los sistemas usan los emuladores de Auth y Firestore (`emuladoresEnLocalhost` en `firebase-config.js`).

### Git

```
cd D:\issys
git init -b main
git add .
git commit -m "Sistemas ISSyS: portal, login único y etapa 1 (Procesos y Presentaciones)"
git remote add origin https://github.com/sago2107-bot/issys.git
git push -u origin main
```

---

## Próximas etapas

- **Estatuto** (`issys-eer`) y **Delegaciones** (`issys-delegaciones`): están en **otros proyectos Firebase**, así que ahí **sí** hay migración de datos (export/import de Firestore). Antes, revisar nombres de colección: Procesos usa `datos`, un nombre genérico que podría chocar. Si alguno también usa `datos`, renombrar el suyo con prefijo (ej. `estatutoDatos`).
- **Consultorios Mitre 837:** relevar primero.
- **Diseño unificado:** pasar los estilos propios del chip de Procesos (`nube.js`) a `shared/issys.css` y usar `ISSyS.ponerUsuario` como en Presentaciones.
