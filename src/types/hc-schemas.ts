/**
 * Esquemas TypeScript para la Calculadora de Huella de Carbono (MITECO España)
 * 
 * Basado en la normativa española de huella de carbono:
 * - GHG Protocol Corporate Standard (Alcance 1 + 2)
 * - Real Decreto 163/2014 - Registro de Huella de Carbono
 * - Potenciales de Calentamiento Global (PCA) del AR6 IPCC: CH4=27.9, N2O=273
 * 
 * Versión del Excel MITECO: V.31 (años 2007-2024)
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES GLOBALES
// ═══════════════════════════════════════════════════════════════════

/** PCA (Potencial de Calentamiento Atmosférico) del AR6 del IPCC */
export const PCA_CH4 = 27.9;
export const PCA_N2O = 273;

// ═══════════════════════════════════════════════════════════════════
// TIPOS DE LA ORGANIZACIÓN (Pestaña 1)
// ═══════════════════════════════════════════════════════════════════

export const TipoOrganizacionEnum = z.enum([
  'Empresa privada',
  'Empresa pública',
  'Administración Pública',
  'Fundación / ONG',
  'Autónomo',
  'Otra'
]);

export const IndiceActividadSchema = z.object({
  nombre: z.string().min(1, 'El nombre del índice es obligatorio'),
  valor: z.number().positive('El valor debe ser positivo'),
  unidades: z.string().min(1, 'Las unidades son obligatorias'),
});

export const HistoricoHCSchema = z.object({
  anio: z.number().int().min(2007).max(2030),
  hc_t_co2e: z.number().min(0),
});

export const OrganizacionSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  cif_nif: z.string().regex(/^[A-Z]\d{8}$|^\d{8}[A-Z]$/, 'CIF/NIF no válido'),
  tipo_organizacion: TipoOrganizacionEnum,
  sector: z.string().min(1, 'El sector es obligatorio'),
  anio_calculo: z.number().int().min(2007).max(2030),
  superficie_m2: z.number().positive('La superficie debe ser positiva'),
  num_empleados: z.number().int().positive('El número de empleados debe ser positivo'),
  indice_actividad: IndiceActividadSchema,
  historico_hc: z.array(HistoricoHCSchema).optional(),
});

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - INSTALACIONES FIJAS (Pestaña 3)
// ═══════════════════════════════════════════════════════════════════

/** Factor de emisión con CO2 (kg/ud), CH4 (g/ud) y N2O (g/ud) */
export const FactorEmisionSchema = z.object({
  co2_kg_ud: z.number().min(0),
  ch4_g_ud: z.number().min(0),
  n2o_g_ud: z.number().min(0),
});

export const EmisionesParcialSchema = z.object({
  co2_kg: z.number().min(0),
  ch4_g: z.number().min(0),
  n2o_g: z.number().min(0),
});

/** Instalación fija no sujeta a Ley 1/2005 (la mayoría de organizaciones) */
export const InstalacionFijaNoLeySchema = z.object({
  id: z.string().uuid(),
  edificio_sede: z.string().min(1, 'La sede es obligatoria'),
  tipo_combustible: z.string().min(1, 'El tipo de combustible es obligatorio'),
  cantidad: z.number().min(0, 'La cantidad no puede ser negativa'),
  factor_emision: FactorEmisionSchema,
  emisiones_parciales: EmisionesParcialSchema,
  emisiones_totales_kg_co2e: z.number().min(0),
});

/** Instalación fija sujeta a Ley 1/2005 (Directiva ETS de comercio de emisiones) */
export const InstalacionFijaLeySchema = z.object({
  id: z.string().uuid(),
  categoria_actividad: z.string(),
  edificio_sede: z.string().min(1),
  instalacion: z.string().min(1),
  emisiones_verificadas: EmisionesParcialSchema,
  emisiones_totales_kg_co2e: z.number().min(0),
});

export const Scope1InstalacionesFijasSchema = z.object({
  no_sujetas_ley_1_2005: z.array(InstalacionFijaNoLeySchema),
  sujetas_ley_1_2005: z.array(InstalacionFijaLeySchema),
});

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - VEHÍCULOS (Pestaña 4)
// ═══════════════════════════════════════════════════════════════════

/** Método A1: cálculo por combustible consumido */
export const VehiculoA1Schema = z.object({
  id: z.string().uuid(),
  edificio_sede: z.string().min(1),
  tipo_combustible: z.string().min(1),
  categoria_vehiculo: z.string().min(1),
  cantidad: z.number().min(0),
  factor_emision: FactorEmisionSchema,
  emisiones_parciales: EmisionesParcialSchema,
  emisiones_totales_kg_co2e: z.number().min(0),
});

/** Método A2: cálculo por distancia recorrida (km) */
export const VehiculoA2Schema = z.object({
  id: z.string().uuid(),
  edificio_sede: z.string().min(1),
  tipo_combustible: z.string().min(1),
  categoria_vehiculo: z.string().min(1),
  km_recorridos: z.number().min(0),
  factor_emision: FactorEmisionSchema,
  emisiones_parciales: EmisionesParcialSchema,
  emisiones_totales_kg_co2e: z.number().min(0),
});

/** Transporte ferroviario, marítimo o aéreo */
export const TransporteNoCarreteraSchema = z.object({
  id: z.string().uuid(),
  edificio_sede: z.string().min(1),
  tipo_transporte: z.string().min(1),
  cantidad: z.number().min(0),
  unidad: z.string(), // km, t·km
  factor_emision_co2_kg: z.number().min(0),
  emisiones_totales_kg_co2e: z.number().min(0),
});

/** Maquinaria móvil (off-road) */
export const MaquinariaMovilSchema = z.object({
  id: z.string().uuid(),
  edificio_sede: z.string().min(1),
  tipo_maquinaria: z.string().min(1),
  tipo_combustible: z.string().min(1),
  cantidad: z.number().min(0),
  factor_emision: FactorEmisionSchema,
  emisiones_parciales: EmisionesParcialSchema,
  emisiones_totales_kg_co2e: z.number().min(0),
});

export const Scope1VehiculosSchema = z.object({
  transporte_carretera_A1_combustible: z.array(VehiculoA1Schema),
  transporte_carretera_A2_distancia_km: z.array(VehiculoA2Schema),
  transporte_ferroviario_maritimo_aereo: z.array(TransporteNoCarreteraSchema),
  maquinaria_movil: z.array(MaquinariaMovilSchema),
});

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - EMISIONES FUGITIVAS (Pestaña 5)
// ═══════════════════════════════════════════════════════════════════

/** Fuga de gas refrigerante (climatización/refrigeración) */
export const FugitivaClimatizacionSchema = z.object({
  id: z.string().uuid(),
  edificio_sede: z.string().min(1),
  gas: z.string().min(1),
  formula_quimica: z.string(),
  pca: z.number().min(0),
  tipo_equipo: z.string().min(1),
  capacidad_kg: z.number().min(0),
  recarga_kg: z.number().min(0),
  emisiones_kg_co2e: z.number().min(0),
});

export const Scope1FugitivasSchema = z.object({
  climatizacion_refrigeracion: z.array(FugitivaClimatizacionSchema),
  otros: z.array(z.object({
    id: z.string().uuid(),
    descripcion: z.string(),
    emisiones_kg_co2e: z.number().min(0),
  })),
});

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 1 - EMISIONES DE PROCESO (Pestaña 6)
// ═══════════════════════════════════════════════════════════════════

export const EmisionProcesoSchema = z.object({
  id: z.string().uuid(),
  descripcion: z.string().min(1),
  proceso: z.string().min(1),
  emisiones_kg_co2e: z.number().min(0),
});

// ═══════════════════════════════════════════════════════════════════
// ALCANCE 2 - ELECTRICIDAD Y OTRAS ENERGÍAS (Pestaña 8)
// ═══════════════════════════════════════════════════════════════════

/** Consumo eléctrico por edificio/sede */
export const ElectricidadEdificioSchema = z.object({
  id: z.string().uuid(),
  edificio_sede: z.string().min(1),
  comercializadora: z.string().min(1),
  garantia_origen: z.boolean(),
  kwh_consumidos: z.number().min(0),
  factor_mix_kg_co2_kwh: z.number().min(0),
  emisiones_kg_co2: z.number().min(0),
});

/** Consumo eléctrico de vehículos eléctricos */
export const ElectricidadVehiculoSchema = z.object({
  id: z.string().uuid(),
  edificio_sede: z.string().min(1),
  kwh_consumidos: z.number().min(0),
  factor_mix_kg_co2_kwh: z.number().min(0),
  emisiones_kg_co2: z.number().min(0),
});

export const Scope2ElectricidadSchema = z.object({
  electricidad_edificios: z.array(ElectricidadEdificioSchema),
  electricidad_vehiculos: z.array(ElectricidadVehiculoSchema),
  calor_vapor_frio: z.array(z.object({
    id: z.string().uuid(),
    edificio_sede: z.string().min(1),
    tipo: z.string().min(1),
    cantidad_kwh: z.number().min(0),
    factor_emision: z.number().min(0),
    emisiones_kg_co2: z.number().min(0),
  })),
});

// ═══════════════════════════════════════════════════════════════════
// RESULTADOS (Pestaña 9)
// ═══════════════════════════════════════════════════════════════════

export const ResultadosSchema = z.object({
  anio_calculo: z.number().int(),
  alcance_1: z.object({
    instalaciones_fijas_no_ley: z.number(),
    instalaciones_fijas_ley: z.number(),
    transporte_carretera: z.number(),
    transporte_ferroviario_maritimo_aereo: z.number(),
    maquinaria: z.number(),
    fugitivas: z.number(),
    proceso: z.number(),
    total_t_co2e: z.number(),
  }),
  alcance_2: z.object({
    electricidad_edificios: z.number(),
    electricidad_vehiculos: z.number(),
    calor_vapor_frio: z.number(),
    total_t_co2e: z.number(),
  }),
  total_alcance_1_2_t_co2e: z.number(),
  ratios: z.object({
    t_co2e_por_empleado: z.number(),
    t_co2e_por_m2: z.number(),
    t_co2e_por_indice_actividad: z.number(),
  }),
});

// ═══════════════════════════════════════════════════════════════════
// USUARIOS Y AUDITORÍA
// ═══════════════════════════════════════════════════════════════════

export const RolUsuarioEnum = z.enum(['admin', 'editor', 'viewer', 'auditor']);
export const PlanEnum = z.enum(['free', 'pro', 'enterprise']);
export const AccionAuditoriaEnum = z.enum([
  'CREATE', 'UPDATE', 'DELETE', 'CALCULATE', 'EXPORT',
  'LOGIN', 'LOGOUT', 'IMPORT'
]);

export const UsuarioSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1),
  email: z.string().email(),
  password_hash: z.string(),
  organizacion_id: z.string(),
  rol: RolUsuarioEnum,
  plan: PlanEnum,
  activo: z.boolean(),
  created_at: z.string().datetime(),
  last_login: z.string().datetime().optional(),
});

export const AuditLogSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  org_id: z.string(),
  accion: AccionAuditoriaEnum,
  entidad_tipo: z.string(),
  entidad_id: z.string().optional(),
  campo_modificado: z.string().optional(),
  valor_anterior: z.string().optional(),
  valor_nuevo: z.string().optional(),
  timestamp: z.string().datetime(),
  ip_address: z.string().optional(),
  session_id: z.string().optional(),
});

export const OrganizacionCSVSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  cif_nif: z.string(),
  sector: z.string(),
  plan: PlanEnum,
  max_usuarios: z.number().int().positive(),
  created_at: z.string().datetime(),
  anio_calculo_activo: z.number().int(),
});

// ═══════════════════════════════════════════════════════════════════
// EVENTOS DEL AGENTE ORQUESTADOR
// ═══════════════════════════════════════════════════════════════════

export const DataChangeEventSchema = z.object({
  userId: z.string(),
  orgId: z.string(),
  anio: z.number().int(),
  entity: z.string(),
  entityId: z.string().optional(),
  field: z.string(),
  oldValue: z.any(),
  newValue: z.any(),
  affectedScope: z.enum(['scope1', 'scope2', 'both']),
  timestamp: z.string().datetime(),
});

export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    severity: z.enum(['error', 'warning']),
  })),
});

// ═══════════════════════════════════════════════════════════════════
// TIPOS INFERIDOS (para usar en el código)
// ═══════════════════════════════════════════════════════════════════

export type TipoOrganizacion = z.infer<typeof TipoOrganizacionEnum>;
export type IndiceActividad = z.infer<typeof IndiceActividadSchema>;
export type HistoricoHC = z.infer<typeof HistoricoHCSchema>;
export type Organizacion = z.infer<typeof OrganizacionSchema>;

export type FactorEmision = z.infer<typeof FactorEmisionSchema>;
export type EmisionesParcial = z.infer<typeof EmisionesParcialSchema>;
export type InstalacionFijaNoLey = z.infer<typeof InstalacionFijaNoLeySchema>;
export type InstalacionFijaLey = z.infer<typeof InstalacionFijaLeySchema>;
export type Scope1InstalacionesFijas = z.infer<typeof Scope1InstalacionesFijasSchema>;

export type VehiculoA1 = z.infer<typeof VehiculoA1Schema>;
export type VehiculoA2 = z.infer<typeof VehiculoA2Schema>;
export type TransporteNoCarretera = z.infer<typeof TransporteNoCarreteraSchema>;
export type MaquinariaMovil = z.infer<typeof MaquinariaMovilSchema>;
export type Scope1Vehiculos = z.infer<typeof Scope1VehiculosSchema>;

export type FugitivaClimatizacion = z.infer<typeof FugitivaClimatizacionSchema>;
export type Scope1Fugitivas = z.infer<typeof Scope1FugitivasSchema>;
export type EmisionProceso = z.infer<typeof EmisionProcesoSchema>;

export type ElectricidadEdificio = z.infer<typeof ElectricidadEdificioSchema>;
export type ElectricidadVehiculo = z.infer<typeof ElectricidadVehiculoSchema>;
export type Scope2Electricidad = z.infer<typeof Scope2ElectricidadSchema>;

export type Resultados = z.infer<typeof ResultadosSchema>;

export type RolUsuario = z.infer<typeof RolUsuarioEnum>;
export type Plan = z.infer<typeof PlanEnum>;
export type AccionAuditoria = z.infer<typeof AccionAuditoriaEnum>;
export type Usuario = z.infer<typeof UsuarioSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type OrganizacionCSV = z.infer<typeof OrganizacionCSVSchema>;

export type DataChangeEvent = z.infer<typeof DataChangeEventSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// ═══════════════════════════════════════════════════════════════════
// TIPOS AUXILIARES PARA FACTORES DE EMISIÓN
// ═══════════════════════════════════════════════════════════════════

export interface FactorEmisionPorAnio {
  [anio: string]: {
    co2_kg_ud: number;
    ch4_g_ud: number;
    n2o_g_ud: number;
  };
}

export interface CombustibleFijo {
  nombre: string;
  unidad: string;
  factores: FactorEmisionPorAnio;
}

export interface CombustibleVehiculo {
  nombre: string;
  unidad: string;
  por_categoria: {
    [categoria: string]: {
      nombre: string;
      factores: FactorEmisionPorAnio;
    };
  };
}

export interface GasRefrigerante {
  formula: string;
  pca: number;
  nombre: string;
}

export interface MixElectrico {
  nombre: string;
  factores_kg_co2_kwh: {
    [anio: string]: number;
  };
}

export interface EmissionFactors {
  version: string;
  fuente: string;
  pca_ar6: { CH4: number; N2O: number };
  anios_disponibles: number[];
  combustibles_instalaciones_fijas: Record<string, CombustibleFijo>;
  combustibles_vehiculos_carretera: Record<string, CombustibleVehiculo>;
  gases_refrigerantes_pca: Record<string, GasRefrigerante>;
  mix_electrico_comercializadoras: Record<string, MixElectrico>;
  transporte_no_carretera: Record<string, any>;
}

export interface Dropdowns {
  tipos_combustible_fijo: string[];
  tipos_combustible_vehiculo: string[];
  categorias_vehiculo: string[];
  tipos_gas_refrigerante: string[];
  tipos_equipo_climatizacion: string[];
  comercializadoras_electricas: string[];
  sectores: string[];
  tipos_organizacion: string[];
  metodos_calculo_vehiculos: string[];
  anios_calculo: number[];
  [key: string]: string[] | number[];
}

// ═══════════════════════════════════════════════════════════════════
// DATOS HC POR ORGANIZACIÓN (para hc_data.csv)
// ═══════════════════════════════════════════════════════════════════

export interface HCDataRow {
  id: string;
  org_id: string;
  anio: number;
  scope: 'scope1' | 'scope2';
  categoria: string;
  subcategoria: string;
  edificio_sede: string;
  tipo_combustible: string;
  cantidad: number;
  unidad: string;
  factor_co2: number;
  factor_ch4: number;
  factor_n2o: number;
  emisiones_co2e_kg: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  version: number;
}
