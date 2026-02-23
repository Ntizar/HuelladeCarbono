/**
 * Seed Demo — Crea una empresa simulada con datos realistas
 * 
 * Empresa: "Distribuciones Solana S.L." — empresa mediana de logística
 * 3 sedes: Madrid (oficina central), Barcelona (almacén), Sevilla (delegación)
 * 45 empleados, 1.200 m², sector Transporte y almacenamiento
 * Año de cálculo: 2024
 * 
 * Ejecutar: node scripts/seed-demo.mjs
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Cargar .env.local ──────────────────────────────────────────
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const sql = neon(process.env.DATABASE_URL);

// ─── IDs ────────────────────────────────────────────────────────
const ORG_ID = 'demo_solana';
const ANIO = 2024;

const sedeIds = {
  madrid:    randomUUID(),
  barcelona: randomUUID(),
  sevilla:   randomUUID(),
};

// ═══════════════════════════════════════════════════════════════════
// 1. ORGANIZACIÓN
// ═══════════════════════════════════════════════════════════════════
const organization = {
  id: randomUUID(),
  nombre: 'Distribuciones Solana S.L.',
  cif_nif: 'B12345678',
  tipo_organizacion: 'Empresa privada',
  sector: 'Transporte y almacenamiento',
  anio_calculo: ANIO,
  superficie_m2: 1200,
  num_empleados: 45,
  indice_actividad: {
    nombre: 'Facturación (miles €)',
    valor: 3200,
    unidades: 'miles €',
  },
  historico_hc: [
    { anio: 2022, hc_t_co2e: 185.4 },
    { anio: 2023, hc_t_co2e: 172.1 },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 2. SEDES
// ═══════════════════════════════════════════════════════════════════
const sedes = [
  { id: sedeIds.madrid,    nombre: 'Oficina Central Madrid',  direccion: 'Calle Gran Vía 42, 28013 Madrid' },
  { id: sedeIds.barcelona, nombre: 'Almacén Barcelona',       direccion: 'Polígono Industrial Zona Franca, 08040 Barcelona' },
  { id: sedeIds.sevilla,   nombre: 'Delegación Sevilla',      direccion: 'Av. de la Constitución 18, 41004 Sevilla' },
];

// ═══════════════════════════════════════════════════════════════════
// 3. ALCANCE 1 — INSTALACIONES FIJAS (calefacción oficinas + almacén)
// ═══════════════════════════════════════════════════════════════════

// Factores 2024 reales del MITECO V.31
const factorGasNatural = { co2_kg_ud: 0.182, ch4_g_ud: 0.004, n2o_g_ud: 0.001 };
const factorGasoleo    = { co2_kg_ud: 2.868, ch4_g_ud: 0.08,  n2o_g_ud: 0.016 };

function calcTotal(cantidad, fe) {
  const co2 = cantidad * fe.co2_kg_ud;
  const ch4 = cantidad * fe.ch4_g_ud;
  const n2o = cantidad * fe.n2o_g_ud;
  const total = co2 + (ch4 / 1000) * 27.9 + (n2o / 1000) * 273;
  return {
    emisiones_parciales: {
      co2_kg: Math.round(co2 * 100) / 100,
      ch4_g: Math.round(ch4 * 100) / 100,
      n2o_g: Math.round(n2o * 100) / 100,
    },
    emisiones_totales_kg_co2e: Math.round(total * 100) / 100,
  };
}

const scope1_instalaciones_fijas = {
  no_sujetas_ley_1_2005: [
    {
      id: randomUUID(),
      edificio_sede: 'Oficina Central Madrid',
      tipo_combustible: 'Gas natural (kWh PCS)',
      cantidad: 42000,   // 42.000 kWh de gas natural (calefacción oficina)
      factor_emision: factorGasNatural,
      ...calcTotal(42000, factorGasNatural),
    },
    {
      id: randomUUID(),
      edificio_sede: 'Almacén Barcelona',
      tipo_combustible: 'Gasóleo calefacción (litros)',
      cantidad: 1500,    // 1.500 litros gasóleo (calefacción almacén)
      factor_emision: factorGasoleo,
      ...calcTotal(1500, factorGasoleo),
    },
    {
      id: randomUUID(),
      edificio_sede: 'Delegación Sevilla',
      tipo_combustible: 'Gas natural (kWh PCS)',
      cantidad: 18000,   // 18.000 kWh gas natural (calefacción delegación)
      factor_emision: factorGasNatural,
      ...calcTotal(18000, factorGasNatural),
    },
  ],
  sujetas_ley_1_2005: [],
};

// ═══════════════════════════════════════════════════════════════════
// 4. ALCANCE 1 — VEHÍCULOS (flota de reparto)
// ═══════════════════════════════════════════════════════════════════

const factorDieselFurgo = { co2_kg_ud: 2.607, ch4_g_ud: 0.005, n2o_g_ud: 0.028 };
const factorDieselCamion = { co2_kg_ud: 2.607, ch4_g_ud: 0.01, n2o_g_ud: 0.107 };
const factorGasolinaTur = { co2_kg_ud: 2.196, ch4_g_ud: 0.238, n2o_g_ud: 0.025 };

const scope1_vehiculos = {
  transporte_carretera_A1_combustible: [
    {
      id: randomUUID(),
      edificio_sede: 'Almacén Barcelona',
      tipo_combustible: 'Gasóleo (litros)',
      categoria_vehiculo: 'Furgonetas (N1)',
      cantidad: 12000,   // 12.000 litros diesel — 5 furgonetas de reparto
      factor_emision: factorDieselFurgo,
      ...calcTotal(12000, factorDieselFurgo),
    },
    {
      id: randomUUID(),
      edificio_sede: 'Almacén Barcelona',
      tipo_combustible: 'Gasóleo (litros)',
      categoria_vehiculo: 'Camiones pesados (N2/N3)',
      cantidad: 18000,   // 18.000 litros diesel — 2 camiones de larga distancia
      factor_emision: factorDieselCamion,
      ...calcTotal(18000, factorDieselCamion),
    },
    {
      id: randomUUID(),
      edificio_sede: 'Oficina Central Madrid',
      tipo_combustible: 'Gasolina (litros)',
      categoria_vehiculo: 'Turismos (M1)',
      cantidad: 3200,    // 3.200 litros gasolina — 3 coches comerciales
      factor_emision: factorGasolinaTur,
      ...calcTotal(3200, factorGasolinaTur),
    },
  ],
  transporte_carretera_A2_distancia_km: [],
  transporte_ferroviario_maritimo_aereo: [],
  maquinaria_movil: [
    {
      id: randomUUID(),
      edificio_sede: 'Almacén Barcelona',
      tipo_maquinaria: 'Carretilla elevadora',
      tipo_combustible: 'Gasóleo (litros)',
      cantidad: 2200,    // 2.200 litros diesel — 2 carretillas
      factor_emision: factorDieselFurgo,
      ...calcTotal(2200, factorDieselFurgo),
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 5. ALCANCE 1 — FUGITIVAS (aire acondicionado oficinas)
// ═══════════════════════════════════════════════════════════════════

const scope1_fugitivas = {
  climatizacion_refrigeracion: [
    {
      id: randomUUID(),
      edificio_sede: 'Oficina Central Madrid',
      gas: 'R-410A',
      formula_quimica: 'R410A',
      pca: 2088,
      tipo_equipo: 'Climatizador split',
      capacidad_kg: 4.2,
      recarga_kg: 1.8,     // Recarga anual de 1.8 kg
      emisiones_kg_co2e: Math.round(1.8 * 2088 * 100) / 100,  // 3758.4 kg CO2e
    },
    {
      id: randomUUID(),
      edificio_sede: 'Almacén Barcelona',
      gas: 'R-134a',
      formula_quimica: 'CH2FCF3',
      pca: 1530,
      tipo_equipo: 'Cámara frigorífica',
      capacidad_kg: 12,
      recarga_kg: 3.5,     // Recarga anual de 3.5 kg
      emisiones_kg_co2e: Math.round(3.5 * 1530 * 100) / 100,  // 5355 kg CO2e
    },
    {
      id: randomUUID(),
      edificio_sede: 'Delegación Sevilla',
      gas: 'R-32',
      formula_quimica: 'CH2F2',
      pca: 771,
      tipo_equipo: 'Bomba de calor',
      capacidad_kg: 2.8,
      recarga_kg: 0.6,     // Recarga anual de 0.6 kg
      emisiones_kg_co2e: Math.round(0.6 * 771 * 100) / 100,   // 462.6 kg CO2e
    },
  ],
  otros: [],
};

// ═══════════════════════════════════════════════════════════════════
// 6. ALCANCE 1 — PROCESO (no aplica en logística, pero ponemos uno simbólico)
// ═══════════════════════════════════════════════════════════════════

const scope1_proceso = {
  emisiones: [],
};

// ═══════════════════════════════════════════════════════════════════
// 7. ALCANCE 2 — ELECTRICIDAD
// ═══════════════════════════════════════════════════════════════════

const scope2_electricidad = {
  electricidad_edificios: [
    {
      id: randomUUID(),
      edificio_sede: 'Oficina Central Madrid',
      comercializadora: 'Iberdrola',
      garantia_origen: false,
      kwh_consumidos: 35000,   // 35.000 kWh/año oficina (iluminación, IT, clima)
      factor_mix_kg_co2_kwh: 0.07,
      emisiones_kg_co2: Math.round(35000 * 0.07 * 100) / 100,  // 2450 kg
    },
    {
      id: randomUUID(),
      edificio_sede: 'Almacén Barcelona',
      comercializadora: 'Endesa',
      garantia_origen: false,
      kwh_consumidos: 62000,   // 62.000 kWh/año almacén (iluminación, cámaras, carga)
      factor_mix_kg_co2_kwh: 0.10,
      emisiones_kg_co2: Math.round(62000 * 0.10 * 100) / 100,  // 6200 kg
    },
    {
      id: randomUUID(),
      edificio_sede: 'Delegación Sevilla',
      comercializadora: 'Naturgy',
      garantia_origen: false,
      kwh_consumidos: 18000,   // 18.000 kWh/año delegación pequeña
      factor_mix_kg_co2_kwh: 0.14,
      emisiones_kg_co2: Math.round(18000 * 0.14 * 100) / 100,  // 2520 kg
    },
  ],
  electricidad_vehiculos: [],
  calor_vapor_frio: [],
};

// ═══════════════════════════════════════════════════════════════════
// 8. CÁLCULO DE RESULTADOS
// ═══════════════════════════════════════════════════════════════════

function sumKg(...items) {
  return items.reduce((sum, item) => sum + (item.emisiones_totales_kg_co2e || item.emisiones_kg_co2e || item.emisiones_kg_co2 || 0), 0);
}

const a1_fijas_no_ley = sumKg(...scope1_instalaciones_fijas.no_sujetas_ley_1_2005);
const a1_transporte = sumKg(...scope1_vehiculos.transporte_carretera_A1_combustible);
const a1_maquinaria = sumKg(...scope1_vehiculos.maquinaria_movil);
const a1_fugitivas = sumKg(...scope1_fugitivas.climatizacion_refrigeracion);
const a1_proceso = 0;

const a2_edificios = sumKg(...scope2_electricidad.electricidad_edificios);
const a2_vehiculos = 0;
const a2_calor = 0;

const total_a1_kg = a1_fijas_no_ley + a1_transporte + a1_maquinaria + a1_fugitivas + a1_proceso;
const total_a2_kg = a2_edificios + a2_vehiculos + a2_calor;
const total_kg = total_a1_kg + total_a2_kg;

// Convertir a toneladas y redondear
const r = (v) => Math.round((v / 1000) * 1000) / 1000;

const results = {
  anio_calculo: ANIO,
  alcance_1: {
    instalaciones_fijas_no_ley: r(a1_fijas_no_ley),
    instalaciones_fijas_ley: 0,
    transporte_carretera: r(a1_transporte),
    transporte_ferroviario_maritimo_aereo: 0,
    maquinaria: r(a1_maquinaria),
    fugitivas: r(a1_fugitivas),
    proceso: 0,
    total_t_co2e: r(total_a1_kg),
  },
  alcance_2: {
    electricidad_edificios: r(a2_edificios),
    electricidad_vehiculos: 0,
    calor_vapor_frio: 0,
    total_t_co2e: r(total_a2_kg),
  },
  total_alcance_1_2_t_co2e: r(total_kg),
  ratios: {
    t_co2e_por_empleado: Math.round((total_kg / 1000 / organization.num_empleados) * 1000) / 1000,
    t_co2e_por_m2: Math.round((total_kg / 1000 / organization.superficie_m2) * 1000) / 1000,
    t_co2e_por_indice_actividad: Math.round((total_kg / 1000 / organization.indice_actividad.valor) * 1000) / 1000,
  },
};

// ═══════════════════════════════════════════════════════════════════
// 9. INSERTAR EN BASE DE DATOS
// ═══════════════════════════════════════════════════════════════════

async function seed() {
  console.log('🌱 Sembrando datos demo: Distribuciones Solana S.L.');
  console.log('─'.repeat(55));

  // Test connection
  const [{ version }] = await sql`SELECT version()`;
  console.log(`✅ Conectado a ${version.split(',')[0]}`);

  // Insert sedes
  for (const sede of sedes) {
    await sql.query(
      `INSERT INTO sedes (id, org_id, anio, nombre, direccion)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET nombre = $4, direccion = $5`,
      [sede.id, ORG_ID, ANIO, sede.nombre, sede.direccion]
    );
  }
  console.log(`✅ ${sedes.length} sedes insertadas`);

  // Insert org_year_data rows
  const dataRows = [
    ['organization',               organization],
    ['scope1_instalaciones_fijas',  scope1_instalaciones_fijas],
    ['scope1_vehiculos',           scope1_vehiculos],
    ['scope1_fugitivas',           scope1_fugitivas],
    ['scope1_proceso',             scope1_proceso],
    ['scope2_electricidad',        scope2_electricidad],
    ['results',                    results],
  ];

  for (const [tipo, data] of dataRows) {
    await sql.query(
      `INSERT INTO org_year_data (org_id, anio, tipo, data, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (org_id, anio, tipo) DO UPDATE SET data = $4, updated_at = NOW()`,
      [ORG_ID, ANIO, tipo, JSON.stringify(data)]
    );
  }
  console.log(`✅ ${dataRows.length} registros org_year_data insertados`);

  // Create demo user (password: demo1234)
  // bcrypt hash for "demo1234" — pre-computed
  const demoPasswordHash = '$2a$10$xJ8Vm1X5G0Hm6gM3qQw3POY1qHqJyKjFN5C0oEj5sV1y6HpSieyWe';
  await sql.query(
    `INSERT INTO users (id, email, nombre, password_hash, role, org_id, plan, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (email) DO UPDATE SET password_hash = $4, org_id = $6`,
    [randomUUID(), 'demo@solana.es', 'Usuario Demo', demoPasswordHash, 'admin', ORG_ID, 'free', true]
  );
  console.log('✅ Usuario demo creado: demo@solana.es');

  // Summary
  console.log('\n─'.repeat(55));
  console.log('📊 RESUMEN DE EMISIONES — Distribuciones Solana S.L. (2024)');
  console.log('─'.repeat(55));
  console.log(`\n🏭 ALCANCE 1 (emisiones directas):`);
  console.log(`   Instalaciones fijas:  ${results.alcance_1.instalaciones_fijas_no_ley.toFixed(3)} t CO₂e`);
  console.log(`   Transporte carretera: ${results.alcance_1.transporte_carretera.toFixed(3)} t CO₂e`);
  console.log(`   Maquinaria móvil:     ${results.alcance_1.maquinaria.toFixed(3)} t CO₂e`);
  console.log(`   Fugitivas:            ${results.alcance_1.fugitivas.toFixed(3)} t CO₂e`);
  console.log(`   Proceso:              ${results.alcance_1.proceso.toFixed(3)} t CO₂e`);
  console.log(`   ─────────────────────────────────────`);
  console.log(`   TOTAL ALCANCE 1:      ${results.alcance_1.total_t_co2e.toFixed(3)} t CO₂e`);

  console.log(`\n⚡ ALCANCE 2 (electricidad):`);
  console.log(`   Electricidad edificios: ${results.alcance_2.electricidad_edificios.toFixed(3)} t CO₂e`);
  console.log(`   ─────────────────────────────────────`);
  console.log(`   TOTAL ALCANCE 2:        ${results.alcance_2.total_t_co2e.toFixed(3)} t CO₂e`);

  console.log(`\n🌍 TOTAL ALCANCE 1+2:    ${results.total_alcance_1_2_t_co2e.toFixed(3)} t CO₂e`);
  console.log(`\n📈 RATIOS:`);
  console.log(`   ${results.ratios.t_co2e_por_empleado.toFixed(3)} t CO₂e/empleado`);
  console.log(`   ${results.ratios.t_co2e_por_m2.toFixed(3)} t CO₂e/m²`);
  console.log(`   ${results.ratios.t_co2e_por_indice_actividad.toFixed(3)} t CO₂e/mile€ facturación`);

  console.log('\n✅ Demo seed completado con éxito.');
  console.log('   Para usar: login con demo@solana.es en la app');
  console.log(`   orgId: ${ORG_ID}  |  año: ${ANIO}`);
}

seed().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
