/**
 * Configuración común de los Sistemas ISSyS (proyecto Firebase issys-procesos, sitio issys-sistemas).
 *
 * - firebase: credenciales web del proyecto (son públicas por diseño; la seguridad está en firestore.rules).
 * - dueno: administrador fijo. También figura en firestore.rules: si se cambia, cambiar en los dos lados.
 * - sistemas: catálogo que muestra el portal y que se usa para habilitar permisos en usuarios/{email}.
 *   estado 'activo' = publicado en este sitio · 'proximamente' = todavía no integrado.
 *   El id es el que se guarda en usuarios/{email}.sistemas y el que piden las reglas.
 *   roles (opcional): roles internos del sistema; se guardan en usuarios/{email}.roles[id].
 */
window.ISSYS_CONFIG = {
    firebase: {
        apiKey: 'AIzaSyALMXeqgQyNykL83SQl4ECW8cxjuvMAdjA',
        authDomain: 'issys-sistemas.web.app',      // mismo dominio que el sitio: la redirección de Google no depende de cookies de terceros
        projectId: 'issys-procesos',
        storageBucket: 'issys-procesos.firebasestorage.app',
        messagingSenderId: '937283247360',
        appId: '1:937283247360:web:34eee7891441e6000d27e5'
    },
    sdk: 'https://www.gstatic.com/firebasejs/10.14.1/',
    dueno: 'sago2107@gmail.com',
    // En localhost usa los emuladores (firebase emulators:start). Con false, localhost usa la nube real.
    emuladoresEnLocalhost: true,

    sistemas: [
        {
            id: 'procesos', nombre: 'Procesos', estado: 'activo', url: '/procesos/', color: 'blue', icono: 'procesos',
            descripcion: 'Relevamiento, modelado BPMN y optimización de los procesos del Instituto.'
        },
        {
            id: 'presentaciones', nombre: 'Presentaciones', estado: 'activo', url: '/presentaciones/', color: 'green', icono: 'presentaciones',
            descripcion: 'Editor y motor de presentaciones con la identidad institucional.'
        },
        {
            id: 'estatuto', nombre: 'Estatuto', estado: 'activo', url: '/estatuto/', color: 'blue', icono: 'estatuto',
            descripcion: 'Estatuto Escalafón Reglamentario: edición, comentarios y mapa de conceptos.',
            // Roles propios del sistema, de más a menos permisos (el portal los ofrece al habilitarlo)
            roles: [
                { id: 'admin', nombre: 'Administrador' },
                { id: 'editor', nombre: 'Editor' },
                { id: 'revisor', nombre: 'Revisor' },
                { id: 'lector', nombre: 'Lector' }
            ]
        },
        {
            id: 'delegaciones', nombre: 'Delegaciones', estado: 'proximamente', url: '/delegaciones/', color: 'green', icono: 'delegaciones',
            descripcion: 'Estructuras de las delegaciones. Se integra en una próxima etapa (hoy en issys-delegaciones).'
        },
        {
            id: 'consultorios', nombre: 'Consultorios Mitre 837', estado: 'proximamente', url: '/consultorios/', color: 'blue', icono: 'consultorios',
            descripcion: 'Cronograma de atención de consultorios. Pendiente de relevamiento.'
        }
    ]
};
