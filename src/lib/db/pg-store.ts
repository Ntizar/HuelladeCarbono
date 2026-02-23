/**
 * PG Store — Gestión de datos HC en PostgreSQL (Neon)
 * 
 * Reemplaza json-store.ts. Misma interfaz pública, pero los datos
 * van a la tabla org_year_data (JSONB) en vez de archivos JSON locales.
 * 
 * Todos los datos (incluidos factores de emisión y dropdowns) están en
 * PostgreSQL para acceso 100% cloud sin depender de archivos locales.
 * 
 * FLUJO DE ESCRITURA:
 *   1. checkWriteAllowed() → Si devuelve allowed=false, lanza error 507
 *   2. UPSERT en org_year_data con ON CONFLICT → actualiza si ya existe
 *   3. invalidateCache() para que el siguiente check sea fresco
 */

import { query, queryOne } from './neon';
import { checkWriteAllowed, invalidateCache } from './free-tier-guard';
import type {
  Organizacion,
  Scope1InstalacionesFijas,
  Scope1Vehiculos,
  Scope1Fugitivas,
  Scope2Electricidad,
  Resultados,
  EmissionFactors,
  Dropdowns,
} from '@/types/hc-schemas';

// ─── Error personalizado para bloqueo de free tier ──────────────

export class FreeTierBlockedError extends Error {
  public statusCode = 507;
  constructor(message: string) {
    super(message);
    this.name = 'FreeTierBlockedError';
  }
}

// ─── Guard helper ───────────────────────────────────────────────

async function guardWrite(): Promise<void> {
  const result = await checkWriteAllowed();
  if (!result.allowed) {
    throw new FreeTierBlockedError(result.error || 'Límite de almacenamiento excedido');
  }
  if (result.warning) {
    console.warn('[FREE-TIER]', result.warning);
  }
}

// ─── Generic UPSERT / READ for org_year_data ────────────────────

async function upsertOrgData<T>(orgId: string, anio: number, tipo: string, data: T): Promise<void> {
  await guardWrite();
  await query(
    `INSERT INTO org_year_data (org_id, anio, tipo, data, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (org_id, anio, tipo) 
     DO UPDATE SET data = $4, updated_at = NOW()`,
    [orgId, anio, tipo, JSON.stringify(data)]
  );
  invalidateCache();
}

async function loadOrgData<T>(orgId: string, anio: number, tipo: string): Promise<T | null> {
  const row = await queryOne<{ data: T }>(
    `SELECT data FROM org_year_data WHERE org_id = $1 AND anio = $2 AND tipo = $3`,
    [orgId, anio, tipo]
  );
  return row?.data || null;
}

// ═══════════════════════════════════════════════════════════════════
// FACTORES DE EMISIÓN Y DROPDOWNS (desde PostgreSQL — tabla static_data)
// ═══════════════════════════════════════════════════════════════════

// Caché en memoria para datos estáticos (no cambian en runtime)
let _emissionFactorsCache: EmissionFactors | null | undefined = undefined;
let _dropdownsCache: Dropdowns | null | undefined = undefined;

export async function loadEmissionFactors(): Promise<EmissionFactors | null> {
  if (_emissionFactorsCache !== undefined) return _emissionFactorsCache;
  const row = await queryOne<{ data: EmissionFactors }>(
    `SELECT data FROM static_data WHERE key = 'emission_factors'`
  );
  _emissionFactorsCache = row?.data || null;
  return _emissionFactorsCache;
}

export async function loadDropdowns(): Promise<Dropdowns | null> {
  if (_dropdownsCache !== undefined) return _dropdownsCache;
  const row = await queryOne<{ data: Dropdowns }>(
    `SELECT data FROM static_data WHERE key = 'dropdowns'`
  );
  _dropdownsCache = row?.data || null;
  return _dropdownsCache;
}

/** Invalida la caché de datos estáticos (útil si se actualizan) */
export function invalidateStaticCache(): void {
  _emissionFactorsCache = undefined;
  _dropdownsCache = undefined;
}

// ═══════════════════════════════════════════════════════════════════
// DATOS DE LA ORGANIZACIÓN
// ═══════════════════════════════════════════════════════════════════

export async function saveOrganization(orgId: string, anio: number, data: Organizacion): Promise<void> {
  await upsertOrgData(orgId, anio, 'organization', data);
}

export async function loadOrganization(orgId: string, anio: number): Promise<Organizacion | null> {
  return loadOrgData<Organizacion>(orgId, anio, 'organization');
}

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - INSTALACIONES FIJAS
// ═══════════════════════════════════════════════════════════════════

export async function saveScope1InstalacionesFijas(orgId: string, anio: number, data: Scope1InstalacionesFijas): Promise<void> {
  await upsertOrgData(orgId, anio, 'scope1_instalaciones_fijas', data);
}

export async function loadScope1InstalacionesFijas(orgId: string, anio: number): Promise<Scope1InstalacionesFijas | null> {
  return loadOrgData<Scope1InstalacionesFijas>(orgId, anio, 'scope1_instalaciones_fijas');
}

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - VEHÍCULOS
// ═══════════════════════════════════════════════════════════════════

export async function saveScope1Vehiculos(orgId: string, anio: number, data: Scope1Vehiculos): Promise<void> {
  await upsertOrgData(orgId, anio, 'scope1_vehiculos', data);
}

export async function loadScope1Vehiculos(orgId: string, anio: number): Promise<Scope1Vehiculos | null> {
  return loadOrgData<Scope1Vehiculos>(orgId, anio, 'scope1_vehiculos');
}

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - FUGITIVAS
// ═══════════════════════════════════════════════════════════════════

export async function saveScope1Fugitivas(orgId: string, anio: number, data: Scope1Fugitivas): Promise<void> {
  await upsertOrgData(orgId, anio, 'scope1_fugitivas', data);
}

export async function loadScope1Fugitivas(orgId: string, anio: number): Promise<Scope1Fugitivas | null> {
  return loadOrgData<Scope1Fugitivas>(orgId, anio, 'scope1_fugitivas');
}

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - PROCESO
// ═══════════════════════════════════════════════════════════════════

type ProcesoData = { emisiones: Array<{ id: string; descripcion: string; proceso: string; emisiones_kg_co2e: number }> };

export async function saveScope1Proceso(orgId: string, anio: number, data: ProcesoData): Promise<void> {
  await upsertOrgData(orgId, anio, 'scope1_proceso', data);
}

export async function loadScope1Proceso(orgId: string, anio: number): Promise<ProcesoData | null> {
  return loadOrgData<ProcesoData>(orgId, anio, 'scope1_proceso');
}

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 2 - ELECTRICIDAD
// ═══════════════════════════════════════════════════════════════════

export async function saveScope2Electricidad(orgId: string, anio: number, data: Scope2Electricidad): Promise<void> {
  await upsertOrgData(orgId, anio, 'scope2_electricidad', data);
}

export async function loadScope2Electricidad(orgId: string, anio: number): Promise<Scope2Electricidad | null> {
  return loadOrgData<Scope2Electricidad>(orgId, anio, 'scope2_electricidad');
}

// ═══════════════════════════════════════════════════════════════════
// SEDES
// ═══════════════════════════════════════════════════════════════════

export interface SedeRecord {
  id: string;
  nombre: string;
  direccion?: string;
}

export async function saveSedes(orgId: string, anio: number, data: { sedes: SedeRecord[] }): Promise<void> {
  await guardWrite();
  // Borrar sedes existentes y reescribir
  await query(`DELETE FROM sedes WHERE org_id = $1 AND anio = $2`, [orgId, anio]);
  for (const sede of data.sedes) {
    await query(
      `INSERT INTO sedes (id, org_id, anio, nombre, direccion) VALUES ($1, $2, $3, $4, $5)`,
      [sede.id, orgId, anio, sede.nombre, sede.direccion || null]
    );
  }
  invalidateCache();
}

export async function loadSedes(orgId: string, anio: number): Promise<{ sedes: SedeRecord[] } | null> {
  const rows = await query<{ id: string; nombre: string; direccion: string | null }>(
    `SELECT id, nombre, direccion FROM sedes WHERE org_id = $1 AND anio = $2 ORDER BY created_at`,
    [orgId, anio]
  );
  return { sedes: rows.map(r => ({ id: r.id, nombre: r.nombre, direccion: r.direccion || undefined })) };
}

// ═══════════════════════════════════════════════════════════════════
// RESULTADOS
// ═══════════════════════════════════════════════════════════════════

export async function saveResults(orgId: string, anio: number, data: Resultados): Promise<void> {
  await upsertOrgData(orgId, anio, 'results', data);
}

export async function loadResults(orgId: string, anio: number): Promise<Resultados | null> {
  return loadOrgData<Resultados>(orgId, anio, 'results');
}

// ═══════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════

export async function listOrgYears(orgId: string): Promise<number[]> {
  const rows = await query<{ anio: number }>(
    `SELECT DISTINCT anio FROM org_year_data WHERE org_id = $1 ORDER BY anio DESC`,
    [orgId]
  );
  return rows.map(r => r.anio);
}

export async function initializeOrgYear(orgId: string, anio: number): Promise<void> {
  const existing = await queryOne(
    `SELECT 1 FROM org_year_data WHERE org_id = $1 AND anio = $2 AND tipo = 'results'`,
    [orgId, anio]
  );
  if (existing) return; // Ya inicializado

  await guardWrite();

  const emptyScope1Fijas: Scope1InstalacionesFijas = {
    no_sujetas_ley_1_2005: [],
    sujetas_ley_1_2005: [],
  };
  const emptyScope1Vehiculos: Scope1Vehiculos = {
    transporte_carretera_A1_combustible: [],
    transporte_carretera_A2_distancia_km: [],
    transporte_ferroviario_maritimo_aereo: [],
    maquinaria_movil: [],
  };
  const emptyScope1Fugitivas: Scope1Fugitivas = {
    climatizacion_refrigeracion: [],
    otros: [],
  };
  const emptyScope2: Scope2Electricidad = {
    electricidad_edificios: [],
    electricidad_vehiculos: [],
    calor_vapor_frio: [],
  };
  const emptyResults: Resultados = {
    anio_calculo: anio,
    alcance_1: {
      instalaciones_fijas_no_ley: 0, instalaciones_fijas_ley: 0,
      transporte_carretera: 0, transporte_ferroviario_maritimo_aereo: 0,
      maquinaria: 0, fugitivas: 0, proceso: 0, total_t_co2e: 0,
    },
    alcance_2: {
      electricidad_edificios: 0, electricidad_vehiculos: 0,
      calor_vapor_frio: 0, total_t_co2e: 0,
    },
    total_alcance_1_2_t_co2e: 0,
    ratios: { t_co2e_por_empleado: 0, t_co2e_por_m2: 0, t_co2e_por_indice_actividad: 0 },
  };

  // Insertar todo de golpe sin re-check de guard (ya lo hicimos arriba)
  const inserts = [
    ['scope1_instalaciones_fijas', emptyScope1Fijas],
    ['scope1_vehiculos', emptyScope1Vehiculos],
    ['scope1_fugitivas', emptyScope1Fugitivas],
    ['scope2_electricidad', emptyScope2],
    ['results', emptyResults],
  ] as const;

  for (const [tipo, data] of inserts) {
    await query(
      `INSERT INTO org_year_data (org_id, anio, tipo, data) VALUES ($1, $2, $3, $4)
       ON CONFLICT (org_id, anio, tipo) DO NOTHING`,
      [orgId, anio, tipo, JSON.stringify(data)]
    );
  }
  invalidateCache();
}

export async function loadAllOrgData(orgId: string, anio: number) {
  const [org, s1f, s1v, s1g, s1p, s2, results] = await Promise.all([
    loadOrganization(orgId, anio),
    loadScope1InstalacionesFijas(orgId, anio),
    loadScope1Vehiculos(orgId, anio),
    loadScope1Fugitivas(orgId, anio),
    loadScope1Proceso(orgId, anio),
    loadScope2Electricidad(orgId, anio),
    loadResults(orgId, anio),
  ]);
  return {
    organization: org,
    scope1_instalaciones_fijas: s1f,
    scope1_vehiculos: s1v,
    scope1_fugitivas: s1g,
    scope1_proceso: s1p,
    scope2_electricidad: s2,
    results,
  };
}
