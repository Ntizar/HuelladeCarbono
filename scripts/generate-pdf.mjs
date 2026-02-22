/**
 * Script para generar el PDF explicativo de la herramienta
 * Ejecutar: node scripts/generate-pdf.mjs
 */

import React from 'react';
import { renderToFile, Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

const green = '#16a34a';
const darkGreen = '#15803d';
const blue = '#2563eb';
const gray = '#6b7280';
const darkGray = '#374151';
const lightGray = '#f3f4f6';
const white = '#ffffff';

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: white,
  },
  // Header
  headerBar: {
    backgroundColor: green,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#bbf7d0',
    marginTop: 4,
  },
  headerBadge: {
    backgroundColor: '#bbf7d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  headerBadgeText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: darkGreen,
  },
  // Author
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  authorText: {
    fontSize: 9,
    color: gray,
  },
  authorName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: darkGray,
  },
  // Section
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: darkGreen,
    marginBottom: 8,
    marginTop: 12,
  },
  paragraph: {
    fontSize: 9,
    color: darkGray,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  // Comparison columns
  compRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  compCol: {
    flex: 1,
    borderRadius: 6,
    padding: 12,
  },
  compColExcel: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  compColNew: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  compColTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  compItem: {
    fontSize: 8,
    color: darkGray,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  // Feature grid
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  featureCard: {
    width: '48%',
    backgroundColor: lightGray,
    borderRadius: 6,
    padding: 10,
  },
  featureCardTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: darkGray,
    marginBottom: 3,
  },
  featureCardDesc: {
    fontSize: 7.5,
    color: gray,
    lineHeight: 1.4,
  },
  // Architecture
  archRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  archBoxGreen: {
    backgroundColor: '#dcfce7',
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  archBoxAmber: {
    backgroundColor: '#fef3c7',
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  archBoxText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: darkGray,
  },
  archArrow: {
    fontSize: 10,
    color: gray,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: gray,
  },
  // Tech stack
  techRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },
  techBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  techBadgeText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: blue,
  },
  // Improvements list  
  improvementRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 4,
  },
  improvementBullet: {
    fontSize: 8,
    color: green,
    marginRight: 5,
    fontFamily: 'Helvetica-Bold',
  },
  improvementText: {
    fontSize: 8,
    color: darkGray,
    lineHeight: 1.4,
    flex: 1,
  },
  linkText: {
    fontSize: 9,
    color: blue,
    textDecoration: 'underline',
  },
});

const Bullet = ({ children }) => (
  React.createElement(View, { style: s.improvementRow },
    React.createElement(Text, { style: s.improvementBullet }, '✓'),
    React.createElement(Text, { style: s.improvementText }, children)
  )
);

const TechBadge = ({ label }) => (
  React.createElement(View, { style: s.techBadge },
    React.createElement(Text, { style: s.techBadgeText }, label)
  )
);

const FeatureCard = ({ title, desc }) => (
  React.createElement(View, { style: s.featureCard },
    React.createElement(Text, { style: s.featureCardTitle }, title),
    React.createElement(Text, { style: s.featureCardDesc }, desc)
  )
);

const ArchBox = ({ label, style }) => (
  React.createElement(View, { style: [style || s.archBox] },
    React.createElement(Text, { style: s.archBoxText }, label)
  )
);

const Arrow = () => React.createElement(Text, { style: s.archArrow }, '→');

const PDFDocument = () => (
  React.createElement(Document, { title: 'Calculadora Huella de Carbono - Explicación', author: 'David Antizar' },
    React.createElement(Page, { size: 'A4', style: s.page },

      // ===== HEADER =====
      React.createElement(View, { style: s.headerBar },
        React.createElement(View, null,
          React.createElement(Text, { style: s.headerTitle }, 'Calculadora de Huella de Carbono'),
          React.createElement(Text, { style: s.headerSubtitle }, 'Sustituto SaaS de la Calculadora Excel V.31 del MITECO · GHG Protocol Alcance 1+2'),
        ),
        React.createElement(View, { style: s.headerBadge },
          React.createElement(Text, { style: s.headerBadgeText }, 'VERSIÓN WEB'),
        ),
      ),

      // ===== AUTHOR =====
      React.createElement(View, { style: s.authorRow },
        React.createElement(Text, { style: s.authorText },
          React.createElement(Text, { style: s.authorName }, 'Desarrollado por David Antizar'),
          '  ·  Febrero 2026',
        ),
        React.createElement(Link, { src: 'https://github.com/d-antizar/HuelladeCarbono', style: s.linkText }, 'github.com/d-antizar/HuelladeCarbono'),
      ),

      // ===== QUÉ ES =====
      React.createElement(Text, { style: s.sectionTitle }, '¿Qué es esta herramienta?'),
      React.createElement(Text, { style: s.paragraph },
        'Es una aplicación web completa (SaaS) que digitaliza y mejora la calculadora oficial Excel V.31 del Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO) de España. Permite calcular la huella de carbono organizacional siguiendo el estándar GHG Protocol, cubriendo las emisiones de Alcance 1 (directas) y Alcance 2 (electricidad).'
      ),

      // ===== COMPARACIÓN =====
      React.createElement(Text, { style: s.sectionTitle }, 'Del Excel oficial a la nueva herramienta'),
      React.createElement(View, { style: s.compRow },
        // Excel column
        React.createElement(View, { style: [s.compCol, s.compColExcel] },
          React.createElement(Text, { style: [s.compColTitle, { color: '#dc2626' }] }, 'Excel MITECO V.31 (antes)'),
          React.createElement(Text, { style: s.compItem }, '• Archivo local .xlsx, sin colaboración'),
          React.createElement(Text, { style: s.compItem }, '• Un solo usuario a la vez'),
          React.createElement(Text, { style: s.compItem }, '• Sin control de versiones ni auditoría'),
          React.createElement(Text, { style: s.compItem }, '• Fórmulas ocultas en celdas, difíciles de verificar'),
          React.createElement(Text, { style: s.compItem }, '• Sin validación de datos en tiempo real'),
          React.createElement(Text, { style: s.compItem }, '• Exportación limitada (solo .xlsx)'),
          React.createElement(Text, { style: s.compItem }, '• Sin gráficos interactivos'),
          React.createElement(Text, { style: s.compItem }, '• Interfaz compleja con 13 pestañas'),
        ),
        // New tool column
        React.createElement(View, { style: [s.compCol, s.compColNew] },
          React.createElement(Text, { style: [s.compColTitle, { color: darkGreen }] }, 'Nueva herramienta web (ahora)'),
          React.createElement(Text, { style: s.compItem }, '• Aplicación web accesible desde cualquier navegador'),
          React.createElement(Text, { style: s.compItem }, '• Multi-usuario con roles (Admin, Editor, Viewer)'),
          React.createElement(Text, { style: s.compItem }, '• Log de auditoría completo de cada acción'),
          React.createElement(Text, { style: s.compItem }, '• Motor de cálculo transparente y validado con tests'),
          React.createElement(Text, { style: s.compItem }, '• Validación instantánea con Zod schemas'),
          React.createElement(Text, { style: s.compItem }, '• Exportación multi-formato: Excel, CSV, JSON, PDF'),
          React.createElement(Text, { style: s.compItem }, '• Dashboard con gráficos Recharts interactivos'),
          React.createElement(Text, { style: s.compItem }, '• Interfaz moderna, intuitiva y responsive'),
        ),
      ),

      // ===== ARQUITECTURA VISUAL =====
      React.createElement(Text, { style: s.sectionTitle }, 'Arquitectura del sistema de agentes'),
      React.createElement(View, { style: s.archRow },
        ArchBox({ label: 'Usuario', style: s.archBox }),
        Arrow(),
        ArchBox({ label: 'Orquestador', style: s.archBoxGreen }),
        Arrow(),
        ArchBox({ label: 'AuditAgent', style: s.archBoxAmber }),
        Arrow(),
        ArchBox({ label: 'ValidationAgent', style: s.archBox }),
        Arrow(),
        ArchBox({ label: 'CalcAgent', style: s.archBoxGreen }),
        Arrow(),
        ArchBox({ label: 'Alertas', style: s.archBoxAmber }),
      ),
      React.createElement(Text, { style: { ...s.paragraph, textAlign: 'center', fontSize: 7.5, color: gray, marginTop: 2 } },
        'Cada cambio de datos pasa por el pipeline completo: registro → validación → recálculo → notificación'
      ),

      // ===== MEJORAS CLAVE =====
      React.createElement(Text, { style: s.sectionTitle }, 'Mejoras principales'),
      React.createElement(View, { style: s.featureGrid },
        FeatureCard({ title: 'Dashboard en tiempo real', desc: 'KPIs, gráficos de barras y circulares con Recharts. Visión global de emisiones Alcance 1 vs 2.' }),
        FeatureCard({ title: 'Multi-tenancy', desc: 'Cada organización tiene sus datos aislados por carpeta. Soporte multi-año (2007-2024).' }),
        FeatureCard({ title: 'Sistema de roles y auth', desc: 'Autenticación con NextAuth.js. Tres roles: admin (todo), editor (datos), viewer (lectura).' }),
        FeatureCard({ title: 'Auditoría completa', desc: 'Cada acción se registra con timestamp, usuario y detalle. Panel de auditoría con filtros.' }),
        FeatureCard({ title: 'Cálculo automático', desc: 'Al añadir datos se recalculan todas las emisiones. Fórmulas MITECO verificadas con tests unitarios.' }),
        FeatureCard({ title: '4 formatos de exportación', desc: 'Excel compatible MITECO, CSV para análisis, JSON para APIs, PDF resumen ejecutivo.' }),
      ),

      // ===== TECH STACK =====
      React.createElement(Text, { style: s.sectionTitle }, 'Stack tecnológico'),
      React.createElement(View, { style: s.techRow },
        TechBadge({ label: 'Next.js 14' }),
        TechBadge({ label: 'TypeScript' }),
        TechBadge({ label: 'TailwindCSS' }),
        TechBadge({ label: 'Recharts' }),
        TechBadge({ label: 'Zustand' }),
        TechBadge({ label: 'Zod' }),
        TechBadge({ label: 'NextAuth.js' }),
        TechBadge({ label: 'ExcelJS' }),
        TechBadge({ label: 'PapaParse' }),
      ),

      // ===== SECCIONES DE LA APP =====
      React.createElement(Text, { style: s.sectionTitle }, 'Secciones de la aplicación'),
      Bullet({ children: 'Organización: datos generales (nombre, CNAE, empleados, facturación)' }),
      Bullet({ children: 'Alcance 1 – Instalaciones fijas: combustión en calderas, hornos, generadores' }),
      Bullet({ children: 'Alcance 1 – Vehículos: flota propia por combustible (A1) o distancia (A2)' }),
      Bullet({ children: 'Alcance 1 – Fugitivas: fugas de gases refrigerantes HFC, SF₆ (recarga × PCA)' }),
      Bullet({ children: 'Alcance 1 – Proceso: emisiones industriales directas (clinker, cal, vidrio)' }),
      Bullet({ children: 'Alcance 1 – Renovables: biomasa y biocombustibles (informativo, biogénicas)' }),
      Bullet({ children: 'Alcance 2 – Electricidad: consumo kWh por comercializadora, toggle GdO renovable' }),
      Bullet({ children: 'Resultados: resumen total con gráficos y desglose por categoría' }),
      Bullet({ children: 'Informes: descarga en Excel/CSV/JSON/PDF con un clic' }),
      Bullet({ children: 'Factores de emisión: tabla completa MITECO (combustibles, gases, electricidad)' }),
      Bullet({ children: 'Admin: gestión de usuarios y panel de auditoría con filtros' }),

      // ===== FOOTER =====
      React.createElement(View, { style: s.footer },
        React.createElement(Text, { style: s.footerText }, 'Calculadora de Huella de Carbono · David Antizar · 2026'),
        React.createElement(Text, { style: s.footerText }, 'Basado en la Calculadora MITECO V.31 · GHG Protocol · AR6 IPCC'),
      ),
    )
  )
);

async function main() {
  const outputPath = './docs/Explicacion_Herramienta_Huella_de_Carbono.pdf';
  const fs = await import('fs');
  if (!fs.existsSync('./docs')) fs.mkdirSync('./docs', { recursive: true });
  
  await renderToFile(React.createElement(PDFDocument), outputPath);
  console.log(`✅ PDF generado: ${outputPath}`);
}

main().catch(err => {
  console.error('Error generando PDF:', err);
  process.exit(1);
});
