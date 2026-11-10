/**
 * Modelos BPMN 2.0 de ISSyS — código compartido por index.html (visor) y modelador.html (editor).
 *
 * Cada diagrama se guarda en el navegador como XML BPMN 2.0 estándar bajo la clave
 * "issys-bpmn:<proceso>:<asis|trans|tobe>". Si no hay versión guardada se usa el modelo
 * original del relevamiento (ORIGINALS) o un diagrama vacío; la transición arranca como copia del AS-IS.
 */

// Escenarios de cada proceso: estado actual, etapa intermedia (mejoras posibles ya) y propuesta
const MODEL_KEYS = ['asis', 'trans', 'tobe'];
const MODEL_LABEL = { asis: 'AS-IS', trans: 'Transición', tobe: 'TO-BE' };
const MODEL_TITLE = { asis: 'AS-IS (Estado actual)', trans: 'Transición (Etapa intermedia)', tobe: 'TO-BE (Propuesta)' };

function parseModelKey(value) {
    return MODEL_KEYS.includes(value) ? value : 'asis';
}

const ISSYS_NS = 'http://issys.chubut.gov.ar/bpmn/1.0';

// Colores por tipo de elemento, con la paleta del manual de marca ISSyS (tintes de fondo y trazo accesible)
const COLORS = {
    task:         { fill: '#E3E6F1', stroke: '#4657A0' },
    gateway:      { fill: '#FDF3D3', stroke: '#8A6508' },
    start:        { fill: '#E6F3EB', stroke: '#2F7D50' },
    end:          { fill: '#F9DEDC', stroke: '#B3261E' },
    intermediate: { fill: '#FEFBEF', stroke: '#8A6508' },
    data:         { fill: '#F5F6F8', stroke: '#5F5F5F' }
};

// Colores de versiones anteriores de la app → paleta de marca (para diagramas ya guardados)
const COLORES_ANTERIORES = {
    '#e8f1fb': '#E3E6F1', '#2b4f7e': '#4657A0', '#fff6bf': '#FDF3D3', '#a58b00': '#8A6508',
    '#dcf5c8': '#E6F3EB', '#3c8a1e': '#2F7D50', '#fbd5d5': '#F9DEDC', '#9b1c1c': '#B3261E',
    '#fff1d6': '#FEFBEF', '#a86b00': '#8A6508', '#f4f4f5': '#F5F6F8', '#52525b': '#5F5F5F',
    '#ccfbf1': '#E3E6F1', '#0f766e': '#36457F', '#ede9fe': '#E3E6F1', '#6d28d9': '#36457F'
};

function colorearConMarca(xml) {
    return String(xml).replace(/(fill|stroke|color)="(#[0-9a-fA-F]{6})"/g, (m, attr, hex) => {
        const nuevo = COLORES_ANTERIORES[hex.toLowerCase()];
        return nuevo ? `${attr}="${nuevo}"` : m;
    });
}

// Atributos de relevamiento ISSyS (se guardan como issys:<clave> en el XML)
const ISSYS_FLAGS = [
    { key: 'presencial', label: 'Contacto presencial obligatorio', hint: 'El afiliado debe trasladarse a Delegación o Casa Central.', chip: 'PRESENCIAL', tone: 'rose' },
    { key: 'hipotesis', label: '¿Hipótesis a validar?', hint: 'Paso no verificado de forma fehaciente con los agentes.', chip: 'HIPÓTESIS', tone: 'amber' },
    { key: 'doblecarga', label: 'Carga manual / doble carga', hint: 'Se transcriben datos que ya obran en el comprobante.', chip: 'DOBLE CARGA', tone: 'indigo' }
];

const TYPE_ES = {
    'bpmn:Task': 'Tarea', 'bpmn:UserTask': 'Tarea de usuario', 'bpmn:ManualTask': 'Tarea manual',
    'bpmn:ServiceTask': 'Tarea de servicio', 'bpmn:SendTask': 'Tarea de envío', 'bpmn:ReceiveTask': 'Tarea de recepción',
    'bpmn:ScriptTask': 'Tarea de script', 'bpmn:BusinessRuleTask': 'Tarea de regla de negocio',
    'bpmn:CallActivity': 'Actividad de llamada', 'bpmn:SubProcess': 'Subproceso', 'bpmn:Transaction': 'Transacción',
    'bpmn:StartEvent': 'Evento de inicio', 'bpmn:EndEvent': 'Evento de fin',
    'bpmn:IntermediateCatchEvent': 'Evento intermedio de captura', 'bpmn:IntermediateThrowEvent': 'Evento intermedio de lanzamiento',
    'bpmn:BoundaryEvent': 'Evento de borde',
    'bpmn:ExclusiveGateway': 'Compuerta exclusiva', 'bpmn:ParallelGateway': 'Compuerta paralela',
    'bpmn:InclusiveGateway': 'Compuerta inclusiva', 'bpmn:EventBasedGateway': 'Compuerta basada en eventos',
    'bpmn:ComplexGateway': 'Compuerta compleja',
    'bpmn:SequenceFlow': 'Flujo de secuencia', 'bpmn:MessageFlow': 'Flujo de mensaje', 'bpmn:Association': 'Asociación',
    'bpmn:DataInputAssociation': 'Asociación de datos', 'bpmn:DataOutputAssociation': 'Asociación de datos',
    'bpmn:DataObjectReference': 'Objeto de datos (documento)', 'bpmn:DataStoreReference': 'Almacén de datos',
    'bpmn:Participant': 'Pool / Participante', 'bpmn:Lane': 'Carril (rol)',
    'bpmn:TextAnnotation': 'Anotación', 'bpmn:Group': 'Grupo'
};

const EVENT_DEF_ES = {
    'bpmn:MessageEventDefinition': 'de mensaje', 'bpmn:TimerEventDefinition': 'de temporizador',
    'bpmn:ConditionalEventDefinition': 'condicional', 'bpmn:SignalEventDefinition': 'de señal',
    'bpmn:ErrorEventDefinition': 'de error', 'bpmn:EscalationEventDefinition': 'de escalamiento',
    'bpmn:TerminateEventDefinition': 'de terminación', 'bpmn:LinkEventDefinition': 'de enlace',
    'bpmn:CompensateEventDefinition': 'de compensación', 'bpmn:CancelEventDefinition': 'de cancelación'
};

// ------------------------------------------------------------
// Generación de XML BPMN 2.0 a partir de una definición compacta
// ------------------------------------------------------------
const SIZES = { task: [110, 70], gateway: [50, 50], event: [36, 36], data: [36, 50] };

function escapeXml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function kindOf(tag) {
    if (tag.endsWith('Gateway')) return 'gateway';
    if (tag.endsWith('Event')) return 'event';
    return 'task';
}

function colorForTag(tag) {
    if (tag.endsWith('Gateway')) return COLORS.gateway;
    if (tag === 'startEvent') return COLORS.start;
    if (tag === 'endEvent') return COLORS.end;
    if (tag.endsWith('Event')) return COLORS.intermediate;
    return COLORS.task;
}

function colorAttrs(c) {
    return c ? ` bioc:stroke="${c.stroke}" bioc:fill="${c.fill}" color:background-color="${c.fill}" color:border-color="${c.stroke}"` : '';
}

function boundsXml(x, y, w, h) {
    return `<dc:Bounds x="${x}" y="${y}" width="${w}" height="${h}" />`;
}

function labelXml(lb) {
    return lb ? `<bpmndi:BPMNLabel>${boundsXml(...lb)}</bpmndi:BPMNLabel>` : '';
}

function waypointsXml(wp) {
    return wp.map(([x, y]) => `<di:waypoint x="${x}" y="${y}" />`).join('');
}

/**
 * def = { pool: {name, x, y, w, h}, lanes: [{id, name, y, h}], nodes: [{id, type, name, lane, x, y, flags, lb, nonInterrupting}],
 *         flows: [{id, from, to, name, expected, wp, lb}], data: [{id, name, x, y, target, wp}],
 *         eventSubprocesses: [{id, name, lane, x, y, w, h, nodes, flows}], notes: [{id, text, x, y, w, h, target, wp}] }
 * type admite "tag:definicion", ej. "intermediateCatchEvent:message".
 */
function buildBpmnXml(def) {
    const subs = def.eventSubprocesses || [];
    const incoming = {};
    const outgoing = {};
    def.flows.concat(...subs.map(sp => sp.flows)).forEach(f => {
        (outgoing[f.from] = outgoing[f.from] || []).push(f.id);
        (incoming[f.to] = incoming[f.to] || []).push(f.id);
    });
    const data = def.data || [];
    const notes = def.notes || [];

    const nodeXml = (n) => {
        const [tag, evDef] = n.type.split(':');
        const flagAttrs = (n.flags || []).map(f => ` issys:${f}="true"`).join('');
        const interrupting = n.nonInterrupting ? ' isInterrupting="false"' : '';
        let inner = '';
        (incoming[n.id] || []).forEach(id => { inner += `<bpmn:incoming>${id}</bpmn:incoming>`; });
        (outgoing[n.id] || []).forEach(id => { inner += `<bpmn:outgoing>${id}</bpmn:outgoing>`; });
        const inputs = data.filter(d => d.target === n.id);
        if (inputs.length) {
            inner += `<bpmn:property id="Property_${n.id}" name="__targetRef_placeholder" />`;
            inputs.forEach(d => {
                inner += `<bpmn:dataInputAssociation id="Assoc_${d.id}"><bpmn:sourceRef>${d.id}</bpmn:sourceRef><bpmn:targetRef>Property_${n.id}</bpmn:targetRef></bpmn:dataInputAssociation>`;
            });
        }
        if (evDef) inner += `<bpmn:${evDef}EventDefinition id="${n.id}_def" />`;
        return `<bpmn:${tag} id="${n.id}" name="${escapeXml(n.name)}"${interrupting}${flagAttrs}>${inner}</bpmn:${tag}>`;
    };
    const flowXml = (f) => `<bpmn:sequenceFlow id="${f.id}"${f.name ? ` name="${escapeXml(f.name)}"` : ''}${f.expected ? ' issys:esperado="true"' : ''} sourceRef="${f.from}" targetRef="${f.to}" />`;
    const nodeShapeXml = (n) => {
        const tag = n.type.split(':')[0];
        const [w, h] = SIZES[kindOf(tag)];
        const marker = tag === 'exclusiveGateway' ? ' isMarkerVisible="true"' : '';
        return `<bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}"${marker}${colorAttrs(colorForTag(tag))}>${boundsXml(n.x, n.y, w, h)}${labelXml(n.lb)}</bpmndi:BPMNShape>`;
    };
    const flowEdgeXml = (f) => `<bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">${waypointsXml(f.wp)}${labelXml(f.lb)}</bpmndi:BPMNEdge>`;

    let proc = '<bpmn:laneSet id="LaneSet_1">';
    def.lanes.forEach(l => {
        proc += `<bpmn:lane id="${l.id}" name="${escapeXml(l.name)}">`;
        def.nodes.concat(subs, ...subs.map(sp => sp.nodes)).filter(n => n.lane === l.id).forEach(n => { proc += `<bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`; });
        proc += '</bpmn:lane>';
    });
    proc += '</bpmn:laneSet>';

    def.nodes.forEach(n => { proc += nodeXml(n); });

    // Subprocesos de evento: se disparan en cualquier momento, fuera del flujo principal
    subs.forEach(sp => {
        proc += `<bpmn:subProcess id="${sp.id}" name="${escapeXml(sp.name)}" triggeredByEvent="true">`;
        sp.nodes.forEach(n => { proc += nodeXml(n); });
        sp.flows.forEach(f => { proc += flowXml(f); });
        proc += '</bpmn:subProcess>';
    });

    data.forEach(d => {
        proc += `<bpmn:dataObjectReference id="${d.id}" name="${escapeXml(d.name)}" dataObjectRef="DataObject_${d.id}" />`;
        proc += `<bpmn:dataObject id="DataObject_${d.id}" />`;
    });

    def.flows.forEach(f => { proc += flowXml(f); });

    notes.forEach(n => {
        proc += `<bpmn:textAnnotation id="${n.id}"><bpmn:text>${escapeXml(n.text)}</bpmn:text></bpmn:textAnnotation>`;
        proc += `<bpmn:association id="Assoc_${n.id}" associationDirection="None" sourceRef="${n.target}" targetRef="${n.id}" />`;
    });

    const p = def.pool;
    let di = `<bpmndi:BPMNShape id="Pool_1_di" bpmnElement="Pool_1" isHorizontal="true">${boundsXml(p.x, p.y, p.w, p.h)}</bpmndi:BPMNShape>`;
    def.lanes.forEach(l => {
        di += `<bpmndi:BPMNShape id="${l.id}_di" bpmnElement="${l.id}" isHorizontal="true">${boundsXml(p.x + 30, l.y, p.w - 30, l.h)}</bpmndi:BPMNShape>`;
    });
    def.nodes.forEach(n => { di += nodeShapeXml(n); });
    subs.forEach(sp => {
        di += `<bpmndi:BPMNShape id="${sp.id}_di" bpmnElement="${sp.id}" isExpanded="true">${boundsXml(sp.x, sp.y, sp.w, sp.h)}</bpmndi:BPMNShape>`;
        sp.nodes.forEach(n => { di += nodeShapeXml(n); });
        sp.flows.forEach(f => { di += flowEdgeXml(f); });
    });
    data.forEach(d => {
        const [w, h] = SIZES.data;
        di += `<bpmndi:BPMNShape id="${d.id}_di" bpmnElement="${d.id}"${colorAttrs(COLORS.data)}>${boundsXml(d.x, d.y, w, h)}</bpmndi:BPMNShape>`;
        di += `<bpmndi:BPMNEdge id="Assoc_${d.id}_di" bpmnElement="Assoc_${d.id}">${waypointsXml(d.wp)}</bpmndi:BPMNEdge>`;
    });
    def.flows.forEach(f => { di += flowEdgeXml(f); });
    notes.forEach(n => {
        di += `<bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}">${boundsXml(n.x, n.y, n.w, n.h)}</bpmndi:BPMNShape>`;
        di += `<bpmndi:BPMNEdge id="Assoc_${n.id}_di" bpmnElement="Assoc_${n.id}">${waypointsXml(n.wp)}</bpmndi:BPMNEdge>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:bioc="http://bpmn.io/schema/bpmn/biocolor/1.0" xmlns:color="http://www.omg.org/spec/BPMN/non-normative/color/1.0" xmlns:issys="${ISSYS_NS}" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
<bpmn:collaboration id="Collaboration_1"><bpmn:participant id="Pool_1" name="${escapeXml(p.name)}" processRef="Process_1" /></bpmn:collaboration>
<bpmn:process id="Process_1" isExecutable="false">${proc}</bpmn:process>
<bpmndi:BPMNDiagram id="Diagram_1"><bpmndi:BPMNPlane id="Plane_1" bpmnElement="Collaboration_1">${di}</bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

// Diagrama vacío: un pool con dos carriles y un evento de inicio
function emptyDefinition() {
    return {
        pool: { name: 'ISSyS', x: 40, y: 40, w: 1100, h: 340 },
        lanes: [
            { id: 'Lane_Afiliado', name: 'Afiliado', y: 40, h: 170 },
            { id: 'Lane_Delegacion', name: 'Delegación', y: 210, h: 170 }
        ],
        nodes: [
            { id: 'Start_1', type: 'startEvent', name: 'Inicio', lane: 'Lane_Afiliado', x: 130, y: 107 }
        ],
        flows: []
    };
}

// Reintegros AS-IS — relevado en Bizagi (reintegros.pdf)
const REINTEGROS_ASIS = {
    pool: { name: 'ISSyS', x: 40, y: 20, w: 1750, h: 960 },
    lanes: [
        { id: 'Lane_Afiliado', name: 'Afiliado', y: 20, h: 250 },
        { id: 'Lane_Reintegros', name: 'Sector Reintegros', y: 270, h: 200 },
        { id: 'Lane_Auditoria', name: 'Auditoría Médica', y: 470, h: 130 },
        { id: 'Lane_Secretaria', name: 'Secretaría Auditoría Médica', y: 600, h: 140 },
        { id: 'Lane_Delegado', name: 'Delegado', y: 740, h: 120 },
        { id: 'Lane_Finanzas', name: 'Finanzas', y: 860, h: 120 }
    ],
    nodes: [
        { id: 'Start_Gasto', type: 'startEvent', name: 'Gasto médico/farmacéutico realizado por afiliado', lane: 'Lane_Afiliado', x: 120, y: 142 },
        { id: 'Task_Reunir', type: 'manualTask', name: 'Reunir Documentación Reintegro', lane: 'Lane_Afiliado', x: 200, y: 125 },
        { id: 'Task_Concurrir', type: 'manualTask', name: 'Concurrir a ISSyS y solicitar reintegro', lane: 'Lane_Afiliado', x: 330, y: 185, flags: ['presencial'] },
        { id: 'Task_Gestionar', type: 'manualTask', name: 'Gestionar Estudio Complementario y Presentarlo en SAM', lane: 'Lane_Afiliado', x: 900, y: 125, flags: ['presencial'] },

        { id: 'Task_Verificar', type: 'userTask', name: 'Verificar Documentación', lane: 'Lane_Reintegros', x: 330, y: 335 },
        { id: 'Gw_DocCompleta', type: 'exclusiveGateway', name: '¿Documentación Completa?', lane: 'Lane_Reintegros', x: 470, y: 345, lb: [403, 410, 88, 27] },
        { id: 'Task_SolicitarCompletar', type: 'userTask', name: 'Solicitar al Afiliado Completar Documentación', lane: 'Lane_Reintegros', x: 580, y: 290 },
        { id: 'Task_GenerarTramite', type: 'userTask', name: 'Generar trámite', lane: 'Lane_Reintegros', x: 580, y: 390 },
        { id: 'Task_CargarGOA', type: 'userTask', name: 'Cargar Gestión de Órdenes de Atención (GOA)', lane: 'Lane_Reintegros', x: 730, y: 390 },
        { id: 'Task_Liquidacion', type: 'task', name: 'Liquidación de Prestaciones Autorizadas', lane: 'Lane_Reintegros', x: 1130, y: 300 },
        { id: 'Task_Corregir', type: 'task', name: 'Corregir Reintegro', lane: 'Lane_Reintegros', x: 1270, y: 380 },

        { id: 'Task_Evaluacion', type: 'task', name: 'Evaluación Médica del Reintegro', lane: 'Lane_Auditoria', x: 580, y: 500 },
        { id: 'Gw_ReqDoc', type: 'exclusiveGateway', name: '¿Requiere Documentación Adicional?', lane: 'Lane_Auditoria', x: 760, y: 510, lb: [693, 563, 88, 40] },

        { id: 'Event_RecibeDoc', type: 'intermediateCatchEvent:message', name: '', lane: 'Lane_Secretaria', x: 550, y: 652 },
        { id: 'Task_Incorpora', type: 'task', name: 'Incorpora Documentación al Trámite', lane: 'Lane_Secretaria', x: 410, y: 635 },
        { id: 'Task_SolicitarAdicional', type: 'userTask', name: 'Solicitar Documentación Adicional al Afiliado', lane: 'Lane_Secretaria', x: 730, y: 640 },
        { id: 'Task_AnalizarAML', type: 'task', name: 'Analizar Evaluación AML', lane: 'Lane_Secretaria', x: 900, y: 640 },
        { id: 'Gw_Aprobado', type: 'exclusiveGateway', name: '¿Reintegro Aprobado?', lane: 'Lane_Secretaria', x: 1060, y: 650 },
        { id: 'Task_NotificarRechazo', type: 'userTask', name: 'Notificar al Afiliado Rechazo', lane: 'Lane_Secretaria', x: 1380, y: 640 },
        { id: 'End_Rechazado', type: 'endEvent', name: 'Rechazado y Notificado', lane: 'Lane_Secretaria', x: 1620, y: 657 },

        { id: 'Task_Controlar', type: 'task', name: 'Controlar Reintegro', lane: 'Lane_Delegado', x: 1130, y: 765 },
        { id: 'Gw_Autorizado', type: 'exclusiveGateway', name: '¿Autorizado?', lane: 'Lane_Delegado', x: 1300, y: 775, lb: [1356, 808, 64, 14] },

        { id: 'Task_Pago', type: 'task', name: 'Pago de Reintegro', lane: 'Lane_Finanzas', x: 1270, y: 885 },
        { id: 'Task_NotificarPago', type: 'sendTask', name: 'Notificar al Afiliado Pago Reintegro', lane: 'Lane_Finanzas', x: 1430, y: 885 },
        { id: 'End_Pagado', type: 'endEvent', name: 'Pagado y Notificado', lane: 'Lane_Finanzas', x: 1620, y: 902 }
    ],
    data: [
        { id: 'Doc_Factura', name: 'Factura Original Conformada', x: 150, y: 28, target: 'Task_Reunir', wp: [[186, 53], [230, 53], [230, 125]] },
        { id: 'Doc_Historia', name: 'Historia Clínica', x: 250, y: 28, target: 'Task_Reunir', wp: [[268, 78], [268, 125]] },
        { id: 'Doc_Prescripcion', name: 'Prescripción Médica Original', x: 360, y: 45, target: 'Task_Reunir', wp: [[360, 70], [295, 70], [295, 125]] }
    ],
    flows: [
        { id: 'Flow_01', from: 'Start_Gasto', to: 'Task_Reunir', wp: [[156, 160], [200, 160]] },
        { id: 'Flow_02', from: 'Task_Reunir', to: 'Task_Concurrir', wp: [[255, 195], [255, 220], [330, 220]] },
        { id: 'Flow_03', from: 'Task_Concurrir', to: 'Task_Verificar', wp: [[385, 255], [385, 335]] },
        { id: 'Flow_04', from: 'Task_Verificar', to: 'Gw_DocCompleta', wp: [[440, 370], [470, 370]] },
        { id: 'Flow_05', from: 'Gw_DocCompleta', to: 'Task_SolicitarCompletar', name: 'NO', wp: [[495, 345], [495, 325], [580, 325]], lb: [540, 308, 20, 14] },
        { id: 'Flow_06', from: 'Gw_DocCompleta', to: 'Task_GenerarTramite', name: 'SI', expected: true, wp: [[495, 395], [495, 425], [580, 425]], lb: [540, 429, 15, 14] },
        { id: 'Flow_07', from: 'Task_SolicitarCompletar', to: 'Task_Reunir', wp: [[635, 290], [635, 160], [310, 160]] },
        { id: 'Flow_08', from: 'Task_GenerarTramite', to: 'Task_CargarGOA', wp: [[690, 425], [730, 425]] },
        { id: 'Flow_09', from: 'Task_CargarGOA', to: 'Task_Evaluacion', wp: [[785, 460], [785, 480], [635, 480], [635, 500]] },
        { id: 'Flow_10', from: 'Task_Evaluacion', to: 'Gw_ReqDoc', wp: [[690, 535], [760, 535]] },
        { id: 'Flow_11', from: 'Gw_ReqDoc', to: 'Task_SolicitarAdicional', name: 'Sí', wp: [[785, 560], [785, 640]], lb: [791, 597, 15, 14] },
        { id: 'Flow_12', from: 'Gw_ReqDoc', to: 'Task_AnalizarAML', name: 'No', expected: true, wp: [[810, 535], [955, 535], [955, 640]], lb: [880, 517, 18, 14] },
        { id: 'Flow_13', from: 'Task_SolicitarAdicional', to: 'Task_Gestionar', wp: [[840, 675], [870, 675], [870, 160], [900, 160]] },
        { id: 'Flow_14', from: 'Task_Gestionar', to: 'Event_RecibeDoc', wp: [[1010, 160], [1040, 160], [1040, 725], [568, 725], [568, 688]] },
        { id: 'Flow_15', from: 'Event_RecibeDoc', to: 'Task_Incorpora', wp: [[550, 670], [520, 670]] },
        { id: 'Flow_16', from: 'Task_Incorpora', to: 'Task_Evaluacion', wp: [[465, 635], [465, 535], [580, 535]] },
        { id: 'Flow_17', from: 'Task_AnalizarAML', to: 'Gw_Aprobado', wp: [[1010, 675], [1060, 675]] },
        { id: 'Flow_18', from: 'Gw_Aprobado', to: 'Task_Liquidacion', name: 'Sí', expected: true, wp: [[1085, 650], [1085, 335], [1130, 335]], lb: [1091, 480, 15, 14] },
        { id: 'Flow_19', from: 'Gw_Aprobado', to: 'Task_NotificarRechazo', name: 'No', wp: [[1110, 675], [1380, 675]], lb: [1250, 657, 18, 14] },
        { id: 'Flow_20', from: 'Task_NotificarRechazo', to: 'End_Rechazado', wp: [[1490, 675], [1620, 675]] },
        { id: 'Flow_22', from: 'Task_Liquidacion', to: 'Task_Controlar', wp: [[1185, 370], [1185, 765]] },
        { id: 'Flow_23', from: 'Task_Controlar', to: 'Gw_Autorizado', wp: [[1240, 800], [1300, 800]] },
        { id: 'Flow_24', from: 'Gw_Autorizado', to: 'Task_Pago', name: 'AUTORIZADO', expected: true, wp: [[1325, 825], [1325, 885]], lb: [1333, 849, 70, 14] },
        { id: 'Flow_25', from: 'Gw_Autorizado', to: 'Task_Corregir', name: 'ERROR / CORRECCIÓN', wp: [[1325, 775], [1325, 450]], lb: [1333, 714, 110, 14] },
        { id: 'Flow_26', from: 'Task_Corregir', to: 'Task_Controlar', wp: [[1270, 415], [1230, 415], [1230, 765]] },
        { id: 'Flow_27', from: 'Task_Pago', to: 'Task_NotificarPago', wp: [[1380, 920], [1430, 920]] },
        { id: 'Flow_28', from: 'Task_NotificarPago', to: 'End_Pagado', wp: [[1540, 920], [1620, 920]] }
    ],
    // Con el N° de trámite generado, el afiliado puede ir a consultar el estado (cero, una o varias veces).
    // Abarca los dos carriles: el traslado lo hace el afiliado y la atención, el sector.
    eventSubprocesses: [
        {
            id: 'Sub_ConsultaEstado', name: 'Consulta de estado del trámite', lane: 'Lane_Reintegros', x: 1440, y: 110, w: 330, h: 345,
            nodes: [
                { id: 'Start_Consulta', type: 'startEvent:conditional', nonInterrupting: true, name: 'Afiliado quiere conocer el estado', lane: 'Lane_Afiliado', x: 1462, y: 172, lb: [1437, 211, 86, 40] },
                { id: 'Task_ConcurrirConsulta', type: 'manualTask', name: 'Concurrir a ISSyS a consultar el estado', lane: 'Lane_Afiliado', x: 1545, y: 155, flags: ['presencial'] },
                { id: 'Task_InformarEstado', type: 'userTask', name: 'Informar estado del trámite', lane: 'Lane_Reintegros', x: 1545, y: 345 },
                { id: 'End_Consulta', type: 'endEvent', name: 'Estado informado', lane: 'Lane_Reintegros', x: 1712, y: 362, lb: [1702, 401, 56, 27] }
            ],
            flows: [
                { id: 'Flow_C1', from: 'Start_Consulta', to: 'Task_ConcurrirConsulta', wp: [[1498, 190], [1545, 190]] },
                { id: 'Flow_C2', from: 'Task_ConcurrirConsulta', to: 'Task_InformarEstado', wp: [[1600, 225], [1600, 345]] },
                { id: 'Flow_C3', from: 'Task_InformarEstado', to: 'End_Consulta', wp: [[1655, 380], [1712, 380]] }
            ]
        }
    ],
    notes: [
        { id: 'Note_Consulta', text: 'Disponible una vez generado el N° de trámite (Generar trámite). El afiliado puede concurrir a consultar las veces que quiera.', x: 1450, y: 35, w: 310, h: 60, target: 'Sub_ConsultaEstado', wp: [[1605, 110], [1605, 95]] }
    ]
};

// Modelos originales por proceso y escenario
const ORIGINALS = {
    reintegros: { asis: REINTEGROS_ASIS }
};

// ------------------------------------------------------------
// Acceso a los diagramas guardados
// ------------------------------------------------------------
function bpmnStorageKey(processId, modelKey) {
    return `issys-bpmn:${processId}:${modelKey}`;
}

function readStoredBpmn(processId, modelKey) {
    try {
        const raw = localStorage.getItem(bpmnStorageKey(processId, modelKey));
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data && data.xml ? data : null;
    } catch (e) {
        return null;
    }
}

function removeStoredBpmn(processId) {
    try {
        MODEL_KEYS.forEach(k => localStorage.removeItem(bpmnStorageKey(processId, k)));
    } catch (e) { /* sin persistencia */ }
}

function originalBpmnDefinition(processId, modelKey) {
    return ORIGINALS[processId] && ORIGINALS[processId][modelKey];
}

// XML vigente: lo guardado, o el original del relevamiento, o un diagrama vacío
function getBpmnXml(processId, modelKey) {
    const stored = readStoredBpmn(processId, modelKey);
    if (stored) return colorearConMarca(stored.xml);
    // La etapa intermedia se modela a partir del estado actual
    if (modelKey === 'trans') return getBpmnXml(processId, 'asis');
    return buildBpmnXml(originalBpmnDefinition(processId, modelKey) || emptyDefinition());
}

// Métricas del diagrama sin necesidad de renderizarlo (para el listado de procesos)
function analyzeBpmnXml(xml) {
    const stats = { steps: 0, physical: 0, automated: 0, hypotheses: 0, duplicate: 0 };
    let doc;
    try {
        doc = new DOMParser().parseFromString(xml, 'application/xml');
    } catch (e) {
        return stats;
    }
    const AUTOMATED = ['serviceTask', 'scriptTask', 'businessRuleTask'];
    doc.querySelectorAll('*').forEach(node => {
        const name = node.localName;
        if (/task$/i.test(name) || name === 'subProcess' || name === 'callActivity') {
            stats.steps++;
            if (AUTOMATED.includes(name)) stats.automated++;
        }
        if (node.getAttributeNS(ISSYS_NS, 'presencial') === 'true') stats.physical++;
        if (node.getAttributeNS(ISSYS_NS, 'hipotesis') === 'true') stats.hypotheses++;
        if (node.getAttributeNS(ISSYS_NS, 'doblecarga') === 'true') stats.duplicate++;
    });
    return stats;
}

function issysFlag(bo, key) {
    return !!(bo && bo.$attrs && bo.$attrs[`issys:${key}`] === 'true');
}

function bpmnTypeLabel(bo) {
    let label = TYPE_ES[bo.$type] || bo.$type.replace('bpmn:', '');
    const def = bo.eventDefinitions && bo.eventDefinitions[0];
    if (def && EVENT_DEF_ES[def.$type]) label += ' ' + EVENT_DEF_ES[def.$type];
    return label;
}

// Etiquetas ISSyS (presencial / hipótesis / doble carga) sobre los elementos del diagrama
function drawIssysOverlays(bpmn) {
    const overlays = bpmn.get('overlays');
    overlays.remove({ type: 'issys' });
    bpmn.get('elementRegistry').forEach(el => {
        if (el.type === 'label' || !el.businessObject || !el.businessObject.$attrs) return;
        const chips = ISSYS_FLAGS
            .filter(f => issysFlag(el.businessObject, f.key))
            .map(f => `<span class="issys-chip ${f.key}">${f.chip}</span>`);
        if (!chips.length) return;
        overlays.add(el, 'issys', {
            position: { top: -9, left: 4 },
            html: `<div class="issys-chips">${chips.join('')}</div>`
        });
    });
}

// Nombre de pools y carriles en negrita, más grande y en mayúsculas.
// Se aplica al dibujar (no en CSS) para que también salga en la exportación SVG/PNG.
const SWIMLANE_LABEL_STYLE = { fontSize: 14, fontWeight: 'bold', lineHeight: 1.1 };

function SwimlaneLabelRenderer(eventBus, bpmnRenderer, textRenderer) {
    eventBus.on('render.shape', 1500, (e) => {
        const { gfx, element } = e;
        const bo = element.businessObject;
        const isPool = element.type === 'bpmn:Participant';
        if (!isPool && element.type !== 'bpmn:Lane') return;
        const shape = bpmnRenderer.drawShape(gfx, element);
        const old = gfx.querySelector('text.djs-label');
        // Solo el nombre vertical de la franja izquierda (no el pool colapsado)
        if (!old || (isPool && (!bo.processRef || element.di.isExpanded === false))) return shape;

        // Se vuelve a armar el texto para que el corte de líneas y el centrado usen el tamaño nuevo
        const text = textRenderer.createText((bo.name || '').toUpperCase(), {
            box: { width: element.height, height: 30 },
            align: 'center-middle',
            style: { ...SWIMLANE_LABEL_STYLE, fill: old.style.fill }
        });
        text.setAttribute('class', 'djs-label');
        text.setAttribute('transform', old.getAttribute('transform'));
        old.replaceWith(text);
        return shape;
    });
}
SwimlaneLabelRenderer.$inject = ['eventBus', 'bpmnRenderer', 'textRenderer'];

const SwimlaneLabelModule = {
    __init__: ['issysSwimlaneLabels'],
    issysSwimlaneLabels: ['type', SwimlaneLabelRenderer]
};

// ------------------------------------------------------------
// Caminos del proceso: camino feliz (esperado) y alternativos
// ------------------------------------------------------------
// En cada compuerta de decisión se marca la salida esperada con issys:esperado="true".
// Los caminos se obtienen simulando el recorrido de un trámite y probando cada salida.
const MAX_PATHS = 60;
const MAX_VISITS = 3;

function seqOut(bo) {
    return (bo.outgoing || []).filter(f => f.$instanceOf('bpmn:SequenceFlow'));
}

function seqIn(bo) {
    return (bo.incoming || []).filter(f => f.$instanceOf('bpmn:SequenceFlow'));
}

// Compuerta donde el trámite sigue por una sola salida (XOR, inclusiva, basada en eventos, compleja)
function isDecisionGateway(bo) {
    return !!bo && bo.$instanceOf('bpmn:Gateway') && !bo.$instanceOf('bpmn:ParallelGateway') && seqOut(bo).length > 1;
}

function isExpectedFlow(flow) {
    return !!(flow && flow.$attrs && flow.$attrs['issys:esperado'] === 'true');
}

function expectedFlowOf(gateway) {
    return seqOut(gateway).find(isExpectedFlow) || null;
}

// "SI → Generar trámite"
function flowChoiceLabel(flow) {
    const target = flow.targetRef && flow.targetRef.name ? flow.targetRef.name : bpmnTypeLabel(flow.targetRef);
    return flow.name ? `${flow.name} → ${target}` : `→ ${target}`;
}

function laneOf(bo) {
    const lanes = bo.lanes || [];
    return lanes.find(l => !l.childLaneSet || !(l.childLaneSet.lanes || []).length) || lanes[0] || null;
}

// Recorre el proceso desde un inicio con las decisiones dadas ("compuerta#visita" → opción).
// Devuelve { need, options } si llega a una decisión sin resolver.
function simulatePath(start, decisions, boundary) {
    const visits = new Map();
    const arrivals = new Map();
    const pendingJoins = new Set();
    const steps = [];
    const flows = [];
    const choices = [];
    const vias = [];            // flecha por la que se llegó a cada paso
    const viaOf = new Map();
    const queue = [[start, null]];

    while (queue.length || pendingJoins.size) {
        let node;
        if (queue.length) {
            let via;
            [node, via] = queue.shift();
            viaOf.set(node.id, via);
            // Unión paralela: espera a que lleguen todas las ramas
            const incoming = seqIn(node).length;
            if (node.$instanceOf('bpmn:ParallelGateway') && incoming > 1) {
                const n = (arrivals.get(node.id) || 0) + 1;
                arrivals.set(node.id, n);
                if (n < incoming) { pendingJoins.add(node); continue; }
            }
        } else {
            // Ramas que nunca llegan (modelo incompleto): se continúa igual
            node = pendingJoins.values().next().value;
        }
        pendingJoins.delete(node);
        arrivals.set(node.id, 0);

        const visit = (visits.get(node.id) || 0) + 1;
        if (visit > MAX_VISITS) return { invalid: true };
        visits.set(node.id, visit);
        steps.push(node);
        vias.push(viaOf.get(node.id) || null);

        let outs = seqOut(node);
        const choose = (key, options, expected) => {
            if (decisions.has(key)) return decisions.get(key);
            const taken = choices.filter(c => c.node === node).map(c => c.option);
            // Al volver a pasar (retrabajo) se sigue por la salida esperada, o por una que no se haya tomado
            if (visit > 1) options = expected && !taken.includes(expected) ? [expected] : options.filter(o => !taken.includes(o));
            if (options.length === 1) return options[0];
            if (!options.length) return null;
            return { need: key, options };
        };

        if (isDecisionGateway(node)) {
            const expected = expectedFlowOf(node);
            const flow = choose(`${node.id}#${visit}`, outs, expected);
            if (flow === null) return { invalid: true };
            if (flow.need) return flow;
            choices.push({ node, option: flow, visit, expected: expected ? flow === expected : null, label: `${node.name || bpmnTypeLabel(node)} → ${flow.name || (flow.targetRef.name || bpmnTypeLabel(flow.targetRef))}` });
            outs = [flow];
        }

        const attached = boundary.get(node.id);
        if (attached) {
            const option = choose(`${node.id}#borde${visit}`, ['normal', ...attached], 'normal');
            if (option === null) return { invalid: true };
            if (option.need) return option;
            if (option !== 'normal') {
                choices.push({ node, option, visit, expected: false, label: `${node.name || bpmnTypeLabel(node)}: ${option.name || bpmnTypeLabel(option)}` });
                if (option.cancelActivity !== false) outs = [];
                queue.push([option, null]);
            } else {
                choices.push({ node, option, visit, expected: true, label: '' });
            }
        }

        outs.forEach(flow => {
            flows.push(flow);
            queue.push([flow.targetRef, flow]);
        });
    }
    return { steps, vias, flows, choices };
}

function describePath(result) {
    const ids = new Set();
    const tasks = [];
    const docs = new Map();
    let presencial = 0;
    let handoffs = 0;

    result.steps.forEach(bo => {
        ids.add(bo.id);
        if (!bo.$instanceOf('bpmn:Activity')) return;
        const lane = laneOf(bo);
        tasks.push({ id: bo.id, name: bo.name || bpmnTypeLabel(bo), lane: lane ? lane.name : '', presencial: issysFlag(bo, 'presencial') });
        if (issysFlag(bo, 'presencial')) presencial++;
        (bo.dataInputAssociations || []).concat(bo.dataOutputAssociations || []).forEach(a => {
            ids.add(a.id);
            [].concat(a.sourceRef || [], a.targetRef || []).forEach(ref => {
                if (ref.$instanceOf('bpmn:DataObjectReference') || ref.$instanceOf('bpmn:DataStoreReference')) {
                    ids.add(ref.id);
                    docs.set(ref.id, ref.name || 'Documento');
                }
            });
        });
    });
    result.flows.forEach(f => {
        ids.add(f.id);
        const a = laneOf(f.sourceRef);
        const b = laneOf(f.targetRef);
        if (a && b && a !== b) handoffs++;
    });

    const seen = new Set();
    let rework = false;
    tasks.forEach(t => { if (seen.has(t.id)) rework = true; seen.add(t.id); });
    return {
        elementIds: ids,
        // Recorrido en orden, para presentarlo paso a paso
        sequence: result.steps.map((bo, i) => ({ id: bo.id, via: result.vias[i] ? result.vias[i].id : null })),
        deviations: result.choices.filter(c => c.visit === 1 && c.expected === false),
        undecided: result.choices.filter(c => c.visit === 1 && c.expected === null),
        tasks,
        docs: [...docs.values()],
        ends: result.steps.filter(bo => bo.$instanceOf('bpmn:EndEvent')).map(bo => bo.name || 'Fin'),
        rework,
        metrics: { tasks: tasks.length, presencial, handoffs, docs: docs.size }
    };
}

// Analiza todos los caminos del diagrama (definitions de bpmn-js)
function analyzeProcessPaths(definitions) {
    const processes = (definitions.rootElements || []).filter(e => e.$instanceOf('bpmn:Process'));
    const elements = processes.flatMap(p => p.flowElements || []);
    const boundary = new Map();
    elements.filter(e => e.$instanceOf('bpmn:BoundaryEvent') && e.attachedToRef).forEach(be => {
        if (!boundary.has(be.attachedToRef.id)) boundary.set(be.attachedToRef.id, []);
        boundary.get(be.attachedToRef.id).push(be);
    });
    const starts = elements.filter(e => e.$instanceOf('bpmn:StartEvent'));
    const gateways = elements.filter(isDecisionGateway);

    const paths = [];
    let truncated = false;
    starts.forEach(start => {
        const stack = [new Map()];
        while (stack.length) {
            if (paths.length >= MAX_PATHS) { truncated = true; return; }
            const decisions = stack.pop();
            const r = simulatePath(start, decisions, boundary);
            if (r.invalid) continue;
            if (r.need) {
                // La opción esperada va última en la pila, para que el camino feliz salga primero
                const rank = (o) => (isExpectedFlow(o) || o === 'normal' ? 0 : 1);
                r.options.slice().sort((a, b) => rank(b) - rank(a)).forEach(o => stack.push(new Map(decisions).set(r.need, o)));
                continue;
            }
            paths.push(describePath(r));
        }
    });

    const candidates = paths.filter(p => !p.deviations.length);
    const happy = candidates[0] || null;
    const alternatives = paths.filter(p => p !== happy).sort((a, b) =>
        a.deviations.length - b.deviations.length || a.metrics.tasks - b.metrics.tasks);

    paths.forEach((p, i) => {
        p.id = `path-${i}`;
        const parts = (p.deviations.length ? p.deviations : p.undecided).map(c => c.label);
        p.name = p === happy ? 'Camino feliz' : (parts.join(' · ') || 'Camino alternativo');
    });

    return {
        happy,
        alternatives,
        unmarked: gateways.filter(g => !expectedFlowOf(g)),
        ambiguous: candidates.length > 1,
        truncated
    };
}
