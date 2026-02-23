/**
 * Agente Orquestador Principal (HCOrchestrator)
 * 
 * Elemento diferenciador del SaaS respecto al Excel: cada modificación genera
 * un evento que pasa por validación, recálculo automático y registro en auditoría
 * con timestamp preciso.
 * 
 * Flujo:
 *   Usuario edita dato → AuditAgent → ValidationAgent → CalcAgent → NotifyAgent
 * 
 * Permite tener un historial completo de quién cambió qué dato y cuándo,
 * requisito habitual en auditorías de sostenibilidad corporativa.
 */

import { auditAgent } from './audit-agent';
import { calcAgent } from './calc-agent';
import { validationAgent } from './validation-agent';
import type { DataChangeEvent, Resultados, ValidationResult } from '@/types/hc-schemas';
import { loadResults } from '@/lib/db/pg-store';

class ValidationError extends Error {
  errors: ValidationResult['errors'];
  constructor(errors: ValidationResult['errors']) {
    super(`Errores de validación: ${errors.map((e) => e.message).join(', ')}`);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

/**
 * Umbral de variación (%) para alertas automáticas
 * Si la HC varía más de este % respecto al año anterior, se genera una alerta
 */
const THRESHOLD_PERCENT = 10;

/**
 * HCOrchestrator - Agente orquestador principal del sistema
 */
export class HCOrchestrator {
  /**
   * Procesa un cambio de datos pasándolo por todo el pipeline:
   * Auditoría → Validación → Cálculo → Notificación
   */
  async onDataChange(event: DataChangeEvent): Promise<{
    results: Resultados;
    alerts: string[];
    validation: ValidationResult;
  }> {
    const alerts: string[] = [];
    
    // 1. AuditAgent: registra el cambio con timestamp preciso
    await auditAgent.log({
      userId: event.userId,
      orgId: event.orgId,
      accion: 'UPDATE',
      entidad: event.entity,
      entidadId: event.entityId,
      campoModificado: event.field,
      valorAnterior: event.oldValue,
      valorNuevo: event.newValue,
      timestamp: event.timestamp,
    });
    
    // 2. ValidationAgent: valida coherencia de datos
    const validation = await validationAgent.validate(event);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    
    // Alertas de warning (no bloquean)
    validation.errors
      .filter((e) => e.severity === 'warning')
      .forEach((e) => alerts.push(`⚠️ ${e.message}`));
    
    // 3. CalcAgent: recalcula emisiones afectadas
    const updatedResults = await calcAgent.recalculate({
      orgId: event.orgId,
      anio: event.anio,
      scope: event.affectedScope,
    });
    
    // 4. NotifyAgent: verifica umbrales de variación
    const thresholdAlerts = await this.checkThresholds(
      event.orgId,
      event.anio,
      updatedResults
    );
    alerts.push(...thresholdAlerts);
    
    return { results: updatedResults, alerts, validation };
  }
  
  /**
   * Procesa una acción de cálculo completo
   */
  async onCalculate(userId: string, orgId: string, anio: number): Promise<{
    results: Resultados;
    alerts: string[];
  }> {
    const alerts: string[] = [];
    
    // Registrar la acción de cálculo
    await auditAgent.log({
      userId,
      orgId,
      accion: 'CALCULATE',
      entidad: 'results',
      timestamp: new Date().toISOString(),
    });
    
    // Recalcular todo
    const results = await calcAgent.recalculate({ orgId, anio, scope: 'both' });
    
    // Verificar umbrales
    const thresholdAlerts = await this.checkThresholds(orgId, anio, results);
    alerts.push(...thresholdAlerts);
    
    return { results, alerts };
  }
  
  /**
   * Registra una exportación de informes
   */
  async onExport(
    userId: string,
    orgId: string,
    tipo: string
  ): Promise<void> {
    await auditAgent.log({
      userId,
      orgId,
      accion: 'EXPORT',
      entidad: 'report',
      entidadId: tipo,
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Comprueba si la variación respecto al año anterior supera el umbral
   * 
   * Si la HC total varía más del 10% respecto al año anterior, genera una alerta.
   * Esto es útil para detectar errores de introducción de datos o cambios
   * significativos que requieran justificación en la memoria de sostenibilidad.
   */
  private async checkThresholds(
    orgId: string,
    anio: number,
    currentResults: Resultados
  ): Promise<string[]> {
    const alerts: string[] = [];
    
    // Cargar resultados del año anterior para comparar
    const previousResults = await loadResults(orgId, anio - 1);
    
    if (previousResults && previousResults.total_alcance_1_2_t_co2e > 0) {
      const previousTotal = previousResults.total_alcance_1_2_t_co2e;
      const currentTotal = currentResults.total_alcance_1_2_t_co2e;
      const variacion = ((currentTotal - previousTotal) / previousTotal) * 100;
      
      if (Math.abs(variacion) > THRESHOLD_PERCENT) {
        const direccion = variacion > 0 ? 'AUMENTO' : 'REDUCCIÓN';
        alerts.push(
          `🔔 ${direccion} del ${Math.abs(variacion).toFixed(1)}% respecto a ${anio - 1} ` +
          `(${previousTotal.toFixed(2)} → ${currentTotal.toFixed(2)} t CO2e). ` +
          `Supera el umbral del ${THRESHOLD_PERCENT}%.`
        );
      }
    }
    
    return alerts;
  }
}

export const orchestrator = new HCOrchestrator();
