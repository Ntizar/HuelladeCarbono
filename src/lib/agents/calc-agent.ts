/**
 * Motor de Cálculo de Huella de Carbono (CalcAgent)
 * 
 * Implementa exactamente las fórmulas de la calculadora MITECO V.31:
 * 
 * ALCANCE 1 - Instalaciones Fijas (no Ley 1/2005):
 *   emisiones_co2_kg = cantidad × fe_co2_kg_ud
 *   emisiones_ch4_g  = cantidad × fe_ch4_g_ud
 *   emisiones_n2o_g  = cantidad × fe_n2o_g_ud
 *   total_co2e_kg = emisiones_co2_kg + (emisiones_ch4_g/1000 × PCA_CH4) + (emisiones_n2o_g/1000 × PCA_N2O)
 * 
 * ALCANCE 1 - Fugitivas:
 *   total_co2e_kg = recarga_kg × PCA_gas
 * 
 * ALCANCE 2 - Electricidad:
 *   emisiones_co2_kg = kwh_consumidos × factor_mix_kg_co2_kwh
 *   (Si tiene GdO → factor = 0)
 * 
 * PCA del AR6 IPCC: CH4 = 27.9  |  N2O = 273
 */

import {
  PCA_CH4,
  PCA_N2O,
  type Resultados,
  type Scope1InstalacionesFijas,
  type Scope1Vehiculos,
  type Scope1Fugitivas,
  type Scope2Electricidad,
  type FactorEmision,
} from '@/types/hc-schemas';
import {
  loadScope1InstalacionesFijas,
  loadScope1Vehiculos,
  loadScope1Fugitivas,
  loadScope1Proceso,
  loadScope2Electricidad,
  loadOrganization,
  saveResults,
} from '@/lib/db/json-store';

// ═══════════════════════════════════════════════════════════════════
// FUNCIONES DE CÁLCULO INDIVIDUAL
// ═══════════════════════════════════════════════════════════════════

/**
 * Calcula emisiones totales en kg CO2e a partir de factores de emisión
 * 
 * Fórmula MITECO:
 *   total = CO2(kg) + CH4(g→kg) × PCA_CH4 + N2O(g→kg) × PCA_N2O
 * 
 * @param cantidad - Cantidad de combustible consumido (en la unidad del FE)
 * @param fe - Factor de emisión: CO2 (kg/ud), CH4 (g/ud), N2O (g/ud)
 * @returns Emisiones en kg CO2e
 */
export function calcularEmisionesCombustible(
  cantidad: number,
  fe: FactorEmision
): {
  co2_kg: number;
  ch4_g: number;
  n2o_g: number;
  total_kg_co2e: number;
} {
  const co2_kg = cantidad * fe.co2_kg_ud;
  const ch4_g = cantidad * fe.ch4_g_ud;
  const n2o_g = cantidad * fe.n2o_g_ud;
  
  // Conversión CH4 y N2O de gramos a kg, luego multiplicar por su PCA
  const total_kg_co2e = co2_kg + (ch4_g / 1000) * PCA_CH4 + (n2o_g / 1000) * PCA_N2O;
  
  return {
    co2_kg: Math.round(co2_kg * 1000) / 1000,
    ch4_g: Math.round(ch4_g * 1000) / 1000,
    n2o_g: Math.round(n2o_g * 1000) / 1000,
    total_kg_co2e: Math.round(total_kg_co2e * 1000) / 1000,
  };
}

/**
 * Calcula emisiones fugitivas por recarga de gas refrigerante
 * 
 * Fórmula MITECO:
 *   emisiones_kg_co2e = recarga_kg × PCA_gas
 */
export function calcularEmisionesFugitivas(recarga_kg: number, pca_gas: number): number {
  return Math.round(recarga_kg * pca_gas * 1000) / 1000;
}

/**
 * Calcula emisiones de electricidad (Alcance 2)
 * 
 * Fórmula MITECO:
 *   emisiones_kg_co2 = kWh_consumidos × factor_mix_kg_co2_kwh
 *   Si tiene Garantía de Origen (GdO) → factor = 0 → emisiones = 0
 */
export function calcularEmisionesElectricidad(
  kwh_consumidos: number,
  factor_mix_kg_co2_kwh: number,
  tiene_gdo: boolean
): number {
  if (tiene_gdo) return 0;
  return Math.round(kwh_consumidos * factor_mix_kg_co2_kwh * 1000) / 1000;
}

// ═══════════════════════════════════════════════════════════════════
// CÁLCULO COMPLETO POR ALCANCE
// ═══════════════════════════════════════════════════════════════════

/**
 * Calcula el total de emisiones de Alcance 1 - Instalaciones Fijas
 */
function calcularAlcance1InstalacionesFijas(data: Scope1InstalacionesFijas | null): {
  no_ley_kg: number;
  ley_kg: number;
} {
  if (!data) return { no_ley_kg: 0, ley_kg: 0 };
  
  const no_ley_kg = data.no_sujetas_ley_1_2005.reduce(
    (sum, inst) => sum + inst.emisiones_totales_kg_co2e,
    0
  );
  
  const ley_kg = data.sujetas_ley_1_2005.reduce(
    (sum, inst) => sum + inst.emisiones_totales_kg_co2e,
    0
  );
  
  return { no_ley_kg, ley_kg };
}

/**
 * Calcula el total de emisiones de Alcance 1 - Vehículos
 */
function calcularAlcance1Vehiculos(data: Scope1Vehiculos | null): {
  carretera_kg: number;
  no_carretera_kg: number;
  maquinaria_kg: number;
} {
  if (!data) return { carretera_kg: 0, no_carretera_kg: 0, maquinaria_kg: 0 };
  
  const carretera_a1 = data.transporte_carretera_A1_combustible.reduce(
    (sum, v) => sum + v.emisiones_totales_kg_co2e,
    0
  );
  
  const carretera_a2 = data.transporte_carretera_A2_distancia_km.reduce(
    (sum, v) => sum + v.emisiones_totales_kg_co2e,
    0
  );
  
  const no_carretera = data.transporte_ferroviario_maritimo_aereo.reduce(
    (sum, t) => sum + t.emisiones_totales_kg_co2e,
    0
  );
  
  const maquinaria = data.maquinaria_movil.reduce(
    (sum, m) => sum + m.emisiones_totales_kg_co2e,
    0
  );
  
  return {
    carretera_kg: carretera_a1 + carretera_a2,
    no_carretera_kg: no_carretera,
    maquinaria_kg: maquinaria,
  };
}

/**
 * Calcula el total de emisiones de Alcance 1 - Fugitivas
 */
function calcularAlcance1Fugitivas(data: Scope1Fugitivas | null): number {
  if (!data) return 0;
  
  const climatizacion = data.climatizacion_refrigeracion.reduce(
    (sum, f) => sum + f.emisiones_kg_co2e,
    0
  );
  
  const otros = data.otros.reduce(
    (sum, f) => sum + f.emisiones_kg_co2e,
    0
  );
  
  return climatizacion + otros;
}

/**
 * Calcula el total de emisiones de Alcance 1 - Proceso
 */
function calcularAlcance1Proceso(
  data: { emisiones: Array<{ emisiones_kg_co2e: number }> } | null
): number {
  if (!data) return 0;
  return data.emisiones.reduce((sum, p) => sum + p.emisiones_kg_co2e, 0);
}

/**
 * Calcula el total de emisiones de Alcance 2 - Electricidad
 */
function calcularAlcance2(data: Scope2Electricidad | null): {
  edificios_kg: number;
  vehiculos_kg: number;
  calor_vapor_frio_kg: number;
} {
  if (!data) return { edificios_kg: 0, vehiculos_kg: 0, calor_vapor_frio_kg: 0 };
  
  const edificios = data.electricidad_edificios.reduce(
    (sum, e) => sum + e.emisiones_kg_co2,
    0
  );
  
  const vehiculos = data.electricidad_vehiculos.reduce(
    (sum, e) => sum + e.emisiones_kg_co2,
    0
  );
  
  const calor = data.calor_vapor_frio.reduce(
    (sum, c) => sum + c.emisiones_kg_co2,
    0
  );
  
  return {
    edificios_kg: edificios,
    vehiculos_kg: vehiculos,
    calor_vapor_frio_kg: calor,
  };
}

// ═══════════════════════════════════════════════════════════════════
// AGENTE DE CÁLCULO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

interface RecalculateParams {
  orgId: string;
  anio: number;
  scope?: 'scope1' | 'scope2' | 'both';
}

/**
 * CalcAgent - Agente especializado en el recálculo de la huella de carbono
 * 
 * Cuando se modifica cualquier dato de emisiones, este agente recalcula
 * automáticamente todos los totales afectados y los ratios de la organización.
 */
export class CalcAgent {
  /**
   * Recalcula las emisiones completas de una organización para un año dado
   * 
   * Este método es llamado por el Orquestador cada vez que se modifica un dato.
   * Carga todos los datos de la organización, recalcula los totales y ratios,
   * y guarda los resultados actualizados.
   */
  async recalculate(params: RecalculateParams): Promise<Resultados> {
    const { orgId, anio, scope: _scope = 'both' } = params;
    
    // Cargar datos de la organización
    const org = loadOrganization(orgId, anio);
    
    // Cargar datos de emisiones
    const scope1Fijas = loadScope1InstalacionesFijas(orgId, anio);
    const scope1Vehiculos = loadScope1Vehiculos(orgId, anio);
    const scope1Fugitivas = loadScope1Fugitivas(orgId, anio);
    const scope1Proceso = loadScope1Proceso(orgId, anio);
    const scope2Data = loadScope2Electricidad(orgId, anio);
    
    // ─── Calcular Alcance 1 ─────────────────────────────
    const fijas = calcularAlcance1InstalacionesFijas(scope1Fijas);
    const vehiculos = calcularAlcance1Vehiculos(scope1Vehiculos);
    const fugitivas_kg = calcularAlcance1Fugitivas(scope1Fugitivas);
    const proceso_kg = calcularAlcance1Proceso(scope1Proceso);
    
    const total_alcance1_kg =
      fijas.no_ley_kg +
      fijas.ley_kg +
      vehiculos.carretera_kg +
      vehiculos.no_carretera_kg +
      vehiculos.maquinaria_kg +
      fugitivas_kg +
      proceso_kg;
    
    // ─── Calcular Alcance 2 ─────────────────────────────
    const alcance2 = calcularAlcance2(scope2Data);
    const total_alcance2_kg =
      alcance2.edificios_kg + alcance2.vehiculos_kg + alcance2.calor_vapor_frio_kg;
    
    // ─── Totales en toneladas de CO2e ───────────────────
    const total_t = (total_alcance1_kg + total_alcance2_kg) / 1000;
    
    // ─── Ratios ─────────────────────────────────────────
    const numEmpleados = org?.num_empleados || 1;
    const superficieM2 = org?.superficie_m2 || 1;
    const indiceActividad = org?.indice_actividad?.valor || 1;
    
    const resultados: Resultados = {
      anio_calculo: anio,
      alcance_1: {
        instalaciones_fijas_no_ley: Math.round((fijas.no_ley_kg / 1000) * 1000) / 1000,
        instalaciones_fijas_ley: Math.round((fijas.ley_kg / 1000) * 1000) / 1000,
        transporte_carretera: Math.round((vehiculos.carretera_kg / 1000) * 1000) / 1000,
        transporte_ferroviario_maritimo_aereo: Math.round((vehiculos.no_carretera_kg / 1000) * 1000) / 1000,
        maquinaria: Math.round((vehiculos.maquinaria_kg / 1000) * 1000) / 1000,
        fugitivas: Math.round((fugitivas_kg / 1000) * 1000) / 1000,
        proceso: Math.round((proceso_kg / 1000) * 1000) / 1000,
        total_t_co2e: Math.round((total_alcance1_kg / 1000) * 1000) / 1000,
      },
      alcance_2: {
        electricidad_edificios: Math.round((alcance2.edificios_kg / 1000) * 1000) / 1000,
        electricidad_vehiculos: Math.round((alcance2.vehiculos_kg / 1000) * 1000) / 1000,
        calor_vapor_frio: Math.round((alcance2.calor_vapor_frio_kg / 1000) * 1000) / 1000,
        total_t_co2e: Math.round((total_alcance2_kg / 1000) * 1000) / 1000,
      },
      total_alcance_1_2_t_co2e: Math.round(total_t * 1000) / 1000,
      ratios: {
        t_co2e_por_empleado: Math.round((total_t / numEmpleados) * 1000) / 1000,
        t_co2e_por_m2: Math.round((total_t / superficieM2) * 10000) / 10000,
        t_co2e_por_indice_actividad:
          Math.round((total_t / indiceActividad) * 1000000) / 1000000,
      },
    };
    
    // Guardar resultados
    saveResults(orgId, anio, resultados);
    
    return resultados;
  }
}

export const calcAgent = new CalcAgent();
