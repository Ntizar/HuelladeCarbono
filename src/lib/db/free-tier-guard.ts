/**
 * Free Tier Guard — Bloqueo duro si se excede el plan gratuito de Neon
 * 
 * Neon Free Tier:
 *   · 512 MB almacenamiento
 *   · 1 proyecto, 10 branches
 *   · Compute: 0.25 vCPU auto-suspend tras 5 min inactivo
 * 
 * Este módulo:
 *   1. Antes de cada WRITE, consulta pg_database_size()
 *   2. Si supera HARD_LIMIT_BYTES (400 MB) → BLOQUEA la operación
 *   3. Si supera WARN_LIMIT_BYTES (300 MB) → permite pero avisa
 *   4. Cachea el resultado 60 segundos para no saturar con queries
 * 
 * NO es solo un aviso — es un bloqueo real que lanza un error HTTP 507.
 */

import { queryOne } from './neon';

// ─── Límites ────────────────────────────────────────────────────
// Neon free tier = 512 MB. Dejamos margen de seguridad.

/** 400 MB — A partir de aquí se BLOQUEAN todas las escrituras */
const HARD_LIMIT_BYTES = 400 * 1024 * 1024;

/** 300 MB — A partir de aquí se genera un WARNING (pero se permite) */
const WARN_LIMIT_BYTES = 300 * 1024 * 1024;

/** Máximo número de filas en org_year_data (protección extra) */
const MAX_ROWS = 10_000;

/** Tiempo de caché del tamaño en ms (60 segundos) */
const CACHE_TTL_MS = 60_000;

// ─── Caché en memoria ──────────────────────────────────────────

interface SizeCache {
  bytes: number;
  rows: number;
  checkedAt: number;
}

let _cache: SizeCache | null = null;

// ─── Tipos de resultado ────────────────────────────────────────

export interface GuardResult {
  allowed: boolean;
  dbSizeBytes: number;
  dbSizeMB: string;
  rowCount: number;
  limitMB: number;
  warnMB: number;
  usagePercent: string;
  warning?: string;
  error?: string;
}

// ─── Funciones públicas ────────────────────────────────────────

/**
 * Consulta el tamaño actual de la BBDD.
 * Usa caché para no hacer query en cada request.
 */
export async function getDatabaseSize(): Promise<SizeCache> {
  const now = Date.now();
  if (_cache && (now - _cache.checkedAt) < CACHE_TTL_MS) {
    return _cache;
  }

  try {
    const sizeRow = await queryOne<{ size: string }>(
      `SELECT pg_database_size(current_database()) as size`
    );
    const rowCountRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM org_year_data`
    );

    const result: SizeCache = {
      bytes: parseInt(sizeRow?.size || '0', 10),
      rows: parseInt(rowCountRow?.count || '0', 10),
      checkedAt: now,
    };
    _cache = result;
    return result;
  } catch {
    // Si falla (tabla no existe aún, etc.), devolver 0
    return { bytes: 0, rows: 0, checkedAt: now };
  }
}

/**
 * GUARD PRINCIPAL — Llama a esto ANTES de cada operación de escritura.
 * 
 * Si devuelve allowed=false, la API debe devolver HTTP 507 
 * (Insufficient Storage) y NO ejecutar la escritura.
 */
export async function checkWriteAllowed(): Promise<GuardResult> {
  const { bytes, rows } = await getDatabaseSize();
  const limitMB = Math.round(HARD_LIMIT_BYTES / 1024 / 1024);
  const warnMB = Math.round(WARN_LIMIT_BYTES / 1024 / 1024);
  const dbSizeMB = (bytes / 1024 / 1024).toFixed(2);
  const usagePercent = ((bytes / HARD_LIMIT_BYTES) * 100).toFixed(1);

  const base: GuardResult = {
    allowed: true,
    dbSizeBytes: bytes,
    dbSizeMB,
    rowCount: rows,
    limitMB,
    warnMB,
    usagePercent,
  };

  // ─── BLOQUEO DURO: Tamaño excede el límite ───
  if (bytes >= HARD_LIMIT_BYTES) {
    return {
      ...base,
      allowed: false,
      error: `🚫 BLOQUEADO: La base de datos ha alcanzado ${dbSizeMB} MB (límite: ${limitMB} MB). ` +
        `Elimina datos antiguos o contacta al administrador para ampliar el plan. ` +
        `No se pueden añadir más registros hasta liberar espacio.`,
    };
  }

  // ─── BLOQUEO DURO: Demasiadas filas ───
  if (rows >= MAX_ROWS) {
    return {
      ...base,
      allowed: false,
      error: `🚫 BLOQUEADO: Se ha alcanzado el límite de ${MAX_ROWS.toLocaleString()} registros. ` +
        `Elimina datos que no necesites antes de añadir más.`,
    };
  }

  // ─── WARNING: Acercándose al límite ───
  if (bytes >= WARN_LIMIT_BYTES) {
    return {
      ...base,
      warning: `⚠️ AVISO: La base de datos está al ${usagePercent}% de capacidad (${dbSizeMB}/${limitMB} MB). ` +
        `Considera eliminar datos antiguos o reducir el volumen de registros.`,
    };
  }

  return base;
}

/**
 * Versión rápida para endpoints de solo lectura — solo devuelve info.
 */
export async function getUsageInfo(): Promise<{
  dbSizeMB: string;
  usagePercent: string;
  rowCount: number;
  isNearLimit: boolean;
  isBlocked: boolean;
}> {
  const { bytes, rows } = await getDatabaseSize();
  return {
    dbSizeMB: (bytes / 1024 / 1024).toFixed(2),
    usagePercent: ((bytes / HARD_LIMIT_BYTES) * 100).toFixed(1),
    rowCount: rows,
    isNearLimit: bytes >= WARN_LIMIT_BYTES,
    isBlocked: bytes >= HARD_LIMIT_BYTES || rows >= MAX_ROWS,
  };
}

/**
 * Invalida la caché (útil después de un DELETE masivo).
 */
export function invalidateCache(): void {
  _cache = null;
}
