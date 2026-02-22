# Calculadora de Huella de Carbono - SaaS

Aplicación web SaaS que reemplaza la calculadora Excel V.31 del **MITECO** (Ministerio para la Transición Ecológica y el Reto Demográfico) para el cálculo de la huella de carbono de organizaciones en España, siguiendo el protocolo GHG Protocol (Alcance 1 + Alcance 2).

## Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** TailwindCSS
- **Gráficos:** Recharts
- **Estado:** Zustand
- **Validación:** Zod
- **Auth:** NextAuth.js v4 (Credentials)
- **Storage:** JSON + CSV (file-based, zero config)
- **Exportación:** ExcelJS, @react-pdf/renderer, PapaParse

## Instalación

```bash
git clone https://github.com/<tu-usuario>/HuelladeCarbono.git
cd HuelladeCarbono
npm install
cp .env.example .env.local
npm run dev
```

Abrir http://localhost:3000

## Credenciales Demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@demo.com | admin123 |
| Editor | editor@demo.com | editor123 |
| Viewer | viewer@demo.com | viewer123 |

## Fórmulas de Cálculo

### Alcance 1 - Combustión
CO2e = (Cantidad * FE_CO2) + (Cantidad * FE_CH4 * 27.9) + (Cantidad * FE_N2O * 273)

### Alcance 1 - Fugitivas
Emisiones (t CO2e) = Recarga (kg) * PCA / 1000

### Alcance 2 - Electricidad
Emisiones (t CO2) = kWh * Factor_emisión / 1000 (0 si GdO renovable)

## Sistema de Agentes

Pipeline: AuditAgent -> ValidationAgent -> CalcAgent -> NotifyAgent

## Variables de Entorno

NEXTAUTH_SECRET=tu-secreto-aqui
NEXTAUTH_URL=http://localhost:3000

## Licencia

MIT
