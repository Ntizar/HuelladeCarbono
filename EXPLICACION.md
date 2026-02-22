# 🌿 Calculadora de Huella de Carbono — Explicación de la Herramienta

> **Desarrollado por David Antizar** · Febrero 2026  
> Sustituto SaaS de la Calculadora Excel V.31 del MITECO · GHG Protocol Alcance 1+2

📄 **[Descargar explicación en PDF](docs/Explicacion_Herramienta_Huella_de_Carbono.pdf)**

---

## ¿Qué es esta herramienta?

Es una **aplicación web completa (SaaS)** que digitaliza y mejora la [calculadora oficial Excel V.31](https://www.miteco.gob.es/es/cambio-climatico/temas/mitigacion-politicas-y-medidas/calculadoras.html) del **Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO)** de España.

Permite calcular la **huella de carbono organizacional** siguiendo el estándar **GHG Protocol**, cubriendo:

- **Alcance 1** — Emisiones directas: combustión fija, vehículos, gases refrigerantes, procesos industriales
- **Alcance 2** — Emisiones indirectas: consumo de electricidad adquirida

---

## 🔄 Del Excel oficial a la nueva herramienta

| Aspecto | Excel MITECO V.31 ❌ | Nueva herramienta web ✅ |
|---------|----------------------|--------------------------|
| **Acceso** | Archivo local `.xlsx` | App web desde cualquier navegador |
| **Usuarios** | Un solo usuario a la vez | Multi-usuario con roles (Admin, Editor, Viewer) |
| **Auditoría** | Sin historial de cambios | Log completo de cada acción con timestamp |
| **Fórmulas** | Ocultas en celdas, difíciles de verificar | Motor de cálculo transparente y testado |
| **Validación** | Sin validación en tiempo real | Validación instantánea con schemas Zod |
| **Exportación** | Solo `.xlsx` | Excel, CSV, JSON y PDF |
| **Visualización** | Sin gráficos interactivos | Dashboard con KPIs y gráficos Recharts |
| **Interfaz** | 13 pestañas de Excel complejas | UI moderna, intuitiva y responsive |
| **Multi-organización** | Un archivo por empresa | Multi-tenancy: datos aislados por organización |
| **Colaboración** | Enviar archivos por email | Acceso simultáneo con control de roles |
| **Seguridad** | Sin protección | Autenticación con NextAuth.js + bcrypt |

---

## 🏗️ Arquitectura del sistema

```
┌──────────┐     ┌──────────────┐     ┌────────────┐     ┌─────────────────┐     ┌───────────┐     ┌──────────┐
│ Usuario  │ ──→ │ Orquestador  │ ──→ │ AuditAgent │ ──→ │ ValidationAgent │ ──→ │ CalcAgent │ ──→ │ Alertas  │
└──────────┘     └──────────────┘     └────────────┘     └─────────────────┘     └───────────┘     └──────────┘
```

Cada cambio de datos pasa por el **pipeline completo de agentes**:

1. **AuditAgent** → Registra la acción en el log de auditoría (quién, qué, cuándo)
2. **ValidationAgent** → Valida coherencia de datos (años, valores numéricos, tipos de combustible)
3. **CalcAgent** → Recalcula todas las emisiones con las fórmulas oficiales MITECO
4. **NotifyAgent** → Detecta variaciones >10% y genera alertas automáticas

---

## ✨ Mejoras principales

### 📊 Dashboard en tiempo real
KPIs de emisiones totales, desglose Alcance 1 vs 2, gráficos de barras y circulares interactivos con Recharts. Visión global instantánea.

### 🏢 Multi-tenancy
Cada organización tiene sus datos aislados por carpeta (`data/orgs/{org_id}/{año}/`). Soporte para todos los años del MITECO (2007-2024).

### 🔐 Sistema de roles y autenticación
Autenticación segura con NextAuth.js y bcrypt. Tres roles diferenciados:
- **Admin** — Gestión completa: usuarios, datos, informes, auditoría
- **Editor** — Crear y editar datos de emisiones
- **Viewer** — Solo lectura de datos e informes

### 📜 Auditoría completa
Cada acción se registra con timestamp, usuario, tipo de acción y detalle. Panel de auditoría con filtros por usuario, fecha y tipo de acción.

### ⚡ Cálculo automático
Al añadir o modificar datos se recalculan automáticamente todas las emisiones. Las fórmulas del MITECO están verificadas con **tests unitarios**.

### 📥 4 formatos de exportación
- **Excel** — Compatible con el formato oficial MITECO V.31
- **CSV** — Para análisis en herramientas externas (Power BI, Tableau)
- **JSON** — Para integración con APIs y sistemas externos
- **PDF** — Resumen ejecutivo para presentaciones

---

## 🧮 Fórmulas de cálculo

Las fórmulas implementadas son **exactamente las del MITECO V.31** con los PCA del **AR6 del IPCC**:

### Alcance 1 — Combustión (fija y móvil)
```
CO₂e = (Cantidad × FE_CO₂) + (Cantidad × FE_CH₄ × 27.9) + (Cantidad × FE_N₂O × 273)
```
- PCA CH₄ = **27.9** (AR6 IPCC)
- PCA N₂O = **273** (AR6 IPCC)

### Alcance 1 — Emisiones fugitivas
```
Emisiones (t CO₂e) = Recarga (kg) × PCA del gas / 1000
```

### Alcance 2 — Electricidad
```
Emisiones (t CO₂) = kWh × Factor_emisión_comercializadora / 1000
Si Garantía de Origen (GdO) renovable → Emisiones = 0
```

---

## 📱 Secciones de la aplicación

| Sección | Descripción |
|---------|-------------|
| **Dashboard** | Panel principal con KPIs y gráficos interactivos |
| **Organización** | Datos generales: nombre, CIF, CNAE, empleados, facturación |
| **Alcance 1 — Instalaciones** | Combustión fija: calderas, hornos, generadores |
| **Alcance 1 — Vehículos** | Flota propia: por combustible (A1) o distancia (A2) |
| **Alcance 1 — Fugitivas** | Gases refrigerantes: HFC, R-410A, SF₆ (recarga × PCA) |
| **Alcance 1 — Proceso** | Emisiones industriales directas (clinker, cal, vidrio) |
| **Alcance 1 — Renovables** | Biomasa y biocombustibles (informativo, biogénicas) |
| **Alcance 2 — Electricidad** | Consumo kWh por comercializadora + toggle GdO |
| **Resultados** | Resumen total con gráficos y desglose por categoría |
| **Informes** | Descarga en Excel / CSV / JSON / PDF |
| **Factores de emisión** | Tabla completa MITECO (combustibles, gases, electricidad) |
| **Admin — Usuarios** | Crear, editar roles, activar/desactivar usuarios |
| **Admin — Auditoría** | Log completo con filtros por acción, usuario y fecha |

---

## 🛠️ Stack tecnológico

| Tecnología | Uso |
|-----------|-----|
| **Next.js 14** | Framework web (App Router, SSR) |
| **TypeScript** | Tipado estático en todo el proyecto |
| **TailwindCSS** | Estilos y diseño responsive |
| **Recharts** | Gráficos interactivos (barras, circular) |
| **Zustand** | Gestión de estado global |
| **Zod** | Validación de schemas y datos |
| **NextAuth.js** | Autenticación y gestión de sesiones |
| **ExcelJS** | Generación de Excel compatible MITECO |
| **PapaParse** | Lectura/escritura CSV |
| **@react-pdf/renderer** | Generación de PDFs |

---

## 🚀 Cómo ejecutar

```bash
git clone https://github.com/d-antizar/HuelladeCarbono.git
cd HuelladeCarbono
npm install
npm run dev
```

Abrir **http://localhost:3000** · Credenciales demo: `admin@demo.com` / `demo123`

---

<p align="center">
  <strong>Desarrollado por David Antizar</strong><br>
  Basado en la Calculadora MITECO V.31 · GHG Protocol · AR6 IPCC
</p>
