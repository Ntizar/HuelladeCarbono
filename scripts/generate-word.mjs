/**
 * Generador del documento Word para Substack
 * Ejecutar: node scripts/generate-word.mjs
 *
 * Genera un .docx profesional con:
 * - Contenido optimizado para post de Substack
 * - Placeholders de imágenes con instrucciones
 * - Estructura narrativa en primera persona
 * - Explicación del por qué y para qué del proyecto
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, ShadingType, TabStopType,
  Table, TableRow, TableCell, WidthType, TableBorders,
  ImageRun, PageBreak,
} from 'docx';
import fs from 'fs';

// ─── Colores ───
const GREEN = '16a34a';
const DARK_GREEN = '15803d';
const BLUE = '2563eb';
const AMBER = 'd97706';
const RED = 'dc2626';
const GRAY = '6b7280';
const DARK = '1f2937';
const LIGHT_GREEN = 'f0fdf4';
const LIGHT_BLUE = 'dbeafe';
const LIGHT_AMBER = 'fef3c7';
const LIGHT_GRAY = 'f3f4f6';
const WHITE = 'ffffff';

// ─── Helpers ───
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 400, after: 200 },
    style: 'heading',
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: DARK_GREEN, font: 'Georgia' })],
    spacing: { before: 400, after: 150 },
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: DARK, font: 'Georgia' })],
    spacing: { before: 300, after: 100 },
  });
}

function p(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: DARK, font: 'Georgia' })],
    spacing: { after: 150 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function pBold(boldPart, rest) {
  return new Paragraph({
    children: [
      new TextRun({ text: boldPart, bold: true, size: 22, color: DARK, font: 'Georgia' }),
      new TextRun({ text: rest, size: 22, color: DARK, font: 'Georgia' }),
    ],
    spacing: { after: 150 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function italic(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: 22, color: GRAY, font: 'Georgia' })],
    spacing: { after: 100 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: DARK, font: 'Georgia' })],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function bulletBold(boldPart, rest) {
  return new Paragraph({
    children: [
      new TextRun({ text: boldPart, bold: true, size: 22, color: DARK, font: 'Georgia' }),
      new TextRun({ text: rest, size: 22, color: DARK, font: 'Georgia' }),
    ],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function quote(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: 22, color: DARK_GREEN, font: 'Georgia' })],
    spacing: { before: 100, after: 200 },
    indent: { left: 400 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 6, color: GREEN },
    },
  });
}

function formula(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: 'Consolas', color: DARK })],
    shading: { type: ShadingType.CLEAR, fill: LIGHT_GRAY },
    spacing: { before: 100, after: 150 },
    indent: { left: 200, right: 200 },
  });
}

function separator() {
  return new Paragraph({
    children: [new TextRun({ text: '───────────────────────────', color: GREEN, size: 22 })],
    spacing: { before: 300, after: 300 },
    alignment: AlignmentType.CENTER,
  });
}

function imagePlaceholder(caption, description) {
  return [
    new Paragraph({
      children: [
        new TextRun({ text: `📸  [ INSERTAR IMAGEN: ${caption} ]`, bold: true, size: 22, color: BLUE, font: 'Georgia' }),
      ],
      shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE },
      spacing: { before: 200, after: 80 },
      alignment: AlignmentType.CENTER,
      border: {
        top: { style: BorderStyle.DASHED, size: 2, color: BLUE },
        bottom: { style: BorderStyle.DASHED, size: 2, color: BLUE },
        left: { style: BorderStyle.DASHED, size: 2, color: BLUE },
        right: { style: BorderStyle.DASHED, size: 2, color: BLUE },
      },
    }),
    new Paragraph({
      children: [new TextRun({ text: description, italics: true, size: 18, color: GRAY, font: 'Georgia' })],
      spacing: { after: 200 },
      alignment: AlignmentType.CENTER,
    }),
  ];
}

function spacer(pts = 100) {
  return new Paragraph({ spacing: { after: pts } });
}

// ─── Tablas ───
function comparisonTable() {
  const headerCell = (text) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: WHITE, font: 'Georgia' })], alignment: AlignmentType.CENTER })],
    shading: { type: ShadingType.CLEAR, fill: DARK_GREEN },
    verticalAlign: 'center',
    width: { size: 50, type: WidthType.PERCENTAGE },
  });

  const dataCell = (text, bg = WHITE) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 19, color: DARK, font: 'Georgia' })], spacing: { after: 40 } })],
    shading: { type: ShadingType.CLEAR, fill: bg },
    width: { size: 50, type: WidthType.PERCENTAGE },
  });

  const rows = [
    ['Archivo .xlsx local, un solo usuario', 'App web accesible desde cualquier navegador, multi-usuario'],
    ['Sin historial de cambios ni auditoría', 'Log completo de cada acción con timestamp y usuario'],
    ['Fórmulas ocultas en celdas protegidas', 'Motor de cálculo transparente y testado con tests unitarios'],
    ['Sin validación de datos al introducirlos', 'Validación instantánea con schemas Zod'],
    ['Solo exporta a .xlsx', 'Exporta a Excel, CSV, JSON y PDF'],
    ['Sin gráficos interactivos', 'Dashboard con KPIs, gráficos de barras, donas, comparativas'],
    ['13 pestañas complejas de Excel', 'UI moderna con 13 secciones intuitivas y responsive'],
    ['Sin control de acceso ni seguridad', 'Autenticación segura con 3 roles diferenciados'],
  ];

  return new Table({
    rows: [
      new TableRow({
        children: [headerCell('Excel MITECO V.31 ❌'), headerCell('Nueva herramienta web ✅')],
        tableHeader: true,
      }),
      ...rows.map((row, i) => new TableRow({
        children: [
          dataCell(row[0], i % 2 === 0 ? WHITE : LIGHT_GRAY),
          dataCell(row[1], i % 2 === 0 ? LIGHT_GREEN : 'e8fbe8'),
        ],
      })),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function factorsTable() {
  const headerCell = (text) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, color: WHITE, font: 'Georgia' })], alignment: AlignmentType.CENTER })],
    shading: { type: ShadingType.CLEAR, fill: DARK_GREEN },
  });

  const dataCell = (text, bg = WHITE) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 18, color: DARK, font: 'Georgia' })], alignment: AlignmentType.CENTER })],
    shading: { type: ShadingType.CLEAR, fill: bg },
  });

  const data = [
    ['Gas Natural', 'kWh', '0,202', '0,00004', '0,00001'],
    ['Gasóleo C', 'litro', '2,868', '0,00022', '0,00004'],
    ['GLP', 'litro', '1,656', '0,00037', '0,00002'],
    ['Gasolina', 'litro', '2,196', '0,00086', '0,00026'],
    ['Diésel', 'litro', '2,471', '0,00010', '0,00040'],
  ];

  return new Table({
    rows: [
      new TableRow({ children: [headerCell('Combustible'), headerCell('Unidad'), headerCell('FE CO₂ (kg)'), headerCell('FE CH₄ (kg)'), headerCell('FE N₂O (kg)')] }),
      ...data.map((row, i) => new TableRow({
        children: row.map(cell => dataCell(cell, i % 2 === 0 ? WHITE : LIGHT_GRAY)),
      })),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENTO PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const doc = new Document({
  creator: 'David Antizar',
  title: 'De Excel gubernamental a aplicación web: Cómo digitalicé la calculadora de huella de carbono del MITECO',
  description: 'Post para Substack sobre la digitalización de la calculadora de huella de carbono MITECO V.31',
  styles: {
    paragraphStyles: [
      {
        id: 'heading',
        name: 'Heading Custom',
        run: { font: 'Georgia', color: DARK_GREEN, bold: true },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1000, bottom: 800, left: 1200, right: 1200 },
        },
      },
      children: [
        // ═══════════════════════════════════════════════
        // TÍTULO Y CABECERA
        // ═══════════════════════════════════════════════
        spacer(200),
        new Paragraph({
          children: [new TextRun({ text: '🌿', size: 60 })],
          alignment: AlignmentType.CENTER,
        }),
        spacer(50),
        new Paragraph({
          children: [new TextRun({
            text: 'De Excel gubernamental a aplicación web',
            bold: true, size: 40, color: DARK, font: 'Georgia',
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({
            text: 'Cómo digitalicé la calculadora de huella de carbono del MITECO',
            size: 28, color: DARK_GREEN, font: 'Georgia',
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'David Antizar', bold: true, size: 22, color: DARK, font: 'Georgia' }),
            new TextRun({ text: '  ·  Febrero 2026', size: 22, color: GRAY, font: 'Georgia' }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'github.com/Ntizar/HuelladeCarbono', size: 20, color: BLUE, font: 'Georgia', underline: {} })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),

        separator(),

        // ═══════════════════════════════════════════════
        // 1. INTRO — EL PROBLEMA
        // ═══════════════════════════════════════════════

        h2('El problema: una hoja de Excel para calcular algo que importa'),

        p('En España, cualquier organización que quiera calcular su huella de carbono y registrarla en el Registro Nacional del MITECO tiene que usar una herramienta oficial: una hoja Excel con 13 pestañas, fórmulas ocultas en celdas protegidas y cero capacidad de colaboración.'),

        p('La Calculadora de Huella de Carbono del MITECO (actualmente en su Versión 31) lleva funcionando desde 2007. Y funciona — técnicamente. Pero tiene todas las limitaciones que te puedes imaginar de un archivo .xlsx que se envía por email entre departamentos:'),

        bullet('Un solo usuario puede trabajar a la vez'),
        bullet('No hay historial de cambios — si alguien borra algo, se pierde'),
        bullet('Las fórmulas de cálculo están ocultas en celdas protegidas'),
        bullet('No valida los datos que introduces — puedes meter texto donde va un número'),
        bullet('No hay gráficos interactivos, ni dashboard, ni KPIs'),
        bullet('La única forma de compartirlo es por email, sin control de versiones'),

        p('Y esto es lo que usa el gobierno español para que las empresas reporten algo tan importante como sus emisiones de CO₂.'),

        quote('Digitalizar no es "pasar algo a la nube". Digitalizar bien significa repensar el flujo completo del dato: quién lo introduce, cómo se valida, cómo se calcula, quién puede verlo y cómo se auditan los cambios.'),

        ...imagePlaceholder('Excel MITECO vs Dashboard',
          'Captura del Excel original del MITECO (izquierda) y del nuevo Dashboard (derecha). Reemplazar con capturas reales de la aplicación.'),

        // ═══════════════════════════════════════════════
        // 2. LO QUE CONSTRUÍ
        // ═══════════════════════════════════════════════

        h2('Lo que construí: una aplicación web completa'),

        p('Decidí reimaginar la calculadora del MITECO como lo que debería haber sido siempre: una aplicación web profesional, con validación en tiempo real, auditoría automática, gráficos interactivos y roles de usuario.'),

        p('No se trata de copiar el Excel y meterlo en un navegador. Se trata de entender qué hace esa herramienta, por qué lo hace, y construir algo que haga lo mismo pero muchísimo mejor.'),

        p('La herramienta cubre los dos alcances que exige el estándar GHG Protocol para huella de carbono organizacional:'),

        bulletBold('Alcance 1 — Emisiones directas: ', 'combustión en instalaciones fijas (calderas, hornos), vehículos de flota propia, gases refrigerantes en equipos de climatización y procesos industriales.'),
        bulletBold('Alcance 2 — Emisiones indirectas: ', 'consumo de electricidad adquirida, con factor de emisión específico por comercializadora según la CNMC.'),

        ...imagePlaceholder('Dashboard principal',
          'Captura del Dashboard mostrando KPIs (Total HC, Alcance 1, Alcance 2, Ratio/empleado), gráficos de barras y donas, filtros por sede/año/alcance/contaminante.'),

        // ═══════════════════════════════════════════════
        // 3. COMPARATIVA
        // ═══════════════════════════════════════════════

        h2('Antes y después: Excel vs aplicación web'),

        p('Esta tabla resume los cambios principales. Cada fila es una limitación real del Excel que ahora tiene solución:'),

        comparisonTable(),

        spacer(100),

        ...imagePlaceholder('Formulario de Alcance 1 — Instalaciones fijas',
          'Captura del formulario de combustión fija con selector de sede, selector de combustible, cantidad, y vista previa del cálculo automático.'),

        // ═══════════════════════════════════════════════
        // 4. CÓMO FUNCIONAN LOS CÁLCULOS
        // ═══════════════════════════════════════════════

        h2('Los cálculos: las mismas fórmulas del MITECO, pero transparentes'),

        p('Las fórmulas que usa mi herramienta son exactamente las del MITECO V.31, con los Potenciales de Calentamiento Atmosférico (PCA) del Sexto Informe del IPCC (AR6, 2021). La diferencia es que aquí puedes verlas, entenderlas y verificarlas.'),

        h3('Combustión fija y vehículos'),

        p('Cada combustible tiene tres factores de emisión: uno para CO₂, otro para CH₄ y otro para N₂O. La fórmula multiplica la cantidad consumida por cada factor y convierte los tres gases a CO₂-equivalente:'),

        formula('Emisiones CO₂  = Cantidad × FE_CO₂  (kg CO₂/unidad)'),
        formula('Emisiones CH₄  = Cantidad × FE_CH₄  (kg) × 27,9  (PCA)'),
        formula('Emisiones N₂O  = Cantidad × FE_N₂O  (kg) × 273   (PCA)'),
        formula('Total (kg CO₂e) = CO₂ + CH₄ como CO₂e + N₂O como CO₂e'),

        p('Los PCA del AR6 del IPCC son: CH₄ = 27,9 (cada kilo de metano calienta como 27,9 kg de CO₂ a 100 años) y N₂O = 273 (cada kilo de óxido nitroso equivale a 273 kg de CO₂).'),

        new Paragraph({
          children: [
            new TextRun({ text: 'Ejemplo: ', bold: true, size: 22, color: DARK, font: 'Georgia' }),
            new TextRun({ text: '50.000 kWh de Gas Natural → (50.000 × 0,202) + (50.000 × 0,00004 × 27,9) + (50.000 × 0,00001 × 273) = 10.100 + 55,8 + 136,5 = ', size: 22, color: DARK, font: 'Georgia' }),
            new TextRun({ text: '10.292 kg CO₂e = 10,29 t CO₂e', bold: true, size: 22, color: DARK_GREEN, font: 'Georgia' }),
          ],
          shading: { type: ShadingType.CLEAR, fill: LIGHT_GREEN },
          spacing: { before: 100, after: 200 },
          indent: { left: 200, right: 200 },
        }),

        h3('Factores de emisión cargados'),

        factorsTable(),

        italic('Fuente: Calculadora MITECO V.31. Datos completos en data/emission_factors.json del repositorio.'),

        h3('Gases refrigerantes (emisiones fugitivas)'),

        p('Los equipos de climatización y refrigeración pierden gas con el tiempo. Cada recarga implica emisiones, y algunos gases son brutalmente potentes: 1 kg de SF₆ equivale a 22,8 toneladas de CO₂.'),

        formula('Emisiones (t CO₂e) = Recarga (kg) × PCA del gas / 1000'),

        p('La herramienta incluye 20 gases refrigerantes con sus PCA del AR6 IPCC: HFC-134a (1.430), R-410A (2.088), R-404A (3.922), SF₆ (22.800), entre otros.'),

        h3('Electricidad (Alcance 2)'),

        p('Las emisiones por electricidad dependen de la comercializadora contratada. Cada una tiene un mix energético diferente (% renovable, gas, carbón). Si la organización tiene Garantía de Origen renovable, sus emisiones de Alcance 2 son cero.'),

        formula('Emisiones (t CO₂) = kWh consumidos × Factor comercializadora (kg CO₂/kWh) / 1000'),
        formula('Con Garantía de Origen (GdO) renovable → Emisiones = 0'),

        ...imagePlaceholder('Formulario de Alcance 2 — Electricidad',
          'Captura del formulario de electricidad mostrando selector de comercializadora, kWh consumidos, toggle de Garantía de Origen, y cálculo automático.'),

        // ═══════════════════════════════════════════════
        // 5. EL SISTEMA POR DENTRO
        // ═══════════════════════════════════════════════

        h2('El sistema por dentro: agentes que trabajan en cadena'),

        p('Cada vez que un usuario añade, modifica o elimina un dato, el sistema ejecuta automáticamente un pipeline de 4 agentes especializados. Esto garantiza que ningún dato se guarde sin validar, que todo quede auditado y que las emisiones se recalculen al instante:'),

        pBold('1. Orquestador → ', 'Recibe el evento de cambio y coordina la ejecución secuencial de todos los agentes.'),
        pBold('2. AuditAgent → ', 'Registra quién hizo qué, cuándo y con qué datos. Cada acción tiene un UUID único.'),
        pBold('3. ValidationAgent → ', 'Valida coherencia: años razonables (2007-2027), valores no negativos, combustibles existentes, campos obligatorios.'),
        pBold('4. CalcAgent → ', 'Aplica todas las fórmulas del MITECO y recalcula los totales. Si la variación supera el 10%, genera una alerta.'),

        quote('El usuario solo se preocupa de introducir los datos. El sistema se encarga de que sean correctos, de calcular las emisiones, de registrar la acción y de alertar si algo cambia drásticamente.'),

        ...imagePlaceholder('Página de Vehículos — Alcance 1',
          'Captura de la página de vehículos mostrando el selector de sede compartido, categoría de vehículo, cantidad, y tabla de consumos registrados.'),

        // ═══════════════════════════════════════════════
        // 6. DASHBOARD AVANZADO
        // ═══════════════════════════════════════════════

        h2('Un dashboard de verdad, no una celda de Excel'),

        p('El dashboard es probablemente la mejora más visible. El Excel del MITECO no tiene nada parecido — solo números en celdas. Aquí hay:'),

        bulletBold('4 filtros interactivos: ', 'Año (2007-2027), Sede, Alcance (1, 2 o ambos), Contaminante (CO₂, CH₄, N₂O)'),
        bulletBold('5 KPIs en tiempo real: ', 'Total HC, Alcance 1, Alcance 2, Ratio por empleado, Número de registros'),
        bulletBold('4 gráficos: ', 'Barras apiladas (Alcance 1 vs 2), Dona por categoría, Dona por sede, Dona por contaminante'),
        bulletBold('Tabla de top emisores: ', 'Las 8 mayores fuentes de emisión con porcentaje sobre el total'),
        bulletBold('Comparativa por sede: ', 'Gráfico de barras horizontales comparando emisiones entre sedes'),
        bulletBold('3 ratios: ', 't CO₂e por m², por empleado y por índice de actividad'),

        p('Todo se actualiza en tiempo real cuando cambias un filtro. Si seleccionas una sede concreta, ves solo sus emisiones. Si seleccionas solo CH₄, ves el desglose de metano.'),

        ...imagePlaceholder('Dashboard con filtros aplicados',
          'Captura del Dashboard con un filtro de sede activo, mostrando las gráficas actualizadas para esa sede específica y la comparativa entre sedes.'),

        // ═══════════════════════════════════════════════
        // 7. SEDES CONECTADAS
        // ═══════════════════════════════════════════════

        h2('Sedes compartidas: todo conectado'),

        p('Una de las cosas que más me molestaba del Excel es que cada pestaña es independiente. Si tu empresa tiene 3 oficinas y quieres saber cuánto emite cada una, tienes que sumar a mano.'),

        p('En la nueva herramienta, las sedes (centros de trabajo) se crean una vez y están disponibles en todas las secciones. Cuando registras un consumo de gas natural en Instalaciones Fijas, seleccionas la sede. Cuando registras un vehículo, seleccionas la misma sede. Y en el dashboard, puedes filtrar por esa sede y ver todo junto.'),

        quote('Creas una sede en cualquier formulario y automáticamente aparece en todos los demás. Así funciona una aplicación conectada.'),

        ...imagePlaceholder('Selector de sede compartido',
          'Captura del componente SedeSelector mostrando el desplegable con las sedes existentes y el botón "Nueva" para crear una sede inline.'),

        // ═══════════════════════════════════════════════
        // 8. STACK Y ARQUITECTURA
        // ═══════════════════════════════════════════════

        h2('Stack tecnológico'),

        p('La herramienta está construida con tecnologías modernas y probadas:'),

        bulletBold('Next.js 14 (App Router) — ', 'Framework web con SSR, rutas automáticas y API routes integradas.'),
        bulletBold('TypeScript — ', 'Tipado estático en todo el proyecto. Cada función, cada tipo, cada esquema está tipado.'),
        bulletBold('TailwindCSS — ', 'Estilos rápidos y responsive. Una UI limpia sin escribir CSS a mano.'),
        bulletBold('Recharts — ', 'Gráficos interactivos: barras apiladas, donas, tooltips, colores personalizados.'),
        bulletBold('Zustand — ', 'Gestión de estado global ligera. Sincroniza los datos entre componentes.'),
        bulletBold('Zod — ', 'Validación de schemas. Cada dato que entra se valida contra su esquema antes de guardarse.'),
        bulletBold('NextAuth.js — ', 'Autenticación con JWT, sesiones seguras, middleware de protección de rutas.'),
        bulletBold('ExcelJS + PapaParse — ', 'Exportación a Excel compatible MITECO, CSV para herramientas BI, y JSON para APIs.'),

        h3('Almacenamiento basado en archivos'),

        p('Los datos se almacenan en JSON y CSV, organizados por organización y año. Cada empresa tiene su carpeta aislada con todos sus datos separados por año de cálculo. Sin base de datos externa — un simple backup de la carpeta data/ es un backup completo.'),

        formula('data/orgs/{org_id}/{año}/organizacion.json'),
        formula('data/orgs/{org_id}/{año}/scope1_instalaciones_fijas.json'),
        formula('data/orgs/{org_id}/{año}/scope1_vehiculos.json'),
        formula('data/orgs/{org_id}/{año}/scope1_fugitivas.json'),
        formula('data/orgs/{org_id}/{año}/scope2_electricidad.json'),
        formula('data/orgs/{org_id}/{año}/results.json'),

        ...imagePlaceholder('Página de resultados',
          'Captura de la página de Resultados mostrando el desglose completo por alcance y categoría, con gráficos finales.'),

        // ═══════════════════════════════════════════════
        // 9. LAS 13 SECCIONES
        // ═══════════════════════════════════════════════

        h2('Las 13 secciones de la aplicación'),

        p('La aplicación tiene 13 secciones que cubren todo el ciclo de cálculo de huella de carbono. Mapean directamente las 13 pestañas del Excel del MITECO, pero con una experiencia de usuario completamente diferente:'),

        bulletBold('🏠 Dashboard — ', 'Panel principal con 5 KPIs, 4 gráficos, filtros por año/sede/alcance/contaminante, tabla de top emisores.'),
        bulletBold('📋 Organización — ', 'Datos generales: nombre, CIF, CNAE, empleados, superficie, facturación. Necesarios para los ratios.'),
        bulletBold('🏭 Instalaciones fijas — ', 'Alcance 1. Combustión en calderas, hornos, generadores. Selector de combustible y cálculo automático.'),
        bulletBold('🚗 Vehículos — ', 'Alcance 1. Flota propia: método A1 (por litros) y A2 (por km). Categorías de vehículo.'),
        bulletBold('💨 Fugitivas — ', 'Alcance 1. Recargas de gas refrigerante. Vista previa del cálculo (recarga × PCA).'),
        bulletBold('⚙️ Proceso — ', 'Alcance 1. Emisiones de procesos industriales directas.'),
        bulletBold('🌱 Renovables — ', 'Informativo. Biomasa y biocombustibles. No computan en el total (GHG Protocol).'),
        bulletBold('⚡ Electricidad — ', 'Alcance 2. kWh por comercializadora con factor CNMC. Toggle de Garantía de Origen.'),
        bulletBold('📊 Resultados — ', 'Resumen total con desglose por alcance y categoría.'),
        bulletBold('📄 Informes — ', 'Exportación en 4 formatos: Excel, CSV, JSON, PDF.'),
        bulletBold('🔬 Factores — ', 'Tabla de consulta con todos los factores cargados (solo lectura).'),
        bulletBold('👥 Usuarios — ', 'Admin. CRUD de usuarios con 3 roles: Admin, Editor, Viewer.'),
        bulletBold('📝 Auditoría — ', 'Admin. Log completo de acciones con filtros por usuario, tipo y fecha.'),

        ...imagePlaceholder('Sidebar de navegación',
          'Captura de la barra lateral con las 13 secciones agrupadas y el branding "David Antizar" en el footer.'),

        // ═══════════════════════════════════════════════
        // 10. REFLEXIÓN FINAL
        // ═══════════════════════════════════════════════

        separator(),

        h2('Lo que aprendí: cómo se debería digitalizar'),

        p('Este proyecto me confirmó algo que llevo pensando mucho tiempo: digitalizar no es replicar un formulario en papel dentro de un navegador. Es entender el flujo completo del dato — desde su origen hasta su uso final — y diseñar un sistema que lo haga más fiable, más accesible y más útil.'),

        p('La calculadora del MITECO funciona. Lleva 19 años funcionando. Pero funcionar no es suficiente cuando hablamos de algo tan importante como medir las emisiones de CO₂ de las empresas españolas.'),

        p('Una herramienta gubernamental basada en Excel, con 13 pestañas y fórmulas ocultas, puede transformarse en una aplicación web moderna con validación en tiempo real, auditoría automática, gráficos interactivos y exportación multi-formato. Y todo manteniendo exactamente las mismas fórmulas oficiales, verificadas con tests automatizados.'),

        quote('La clave: no sustituir el Excel por otro Excel. Sustituirlo por un sistema que haga imposible equivocarse, obligatorio auditar y fácil colaborar.'),

        spacer(200),

        // ═══════════════════════════════════════════════
        // FOOTER / CTA
        // ═══════════════════════════════════════════════

        new Paragraph({
          children: [new TextRun({ text: '───────── ✦ ─────────', color: GREEN, size: 22 })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          children: [new TextRun({
            text: '¿Quieres probarlo?',
            bold: true, size: 28, color: DARK_GREEN, font: 'Georgia',
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [new TextRun({
            text: 'git clone https://github.com/Ntizar/HuelladeCarbono.git\nnpm install → npm run dev → localhost:3000',
            size: 20, font: 'Consolas', color: DARK,
          })],
          shading: { type: ShadingType.CLEAR, fill: LIGHT_GRAY },
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          indent: { left: 600, right: 600 },
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Demo: ', size: 20, color: GRAY, font: 'Georgia' }),
            new TextRun({ text: 'admin@demo.com / demo123', bold: true, size: 20, color: DARK, font: 'Georgia' }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        separator(),

        new Paragraph({
          children: [
            new TextRun({ text: 'Desarrollado por ', size: 20, color: GRAY, font: 'Georgia' }),
            new TextRun({ text: 'David Antizar', bold: true, size: 20, color: DARK, font: 'Georgia' }),
            new TextRun({ text: '  ·  Febrero 2026  ·  ', size: 20, color: GRAY, font: 'Georgia' }),
            new TextRun({ text: 'github.com/Ntizar/HuelladeCarbono', size: 20, color: BLUE, font: 'Georgia', underline: {} }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),

        new Paragraph({
          children: [new TextRun({
            text: 'Basado en la Calculadora MITECO V.31 · GHG Protocol · AR6 IPCC',
            size: 18, color: GRAY, font: 'Georgia',
          })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    },
  ],
});

// ═══════════════════════════════════════════════════════════════
// GENERAR ARCHIVO
// ═══════════════════════════════════════════════════════════════

async function main() {
  if (!fs.existsSync('./docs')) fs.mkdirSync('./docs', { recursive: true });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = './docs/Post_Substack_Huella_de_Carbono.docx';
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Word generado: ${outputPath}`);
  console.log(`   Tamaño: ${(buffer.length / 1024).toFixed(0)} KB`);
  console.log('');
  console.log('📌 INSTRUCCIONES:');
  console.log('   1. Abre el .docx en Word');
  console.log('   2. Busca los placeholders "📸 [ INSERTAR IMAGEN: ... ]"');
  console.log('   3. Reemplaza cada uno con una captura de pantalla real');
  console.log('   4. Copia y pega el contenido en tu editor de Substack');
  console.log('');
  console.log('💡 TIP: Substack acepta imágenes arrastrando directamente.');
  console.log('         Haz capturas del programa corriendo en localhost:3000.');
}

main().catch(err => {
  console.error('Error generando Word:', err);
  process.exit(1);
});
