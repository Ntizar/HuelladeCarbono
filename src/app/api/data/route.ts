/**
 * API Route: /api/data
 * 
 * CRUD para datos de huella de carbono por organización.
 * Cada operación pasa por el agente orquestador para validación,
 * cálculo automático y registro en auditoría.
 * 
 * Almacenamiento: PostgreSQL en Neon (free tier con HARD BLOCK a 400 MB).
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents/orchestrator';
import * as pgStore from '@/lib/db/pg-store';
import { FreeTierBlockedError } from '@/lib/db/pg-store';
import { getUsageInfo } from '@/lib/db/free-tier-guard';
import { v4 as uuidv4 } from 'uuid';
import { calcularEmisionesCombustible, calcularEmisionesFugitivas, calcularEmisionesElectricidad } from '@/lib/agents/calc-agent';

/** Helper: respuesta de error con código apropiado */
function errorResponse(error: any) {
  if (error instanceof FreeTierBlockedError) {
    return NextResponse.json(
      { error: error.message, code: 'FREE_TIER_EXCEEDED' },
      { status: 507 }
    );
  }
  return NextResponse.json({ error: error.message }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org_001';
  const anio = parseInt(searchParams.get('anio') || '2024');
  const tipo = searchParams.get('tipo') || 'all';
  
  try {
    switch (tipo) {
      case 'organization':
        return NextResponse.json(await pgStore.loadOrganization(orgId, anio));
      case 'scope1_instalaciones':
        return NextResponse.json(await pgStore.loadScope1InstalacionesFijas(orgId, anio));
      case 'scope1_vehiculos':
        return NextResponse.json(await pgStore.loadScope1Vehiculos(orgId, anio));
      case 'scope1_fugitivas':
        return NextResponse.json(await pgStore.loadScope1Fugitivas(orgId, anio));
      case 'scope1_proceso':
        return NextResponse.json(await pgStore.loadScope1Proceso(orgId, anio));
      case 'scope2':
        return NextResponse.json(await pgStore.loadScope2Electricidad(orgId, anio));
      case 'results':
        return NextResponse.json(await pgStore.loadResults(orgId, anio));
      case 'sedes':
        return NextResponse.json((await pgStore.loadSedes(orgId, anio)) || { sedes: [] });
      case 'all_raw':
        return NextResponse.json(await pgStore.loadAllOrgData(orgId, anio));
      case 'factors':
        return NextResponse.json(pgStore.loadEmissionFactors());
      case 'dropdowns':
        return NextResponse.json(pgStore.loadDropdowns());
      case 'years':
        return NextResponse.json(await pgStore.listOrgYears(orgId));
      case 'usage':
        return NextResponse.json(await getUsageInfo());
      case 'all':
      default:
        return NextResponse.json(await pgStore.loadAllOrgData(orgId, anio));
    }
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId = 'org_001', anio = 2024, tipo, data, userId = 'usr_001' } = body;
    
    // Inicializar estructura si es la primera vez
    await pgStore.initializeOrgYear(orgId, anio);
    
    switch (tipo) {
      case 'organization':
        await pgStore.saveOrganization(orgId, anio, { ...data, id: data.id || uuidv4() });
        break;
        
      case 'scope1_instalacion_fija': {
        const current = await pgStore.loadScope1InstalacionesFijas(orgId, anio);
        if (current) {
          const newItem = {
            ...data,
            id: data.id || uuidv4(),
          };
          // Calcular emisiones automáticamente
          if (data.cantidad && data.factor_emision) {
            const calc = calcularEmisionesCombustible(data.cantidad, data.factor_emision);
            newItem.emisiones_parciales = { co2_kg: calc.co2_kg, ch4_g: calc.ch4_g, n2o_g: calc.n2o_g };
            newItem.emisiones_totales_kg_co2e = calc.total_kg_co2e;
          }
          current.no_sujetas_ley_1_2005.push(newItem);
          await pgStore.saveScope1InstalacionesFijas(orgId, anio, current);
        }
        break;
      }
        
      case 'scope1_fugitiva': {
        const current = await pgStore.loadScope1Fugitivas(orgId, anio);
        if (current) {
          const newItem = {
            ...data,
            id: data.id || uuidv4(),
            emisiones_kg_co2e: calcularEmisionesFugitivas(data.recarga_kg || 0, data.pca || 0),
          };
          current.climatizacion_refrigeracion.push(newItem);
          await pgStore.saveScope1Fugitivas(orgId, anio, current);
        }
        break;
      }
      
      case 'scope2_electricidad': {
        const current = await pgStore.loadScope2Electricidad(orgId, anio);
        if (current) {
          const newItem = {
            ...data,
            id: data.id || uuidv4(),
            emisiones_kg_co2: calcularEmisionesElectricidad(
              data.kwh_consumidos || 0,
              data.factor_mix_kg_co2_kwh || 0,
              data.garantia_origen || false
            ),
          };
          current.electricidad_edificios.push(newItem);
          await pgStore.saveScope2Electricidad(orgId, anio, current);
        }
        break;
      }
      
      case 'sedes': {
        const currentSedes = (await pgStore.loadSedes(orgId, anio)) || { sedes: [] };
        if (data?.sede) {
          currentSedes.sedes.push(data.sede);
          await pgStore.saveSedes(orgId, anio, currentSedes);
        }
        return NextResponse.json({ success: true, sedes: currentSedes.sedes });
      }

      case 'initialize':
        await pgStore.initializeOrgYear(orgId, anio);
        break;
        
      default:
        return NextResponse.json({ error: `Tipo no soportado: ${tipo}` }, { status: 400 });
    }
    
    // Recalcular resultados
    const { results, alerts } = await orchestrator.onCalculate(userId, orgId, anio);
    
    return NextResponse.json({ success: true, results, alerts });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId = 'org_001', anio = 2024, tipo, itemId, userId = 'usr_001' } = body;
    
    switch (tipo) {
      case 'scope1_instalacion_fija': {
        const current = await pgStore.loadScope1InstalacionesFijas(orgId, anio);
        if (current) {
          current.no_sujetas_ley_1_2005 = current.no_sujetas_ley_1_2005.filter(i => i.id !== itemId);
          await pgStore.saveScope1InstalacionesFijas(orgId, anio, current);
        }
        break;
      }
      case 'scope1_fugitiva': {
        const current = await pgStore.loadScope1Fugitivas(orgId, anio);
        if (current) {
          current.climatizacion_refrigeracion = current.climatizacion_refrigeracion.filter(i => i.id !== itemId);
          await pgStore.saveScope1Fugitivas(orgId, anio, current);
        }
        break;
      }
      case 'scope2_electricidad': {
        const current = await pgStore.loadScope2Electricidad(orgId, anio);
        if (current) {
          current.electricidad_edificios = current.electricidad_edificios.filter(i => i.id !== itemId);
          await pgStore.saveScope2Electricidad(orgId, anio, current);
        }
        break;
      }
    }
    
    // Recalcular
    const { results, alerts } = await orchestrator.onCalculate(userId, orgId, anio);
    return NextResponse.json({ success: true, results, alerts });
  } catch (error: any) {
    return errorResponse(error);
  }
}
