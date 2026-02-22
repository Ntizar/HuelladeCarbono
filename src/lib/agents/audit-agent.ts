/**
 * Agente de Auditoría (AuditAgent)
 * 
 * Registra cada acción del sistema en el log de auditoría (audit_log.csv).
 * Requisito habitual en auditorías de sostenibilidad corporativa según
 * el Real Decreto 163/2014 y la normativa de reporting ESG.
 * 
 * Cada entrada incluye: quién, qué, cuándo, desde dónde, y los valores antes/después.
 */

import { v4 as uuidv4 } from 'uuid';
import { appendRow, filterByOrg } from '@/lib/db/csv-handler';
import type { AuditLog, AccionAuditoria } from '@/types/hc-schemas';

interface AuditEntry {
  userId: string;
  orgId: string;
  accion: AccionAuditoria;
  entidad: string;
  entidadId?: string;
  campoModificado?: string;
  valorAnterior?: any;
  valorNuevo?: any;
  timestamp: string;
  ipAddress?: string;
  sessionId?: string;
}

/**
 * AuditAgent - Registra todas las operaciones en el sistema
 * 
 * Cada modificación de datos, cálculo, exportación, login/logout queda
 * registrada con timestamp preciso para trazabilidad completa.
 */
export class AuditAgent {
  /**
   * Registra una acción en el log de auditoría
   */
  async log(entry: AuditEntry): Promise<void> {
    const auditRow = {
      id: `aud_${uuidv4().slice(0, 8)}`,
      user_id: entry.userId,
      org_id: entry.orgId,
      accion: entry.accion,
      entidad_tipo: entry.entidad,
      entidad_id: entry.entidadId || '',
      campo_modificado: entry.campoModificado || '',
      valor_anterior: entry.valorAnterior !== undefined ? String(entry.valorAnterior) : '',
      valor_nuevo: entry.valorNuevo !== undefined ? String(entry.valorNuevo) : '',
      timestamp: entry.timestamp,
      ip_address: entry.ipAddress || '',
      session_id: entry.sessionId || '',
    };
    
    await appendRow('audit_log', auditRow);
  }
  
  /**
   * Obtiene el log completo de una organización
   */
  async getOrgLog(orgId: string): Promise<AuditLog[]> {
    return filterByOrg<AuditLog>('audit_log', orgId);
  }
  
  /**
   * Obtiene las últimas N entradas del log
   */
  async getRecent(orgId: string, limit: number = 50): Promise<AuditLog[]> {
    const logs = await this.getOrgLog(orgId);
    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  /**
   * Filtra log por tipo de acción
   */
  async getByAction(orgId: string, accion: AccionAuditoria): Promise<AuditLog[]> {
    const logs = await this.getOrgLog(orgId);
    return logs.filter((log) => log.accion === accion);
  }
  
  /**
   * Filtra log por rango de fechas
   */
  async getByDateRange(
    orgId: string,
    desde: Date,
    hasta: Date
  ): Promise<AuditLog[]> {
    const logs = await this.getOrgLog(orgId);
    return logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= desde && logDate <= hasta;
    });
  }
}

export const auditAgent = new AuditAgent();
