/**
 * API Route: /api/reports
 * 
 * Endpoints para generación y descarga de informes en PDF, Excel y CSV.
 */

import { NextRequest, NextResponse } from 'next/server';
import { reportAgent } from '@/lib/agents/report-agent';
import { orchestrator } from '@/lib/agents/orchestrator';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org_001';
  const anio = parseInt(searchParams.get('anio') || '2024');
  const formato = searchParams.get('formato') || 'json';
  const userId = searchParams.get('userId') || 'usr_001';
  
  try {
    switch (formato) {
      case 'excel': {
        const buffer = await reportAgent.generateExcel(orgId, anio);
        await orchestrator.onExport(userId, orgId, 'excel');
        
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=huella_carbono_${orgId}_${anio}.xlsx`,
          },
        });
      }
      
      case 'csv': {
        const csv = await reportAgent.generateCSV(orgId, anio);
        await orchestrator.onExport(userId, orgId, 'csv');
        
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename=datos_hc_${orgId}_${anio}.csv`,
          },
        });
      }
      
      case 'pdf':
      case 'json':
      default: {
        const data = await reportAgent.generatePDFData(orgId, anio);
        return NextResponse.json(data);
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
