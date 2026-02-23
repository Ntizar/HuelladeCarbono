/**
 * Neon DB — Conexión a PostgreSQL en Neon (serverless)
 * 
 * Usa @neondatabase/serverless que funciona en Edge y Node.js.
 * La connection string se lee de DATABASE_URL en .env.local.
 * 
 * IMPORTANTE: Esta conexión es serverless — cada query abre y cierra
 * una conexión HTTP, perfecto para el free tier (sin idle compute).
 */

import { neon, NeonQueryFunction } from '@neondatabase/serverless';

/** Tipo auxiliar para queries con parámetros posicionales */
type QueryFn = NeonQueryFunction<false, false>;

let _sql: QueryFn | null = null;

/**
 * Obtiene el cliente SQL de Neon (singleton por proceso).
 * Cada llamada devuelve una función sql`` que ejecuta queries.
 */
export function getSQL(): QueryFn {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      '❌ DATABASE_URL no está configurada.\n' +
      'Añade tu connection string de Neon en .env.local:\n' +
      'DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require'
    );
  }
  _sql = neon(url);
  return _sql;
}

/**
 * Ejecuta una query raw con parámetros posicionales ($1, $2...).
 * Usa sql.query() que es la API correcta para queries parametrizadas.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const sql = getSQL();
  const result = await sql.query(text, params);
  return ((result as any).rows ?? result) as T[];
}

/**
 * Ejecuta una query que devuelve una sola fila (o null).
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * Comprueba la conexión a la base de datos.
 */
export async function testConnection(): Promise<{ ok: boolean; version?: string; error?: string }> {
  try {
    const sql = getSQL();
    const rows = await sql`SELECT version()`;
    return { ok: true, version: String(rows[0]?.version || 'unknown') };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
