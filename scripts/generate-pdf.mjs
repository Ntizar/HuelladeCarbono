/**
 * Generador del PDF explicativo — Calculadora Huella de Carbono
 * Ejecutar: node scripts/generate-pdf.mjs
 * 
 * Genera un documento multi-página con:
 * - Contexto y motivación del proyecto
 * - Comparativa Excel MITECO vs herramienta web
 * - Explicación detallada de cálculos y factores
 * - Organización de datos y arquitectura
 * - Guía de edición y personalización
 */

import React from 'react';
import { renderToFile, Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

// ─── Paleta ───
const C = {
  green: '#16a34a', darkGreen: '#15803d', lightGreen: '#f0fdf4', mintGreen: '#dcfce7', borderGreen: '#bbf7d0',
  blue: '#2563eb', lightBlue: '#dbeafe', darkBlue: '#1e40af',
  red: '#dc2626', lightRed: '#fef2f2', borderRed: '#fecaca',
  amber: '#d97706', lightAmber: '#fef3c7',
  gray: '#6b7280', darkGray: '#374151', lightGray: '#f3f4f6', borderGray: '#e5e7eb',
  white: '#ffffff', black: '#111827',
};

// ─── Estilos ───
const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 55, fontFamily: 'Helvetica', backgroundColor: C.white },
  // Header
  headerBar: { backgroundColor: C.green, borderRadius: 8, padding: 18, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.5 },
  headerSub: { fontSize: 9, color: C.borderGreen, marginTop: 3 },
  badge: { backgroundColor: C.borderGreen, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.darkGreen },
  // Author line
  authorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.borderGray },
  authorLabel: { fontSize: 8, color: C.gray },
  authorName: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.darkGray },
  link: { fontSize: 8, color: C.blue, textDecoration: 'underline' },
  // Section
  h2: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.darkGreen, marginBottom: 7, marginTop: 14 },
  h3: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.darkGray, marginBottom: 4, marginTop: 8 },
  p: { fontSize: 8.5, color: C.darkGray, lineHeight: 1.55, marginBottom: 5 },
  pSmall: { fontSize: 7.5, color: C.gray, lineHeight: 1.5, marginBottom: 4 },
  bold: { fontFamily: 'Helvetica-Bold' },
  italic: { fontFamily: 'Helvetica-Oblique' },
  // Columns
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  col: { flex: 1 },
  // Boxes
  box: { borderRadius: 6, padding: 10, marginBottom: 6 },
  boxGreen: { backgroundColor: C.lightGreen, borderWidth: 1, borderColor: C.borderGreen },
  boxRed: { backgroundColor: C.lightRed, borderWidth: 1, borderColor: C.borderRed },
  boxBlue: { backgroundColor: C.lightBlue, borderWidth: 1, borderColor: '#93c5fd' },
  boxAmber: { backgroundColor: C.lightAmber, borderWidth: 1, borderColor: '#fcd34d' },
  boxGray: { backgroundColor: C.lightGray, borderWidth: 1, borderColor: C.borderGray },
  // Bullet
  bulletRow: { flexDirection: 'row', marginBottom: 2.5, paddingLeft: 4 },
  bulletDot: { fontSize: 8, color: C.green, marginRight: 5, fontFamily: 'Helvetica-Bold', width: 10 },
  bulletText: { fontSize: 8, color: C.darkGray, lineHeight: 1.45, flex: 1 },
  // Number bullet
  numDot: { fontSize: 8, color: C.white, backgroundColor: C.green, borderRadius: 7, width: 14, height: 14, textAlign: 'center', lineHeight: 14, marginRight: 6, fontFamily: 'Helvetica-Bold' },
  // Code / formula
  formula: { backgroundColor: C.lightGray, borderRadius: 4, padding: 8, marginBottom: 6, marginTop: 4 },
  formulaText: { fontSize: 8, fontFamily: 'Courier', color: C.darkGray, lineHeight: 1.5 },
  // Architecture
  archRow: { flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center', marginBottom: 6, marginTop: 4 },
  archBox: { borderRadius: 4, paddingVertical: 5, paddingHorizontal: 8, alignItems: 'center' },
  archText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.darkGray },
  arrow: { fontSize: 9, color: C.gray },
  // Feature card
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 },
  featureCard: { width: '31%', backgroundColor: C.lightGray, borderRadius: 5, padding: 8 },
  fcTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.darkGray, marginBottom: 2 },
  fcDesc: { fontSize: 7, color: C.gray, lineHeight: 1.4 },
  // Tech badges
  techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  techBadge: { backgroundColor: C.lightBlue, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2.5 },
  techText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.blue },
  // Table
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.borderGray, paddingVertical: 3 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.darkGray, paddingVertical: 4, backgroundColor: C.lightGray, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tableCell: { fontSize: 7.5, color: C.darkGray, paddingHorizontal: 4 },
  tableCellBold: { fontSize: 7.5, color: C.darkGray, paddingHorizontal: 4, fontFamily: 'Helvetica-Bold' },
  // Folder tree
  tree: { backgroundColor: C.lightGray, borderRadius: 4, padding: 8, marginBottom: 6, marginTop: 2 },
  treeLine: { fontSize: 7.5, fontFamily: 'Courier', color: C.darkGray, lineHeight: 1.5 },
  // Footer
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: C.borderGray, paddingTop: 6 },
  footerText: { fontSize: 6.5, color: C.gray },
  pageNum: { fontSize: 6.5, color: C.gray, fontFamily: 'Helvetica-Bold' },
});

// ─── Helpers ───
const H2 = ({ children }) => React.createElement(Text, { style: s.h2 }, children);
const H3 = ({ children }) => React.createElement(Text, { style: s.h3 }, children);
const P = ({ children }) => React.createElement(Text, { style: s.p }, children);
const PSmall = ({ children }) => React.createElement(Text, { style: s.pSmall }, children);
const B = ({ children }) => React.createElement(Text, { style: s.bold }, children);

const Bullet = ({ children }) => React.createElement(View, { style: s.bulletRow },
  React.createElement(Text, { style: s.bulletDot }, '•'),
  React.createElement(Text, { style: s.bulletText }, children)
);

const CheckBullet = ({ children }) => React.createElement(View, { style: s.bulletRow },
  React.createElement(Text, { style: { ...s.bulletDot, color: C.green } }, '✓'),
  React.createElement(Text, { style: s.bulletText }, children)
);

const NumBullet = ({ n, children }) => React.createElement(View, { style: { ...s.bulletRow, alignItems: 'flex-start', marginBottom: 4 } },
  React.createElement(View, { style: s.numDot }, React.createElement(Text, { style: { fontSize: 7, color: C.white, textAlign: 'center' } }, String(n))),
  React.createElement(Text, { style: { ...s.bulletText, marginTop: 1 } }, children)
);

const Formula = ({ children }) => React.createElement(View, { style: s.formula },
  React.createElement(Text, { style: s.formulaText }, children)
);

const ArchBox = ({ label, bg }) => React.createElement(View, { style: { ...s.archBox, backgroundColor: bg || C.lightBlue } },
  React.createElement(Text, { style: s.archText }, label)
);
const Arrow = () => React.createElement(Text, { style: s.arrow }, '→');

const TechBadge = ({ label }) => React.createElement(View, { style: s.techBadge },
  React.createElement(Text, { style: s.techText }, label)
);

const FeatureCard = ({ title, desc }) => React.createElement(View, { style: s.featureCard },
  React.createElement(Text, { style: s.fcTitle }, title),
  React.createElement(Text, { style: s.fcDesc }, desc)
);

const Footer = ({ pageNum }) => React.createElement(View, { style: s.footer },
  React.createElement(Text, { style: s.footerText }, 'Calculadora de Huella de Carbono · David Antizar · 2026'),
  React.createElement(Text, { style: s.pageNum }, `${pageNum}/4`),
);

// ─── HEADER reutilizable ───
const Header = () => React.createElement(View, { style: s.headerBar },
  React.createElement(View, null,
    React.createElement(Text, { style: s.headerTitle }, 'Calculadora de Huella de Carbono'),
    React.createElement(Text, { style: s.headerSub }, 'Sustituto SaaS de la Calculadora Excel V.31 del MITECO'),
  ),
  React.createElement(View, { style: s.badge },
    React.createElement(Text, { style: s.badgeText }, 'David Antizar · 2026'),
  ),
);

const AuthorLine = () => React.createElement(View, { style: s.authorRow },
  React.createElement(Text, { style: s.authorLabel },
    React.createElement(Text, { style: s.authorName }, 'Desarrollado por David Antizar'),
    '  ·  Febrero 2026  ·  GHG Protocol  ·  AR6 IPCC',
  ),
  React.createElement(Link, { src: 'https://github.com/Ntizar/HuelladeCarbono', style: s.link }, 'github.com/Ntizar/HuelladeCarbono'),
);

// ═══════════════════════════════════════════════════════════════
// PÁGINA 1: Contexto, motivación y comparativa
// ═══════════════════════════════════════════════════════════════
const Page1 = () => React.createElement(Page, { size: 'A4', style: s.page },
  Header(),
  AuthorLine(),

  // ── Por qué este proyecto ──
  H2({ children: '¿Por que este proyecto? La necesidad de digitalizar bien' }),
  P({ children: 'El MITECO proporciona desde 2007 una calculadora Excel (actualmente la Version 31) para que las organizaciones espanolas calculen su huella de carbono y puedan inscribirla en el Registro Nacional. Esta herramienta, aunque funcional, presenta todas las limitaciones inherentes a una hoja de calculo: un unico usuario, sin trazabilidad, formulas ocultas en celdas, sin validacion de datos y sin capacidad de colaboracion.' }),
  P({ children: 'Digitalizar no es simplemente "pasar algo a la nube". Digitalizar bien significa repensar el flujo de trabajo completo: quien introduce los datos, como se validan, como se calculan, quien puede verlos, como se auditan los cambios y como se exportan los resultados. Esta herramienta nace con esa filosofia: no copiar el Excel, sino reimaginarlo como un sistema profesional con las mejores practicas de ingenieria de software.' }),

  React.createElement(View, { style: { ...s.box, ...s.boxAmber, marginTop: 4 } },
    React.createElement(Text, { style: { ...s.p, color: C.amber, marginBottom: 0 } },
      React.createElement(B, null, 'Principio de diseno: '),
      'Una buena digitalizacion no replica los defectos del formato anterior. Cada campo se valida, cada accion se registra, cada calculo es transparente y reproducible. El objetivo es que el usuario se concentre en los datos, no en la herramienta.'
    ),
  ),

  // ── Comparativa ──
  H2({ children: 'Del Excel oficial a la herramienta web' }),
  React.createElement(View, { style: s.row },
    React.createElement(View, { style: { ...s.col, ...s.box, ...s.boxRed } },
      React.createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.red, marginBottom: 5 } }, 'Excel MITECO V.31 (antes)'),
      Bullet({ children: 'Archivo .xlsx local, envio por email' }),
      Bullet({ children: 'Un solo usuario simultaneo' }),
      Bullet({ children: 'Sin historial de cambios ni auditoria' }),
      Bullet({ children: 'Formulas ocultas en celdas protegidas' }),
      Bullet({ children: 'Sin validacion de datos al introducirlos' }),
      Bullet({ children: 'Exportacion limitada (solo .xlsx)' }),
      Bullet({ children: 'Sin graficos interactivos ni dashboard' }),
      Bullet({ children: '13 pestanas complejas de Excel' }),
      Bullet({ children: 'Sin control de acceso ni seguridad' }),
    ),
    React.createElement(View, { style: { ...s.col, ...s.box, ...s.boxGreen } },
      React.createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.darkGreen, marginBottom: 5 } }, 'Nueva herramienta web (ahora)'),
      CheckBullet({ children: 'App web accesible desde cualquier navegador' }),
      CheckBullet({ children: 'Multi-usuario con 3 roles diferenciados' }),
      CheckBullet({ children: 'Log de auditoria completo (quien, que, cuando)' }),
      CheckBullet({ children: 'Motor de calculo transparente con tests unitarios' }),
      CheckBullet({ children: 'Validacion instantanea con schemas Zod' }),
      CheckBullet({ children: '4 formatos de exportacion: Excel, CSV, JSON, PDF' }),
      CheckBullet({ children: 'Dashboard en tiempo real con KPIs y Recharts' }),
      CheckBullet({ children: 'UI moderna con 13 secciones intuitivas' }),
      CheckBullet({ children: 'Autenticacion segura + control de roles' }),
    ),
  ),

  // ── Mejoras resumen ──
  H2({ children: 'Mejoras clave implementadas' }),
  React.createElement(View, { style: s.featureGrid },
    FeatureCard({ title: 'Dashboard interactivo', desc: 'KPIs de emisiones, graficos de barras (Alcance 1 vs 2) y circulares (desglose). Vision global instantanea.' }),
    FeatureCard({ title: 'Multi-organizacion', desc: 'Cada empresa tiene datos aislados en data/orgs/{id}/{ano}/. Soporte multi-ano (2007-2024).' }),
    FeatureCard({ title: 'Roles y autenticacion', desc: 'Admin: todo. Editor: datos. Viewer: lectura. Auth con NextAuth.js y contrasenas con bcrypt.' }),
    FeatureCard({ title: 'Auditoria completa', desc: 'Cada accion se registra con timestamp, usuario, tipo y detalle. Panel de consulta con filtros.' }),
    FeatureCard({ title: 'Calculo automatico', desc: 'Al guardar datos, el pipeline recalcula todas las emisiones. Formulas verificadas con tests.' }),
    FeatureCard({ title: '4 exportaciones', desc: 'Excel compatible MITECO, CSV para BI, JSON para APIs externas, PDF resumen ejecutivo.' }),
  ),

  Footer({ pageNum: 1 }),
);

// ═══════════════════════════════════════════════════════════════
// PÁGINA 2: Cálculos y factores de emisión
// ═══════════════════════════════════════════════════════════════
const Page2 = () => React.createElement(Page, { size: 'A4', style: s.page },
  React.createElement(View, { style: { ...s.headerBar, padding: 12 } },
    React.createElement(Text, { style: { ...s.headerTitle, fontSize: 14 } }, 'Calculos y Factores de Emision'),
    React.createElement(View, { style: s.badge }, React.createElement(Text, { style: s.badgeText }, 'Pagina 2/4')),
  ),

  // ── Origen de los factores ──
  H2({ children: 'De donde salen los factores de emision' }),
  P({ children: 'Los factores de emision (FE) son los coeficientes oficiales que relacionan una actividad (quemar gas, consumir electricidad) con las emisiones de GEI que produce. En esta herramienta, los factores provienen de dos fuentes oficiales:' }),

  NumBullet({ n: 1, children: 'Calculadora Excel MITECO V.31 — Los factores de combustibles fijos, vehiculos y gases refrigerantes se extrajeron automaticamente del Excel oficial mediante un script Python (scripts/parse_excel_to_json.py) que lee las hojas del archivo calculadora_hc_tcm30-485617.xlsx y los convierte a JSON estructurado (data/emission_factors.json).' }),
  NumBullet({ n: 2, children: 'CNMC (Comision Nacional de los Mercados y la Competencia) — Los factores de emision de las comercializadoras electricas se obtienen de la publicacion anual de la CNMC sobre el mix electrico de cada comercializadora. Si tienes Garantia de Origen (GdO) renovable, las emisiones son 0.' }),
  NumBullet({ n: 3, children: 'AR6 del IPCC (2021) — Los Potenciales de Calentamiento Atmosferico (PCA) de CH4=27.9 y N2O=273 corresponden al Sexto Informe de Evaluacion del IPCC, que son los valores mas actualizados para convertir cada GEI a CO2-equivalente.' }),

  // ── Alcance 1: Combustión ──
  H2({ children: 'Alcance 1 — Combustion fija y movil' }),
  P({ children: 'Las emisiones por combustion (calderas, hornos, generadores, vehiculos) se calculan multiplicando la cantidad consumida por tres factores de emision independientes — uno para cada gas de efecto invernadero — y convirtiendo CH4 y N2O a CO2-equivalente mediante sus PCA:' }),

  Formula({ children: 'Emisiones CO2     = Cantidad consumida  x  FE_CO2  (kg CO2 / unidad)\nEmisiones CH4     = Cantidad consumida  x  FE_CH4  (kg CH4 / unidad)  x  27.9  (PCA AR6)\nEmisiones N2O     = Cantidad consumida  x  FE_N2O  (kg N2O / unidad)  x  273   (PCA AR6)\n─────────────────────────────────────────────────────────────────────\nTotal (kg CO2e)   = Emisiones CO2  +  Emisiones CH4 como CO2e  +  Emisiones N2O como CO2e' }),

  React.createElement(View, { style: { ...s.box, ...s.boxBlue } },
    React.createElement(Text, { style: { ...s.pSmall, color: C.darkBlue, marginBottom: 0 } },
      React.createElement(B, null, 'Ejemplo: '),
      '50.000 kWh de Gas Natural → FE_CO2=0.202 kg/kWh, FE_CH4=0.00004, FE_N2O=0.00001. Total = (50000 x 0.202) + (50000 x 0.00004 x 27.9) + (50000 x 0.00001 x 273) = 10.100 + 55.8 + 136.5 = 10.292,3 kg CO2e = 10,29 t CO2e.'
    ),
  ),

  P({ children: 'Los factores estan disponibles para: Gas Natural, Gasoleo, Fuel Oil, GLP, Carbon, Biomasa (pellets, astillas, hueso de aceituna), Gasolina, Diesel, Bioetanol, Biodiesel, GNC, GNL, y mas. Cada uno tiene sus tres FE especificos seguin el MITECO V.31.' }),

  // ── Alcance 1: Fugitivas ──
  H2({ children: 'Alcance 1 — Emisiones fugitivas (gases refrigerantes)' }),
  P({ children: 'Las emisiones fugitivas provienen de fugas o recargas de gases fluorados en equipos de refrigeracion y climatizacion. Cada gas tiene un PCA (Potencial de Calentamiento Atmosferico) que mide cuanto calienta respecto al CO2. El calculo es directo:' }),

  Formula({ children: 'Emisiones (t CO2e) = Cantidad recargada (kg)  x  PCA del gas  /  1000' }),

  P({ children: 'Ejemplos de PCA (AR6 IPCC): HFC-134a = 1.430, R-410A = 2.088, R-404A = 3.922, SF6 = 22.800. Una recarga de tan solo 1 kg de SF6 equivale a 22,8 toneladas de CO2. La herramienta incluye 20 gases refrigerantes con sus PCA del AR6.' }),

  // ── Alcance 2: Electricidad ──
  H2({ children: 'Alcance 2 — Electricidad' }),
  P({ children: 'Las emisiones por consumo electrico dependen de la comercializadora contratada, ya que cada una tiene un mix energetico diferente (% renovable, gas, carbon, nuclear). El MITECO y la CNMC publican anualmente los factores:' }),

  Formula({ children: 'Emisiones (t CO2) = Consumo (kWh)  x  Factor comercializadora (kg CO2/kWh)  /  1000\n\nSi la organizacion tiene Garantia de Origen (GdO) renovable → Emisiones = 0 t CO2' }),

  React.createElement(View, { style: { ...s.box, ...s.boxGreen } },
    React.createElement(Text, { style: { ...s.pSmall, color: C.darkGreen, marginBottom: 0 } },
      React.createElement(B, null, 'Garantia de Origen (GdO): '),
      'Es un certificado que acredita que la electricidad consumida proviene de fuentes renovables. Si tienes GdO, tus emisiones de Alcance 2 son 0. La herramienta tiene un toggle para activarlo por cada punto de suministro.'
    ),
  ),

  // ── Tabla ejemplo factores ──
  H3({ children: 'Ejemplo de factores de emision cargados' }),
  React.createElement(View, { style: { borderWidth: 0.5, borderColor: C.borderGray, borderRadius: 4, overflow: 'hidden', marginBottom: 6 } },
    React.createElement(View, { style: s.tableHeader },
      React.createElement(Text, { style: { ...s.tableCellBold, width: '30%' } }, 'Combustible'),
      React.createElement(Text, { style: { ...s.tableCellBold, width: '15%' } }, 'Unidad'),
      React.createElement(Text, { style: { ...s.tableCellBold, width: '18%' } }, 'FE CO2 (kg)'),
      React.createElement(Text, { style: { ...s.tableCellBold, width: '18%' } }, 'FE CH4 (kg)'),
      React.createElement(Text, { style: { ...s.tableCellBold, width: '19%' } }, 'FE N2O (kg)'),
    ),
    ...[
      ['Gas Natural', 'kWh', '0.202', '0.00004', '0.00001'],
      ['Gasoleo C', 'litro', '2.868', '0.00022', '0.00004'],
      ['GLP', 'litro', '1.656', '0.00037', '0.00002'],
      ['Gasolina (vehiculos)', 'litro', '2.196', '0.00086', '0.00026'],
      ['Diesel (vehiculos)', 'litro', '2.471', '0.00010', '0.00040'],
    ].map((row, i) => React.createElement(View, { key: i, style: { ...s.tableRow, backgroundColor: i % 2 === 0 ? C.white : C.lightGray } },
      React.createElement(Text, { style: { ...s.tableCell, width: '30%' } }, row[0]),
      React.createElement(Text, { style: { ...s.tableCell, width: '15%' } }, row[1]),
      React.createElement(Text, { style: { ...s.tableCell, width: '18%' } }, row[2]),
      React.createElement(Text, { style: { ...s.tableCell, width: '18%' } }, row[3]),
      React.createElement(Text, { style: { ...s.tableCell, width: '19%' } }, row[4]),
    )),
  ),
  PSmall({ children: 'Fuente: Calculadora MITECO V.31 (calculadora_hc_tcm30-485617.xlsx). Datos completos en data/emission_factors.json.' }),

  Footer({ pageNum: 2 }),
);

// ═══════════════════════════════════════════════════════════════
// PÁGINA 3: Arquitectura, organización de datos y edición
// ═══════════════════════════════════════════════════════════════
const Page3 = () => React.createElement(Page, { size: 'A4', style: s.page },
  React.createElement(View, { style: { ...s.headerBar, padding: 12 } },
    React.createElement(Text, { style: { ...s.headerTitle, fontSize: 14 } }, 'Arquitectura y Organizacion de Datos'),
    React.createElement(View, { style: s.badge }, React.createElement(Text, { style: s.badgeText }, 'Pagina 3/4')),
  ),

  // ── Pipeline de agentes ──
  H2({ children: 'Sistema de agentes: como fluyen los datos' }),
  P({ children: 'Cada vez que un usuario anade, modifica o elimina un dato, el sistema ejecuta un pipeline de agentes en cadena. Esto garantiza que ningun dato se guarde sin validar, que todo quede auditado y que las emisiones se recalculen automaticamente:' }),

  React.createElement(View, { style: s.archRow },
    ArchBox({ label: 'Accion\ndel usuario', bg: C.lightGray }),
    Arrow(),
    ArchBox({ label: 'Orquestador\n(orchestrator.ts)', bg: C.mintGreen }),
    Arrow(),
    ArchBox({ label: 'AuditAgent\n(audit-agent.ts)', bg: C.lightAmber }),
    Arrow(),
    ArchBox({ label: 'ValidationAgent\n(validation-agent.ts)', bg: C.lightBlue }),
    Arrow(),
    ArchBox({ label: 'CalcAgent\n(calc-agent.ts)', bg: C.mintGreen }),
    Arrow(),
    ArchBox({ label: 'Alertas\n(>10% variacion)', bg: C.lightAmber }),
  ),

  NumBullet({ n: 1, children: 'Orquestador (orchestrator.ts) — Recibe el evento de cambio y coordina la ejecucion secuencial de todos los agentes. Es el punto de entrada unico del sistema.' }),
  NumBullet({ n: 2, children: 'AuditAgent (audit-agent.ts) — Registra en store/audit_log.csv quien hizo que, cuando y con que datos. Genera un UUID unico por cada accion.' }),
  NumBullet({ n: 3, children: 'ValidationAgent (validation-agent.ts) — Valida que los datos sean coherentes: anos razonables (2007-2030), valores no negativos, tipos de combustible existentes, campos obligatorios.' }),
  NumBullet({ n: 4, children: 'CalcAgent (calc-agent.ts) — Aplica todas las formulas del MITECO para recalcular las emisiones totales de la organizacion. Los resultados se guardan en el JSON del ano correspondiente.' }),
  NumBullet({ n: 5, children: 'Alertas — Si la variacion respecto al calculo anterior supera el 10%, se genera una alerta automatica visible en el dashboard.' }),

  // ── Organización de datos ──
  H2({ children: 'Como estan organizados los datos' }),
  P({ children: 'El sistema usa almacenamiento basado en archivos (JSON + CSV), sin necesidad de base de datos externa. Esto simplifica el despliegue y permite version control de los propios datos:' }),

  React.createElement(View, { style: s.tree },
    React.createElement(Text, { style: s.treeLine }, 'data/'),
    React.createElement(Text, { style: s.treeLine }, '  emission_factors.json    ← Factores MITECO (generado por parse_excel_to_json.py)'),
    React.createElement(Text, { style: s.treeLine }, '  dropdowns.json           ← Listas desplegables (combustibles, gases, comercializadoras)'),
    React.createElement(Text, { style: s.treeLine }, '  orgs/'),
    React.createElement(Text, { style: s.treeLine }, '    org_001/               ← Datos de cada organizacion, aislados'),
    React.createElement(Text, { style: s.treeLine }, '      2024/                ← Datos por ano de calculo'),
    React.createElement(Text, { style: s.treeLine }, '        organizacion.json   ← Datos generales (nombre, CIF, CNAE)'),
    React.createElement(Text, { style: s.treeLine }, '        scope1_fijas.json   ← Combustion fija'),
    React.createElement(Text, { style: s.treeLine }, '        scope1_vehiculos.json ← Vehiculos'),
    React.createElement(Text, { style: s.treeLine }, '        scope1_fugitivas.json ← Gases refrigerantes'),
    React.createElement(Text, { style: s.treeLine }, '        scope2_elect.json   ← Electricidad'),
    React.createElement(Text, { style: s.treeLine }, '        resultados.json     ← Totales calculados'),
    React.createElement(Text, { style: s.treeLine }, 'store/'),
    React.createElement(Text, { style: s.treeLine }, '  users.csv                ← Usuarios (id, email, hash, rol, org_id)'),
    React.createElement(Text, { style: s.treeLine }, '  organizations.csv        ← Organizaciones registradas'),
    React.createElement(Text, { style: s.treeLine }, '  audit_log.csv            ← Log de auditoria completo'),
  ),

  // ── Cómo editar/modificar ──
  H2({ children: 'Como modificar y personalizar la herramienta' }),
  P({ children: 'La herramienta esta disenada para ser facilmente editable y extensible. Estos son los puntos clave para personalizarla:' }),

  React.createElement(View, { style: { ...s.box, ...s.boxBlue } },
    React.createElement(Text, { style: { ...s.pSmall, color: C.darkBlue, marginBottom: 2 } },
      React.createElement(B, null, 'Actualizar factores de emision: '),
      'Editar directamente data/emission_factors.json o volver a ejecutar python scripts/parse_excel_to_json.py con un Excel MITECO mas reciente. Los nuevos factores se aplican inmediatamente en los calculos.'
    ),
  ),
  React.createElement(View, { style: { ...s.box, ...s.boxBlue } },
    React.createElement(Text, { style: { ...s.pSmall, color: C.darkBlue, marginBottom: 2 } },
      React.createElement(B, null, 'Modificar formulas de calculo: '),
      'Las formulas estan en src/lib/agents/calc-agent.ts. Cada funcion esta documentada y con tipos TypeScript. Puedes anadir nuevos gases, combustibles o ajustar los PCA sin tocar nada mas.'
    ),
  ),
  React.createElement(View, { style: { ...s.box, ...s.boxBlue } },
    React.createElement(Text, { style: { ...s.pSmall, color: C.darkBlue, marginBottom: 2 } },
      React.createElement(B, null, 'Anadir nuevas secciones: '),
      'Crear un nuevo archivo en src/app/nueva-seccion/page.tsx siguiendo el patron de las paginas existentes. Next.js App Router genera la ruta automaticamente.'
    ),
  ),
  React.createElement(View, { style: { ...s.box, ...s.boxBlue } },
    React.createElement(Text, { style: { ...s.pSmall, color: C.darkBlue, marginBottom: 2 } },
      React.createElement(B, null, 'Cambiar estilos: '),
      'Los estilos estan en src/app/globals.css (clases Tailwind personalizadas) y tailwind.config.ts. El color principal se puede cambiar modificando las clases .btn-primary, .card, etc.'
    ),
  ),
  React.createElement(View, { style: { ...s.box, ...s.boxBlue } },
    React.createElement(Text, { style: { ...s.pSmall, color: C.darkBlue, marginBottom: 2 } },
      React.createElement(B, null, 'Gestionar usuarios: '),
      'Los usuarios se gestionan desde la interfaz web (/admin/usuarios) o editando directamente store/users.csv. Las contrasenas se almacenan como hash bcrypt.'
    ),
  ),

  Footer({ pageNum: 3 }),
);

// ═══════════════════════════════════════════════════════════════
// PÁGINA 4: Secciones, stack y filosofía
// ═══════════════════════════════════════════════════════════════
const Page4 = () => React.createElement(Page, { size: 'A4', style: s.page },
  React.createElement(View, { style: { ...s.headerBar, padding: 12 } },
    React.createElement(Text, { style: { ...s.headerTitle, fontSize: 14 } }, 'Secciones, Stack y Vision del Proyecto'),
    React.createElement(View, { style: s.badge }, React.createElement(Text, { style: s.badgeText }, 'Pagina 4/4')),
  ),

  // ── Secciones ──
  H2({ children: 'Las 13 secciones de la aplicacion' }),
  ...[
    ['Dashboard', 'Panel principal con 4 KPIs (emisiones totales, Alcance 1, Alcance 2, ratio por empleado) y graficos interactivos de barras y circulares.'],
    ['Organizacion', 'Datos generales: nombre, CIF, CNAE, numero de empleados, facturacion. Necesarios para los ratios e informe final.'],
    ['Instalaciones fijas', 'Alcance 1. Consumo de combustible en calderas, hornos, generadores. Seleccion de combustible, cantidad y calculo automatico.'],
    ['Vehiculos', 'Alcance 1. Flota propia con dos metodos: A1 (por litros consumidos) y A2 (por km recorridos). Categorias de vehiculo.'],
    ['Fugitivas', 'Alcance 1. Recargas de gas refrigerante en equipos de climatizacion. Vista previa del calculo (recarga x PCA) antes de guardar.'],
    ['Proceso', 'Alcance 1. Emisiones de procesos industriales (clinker, cal, vidrio). El usuario introduce directamente las toneladas de CO2.'],
    ['Renovables', 'Alcance 1 informativo. Biomasa y biocombustibles. Las emisiones biogenicas se reportan pero no computan en el total (GHG Protocol).'],
    ['Electricidad', 'Alcance 2. Consumo kWh por comercializadora con factor CNMC. Toggle de Garantia de Origen que pone emisiones a 0.'],
    ['Resultados', 'Resumen total con desglose por alcance y categoria. Graficos finales y tabla resumen lista para el informe.'],
    ['Informes', 'Descarga en 4 formatos con un clic: Excel MITECO, CSV, JSON, PDF. Cada formato optimizado para su caso de uso.'],
    ['Factores', 'Tabla de consulta read-only con todos los factores cargados: combustibles fijos, vehiculos, gases (20 tipos), electricidad.'],
    ['Usuarios', 'Admin. CRUD de usuarios: crear, asignar rol, activar/desactivar. Tres roles: admin, editor, viewer.'],
    ['Auditoria', 'Admin. Log completo de acciones con filtros por usuario, tipo de accion y fecha. Hasta 200 registros por pagina.'],
  ].map(([title, desc], i) => React.createElement(View, { key: i, style: { ...s.bulletRow, marginBottom: 3 } },
    React.createElement(Text, { style: { ...s.bulletDot, color: C.green, width: 8 } }, '•'),
    React.createElement(Text, { style: { ...s.bulletText } },
      React.createElement(B, null, `${title}: `),
      desc,
    ),
  )),

  // ── Stack ──
  H2({ children: 'Stack tecnologico' }),
  React.createElement(View, { style: s.techRow },
    ...['Next.js 14', 'TypeScript', 'TailwindCSS', 'Recharts', 'Zustand', 'Zod', 'NextAuth.js', 'ExcelJS', 'PapaParse', '@react-pdf/renderer', 'Python (parser)'].map(t => TechBadge({ label: t }))
  ),
  PSmall({ children: 'Next.js 14 (App Router, SSR) como framework web. TypeScript para tipado estatico. Tailwind para estilos responsive. Recharts para graficos interactivos. Zustand para estado global. Zod para validacion de schemas. NextAuth.js para autenticacion JWT. ExcelJS y PapaParse para exportacion. Python + openpyxl para el parser inicial del Excel MITECO.' }),

  // ── Reflexión final ──
  H2({ children: 'Reflexion: como se debe digitalizar' }),
  React.createElement(View, { style: { ...s.box, ...s.boxGreen, marginTop: 2 } },
    P({ children: 'La digitalizacion no consiste en replicar un formulario en papel dentro de un navegador. Consiste en entender el flujo completo del dato — desde su origen hasta su uso final — y disenear un sistema que lo haga mas fiable, mas accesible y mas util.' }),
    P({ children: 'Este proyecto demuestra que una herramienta gubernamental basada en Excel, con 13 pestanas y formulas ocultas, puede transformarse en una aplicacion web moderna, con validacion en tiempo real, auditoria automatica, graficos interactivos y exportacion multi-formato. Y todo ello manteniendo las mismas formulas oficiales del MITECO, verificadas con tests automatizados.' }),
    React.createElement(Text, { style: { ...s.p, marginBottom: 0 } },
      React.createElement(B, null, 'La clave: '),
      'no sustituir el Excel por otro Excel. Sustituirlo por un sistema que haga imposible equivocarse, obligatorio auditar y facil colaborar.'
    ),
  ),

  // ── Ejecución ──
  H3({ children: 'Como ejecutar' }),
  Formula({ children: 'git clone https://github.com/Ntizar/HuelladeCarbono.git\ncd HuelladeCarbono\nnpm install\nnpm run dev\n→ Abrir http://localhost:3000  ·  Demo: admin@demo.com / demo123' }),

  Footer({ pageNum: 4 }),
);

// ═══════════════════════════════════════════════════════════════
// DOCUMENTO COMPLETO
// ═══════════════════════════════════════════════════════════════
const PDFDocument = () => React.createElement(Document, {
  title: 'Calculadora de Huella de Carbono — Explicacion de la Herramienta',
  author: 'David Antizar',
  subject: 'Documentacion del sustituto SaaS de la calculadora Excel MITECO V.31',
  keywords: 'huella carbono, MITECO, GHG Protocol, SaaS, Next.js',
},
  Page1(),
  Page2(),
  Page3(),
  Page4(),
);

// ── Main ──
async function main() {
  const outputPath = './docs/Explicacion_Herramienta_Huella_de_Carbono.pdf';
  const fs = await import('fs');
  if (!fs.existsSync('./docs')) fs.mkdirSync('./docs', { recursive: true });
  await renderToFile(React.createElement(PDFDocument), outputPath);
  console.log(`✅ PDF generado con 4 paginas: ${outputPath}`);
}

main().catch(err => {
  console.error('Error generando PDF:', err);
  process.exit(1);
});
