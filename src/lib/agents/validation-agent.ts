/**
 * Agente de Validación (ValidationAgent)
 * 
 * Verifica la coherencia de los datos introducidos por el usuario:
 * - Año de cálculo disponible en los factores de emisión
 * - Valores numéricos dentro de rangos razonables
 * - Campos obligatorios completados
 * - Tipos de combustible/vehículo válidos
 * - CIF/NIF con formato correcto
 */

import { loadEmissionFactors, loadDropdowns } from '@/lib/db/pg-store';
import type { DataChangeEvent, ValidationResult } from '@/types/hc-schemas';

/**
 * ValidationAgent - Valida coherencia de datos antes del cálculo
 */
export class ValidationAgent {
  /**
   * Valida un evento de cambio de datos
   */
  async validate(event: DataChangeEvent): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const factors = loadEmissionFactors();
    
    // Verificar que el año de cálculo es razonable (2007-2027)
    // Si el año no tiene factores exactos, se usarán los del último año disponible
    if (event.anio < 2007 || event.anio > 2027) {
      errors.push({
        field: 'anio',
        message: `El año ${event.anio} está fuera del rango permitido (2007-2027)`,
        severity: 'error',
      });
    } else if (factors && !factors.anios_disponibles.includes(event.anio)) {
      errors.push({
        field: 'anio',
        message: `El año ${event.anio} no tiene factores de emisión propios. Se usarán los del último año disponible (${factors.anios_disponibles[factors.anios_disponibles.length - 1]}).`,
        severity: 'warning',
      });
    }
    
    // Verificar valores numéricos no negativos
    if (typeof event.newValue === 'number' && event.newValue < 0) {
      errors.push({
        field: event.field,
        message: `El valor de "${event.field}" no puede ser negativo`,
        severity: 'error',
      });
    }
    
    // Verificar campos de cantidad razonables (alerta si > 10M)
    if (
      typeof event.newValue === 'number' &&
      event.field.includes('cantidad') &&
      event.newValue > 10000000
    ) {
      errors.push({
        field: event.field,
        message: `El valor ${event.newValue} parece inusualmente alto. ¿Estás seguro?`,
        severity: 'warning',
      });
    }
    
    // Verificar que el tipo de combustible es válido
    if (event.field === 'tipo_combustible' && typeof event.newValue === 'string') {
      const dropdowns = loadDropdowns();
      if (dropdowns) {
        const validFuels = [
          ...dropdowns.tipos_combustible_fijo,
          ...dropdowns.tipos_combustible_vehiculo,
        ];
        if (!validFuels.includes(event.newValue)) {
          errors.push({
            field: event.field,
            message: `Tipo de combustible "${event.newValue}" no reconocido`,
            severity: 'warning',
          });
        }
      }
    }
    
    return {
      isValid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }
  
  /**
   * Valida los datos de una organización completa
   */
  async validateOrganization(data: Record<string, any>): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    
    if (!data.nombre || data.nombre.trim() === '') {
      errors.push({ field: 'nombre', message: 'El nombre es obligatorio', severity: 'error' });
    }
    
    if (!data.cif_nif || !/^[A-Z]\d{8}$|^\d{8}[A-Z]$/.test(data.cif_nif)) {
      errors.push({ field: 'cif_nif', message: 'CIF/NIF no válido (formato: B12345678 o 12345678A)', severity: 'error' });
    }
    
    if (!data.num_empleados || data.num_empleados <= 0) {
      errors.push({ field: 'num_empleados', message: 'Debe indicar al menos 1 empleado', severity: 'error' });
    }
    
    if (!data.superficie_m2 || data.superficie_m2 <= 0) {
      errors.push({ field: 'superficie_m2', message: 'La superficie debe ser positiva', severity: 'error' });
    }
    
    return {
      isValid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }
}

export const validationAgent = new ValidationAgent();
