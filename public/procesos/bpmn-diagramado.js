/**
 * Diagramado automático de BPMN respetando pools y carriles (uso: modelador.html).
 *
 * bpmn-auto-layout (bpmn.io) descarta carriles y objetos de datos, así que acá se
 * reordena el diagrama a partir de la lógica del proceso:
 *   - cada paso va en una columna según su distancia al inicio (los retornos no cuentan),
 *   - cada paso queda en su carril; las ramas de una compuerta ocupan filas distintas,
 *   - los documentos van arriba de la tarea que los usa,
 *   - los flujos se trazan con líneas ortogonales.
 *
 * Modifica la información gráfica (DI) del modelo cargado en el modeler; después hay
 * que exportar e importar de nuevo el XML para redibujar.
 */

const LAYOUT = {
    COL_W: 170,        // ancho de columna
    ROW_H: 130,        // alto de cada fila dentro de un carril
    LANE_PAD: 10,      // margen superior/inferior del carril
    DATA_BAND: 100,    // franja superior para documentos
    POOL_HEADER: 30,   // franja con el nombre del pool / carril
    START_GAP: 60,     // espacio entre el borde del carril y la primera columna
    END_GAP: 50,
    EVENT_SUB_GAP: 40, // separación de los subprocesos de evento (a la derecha del flujo)
    NO_POOL_ORIGIN: { x: 160, y: 80 }
};

function ordenarDiagrama(modeler) {
    const registry = modeler.get('elementRegistry');
    const moddle = modeler.get('moddle');
    const is = (el, type) => el && el.businessObject && el.businessObject.$instanceOf(type);
    const isShape = el => el.type !== 'label' && !el.waypoints && el.businessObject;

    // Pool a ordenar: el que tiene el proceso con más elementos (o el proceso sin pool)
    const pools = registry.filter(el => el.type === 'bpmn:Participant');
    const pool = pools
        .filter(p => p.businessObject.processRef)
        .sort((a, b) => b.children.length - a.children.length)[0] || null;
    const container = pool || registry.filter(el => !el.parent && el.type !== 'label')[0];
    if (!container) return false;

    // Carriles hoja (sin subcarriles), ordenados de arriba hacia abajo
    const lanes = registry
        .filter(el => is(el, 'bpmn:Lane') && insidePool(el) && !(el.businessObject.childLaneSet && el.businessObject.childLaneSet.lanes.length))
        .sort((a, b) => a.y - b.y);

    function insidePool(el) {
        let p = el.parent;
        while (p) { if (p === container) return true; p = p.parent; }
        return false;
    }

    const children = container.children.filter(isShape);
    // Los subprocesos de evento no están en el flujo: van aparte, a la derecha de su carril
    const isEventSub = el => is(el, 'bpmn:SubProcess') && el.businessObject.triggeredByEvent;
    const eventSubs = children.filter(isEventSub);
    const nodes = children.filter(el => is(el, 'bpmn:FlowNode') && !is(el, 'bpmn:BoundaryEvent') && !isEventSub(el));
    if (!nodes.length) return false;
    const boundaries = children.filter(el => is(el, 'bpmn:BoundaryEvent'));
    const dataShapes = children.filter(el => is(el, 'bpmn:DataObjectReference') || is(el, 'bpmn:DataStoreReference'));

    // ---------- Carril de cada paso ----------
    const laneOf = new Map();
    nodes.concat(eventSubs).forEach(n => {
        const refs = n.businessObject.lanes || [];
        let lane = lanes.find(l => refs.includes(l.businessObject));
        if (!lane) {
            const cy = n.y + n.height / 2;
            lane = lanes.find(l => cy >= l.y && cy <= l.y + l.height) || null;
        }
        laneOf.set(n, lane);
    });
    const laneKeys = lanes.length ? lanes : [null];

    // ---------- Grafo de flujos ----------
    // Los eventos de borde se tratan como parte de su tarea (misma columna)
    const nodeOf = el => (is(el, 'bpmn:BoundaryEvent') ? el.host : el);
    const succ = new Map(nodes.map(n => [n, []]));
    const pred = new Map(nodes.map(n => [n, []]));
    const seqFlows = registry.filter(el => el.type === 'bpmn:SequenceFlow' && insidePool(el));
    seqFlows.forEach(f => {
        const s = nodeOf(f.source), t = nodeOf(f.target);
        if (!succ.has(s) || !succ.has(t) || s === t) return;
        succ.get(s).push({ node: t, flow: f });
        pred.get(t).push({ node: s, flow: f });
    });
    // Ramas ordenadas por su posición vertical actual (la de arriba conserva la fila)
    succ.forEach(list => list.sort((a, b) => (a.node.y - b.node.y) || (a.node.x - b.node.x)));

    // ---------- Retornos (aristas hacia atrás) con DFS desde los inicios ----------
    const back = new Set();
    const state = new Map();
    const roots = nodes
        .filter(n => is(n, 'bpmn:StartEvent'))
        .concat(nodes.filter(n => !pred.get(n).length))
        .concat([...nodes].sort((a, b) => a.x - b.x));
    function dfs(n) {
        state.set(n, 1);
        succ.get(n).forEach(({ node, flow }) => {
            if (state.get(node) === 1) back.add(flow);
            else if (!state.has(node)) dfs(node);
        });
        state.set(n, 2);
    }
    roots.forEach(r => { if (!state.has(r)) dfs(r); });

    // ---------- Columnas: camino más largo desde el inicio ----------
    const rank = new Map(nodes.map(n => [n, 0]));
    const indeg = new Map(nodes.map(n => [n, pred.get(n).filter(p => !back.has(p.flow)).length]));
    const queue = nodes.filter(n => indeg.get(n) === 0).sort((a, b) => a.x - b.x);
    const topo = [];
    while (queue.length) {
        const n = queue.shift();
        topo.push(n);
        succ.get(n).forEach(({ node, flow }) => {
            if (back.has(flow)) return;
            rank.set(node, Math.max(rank.get(node), rank.get(n) + 1));
            indeg.set(node, indeg.get(node) - 1);
            if (indeg.get(node) === 0) queue.push(node);
        });
    }
    nodes.forEach(n => { if (!topo.includes(n)) topo.push(n); });

    // ---------- Filas dentro de cada carril ----------
    const row = new Map();
    const used = new Set();
    const slot = (lane, r, k) => `${lane ? lane.id : '-'}|${r}|${k}`;
    const preferred = new Map();
    topo.forEach(n => {
        const lane = laneOf.get(n);
        let k = preferred.has(n) ? preferred.get(n) : 0;
        while (used.has(slot(lane, rank.get(n), k))) k++;
        used.add(slot(lane, rank.get(n), k));
        row.set(n, k);
        // Las ramas que salen de este paso heredan su fila (y las siguientes, filas de abajo)
        let next = k;
        succ.get(n).forEach(({ node, flow }) => {
            if (back.has(flow) || preferred.has(node)) return;
            if (laneOf.get(node) === lane) preferred.set(node, next++);
        });
    });

    // ---------- Documentos: arriba de la tarea que los usa ----------
    const dataHost = new Map();
    dataShapes.forEach(d => {
        const conn = d.incoming.concat(d.outgoing).find(c => nodes.includes(c.source === d ? c.target : c.source));
        if (conn) dataHost.set(d, conn.source === d ? conn.target : conn.source);
    });

    // ---------- Geometría de carriles ----------
    const maxRank = Math.max(...nodes.map(n => rank.get(n)));
    const laneInfo = new Map();
    const poolX = pool ? pool.x : LAYOUT.NO_POOL_ORIGIN.x;
    let y = pool ? pool.y : LAYOUT.NO_POOL_ORIGIN.y;
    laneKeys.forEach(lane => {
        const inLane = nodes.filter(n => laneOf.get(n) === lane);
        const rows = inLane.length ? Math.max(...inLane.map(n => row.get(n))) + 1 : 1;
        const hasData = [...dataHost.values()].some(h => laneOf.get(h) === lane);
        const band = hasData ? LAYOUT.DATA_BAND : 0;
        const subHeight = Math.max(0, ...eventSubs.filter(s => laneOf.get(s) === lane && lanesSpanned(s).length < 2).map(s => s.height + 4 * LAYOUT.LANE_PAD));
        const height = Math.max(120, subHeight, band + rows * LAYOUT.ROW_H + 2 * LAYOUT.LANE_PAD);
        laneInfo.set(lane, { y, height, band });
        y += height;
    });
    const contentX = poolX + (pool ? LAYOUT.POOL_HEADER : 0) + (lanes.length ? LAYOUT.POOL_HEADER : 0) + LAYOUT.START_GAP;
    let poolWidth = contentX - poolX + (maxRank + 1) * LAYOUT.COL_W + LAYOUT.END_GAP;
    const poolHeight = y - (pool ? pool.y : LAYOUT.NO_POOL_ORIGIN.y);

    // ---------- Nuevas posiciones ----------
    const bounds = new Map();   // shape -> {x, y, width, height}
    nodes.forEach(n => {
        const info = laneInfo.get(laneOf.get(n));
        const cx = contentX + rank.get(n) * LAYOUT.COL_W + LAYOUT.COL_W / 2 - 35;
        const cy = info.y + info.band + LAYOUT.LANE_PAD + row.get(n) * LAYOUT.ROW_H + LAYOUT.ROW_H / 2;
        bounds.set(n, { x: Math.round(cx - n.width / 2), y: Math.round(cy - n.height / 2), width: n.width, height: n.height });
    });

    // Subprocesos de evento: después de la última columna. Si están en un solo carril se centran en él;
    // si abarcan varios (ej. Afiliado y un sector), cada paso de adentro sigue en su carril.
    const subCursor = new Map();
    const laneShift = l => (l ? laneInfo.get(l).y - l.y : 0);
    const laneAt = y => lanes.find(l => y >= l.y && y <= l.y + l.height) || null;
    const multiLaneSubs = new Set();
    eventSubs.forEach(s => {
        const spanned = lanesSpanned(s);
        const key = spanned.length > 1 ? 'multi' : laneOf.get(s);
        const x = subCursor.get(key) || contentX + (maxRank + 1) * LAYOUT.COL_W + LAYOUT.EVENT_SUB_GAP - LAYOUT.COL_W / 2 + 35;
        subCursor.set(key, x + s.width + LAYOUT.EVENT_SUB_GAP);
        poolWidth = Math.max(poolWidth, x + s.width + LAYOUT.END_GAP - poolX);
        if (spanned.length < 2) {
            const info = laneInfo.get(laneOf.get(s));
            bounds.set(s, { x: Math.round(x), y: Math.round(info.y + (info.height - s.height) / 2), width: s.width, height: s.height });
            return;
        }
        multiLaneSubs.add(s);
        const top = s.y + laneShift(laneAt(s.y));
        const bottom = s.y + s.height + laneShift(laneAt(s.y + s.height));
        bounds.set(s, { x: Math.round(x), y: Math.round(top), width: s.width, height: Math.round(bottom - top) });
        const dx = x - s.x;
        (function place(el) {
            (el.children || []).forEach(c => {
                if (c.waypoints || c.type === 'label') return;
                const dy = laneShift(laneAt(c.y + c.height / 2));
                bounds.set(c, { x: Math.round(c.x + dx), y: Math.round(c.y + dy), width: c.width, height: c.height });
                place(c);
            });
        })(s);
    });

    function lanesSpanned(s) {
        return lanes.filter(l => l.y < s.y + s.height - 1 && l.y + l.height > s.y + 1);
    }

    // Varios documentos de una misma tarea: repartidos y centrados sobre ella
    const perHost = new Map();
    const totalPerHost = new Map();
    dataHost.forEach(host => totalPerHost.set(host, (totalPerHost.get(host) || 0) + 1));
    dataShapes.forEach(d => {
        const host = dataHost.get(d);
        if (!host) return;
        const i = perHost.get(host) || 0;
        perHost.set(host, i + 1);
        const hb = bounds.get(host);
        const info = laneInfo.get(laneOf.get(host));
        const cx = hb.x + hb.width / 2 + (i - (totalPerHost.get(host) - 1) / 2) * 90;
        bounds.set(d, { x: Math.round(cx - d.width / 2), y: info.y + 12, width: d.width, height: d.height });
    });

    // Eventos de borde, anotaciones y contenido de subprocesos: se mueven con su elemento
    const delta = new Map();
    bounds.forEach((b, el) => delta.set(el, { dx: b.x - el.x, dy: b.y - el.y }));
    boundaries.forEach(b => {
        const d = delta.get(b.host);
        if (d) bounds.set(b, { x: b.x + d.dx, y: b.y + d.dy, width: b.width, height: b.height });
    });
    children.filter(el => is(el, 'bpmn:TextAnnotation')).forEach(a => {
        const conn = a.incoming.concat(a.outgoing).find(c => bounds.has(c.source === a ? c.target : c.source));
        const other = conn && (conn.source === a ? conn.target : conn.source);
        const d = other && delta.get(other);
        if (d) bounds.set(a, { x: a.x + d.dx, y: a.y + d.dy, width: a.width, height: a.height });
    });
    function moveDescendants(el, d) {
        (el.children || []).forEach(c => {
            if (c.waypoints) return;
            if (c.type !== 'label') bounds.set(c, { x: c.x + d.dx, y: c.y + d.dy, width: c.width, height: c.height });
            moveDescendants(c, d);
        });
    }
    nodes.concat(eventSubs.filter(s => !multiLaneSubs.has(s))).forEach(n => { if (n.children && n.children.length) moveDescendants(n, delta.get(n)); });

    // ---------- Escribir la información gráfica ----------
    const setBounds = (di, b) => {
        if (!di || !di.bounds) return;
        Object.assign(di.bounds, { x: b.x, y: b.y, width: b.width, height: b.height });
    };
    const setLabel = (el, x, y) => {
        if (!el.label || !el.di) return;
        const lb = { x: Math.round(x), y: Math.round(y), width: Math.round(el.label.width), height: Math.round(el.label.height) };
        if (el.di.label && el.di.label.bounds) Object.assign(el.di.label.bounds, lb);
        else el.di.label = moddle.create('bpmndi:BPMNLabel', { bounds: moddle.create('dc:Bounds', lb) });
    };

    bounds.forEach((b, el) => {
        setBounds(el.di, b);
        if (!el.label) return;
        if (is(el, 'bpmn:Gateway')) {
            // Nombre de la compuerta del lado (arriba / abajo) por donde no salen ni entran ramas
            const cy = b.y + b.height / 2;
            const others = el.incoming.map(c => c.source).concat(el.outgoing.map(c => c.target))
                .map(o => bounds.get(o)).filter(Boolean).map(o => o.y + o.height / 2);
            const above = others.some(y => y < cy - 1);
            const below = others.some(y => y > cy + 1);
            if (!above) setLabel(el, b.x + b.width / 2 - el.label.width / 2, b.y - el.label.height - 6);
            else if (!below) setLabel(el, b.x + b.width / 2 - el.label.width / 2, b.y + b.height + 5);
            else setLabel(el, b.x + b.width + 4, b.y - el.label.height + 4);
        } else {
            setLabel(el, b.x + b.width / 2 - el.label.width / 2, b.y + b.height + 5);
        }
    });

    if (pool) {
        setBounds(pool.di, { x: poolX, y: pool.y, width: poolWidth, height: poolHeight });
        lanes.forEach(l => {
            const info = laneInfo.get(l);
            setBounds(l.di, { x: poolX + LAYOUT.POOL_HEADER, y: info.y, width: poolWidth - LAYOUT.POOL_HEADER, height: info.height });
        });
        // Carriles padre (si hay subcarriles): abarcan a sus hijos
        registry.filter(el => is(el, 'bpmn:Lane') && insidePool(el) && !lanes.includes(el)).forEach(parent => {
            const kids = lanes.filter(l => { let p = l.parent; while (p) { if (p === parent) return true; p = p.parent; } return false; });
            if (!kids.length) return;
            const top = Math.min(...kids.map(k => laneInfo.get(k).y));
            const bottom = Math.max(...kids.map(k => laneInfo.get(k).y + laneInfo.get(k).height));
            setBounds(parent.di, { x: poolX + LAYOUT.POOL_HEADER, y: top, width: poolWidth - LAYOUT.POOL_HEADER, height: bottom - top });
        });
    }

    // ---------- Conexiones ----------
    const box = el => bounds.get(el) || { x: el.x, y: el.y, width: el.width, height: el.height };
    const mid = b => ({ cx: b.x + b.width / 2, cy: b.y + b.height / 2 });

    registry.filter(el => el.waypoints).forEach(conn => {
        const src = conn.source, tgt = conn.target;
        if (!src || !tgt || (!bounds.has(src) && !bounds.has(tgt))) return;
        const S = box(src), T = box(tgt);
        let pts;
        if (conn.type === 'bpmn:SequenceFlow') pts = routeSequence(src, tgt, S, T, back.has(conn));
        else if (conn.type === 'bpmn:MessageFlow') pts = routeVertical(S, T);
        else {
            // Asociaciones: si ambos extremos se movieron igual, trasladar; si no, línea recta
            const ds = delta.get(src) || dRel(src), dt = delta.get(tgt) || dRel(tgt);
            if (ds && dt && ds.dx === dt.dx && ds.dy === dt.dy) {
                pts = conn.waypoints.map(p => ({ x: p.x + ds.dx, y: p.y + ds.dy }));
            } else {
                pts = straight(S, T);
            }
        }
        conn.di.waypoint = pts.map(p => moddle.create('dc:Point', { x: Math.round(p.x), y: Math.round(p.y) }));

        if (conn.label && conn.businessObject.name) {
            // Sobre el primer tramo horizontal: cada rama de una compuerta queda con su etiqueta
            const i = pts.findIndex((p, k) => k < pts.length - 1 && Math.abs(p.y - pts[k + 1].y) < 1);
            if (i >= 0) {
                const p = pts[i], q = pts[i + 1];
                const x = q.x >= p.x ? p.x + 8 : p.x - conn.label.width - 8;
                setLabel(conn, x, p.y - conn.label.height - 3);
            } else {
                setLabel(conn, pts[0].x + 6, (pts[0].y + pts[1].y) / 2 - conn.label.height / 2);
            }
        }
    });

    function dRel(el) {
        const b = bounds.get(el);
        return b ? { dx: b.x - el.x, dy: b.y - el.y } : { dx: 0, dy: 0 };
    }

    function straight(S, T) {
        const a = mid(S), b = mid(T);
        return [clip(S, b.cx, b.cy), clip(T, a.cx, a.cy)];
    }

    // Punto del borde de B en dirección a (x, y)
    function clip(B, x, y) {
        const { cx, cy } = mid(B);
        const dx = x - cx, dy = y - cy;
        if (!dx && !dy) return { x: cx, y: cy };
        const sx = dx ? (B.width / 2) / Math.abs(dx) : Infinity;
        const sy = dy ? (B.height / 2) / Math.abs(dy) : Infinity;
        const s = Math.min(sx, sy);
        return { x: cx + dx * s, y: cy + dy * s };
    }

    function routeVertical(S, T) {
        const a = mid(S), b = mid(T);
        const down = b.cy > a.cy;
        const y1 = down ? S.y + S.height : S.y;
        const y2 = down ? T.y : T.y + T.height;
        if (Math.abs(a.cx - b.cx) < 1) return [{ x: a.cx, y: y1 }, { x: b.cx, y: y2 }];
        const my = (y1 + y2) / 2;
        return [{ x: a.cx, y: y1 }, { x: a.cx, y: my }, { x: b.cx, y: my }, { x: b.cx, y: y2 }];
    }

    function routeSequence(src, tgt, S, T, isBack) {
        const a = mid(S), b = mid(T);
        const same = Math.abs(a.cy - b.cy) < 1;

        // Desde un evento de borde: sale por abajo y entra por el costado
        if (is(src, 'bpmn:BoundaryEvent')) {
            const side = b.cx >= a.cx ? T.x : T.x + T.width;
            if (b.cy > a.cy) return [{ x: a.cx, y: S.y + S.height }, { x: a.cx, y: b.cy }, { x: side, y: b.cy }];
            return [{ x: a.cx, y: S.y }, { x: a.cx, y: b.cy }, { x: side, y: b.cy }];
        }

        // Uno debajo del otro (ej. dentro de un subproceso que abarca dos carriles): línea vertical
        if (!isBack && Math.abs(a.cx - b.cx) < 1) return routeVertical(S, T);

        // Retorno: va por el pasillo libre arriba (o abajo) de las filas y entra por arriba (o abajo) del destino,
        // así no cruza las tareas que quedan en el medio
        if (isBack || b.cx <= a.cx) {
            if (b.cy <= a.cy) {
                const top = Math.min(S.y, T.y) - 22;
                return [{ x: a.cx, y: S.y }, { x: a.cx, y: top }, { x: b.cx, y: top }, { x: b.cx, y: T.y }];
            }
            const bottom = Math.max(S.y + S.height, T.y + T.height) + 22;
            return [{ x: a.cx, y: S.y + S.height }, { x: a.cx, y: bottom }, { x: b.cx, y: bottom }, { x: b.cx, y: T.y + T.height }];
        }

        if (same) return [{ x: S.x + S.width, y: a.cy }, { x: T.x, y: b.cy }];

        // Rama de una compuerta: sale por arriba/abajo y entra por la izquierda
        if (is(src, 'bpmn:Gateway')) {
            const down = b.cy > a.cy;
            return [{ x: a.cx, y: down ? S.y + S.height : S.y }, { x: a.cx, y: b.cy }, { x: T.x, y: b.cy }];
        }
        // Llegada a una compuerta desde otra fila: entra por arriba/abajo
        if (is(tgt, 'bpmn:Gateway')) {
            const down = b.cy > a.cy;
            return [{ x: S.x + S.width, y: a.cy }, { x: b.cx, y: a.cy }, { x: b.cx, y: down ? T.y : T.y + T.height }];
        }
        const mx = T.x - 25;
        return [{ x: S.x + S.width, y: a.cy }, { x: mx, y: a.cy }, { x: mx, y: b.cy }, { x: T.x, y: b.cy }];
    }

    return true;
}
