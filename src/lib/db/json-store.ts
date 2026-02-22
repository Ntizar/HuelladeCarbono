/**
 * JSON Store - Gestión de datos HC estructurados por organización
 * 
 * Almacena los datos de huella de carbono de cada organización en archivos JSON
 * separados, organizados por carpeta (org_id/año).
 * 
 * Estructura de almacenamiento:
 *   data/orgs/{org_id}/{anio}/
 *     ├── organization.json
 *     ├── scope1_instalaciones_fijas.json
 *     ├── scope1_vehiculos.json
 *     ├── scope1_fugitivas.json
 *     ├── scope1_proceso.json
 *     ├── scope2_electricidad.json
 *     └── results.json
 * 
 * Los factores de emisión (emission_factors.json) y dropdowns (dropdowns.json)
 * son globales y compartidos entre todas las organizaciones.
 */

import fs from 'fs';
import path from 'path';
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

const DATA_DIR = path.join(process.cwd(), 'data');
const ORGS_DIR = path.join(DATA_DIR, 'orgs');

/**
 * Asegura que un directorio existe, creándolo recursivamente si es necesario
 */
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Obtiene la ruta del directorio de datos de una organización para un año
 */
function getOrgYearDir(orgId: string, anio: number): string {
  return path.join(ORGS_DIR, orgId, String(anio));
}

/**
 * Lee un archivo JSON de forma segura, devolviendo null si no existe
 */
function readJSON<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error leyendo ${filePath}:`, error);
    return null;
  }
}

/**
 * Escribe un objeto como JSON formateado
 */
function writeJSON<T>(filePath: string, data: T): void {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ═══════════════════════════════════════════════════════════════════
// FACTORES DE EMISIÓN (globales, solo lectura)
// ═══════════════════════════════════════════════════════════════════

/**
 * Carga los factores de emisión del MITECO V.31
 * Son compartidos entre todas las organizaciones y no se pueden modificar
 * desde la aplicación (solo lectura).
 */
export function loadEmissionFactors(): EmissionFactors | null {
  return readJSON<EmissionFactors>(path.join(DATA_DIR, 'emission_factors.json'));
}

/**
 * Carga las opciones de desplegables
 */
export function loadDropdowns(): Dropdowns | null {
  return readJSON<Dropdowns>(path.join(DATA_DIR, 'dropdowns.json'));
}

// ═══════════════════════════════════════════════════════════════════
// DATOS DE LA ORGANIZACIÓN
// ═══════════════════════════════════════════════════════════════════

/**
 * Guarda los datos generales de la organización (pestaña 1 del Excel)
 */
export function saveOrganization(orgId: string, anio: number, data: Organizacion): void {
  const dir = getOrgYearDir(orgId, anio);
  writeJSON(path.join(dir, 'organization.json'), data);
}

/**
 * Lee los datos generales de la organización
 */
export function loadOrganization(orgId: string, anio: number): Organizacion | null {
  return readJSON<Organizacion>(path.join(getOrgYearDir(orgId, anio), 'organization.json'));
}

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - INSTALACIONES FIJAS (Pestaña 3)
// ═══════════════════════════════════════════════════════════════════

export function saveScope1InstalacionesFijas(
  orgId: string,
  anio: number,
  data: Scope1InstalacionesFijas
): void {
  const dir = getOrgYearDir(orgId, anio);
  writeJSON(path.join(dir, 'scope1_instalaciones_fijas.json'), data);
}

export function loadScope1InstalacionesFijas(
  orgId: string,
  anio: number
): Scope1InstalacionesFijas | null {
  return readJSON<Scope1InstalacionesFijas>(
    path.join(getOrgYearDir(orgId, anio), 'scope1_instalaciones_fijas.json')
  );
}

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - VEHÍCULOS (Pestaña 4)
// ═══════════════════════════════════════════════════════════════════

export function saveScope1Vehiculos(
  orgId: string,
  anio: number,
  data: Scope1Vehiculos
): void {
  const dir = getOrgYearDir(orgId, anio);
  writeJSON(path.join(dir, 'scope1_vehiculos.json'), data);
}

export function loadScope1Vehiculos(
  orgId: string,
  anio: number
): Scope1Vehiculos | null {
  return readJSON<Scope1Vehiculos>(
    path.join(getOrgYearDir(orgId, anio), 'scope1_vehiculos.json')
  );
}

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - FUGITIVAS (Pestaña 5)
// ═══════════════════════════════════════════════════════════════════

export function saveScope1Fugitivas(
  orgId: string,
  anio: number,
  data: Scope1Fugitivas
): void {
  const dir = getOrgYearDir(orgId, anio);
  writeJSON(path.join(dir, 'scope1_fugitivas.json'), data);
}

export function loadScope1Fugitivas(
  orgId: string,
  anio: number
): Scope1Fugitivas | null {
  return readJSON<Scope1Fugitivas>(
    path.join(getOrgYearDir(orgId, anio), 'scope1_fugitivas.json')
  );
}

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - PROCESO (Pestaña 6)
// ═══════════════════════════════════════════════════════════════════

export function saveScope1Proceso(
  orgId: string,
  anio: number,
  data: { emisiones: Array<{ id: string; descripcion: string; proceso: string; emisiones_kg_co2e: number }> }
): void {
  const dir = getOrgYearDir(orgId, anio);
  writeJSON(path.join(dir, 'scope1_proceso.json'), data);
}

export function loadScope1Proceso(
  orgId: string,
  anio: number
): { emisiones: Array<{ id: string; descripcion: string; proceso: string; emisiones_kg_co2e: number }> } | null {
  return readJSON(path.join(getOrgYearDir(orgId, anio), 'scope1_proceso.json'));
}

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 2 - ELECTRICIDAD (Pestaña 8)
// ═══════════════════════════════════════════════════════════════════

export function saveScope2Electricidad(
  orgId: string,
  anio: number,
  data: Scope2Electricidad
): void {
  const dir = getOrgYearDir(orgId, anio);
  writeJSON(path.join(dir, 'scope2_electricidad.json'), data);
}

export function loadScope2Electricidad(
  orgId: string,
  anio: number
): Scope2Electricidad | null {
  return readJSON<Scope2Electricidad>(
    path.join(getOrgYearDir(orgId, anio), 'scope2_electricidad.json')
  );
}

// ═══════════════════════════════════════════════════════════════════
// SEDES / CENTROS DE TRABAJO
// ═══════════════════════════════════════════════════════════════════

export interface SedeRecord {
  id: string;
  nombre: string;
  direccion?: string;
}

export function saveSedes(orgId: string, anio: number, data: { sedes: SedeRecord[] }): void {
  const dir = getOrgYearDir(orgId, anio);
  writeJSON(path.join(dir, 'sedes.json'), data);
}

export function loadSedes(orgId: string, anio: number): { sedes: SedeRecord[] } | null {
  return readJSON<{ sedes: SedeRecord[] }>(path.join(getOrgYearDir(orgId, anio), 'sedes.json'));
}

// ═══════════════════════════════════════════════════════════════════
// RESULTADOS (Pestaña 9)
// ═══════════════════════════════════════════════════════════════════

export function saveResults(orgId: string, anio: number, data: Resultados): void {
  const dir = getOrgYearDir(orgId, anio);
  writeJSON(path.join(dir, 'results.json'), data);
}

export function loadResults(orgId: string, anio: number): Resultados | null {
  return readJSON<Resultados>(
    path.join(getOrgYearDir(orgId, anio), 'results.json')
  );
}

// ═══════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════

/**
 * Lista los años con datos para una organización
 */
export function listOrgYears(orgId: string): number[] {
  const orgDir = path.join(ORGS_DIR, orgId);
  if (!fs.existsSync(orgDir)) return [];
  
  return fs.readdirSync(orgDir)
    .filter((name) => /^\d{4}$/.test(name))
    .map(Number)
    .sort((a, b) => b - a); // Más recientes primero
}

/**
 * Inicializa la estructura de datos vacía para una organización y año
 */
export function initializeOrgYear(orgId: string, anio: number): void {
  const dir = getOrgYearDir(orgId, anio);
  ensureDir(dir);
  
  // Crear archivos vacíos si no existen
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
      instalaciones_fijas_no_ley: 0,
      instalaciones_fijas_ley: 0,
      transporte_carretera: 0,
      transporte_ferroviario_maritimo_aereo: 0,
      maquinaria: 0,
      fugitivas: 0,
      proceso: 0,
      total_t_co2e: 0,
    },
    alcance_2: {
      electricidad_edificios: 0,
      electricidad_vehiculos: 0,
      calor_vapor_frio: 0,
      total_t_co2e: 0,
    },
    total_alcance_1_2_t_co2e: 0,
    ratios: {
      t_co2e_por_empleado: 0,
      t_co2e_por_m2: 0,
      t_co2e_por_indice_actividad: 0,
    },
  };
  
  if (!loadScope1InstalacionesFijas(orgId, anio)) {
    saveScope1InstalacionesFijas(orgId, anio, emptyScope1Fijas);
  }
  if (!loadScope1Vehiculos(orgId, anio)) {
    saveScope1Vehiculos(orgId, anio, emptyScope1Vehiculos);
  }
  if (!loadScope1Fugitivas(orgId, anio)) {
    saveScope1Fugitivas(orgId, anio, emptyScope1Fugitivas);
  }
  if (!loadScope2Electricidad(orgId, anio)) {
    saveScope2Electricidad(orgId, anio, emptyScope2);
  }
  if (!loadResults(orgId, anio)) {
    saveResults(orgId, anio, emptyResults);
  }
}

/**
 * Carga todos los datos de una organización para un año
 */
export function loadAllOrgData(orgId: string, anio: number) {
  return {
    organization: loadOrganization(orgId, anio),
    scope1_instalaciones_fijas: loadScope1InstalacionesFijas(orgId, anio),
    scope1_vehiculos: loadScope1Vehiculos(orgId, anio),
    scope1_fugitivas: loadScope1Fugitivas(orgId, anio),
    scope1_proceso: loadScope1Proceso(orgId, anio),
    scope2_electricidad: loadScope2Electricidad(orgId, anio),
    results: loadResults(orgId, anio),
  };
}
