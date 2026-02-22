# 🌿 Calculadora de Huella de Carbono — Explicación de la Herramienta

> **Desarrollado por David Antizar** · Febrero 2026  
> Sustituto SaaS de la Calculadora Excel V.31 del MITECO · GHG Protocol Alcance 1+2

📄 **[Descargar explicación en PDF](docs/Explicacion_Herramienta_Huella_de_Carbono.pdf)**  
🔗 **[Repositorio en GitHub](https://github.com/Ntizar/HuelladeCarbono)**

---

## ¿Por qué este proyecto? La necesidad de digitalizar bien

El **MITECO** (Ministerio para la Transición Ecológica y el Reto Demográfico) proporciona desde 2007 una calculadora en formato Excel — actualmente la **Versión 31** — para que las organizaciones españolas calculen su huella de carbono y la inscriban en el Registro Nacional. Esta herramienta, aunque funcional, presenta todas las limitaciones inherentes a una hoja de cálculo:

- Un único usuario simultáneo
- Sin historial de cambios ni auditoría
- Fórmulas ocultas en celdas protegidas
- Sin validación de datos al introducirlos
- Envío por email sin control de versiones
- Sin gráficos interactivos ni dashboards

**Digitalizar no es simplemente "pasar algo a la nube".** Digitalizar bien significa **repensar el flujo de trabajo completo**: quién introduce los datos, cómo se validan, cómo se calculan, quién puede verlos, cómo se auditan los cambios y cómo se exportan los resultados.

Esta herramienta nace con esa filosofía: **no copiar el Excel, sino reimaginarlo** como un sistema profesional con las mejores prácticas de ingeniería de software.

> **Principio de diseño:** Una buena digitalización no replica los defectos del formato anterior. Cada campo se valida, cada acción se registra, cada cálculo es transparente y reproducible. El objetivo es que el usuario se concentre en los datos, no en la herramienta.

---

## ¿Qué es esta herramienta?

Es una **aplicación web completa (SaaS)** que digitaliza y mejora la [calculadora oficial Excel V.31](https://www.miteco.gob.es/es/cambio-climatico/temas/mitigacion-politicas-y-medidas/calculadoras.html) del MITECO.

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

## 🧮 Cálculos: explicación detallada

Las fórmulas implementadas son **exactamente las del MITECO V.31** con los PCA del **AR6 del IPCC**.

### Alcance 1 — Combustión fija y móvil

Las emisiones por combustión (calderas, hornos, generadores, vehículos) se calculan multiplicando la cantidad consumida por **tres factores de emisión independientes** — uno para cada gas de efecto invernadero — y convirtiendo CH₄ y N₂O a CO₂-equivalente mediante sus Potenciales de Calentamiento Atmosférico (PCA):

```
Emisiones CO₂     = Cantidad consumida  ×  FE_CO₂  (kg CO₂ / unidad)
Emisiones CH₄     = Cantidad consumida  ×  FE_CH₄  (kg CH₄ / unidad)  ×  27.9  (PCA AR6)
Emisiones N₂O     = Cantidad consumida  ×  FE_N₂O  (kg N₂O / unidad)  ×  273   (PCA AR6)
─────────────────────────────────────────────────────────────────────────────────
Total (kg CO₂e)   = Emisiones CO₂  +  Emisiones CH₄ (como CO₂e)  +  Emisiones N₂O (como CO₂e)
```

**PCA del AR6 del IPCC (2021):**
- **CH₄ = 27.9** — Cada kg de metano calienta lo mismo que 27,9 kg de CO₂ a 100 años
- **N₂O = 273** — Cada kg de óxido nitroso equivale a 273 kg de CO₂ a 100 años

> **Ejemplo práctico:** 50.000 kWh de Gas Natural → FE_CO₂=0,202 kg/kWh, FE_CH₄=0,00004, FE_N₂O=0,00001.  
> Total = (50.000 × 0,202) + (50.000 × 0,00004 × 27,9) + (50.000 × 0,00001 × 273) = 10.100 + 55,8 + 136,5 = **10.292,3 kg CO₂e = 10,29 t CO₂e**

Los factores de emisión están disponibles para: Gas Natural, Gasóleo, Fuel Oil, GLP, Carbón, Biomasa (pellets, astillas, hueso de aceituna), Gasolina, Diésel, Bioetanol, Biodiésel, GNC, GNL, entre otros. Cada combustible tiene sus tres FE específicos según el MITECO V.31.

### Alcance 1 — Emisiones fugitivas (gases refrigerantes)

Las emisiones fugitivas provienen de fugas o recargas de gases fluorados en equipos de refrigeración y climatización. Cada gas tiene un PCA propio:

```
Emisiones (t CO₂e) = Cantidad recargada (kg)  ×  PCA del gas  /  1000
```

**Ejemplos de PCA (AR6 IPCC):**
| Gas | PCA | Ejemplo: 1 kg de fuga = |
|-----|-----|------------------------|
| HFC-134a | 1.430 | 1,43 t CO₂e |
| R-410A | 2.088 | 2,09 t CO₂e |
| R-404A | 3.922 | 3,92 t CO₂e |
| SF₆ | 22.800 | **22,8 t CO₂e** |

La herramienta incluye **20 gases refrigerantes** con sus PCA del AR6, tomados directamente del Excel MITECO.

### Alcance 2 — Electricidad

Las emisiones por consumo eléctrico dependen de la **comercializadora contratada**, ya que cada una tiene un mix energético diferente (% renovable, gas, carbón, nuclear):

```
Emisiones (t CO₂) = Consumo (kWh)  ×  Factor comercializadora (kg CO₂/kWh)  /  1000
```

Si la organización tiene **Garantía de Origen (GdO) renovable** → **Emisiones = 0 t CO₂**

> **Garantía de Origen (GdO):** Es un certificado que acredita que la electricidad consumida proviene de fuentes renovables. Si tienes GdO, tus emisiones de Alcance 2 son 0. La herramienta tiene un toggle para activarlo por cada punto de suministro.

---

## 📊 De dónde salen los factores de emisión

Los factores de emisión son el corazón de la herramienta. Son los coeficientes oficiales que relacionan una actividad (quemar gas, consumir electricidad) con las emisiones de GEI que produce. Provienen de **tres fuentes oficiales**:

### 1. Calculadora Excel MITECO V.31

Los factores de combustibles fijos, vehículos y gases refrigerantes se extrajeron **automáticamente** del Excel oficial del MITECO (`calculadora_hc_tcm30-485617.xlsx`) mediante un script Python:

```bash
python scripts/parse_excel_to_json.py
```

Este script usa la librería `openpyxl` para leer las hojas del archivo Excel, extraer los factores de cada pestaña y convertirlos a JSON estructurado. El resultado se guarda en `data/emission_factors.json`.

**Contenido del archivo de factores:**
- **8 combustibles fijos** (Gas Natural, Gasóleo C, Fuel Oil, GLP, Carbón, Biomasa, etc.)
- **6 combustibles para vehículos** (Gasolina, Diésel, Bioetanol, Biodiésel, GNC, GNL)
- **20 gases refrigerantes** (HFC-23, HFC-32, HFC-125, HFC-134a, HFC-143a, R-404A, R-410A, SF₆, etc.)
- **8+ comercializadoras eléctricas** con su factor CNMC

### 2. CNMC (Comisión Nacional de los Mercados y la Competencia)

Los factores de emisión de las comercializadoras eléctricas se obtienen de la **publicación anual de la CNMC** sobre el mix eléctrico de cada empresa. Se actualizan cada año.

### 3. AR6 del IPCC (2021)

Los Potenciales de Calentamiento Atmosférico (PCA) de CH₄ = 27.9 y N₂O = 273 corresponden al **Sexto Informe de Evaluación del IPCC**, los valores más actualizados internacionalmente.

### Tabla de ejemplo de factores cargados

| Combustible | Unidad | FE CO₂ (kg) | FE CH₄ (kg) | FE N₂O (kg) |
|-------------|--------|-------------|-------------|-------------|
| Gas Natural | kWh | 0,202 | 0,00004 | 0,00001 |
| Gasóleo C | litro | 2,868 | 0,00022 | 0,00004 |
| GLP | litro | 1,656 | 0,00037 | 0,00002 |
| Gasolina (vehículos) | litro | 2,196 | 0,00086 | 0,00026 |
| Diésel (vehículos) | litro | 2,471 | 0,00010 | 0,00040 |

*Fuente: Calculadora MITECO V.31. Datos completos en `data/emission_factors.json`.*

---

## 🏗️ Arquitectura del sistema

### Pipeline de agentes

Cada vez que un usuario añade, modifica o elimina un dato, el sistema ejecuta un **pipeline de agentes en cadena**. Esto garantiza que ningún dato se guarde sin validar, que todo quede auditado y que las emisiones se recalculen automáticamente:

```
┌──────────┐     ┌──────────────┐     ┌────────────┐     ┌─────────────────┐     ┌───────────┐     ┌──────────┐
│ Usuario  │ ──→ │ Orquestador  │ ──→ │ AuditAgent │ ──→ │ ValidationAgent │ ──→ │ CalcAgent │ ──→ │ Alertas  │
└──────────┘     └──────────────┘     └────────────┘     └─────────────────┘     └───────────┘     └──────────┘
```

1. **Orquestador** (`orchestrator.ts`) — Recibe el evento de cambio y coordina la ejecución secuencial de todos los agentes. Punto de entrada único del sistema.
2. **AuditAgent** (`audit-agent.ts`) — Registra en `store/audit_log.csv` quién hizo qué, cuándo y con qué datos. Genera un UUID único por acción.
3. **ValidationAgent** (`validation-agent.ts`) — Valida coherencia de datos: años razonables (2007-2030), valores no negativos, tipos de combustible existentes, campos obligatorios.
4. **CalcAgent** (`calc-agent.ts`) — Aplica todas las fórmulas del MITECO para recalcular las emisiones totales. Resultados en el JSON del año correspondiente.
5. **Alertas** — Si la variación respecto al cálculo anterior supera el 10%, se genera una alerta automática visible en el dashboard.

---

## 📁 Cómo están organizados los datos

El sistema usa **almacenamiento basado en archivos** (JSON + CSV), sin necesidad de base de datos externa. Esto simplifica el despliegue y permite control de versiones de los propios datos:

```
data/
  emission_factors.json    ← Factores MITECO (generado por parse_excel_to_json.py)
  dropdowns.json           ← Listas desplegables (combustibles, gases, comercializadoras)
  orgs/
    org_001/               ← Datos de cada organización, aislados
      2024/                ← Datos por año de cálculo
        organizacion.json   ← Datos generales (nombre, CIF, CNAE)
        scope1_fijas.json   ← Combustión fija
        scope1_vehiculos.json ← Vehículos
        scope1_fugitivas.json ← Gases refrigerantes
        scope2_elect.json   ← Electricidad
        resultados.json     ← Totales calculados
store/
  users.csv                ← Usuarios (id, email, hash, rol, org_id)
  organizations.csv        ← Organizaciones registradas
  audit_log.csv            ← Log de auditoría completo
```

**Ventajas de este enfoque:**
- **Aislamiento total** entre organizaciones: cada una tiene su carpeta independiente
- **Backup sencillo**: copiar la carpeta `data/` y `store/` es un backup completo
- **Histórico por año**: cada año se almacena por separado, permitiendo comparativas anuales
- **Legible por humanos**: los archivos JSON y CSV se pueden abrir y revisar manualmente
- **Sin dependencias externas**: no necesitas instalar ni configurar una base de datos

---

## 🔧 Cómo modificar y personalizar la herramienta

La herramienta está diseñada para ser **fácilmente editable y extensible**:

### Actualizar factores de emisión

Editar directamente `data/emission_factors.json` o volver a ejecutar el parser con un Excel MITECO más reciente:

```bash
python scripts/parse_excel_to_json.py
```

Los nuevos factores se aplican **inmediatamente** en los cálculos, sin necesidad de reiniciar la aplicación.

### Modificar fórmulas de cálculo

Las fórmulas están en `src/lib/agents/calc-agent.ts`. Cada función está documentada y con tipos TypeScript. Puedes:
- Añadir nuevos gases o combustibles
- Ajustar los PCA (por ejemplo, cuando salga el AR7)
- Añadir nuevas categorías de emisión

### Añadir nuevas secciones

Crear un nuevo archivo en `src/app/nueva-seccion/page.tsx` siguiendo el patrón de las páginas existentes. Next.js App Router genera la ruta automáticamente.

### Cambiar estilos

Los estilos están en `src/app/globals.css` (clases Tailwind personalizadas) y `tailwind.config.ts`. El color principal se puede cambiar modificando las clases `.btn-primary`, `.card`, etc.

### Gestionar usuarios

Los usuarios se gestionan desde la interfaz web (`/admin/usuarios`) o editando directamente `store/users.csv`. Las contraseñas se almacenan como hash bcrypt, nunca en texto plano.

### Añadir nuevas comercializadoras eléctricas

Editar la sección correspondiente en `data/emission_factors.json` y `data/dropdowns.json`. La nueva comercializadora aparecerá automáticamente en los desplegables del formulario de electricidad.

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

## 📱 Las 13 secciones de la aplicación

| Sección | Descripción |
|---------|-------------|
| **Dashboard** | Panel principal con 4 KPIs (emisiones totales, Alcance 1, Alcance 2, ratio por empleado) y gráficos interactivos de barras y circulares |
| **Organización** | Datos generales: nombre, CIF, CNAE, número de empleados, facturación. Necesarios para los ratios e informe final |
| **Instalaciones fijas** | Alcance 1. Consumo de combustible en calderas, hornos, generadores. Selección de combustible, cantidad y cálculo automático |
| **Vehículos** | Alcance 1. Flota propia con dos métodos: A1 (por litros consumidos) y A2 (por km recorridos). Categorías de vehículo |
| **Fugitivas** | Alcance 1. Recargas de gas refrigerante en equipos de climatización. Vista previa del cálculo (recarga × PCA) antes de guardar |
| **Proceso** | Alcance 1. Emisiones de procesos industriales (clínker, cal, vidrio). El usuario introduce directamente las toneladas de CO₂ |
| **Renovables** | Alcance 1 informativo. Biomasa y biocombustibles. Las emisiones biogénicas se reportan pero no computan en el total (GHG Protocol) |
| **Electricidad** | Alcance 2. Consumo kWh por comercializadora con factor CNMC. Toggle de Garantía de Origen que pone emisiones a 0 |
| **Resultados** | Resumen total con desglose por alcance y categoría. Gráficos finales y tabla resumen lista para el informe |
| **Informes** | Descarga en 4 formatos con un clic: Excel MITECO, CSV, JSON, PDF. Cada formato optimizado para su caso de uso |
| **Factores** | Tabla de consulta read-only con todos los factores cargados: combustibles fijos, vehículos, gases (20 tipos), electricidad |
| **Usuarios** | Admin. CRUD de usuarios: crear, asignar rol, activar/desactivar. Tres roles: admin, editor, viewer |
| **Auditoría** | Admin. Log completo de acciones con filtros por usuario, tipo de acción y fecha. Hasta 200 registros por página |

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
| **Python + openpyxl** | Parser del Excel MITECO a JSON |

---

## 🧠 Reflexión: cómo se debe digitalizar

La digitalización no consiste en replicar un formulario en papel dentro de un navegador. Consiste en **entender el flujo completo del dato** — desde su origen hasta su uso final — y diseñar un sistema que lo haga más fiable, más accesible y más útil.

Este proyecto demuestra que una herramienta gubernamental basada en Excel, con 13 pestañas y fórmulas ocultas, puede transformarse en una **aplicación web moderna**, con validación en tiempo real, auditoría automática, gráficos interactivos y exportación multi-formato. Y todo ello manteniendo las **mismas fórmulas oficiales** del MITECO, verificadas con tests automatizados.

**La clave:** no sustituir el Excel por otro Excel. Sustituirlo por un sistema que haga **imposible equivocarse**, **obligatorio auditar** y **fácil colaborar**.

---

## 🚀 Cómo ejecutar

```bash
git clone https://github.com/Ntizar/HuelladeCarbono.git
cd HuelladeCarbono
npm install
npm run dev
```

Abrir **http://localhost:3000** · Credenciales demo: `admin@demo.com` / `demo123`

---

<p align="center">
  <strong>Desarrollado por David Antizar</strong><br>
  Basado en la Calculadora MITECO V.31 · GHG Protocol · AR6 IPCC<br>
  <a href="https://github.com/Ntizar/HuelladeCarbono">github.com/Ntizar/HuelladeCarbono</a>
</p>
