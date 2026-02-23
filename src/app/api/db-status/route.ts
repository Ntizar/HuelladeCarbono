/**
 * API Route: /api/db-status
 * 
 * Devuelve el estado de la conexión a Neon PostgreSQL y el uso del free tier.
 * Útil para monitorizar el consumo y detectar si estamos cerca del límite.
 */

import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db/neon';
import { getUsageInfo } from '@/lib/db/free-tier-guard';

export async function GET() {
  try {
    const [connection, usage] = await Promise.all([
      testConnection(),
      getUsageInfo().catch(() => null),
    ]);

    return NextResponse.json({
      status: connection.ok ? 'connected' : 'error',
      postgres_version: connection.version || null,
      usage: usage
        ? {
            db_size_mb: usage.dbSizeMB,
            hard_limit_mb: 400,
            neon_limit_mb: 512,
            usage_percent: usage.usagePercent,
            row_count: usage.rowCount,
            is_near_limit: usage.isNearLimit,
            is_blocked: usage.isBlocked,
          }
        : null,
      error: connection.error || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
