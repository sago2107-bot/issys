# Requisitos por especialidad — Resolución N° 461/11-MS (Chubut)

Fuente: Resolución N° 461/11-MS del Ministerio de Salud de la Provincia del Chubut, «Normas para habilitación de consultorios dentro de los Establecimientos de Salud Sin Internación (ESSI)», Rawson, 20/09/2011. Anexo I (Consultorios) y Anexo II (Kinesiología y terapia física). El Anexo III (locales de tatuajes) no aplica.

Nota de lectura: en el PDF las superficies figuran como «6m», «9m», «7,50m» porque se perdió el superíndice. Son metros cuadrados (m²).

---

## 1. Pedido para Claude (VS Code)

Agregar a la web app «Cronograma de consultorios · Mitre 837» (`index.html`, un solo archivo, datos en Firestore) el control de requisitos de habilitación según la Resolución 461/11-MS. Los datos están en las secciones 2 a 6 de este archivo.

1. **Catálogo de requisitos.** Crear una constante `REQUISITOS` con una entrada por tipo de consultorio de la sección 3. Cada entrada lleva: `id`, especialidades de la app que cubre, punto de la norma, superficie mínima, condiciones edilicias, equipamiento y condiciones de funcionamiento. Las especialidades se comparan con la función `norm()` que ya existe.
2. **Ficha de cada consultorio.** En la pestaña Consultorios, agregar a cada consultorio una ficha editable con los campos de la sección 5. Guardarla dentro del mismo objeto del consultorio (arreglo `salas` del documento `cronogramas/mitre837`). No requiere cambios en `firestore.rules`.
3. **Validación.** Para cada consultorio, tomar las especialidades de los profesionales que atienden ahí y calcular la unión de sus requisitos. Comparar contra la ficha y listar lo que falta en el panel de avisos del Cronograma, por ejemplo: «Consultorio 4: falta balanza lactante (Pediatría, Anexo I, III-3)».
   - Un campo de la ficha sin cargar se informa como «sin dato», no como incumplimiento.
   - Los faltantes son avisos. No bloquean el guardado ni la asignación.
4. **Asignación automática.** En `salasElegibles()`, cuando la ficha esté cargada, excluir los consultorios que no cumplen los requisitos edilicios de la especialidad (superficie mínima, acceso directo a baño, planta baja). El equipamiento móvil no excluye, solo avisa.
5. **Pestaña «Requisitos».** Vista de solo lectura con el catálogo por especialidad y la lista de control del establecimiento (sección 2), calculada según la cantidad de consultorios cargados.
6. **Cobertura en días hábiles.** Aviso informativo por especialidad: días de lunes a viernes sin ningún profesional de esa especialidad (Anexo I, I-4).
7. Mantener el estilo, los textos en español formal y el modo local. Cada requisito debe mostrar el punto de la norma del que sale.

---

## 2. Requisitos comunes a todo consultorio y al establecimiento

### 2.1 Local consultorio (Anexo I, II-17 y II-18)

- Superficie de 7,50 m² o mayor, con un mínimo de 2,5 m de lado.
- Con equipamiento especializado: superficie cubierta mínima de 9 m².
- Acceso directo a la sala de espera o a los lugares de tránsito que comunican con ella.
- Separado de la sala de espera por pared o tabique doble completo con aislante acústico, sin espacio libre contra piso o techo.
- Si el equipamiento está en otro espacio contiguo, ese espacio se habilita como un segundo consultorio.

### 2.2 Condiciones edilicias generales (Anexo I, II-1 a II-13)

- Pisos y zócalos lisos, lavables, aislantes, resistentes al desgaste e ignífugos.
- Paredes lisas, lavables, ignífugas. Cielorrasos lisos, lavables, ignífugos y no inflamables.
- Ventilación natural o renovación de aire con salida al exterior. Excepcionalmente, purificador de aire.
- Iluminación no menor a 60 W por ambiente, puesta a tierra, llaves termomagnéticas y disyuntor diferencial.
- Climatización acorde a la temperatura del lugar.
- Luz de emergencia en todos los espacios de permanencia y atención.
- Todos los espacios físicos identificados.
- Puertas y paredes internas no transparentes.
- Ingreso de fácil acceso, con rampa o elevación mecánica si hay escalones, y paso para silla de ruedas.
- Edificio de más de una planta: ascensor o sistema alternativo. Si no lo hay, debe garantizarse un consultorio en planta baja para personas con limitaciones motoras.
- Seguridad: luces de emergencia, llave térmica y disyuntor, extintores ABC de 5 kg, análisis de agua.

### 2.3 Establecimiento, según cantidad de consultorios (Anexo I, II-14 a II-16)

| Sector | Requisito | Con 9 consultorios |
|---|---|---|
| Sala de espera | 6 m² si es individual; 9 m² mínimo si es colectiva; lado mínimo 2,50 m | Colectiva |
| Sala de espera | Más de 4 consultorios: se incrementa 2 m² por cada consultorio, o se disponen otras salas de espera | 19 m² (ver nota) |
| Sala de espera | Acceso contiguo a baño y vía señalizada; ventilación; sillas o sillones | Aplica |
| Sala de espera | Circulaciones de más de 2 m de ancho pueden usarse para espera dejando 1,20 m libres | Opcional |
| Baño general | Acceso directo a la sala de espera, señalizado; lavabo, inodoro, agua continua; ventilación natural o forzada | Aplica |
| Baño general | Más de 6 consultorios: segundo baño, con accesibilidad para movilidad reducida | 2 baños |
| Baño de personal | Optativo hasta 3 consultorios | Obligatorio |
| Secretaría/recepción | 3 m² con lado mínimo de 1,50 m; puede integrarse a la sala de espera; sillas, escritorio, armario o archivo | Aplica |
| Secretaría/recepción | Optativa hasta 3 consultorios | Obligatoria |

Nota: el texto dice «la superficie se incrementará a razón de 2 m² por cada consultorio». Se tomó 9 m² + 2 m² por cada consultorio por encima de cuatro (19 m²). Si se cuenta por cada uno de los nueve, serían 27 m². Confirmar el criterio con Fiscalización Sanitaria.

### 2.4 Funcionamiento (Anexo I, I-3 a I-8)

- Habilitación por especialidad: cobertura obligatoria en días hábiles con profesionales de esa especialidad (I-4).
- Un consultorio habilitado por un profesional que vaya a ser usado por otros requiere autorización de la Dirección, con conformidad del responsable de la habilitación original (I-5).
- Registro obligatorio de pacientes: datos personales, diagnóstico, estudios, tratamiento, evolución y derivaciones (I-7).
- Exhibir el título del profesional y el certificado de habilitación en el lugar de atención (I-8).
- Dirección técnica: un profesional por consultorio o uno para varios dentro del mismo establecimiento (I-3).

---

## 3. Requisitos por especialidad cargada en la app

### 3.1 Clínica médica — Anexo I, III-1 (consultorio médico clínico)

- **Superficie:** 7,50 m², lado mínimo 2,5 m.
- **Equipamiento:** lavabo con provisión de agua continua; toallero para descartables; escritorio; sillas; camilla; negatoscopio; tensiómetro; recipiente para residuos con tapa; escalera de dos peldaños.
- **Además:** accesibilidad a carro de suministro o curaciones y a luz focalizada.

### 3.2 Cardiología — Anexo I, III-2 (consultorio médico especializado)

- **Equipamiento:** todo lo del consultorio médico clínico (3.1) más el específico que requiera la especialidad. La norma no lo enumera.
- **Superficie:** 7,50 m²; pasa a 9 m² si el consultorio cuenta con equipamiento especializado (II-17-b).
- **A definir:** qué equipamiento específico usa el profesional y si queda dentro del consultorio.

### 3.3 Pediatría — Anexo I, III-3

- **Superficie:** 7,50 m², lado mínimo 2,5 m.
- **Equipamiento:** lavabo con provisión de agua continua; toallero para descartables; escritorio; negatoscopio; tensiómetro con manguito pediátrico; recipiente para residuos con tapa; camilla pediátrica; balanza con altímetro; balanza lactante; cinta métrica; otoscopio; oftalmoscopio.
- **Edilicio:** si el consultorio está en planta alta, medidas de seguridad para niños.

### 3.4 Psicología y Psicología infantil — Anexo I, III-4 (salud mental, psiquiatría y/o psicología)

- **Superficie:** 7,50 m², lado mínimo 2,5 m.
- **Equipamiento:** escritorio o equivalente; sillas; sillón o diván.
- La norma no distingue psicología infantil: rige el mismo punto.

### 3.5 Ginecología — Anexo I, III-6 (ginecología y obstetricia)

- **Edilicio:**
  - Acceso directo al baño desde el consultorio.
  - Inodoro para discapacitados, o inodoro común sobreelevado 10 cm sobre el piso terminado.
  - Barral o agarradera perpendicular o inclinado al piso, a una altura entre 70 cm y 1,10 m.
  - Si el baño tiene bidet, debe anularse.
  - En edificios de más de una planta: consultorio garantizado en planta baja.
- **Equipamiento:** cinta métrica inextensible; estetoscopio de Pinard (el texto dice «pilar») o detector de latidos fetales; acceso a colposcopio e insumos para colposcopía; descartadores para objetos punzantes; camilla de examen ginecológico; lámpara de pie; taburete; escalera de dos peldaños.
- **Interpretación:** por ser consultorio especializado, se suma el equipamiento del consultorio clínico (III-2).

### 3.6 Odontología — Anexo I, III-8 y III-9

- **Superficie:** 9 m². Con dos sillones, 6 m² como mínimo por cada uno.
- **Edilicio:** ventilación natural; aislamiento acústico adecuado; mesada con lavabo con agua fría y caliente dentro del consultorio; la superficie que limita con la mesada revestida hasta 60 cm con material de fácil lavado y resistente al desgaste.
- **Equipamiento:** sillón dental regulable; luz directa; salivadera; consola con turbina; torno convencional; jeringa triple (agua, aire, spray); esterilizador para instrumental.
- **Rayos X:** si hay equipo, rige la habilitación de equipos emisores de radiaciones ionizantes.
- **Especializado con equipamiento (III-9):** espacios libres que permitan el ingreso y giro de una silla de ruedas.
- **Documentación (IV-11):** datos de los protesistas a los que se encomienden trabajos (nombre, matrícula y dirección).

### 3.7 Nutrición — Anexo I, III-10

- **Superficie y equipamiento:** solo las condiciones generales (puntos I y II). No se exige equipamiento específico.
- **Profesional:** matrícula provincial.
- **Funcionamiento:**
  - El horario de cobertura debe permitir la continuidad de los tratamientos.
  - Si actúa por indicación médica: indicaciones por escrito, actualizadas, firmadas y selladas con matrícula, archivadas por orden cronológico durante 2 años como mínimo.
  - Registro de pacientes atendidos y prestación efectuada; toda enmienda se salva con nota aclaratoria firmada.

### 3.8 Kinesiología — Anexo II

- **Condición de ejercicio:** para tratar personas enfermas es indispensable la prescripción del médico tratante.
- **Figuras habilitables:** consultorio propiamente dicho, boxes, gimnasio terapéutico y sala de hidroterapia. El establecimiento debe tener al menos una.
- **Consultorio propiamente dicho:** iguales requisitos que el local consultorio (2.1).
- **Box:**
  - Pisos, paramentos y cielorrasos lisos y lavables; pisos antiderrapantes.
  - Divisorios en cada box para resguardar la privacidad; se admiten cortinas si permiten correcta higiene.
  - Dimensiones mínimas: 2,00 m de largo por 1,60 m de ancho.
  - El área de boxes debe tener un lavatorio.
- **Gimnasio terapéutico:** superficie proporcional al equipamiento, con 60 cm libres entre aparatos. Puede comunicarse con la sala de espera.
- **Boxes y gimnasio:** circulaciones de 1,00 m como mínimo, aptas para silla de ruedas; ventilación natural o forzada con salida al exterior; instalación eléctrica con puesta a tierra o disyuntor y térmicas, con tomacorrientes ubicados para que los cables no obstruyan la circulación.
- **Equipamiento:** el propio de las prácticas. Se presenta el listado al solicitar la habilitación y se comunica toda alta o baja.
- **Sala de hidroterapia (si hubiera):** espacio individualizado con cambiador, sector de duchas y acceso a baño adaptado; circulaciones con barandas de 1,20 m de ancho mínimo; pisos antideslizantes; piletas de 1,40 m de largo mínimo si son individuales, o 1 m³ de líquido por persona si son colectivas.

---

## 4. Otros tipos de consultorio previstos en la norma (hoy sin profesionales en la app)

| Tipo | Punto | Requisitos propios |
|---|---|---|
| Oftalmología con equipamiento | III-5 | 9 m², con un lateral de 3 m; giro de silla de ruedas; preferentemente en planta baja |
| Urología | III-7 | Baño con acceso directo desde el consultorio (sin exigencia de bidet); camilla y escalera de dos peldaños |
| Enfermería | III-11 | Mesada revestida hasta 60 cm con áreas sucia y limpia; camilla lavable, tubo de oxígeno con mascarilla, lámpara portátil, estetoscopio y esfigmomanómetro, nebulizador con aspirador, lavabo con agua fría y caliente, estufa de esterilizar, armario de insumos, recipientes para residuos diferenciados; giro de silla de ruedas; registro foliado y habilitado |
| Fonoaudiología | III-12 | Condiciones generales; cobertura que permita continuidad; indicaciones médicas archivadas 2 años; registro de pacientes |
| Fonoaudiología con equipamiento | III-13 | 9 m²; cabina audiológica de 1,50 × 1,50 × 2 m, sonoamortiguada, con ruido interno entre 30 y 40 dB; audiómetros con calibración anual |
| Vacunación | III-14 | Local de uso exclusivo; dos circuitos eléctricos independientes; heladera exclusiva para vacunas con termómetros; heladera de transporte; libro foliado y planilla de temperatura cada 6 horas |
| Podología | III-15 | Mesada revestida hasta 60 cm con áreas sucia y limpia; camilla o sillón lavable; lámpara portátil; lavabo con agua fría y caliente; estufa de esterilización; instrumental de acero inoxidable |

---

## 5. Campos sugeridos para la ficha de cada consultorio

**Edilicios**

- Superficie (m²) y lado mínimo (m).
- Planta: baja o alta. Si es alta: acceso por ascensor (sí/no).
- Acceso directo a baño desde el consultorio (sí/no).
- Baño adaptado: inodoro para discapacitados o sobreelevado, con barral (sí/no).
- Lavabo con agua continua (sí/no). Agua fría y caliente (sí/no).
- Mesada con revestimiento lavable hasta 60 cm (sí/no).
- Ventilación natural (sí/no).
- Tabique completo con aislante acústico hacia la sala de espera (sí/no).
- Permite giro de silla de ruedas (sí/no).
- Medidas de seguridad para niños (sí/no; solo planta alta).

**Equipamiento presente (lista de control)**

- General: escritorio, sillas, toallero para descartables, recipiente para residuos con tapa, escalera de dos peldaños, descartador de punzantes.
- Clínico: camilla, negatoscopio, tensiómetro, luz focalizada, acceso a carro de curaciones.
- Pediatría: camilla pediátrica, tensiómetro con manguito pediátrico, balanza con altímetro, balanza lactante, cinta métrica, otoscopio, oftalmoscopio.
- Salud mental: sillón o diván.
- Ginecología: camilla ginecológica, cinta métrica inextensible, estetoscopio de Pinard o detector de latidos fetales, acceso a colposcopio e insumos, lámpara de pie, taburete.
- Odontología: sillón dental regulable, luz directa, salivadera, consola con turbina, torno convencional, jeringa triple, esterilizador para instrumental, equipo de rayos X (opcional).
- Kinesiología: cantidad de boxes y medidas, lavatorio en el área de boxes, gimnasio (sí/no), listado de equipos.

---

## 6. Aplicación al cronograma actual de Mitre 837

Requisitos que debe reunir cada consultorio según quién atiende hoy:

| Consultorio | Especialidades | Debe reunir |
|---|---|---|
| Ginecología | Ginecología | 3.5: baño adaptado con acceso directo y equipamiento ginecológico, más 3.1 |
| Odontología | Odontología | 3.6: 9 m², mesada con lavabo y sillón dental |
| Kinesiología | Kinesiología | 3.8: consultorio, boxes o gimnasio |
| Consultorio 1 | Clínica médica + Nutrición | 3.1 |
| Consultorio 2 | Clínica médica + Psicología | 3.1 más sillón o diván |
| Consultorio 3 | Clínica médica + Cardiología | 3.1 más equipamiento de cardiología; 9 m² si es equipamiento especializado |
| Consultorio 4 | Pediatría | 3.3 |
| Consultorio 5 | Pediatría + Psicología infantil | 3.3 más sillón o diván |
| Consultorio 6 | Nutrición | Solo condiciones generales |

Cobertura en días hábiles con el cronograma actual (I-4):

| Especialidad | Días con profesional | Días hábiles sin cobertura |
|---|---|---|
| Clínica médica | Lunes a viernes | Ninguno |
| Kinesiología | Lunes a viernes | Ninguno |
| Ginecología | Lunes a viernes | Ninguno |
| Pediatría | Lunes, martes, jueves y viernes | Miércoles, si no se confirma el horario de la Dra. Contreras |
| Nutrición | Lunes a jueves | Viernes |
| Psicología | Lunes y miércoles | Martes, jueves y viernes |
| Psicología infantil | Miércoles y viernes | Lunes, martes y jueves |
| Cardiología | Lunes, miércoles y viernes | Martes y jueves |
| Odontología | Sin profesionales | Todos |

El punto I-4 rige cuando la habilitación se pide para una especialidad determinada. Confirmar con Fiscalización Sanitaria cómo se aplica a consultorios generales compartidos.
