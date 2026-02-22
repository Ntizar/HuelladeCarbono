# 🌿 Calculadora de Huella de Carbono

**Una herramienta web que sustituye al Excel del MITECO para calcular la huella de carbono de tu organización.**

En España, el Ministerio para la Transición Ecológica (MITECO) lleva años ofreciendo una hoja de cálculo Excel para que las empresas calculen sus emisiones de CO₂. Funciona, pero tiene las limitaciones de siempre: un solo usuario, sin historial de cambios, fórmulas escondidas en celdas protegidas, y un archivo que acaba viajando por email sin control.

Esta herramienta hace exactamente lo mismo que ese Excel — usa las mismas fórmulas, los mismos factores de emisión oficiales — pero lo convierte en una aplicación web moderna donde todo es más claro, más seguro y más fácil de usar.

📄 [Explicación completa del proyecto](EXPLICACION.md) · 📥 [Descargar PDF explicativo](docs/Explicacion_Herramienta_Huella_de_Carbono.pdf)

---

## ¿Qué puedes hacer con esto?

- **Calcular las emisiones de Alcance 1** — Lo que tu organización emite directamente: gas de las calderas, combustible de los coches de empresa, fugas de gases refrigerantes del aire acondicionado, procesos industriales.

- **Calcular las emisiones de Alcance 2** — Lo que emite indirectamente por la electricidad que consume. Depende de tu comercializadora eléctrica y de si tienes certificado de energía renovable (Garantía de Origen).

- **Ver los resultados en un dashboard** — Gráficos de barras, circulares, KPIs. Todo visual, sin tener que buscar en celdas de Excel.

- **Exportar informes** — En Excel (compatible MITECO), CSV, JSON o PDF. Un clic y listo.

- **Trabajar en equipo** — Varios usuarios con diferentes permisos: el administrador lo gestiona todo, el editor introduce datos, y el viewer solo consulta.

- **Tener todo auditado** — Cada cambio queda registrado: quién lo hizo, cuándo y qué modificó.

---

## Cómo funciona por dentro

Cuando alguien guarda un dato (por ejemplo, "hemos consumido 50.000 kWh de gas natural este año"), la aplicación hace esto automáticamente:

1. **Registra la acción** en un log de auditoría (AuditAgent)
2. **Valida que el dato tenga sentido** — que no sea negativo, que el combustible exista, que el año sea razonable (ValidationAgent)
3. **Recalcula todas las emisiones** de la organización con las fórmulas oficiales del MITECO (CalcAgent)
4. **Avisa si hay un cambio grande** — si las emisiones suben o bajan más de un 10% respecto al cálculo anterior

Todo esto pasa en cadena, sin que el usuario tenga que hacer nada más que guardar.

---

## Las fórmulas (explicadas de forma sencilla)

### Quemar combustible (gas, gasóleo, gasolina…)

Cuando quemas un combustible, se emiten tres gases de efecto invernadero: CO₂, metano (CH₄) y óxido nitroso (N₂O). Cada uno tiene un "factor de emisión" que dice cuánto gas se emite por cada unidad consumida.

Como el metano y el óxido nitroso calientan más que el CO₂, se multiplican por un coeficiente para expresar todo en "CO₂ equivalente":

```
Total CO₂e = (Cantidad × Factor_CO₂)
           + (Cantidad × Factor_CH₄ × 27.9)
           + (Cantidad × Factor_N₂O × 273)
```

Esos 27.9 y 273 vienen del último informe del IPCC (AR6, 2021). Significan que 1 kg de metano calienta lo mismo que 27,9 kg de CO₂, y 1 kg de N₂O lo mismo que 273 kg de CO₂.

**Ejemplo real:** 50.000 kWh de gas natural = 10,29 toneladas de CO₂e.

### Fugas de gases refrigerantes

Si tu aire acondicionado pierde gas, ese gas es un potente gas de efecto invernadero. Se calcula simplemente:

```
Emisiones = kg de gas fugado × Potencial de calentamiento del gas / 1000
```

Algunos gases son brutales: 1 solo kg de SF₆ equivale a 22,8 toneladas de CO₂.

### Electricidad

Depende de tu comercializadora eléctrica. Cada una tiene un "mix" diferente (cuánto usa de renovables, gas, carbón…). El MITECO y la CNMC publican los factores cada año:

```
Emisiones = kWh consumidos × Factor de tu comercializadora / 1000
```

Si tienes Garantía de Origen renovable → tus emisiones de electricidad son 0.

---

## De dónde salen los factores de emisión

Los factores no están inventados. Vienen de fuentes oficiales:

- **Combustibles y gases refrigerantes** → Extraídos directamente del Excel oficial del MITECO (V.31) con un script Python que los parsea automáticamente
- **Electricidad** → Publicación anual de la CNMC con el mix de cada comercializadora
- **Coeficientes de calentamiento (PCA)** → Sexto Informe del IPCC (AR6, 2021)

Todos están en `data/emission_factors.json`, un archivo que puedes abrir con cualquier editor de texto y ver exactamente qué valores se usan.

---

## Cómo están organizados los datos

No hay base de datos. Todo son archivos JSON y CSV, organizados así:

```
data/
  emission_factors.json     ← Los factores oficiales
  dropdowns.json            ← Listas desplegables (tipos de combustible, gases, etc.)
  orgs/
    org_001/                ← Cada organización tiene su carpeta
      2024/                 ← Y dentro, una carpeta por año
        organizacion.json    ← Nombre, CIF, empleados…
        scope1_fijas.json    ← Datos de combustión fija
        scope1_vehiculos.json ← Datos de vehículos
        scope1_fugitivas.json ← Datos de gases refrigerantes
        scope2_elect.json    ← Datos de electricidad
        resultados.json      ← Emisiones calculadas

store/
  users.csv                 ← Usuarios y contraseñas (hash bcrypt)
  organizations.csv         ← Lista de organizaciones
  audit_log.csv             ← Todo lo que ha pasado en el sistema
```

Hacer un backup es copiar estas dos carpetas. Así de sencillo.

---

## Cómo modificar cosas

- **Actualizar los factores de emisión** → Edita `data/emission_factors.json` directamente, o vuelve a ejecutar `python scripts/parse_excel_to_json.py` con un Excel MITECO más reciente.

- **Cambiar las fórmulas** → Están en `src/lib/agents/calc-agent.ts`, con tipos TypeScript y tests.

- **Añadir una nueva sección** → Crea un archivo `page.tsx` en `src/app/tu-nueva-seccion/` y Next.js genera la ruta solo.

- **Gestionar usuarios** → Desde `/admin/usuarios` en la web, o editando `store/users.csv`.

- **Cambiar los estilos** → `src/app/globals.css` y `tailwind.config.ts`.

---

## Instalación

```bash
git clone https://github.com/Ntizar/HuelladeCarbono.git
cd HuelladeCarbono
npm install
cp .env.example .env.local
npm run dev
```

Abre http://localhost:3000 y ya está.

### Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@demo.com | admin123 |
| Editor | editor@demo.com | editor123 |
| Viewer | viewer@demo.com | viewer123 |

### Variables de entorno

```
NEXTAUTH_SECRET=tu-secreto-aqui
NEXTAUTH_URL=http://localhost:3000
```

---

## Stack técnico

| Qué | Para qué |
|-----|----------|
| Next.js 14 | La aplicación web (App Router, renderizado en servidor) |
| TypeScript | Para que el código tenga tipos y menos errores |
| TailwindCSS | Estilos rápidos y responsive |
| Recharts | Los gráficos del dashboard |
| Zustand | Estado global de la aplicación |
| Zod | Validar que los datos son correctos antes de guardarlos |
| NextAuth.js | Login y sesiones de usuario |
| ExcelJS | Generar archivos Excel compatibles con MITECO |
| PapaParse | Leer y escribir CSV |
| @react-pdf/renderer | Generar los PDF |

---

## Las 13 secciones

1. **Dashboard** — Panel con gráficos y KPIs. Lo primero que ves al entrar.
2. **Organización** — Los datos de tu empresa (nombre, CIF, empleados…).
3. **Instalaciones fijas** — Consumo de gas, gasóleo, etc. en calderas y similares.
4. **Vehículos** — La flota de coches/furgonetas de la empresa.
5. **Fugitivas** — Recargas de gas refrigerante del aire acondicionado.
6. **Proceso** — Emisiones de procesos industriales (cementeras, vidrio…).
7. **Renovables** — Biomasa y biocombustibles (informativo, no suman al total).
8. **Electricidad** — Tu consumo eléctrico por comercializadora.
9. **Resultados** — Resumen total con desglose y gráficos.
10. **Informes** — Descargar en Excel, CSV, JSON o PDF.
11. **Factores** — Consulta de todos los factores de emisión cargados.
12. **Usuarios** — Gestión de usuarios y roles (solo admin).
13. **Auditoría** — Log de todo lo que se ha hecho en el sistema (solo admin).

---

## Licencia

MIT

---

<p align="center">
  Desarrollado por <strong>David Antizar</strong><br>
  Basado en la Calculadora MITECO V.31 · GHG Protocol · AR6 IPCC
</p>
