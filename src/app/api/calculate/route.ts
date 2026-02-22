/**
 * API Route: /api/calculate
 * 
 * Endpoint para forzar el recálculo completo de la huella de carbono.
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId = 'org_001', anio = 2024, userId = 'usr_001' } = body;
    
    const { results, alerts } = await orchestrator.onCalculate(userId, orgId, anio);
    
    return NextResponse.json({ success: true, results, alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
