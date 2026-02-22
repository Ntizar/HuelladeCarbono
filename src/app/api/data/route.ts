/**
 * API Route: /api/data
 * 
 * CRUD para datos de huella de carbono por organización.
 * Cada operación pasa por el agente orquestador para validación,
 * cálculo automático y registro en auditoría.
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents/orchestrator';
import * as jsonStore from '@/lib/db/json-store';
import { v4 as uuidv4 } from 'uuid';
import { calcularEmisionesCombustible, calcularEmisionesFugitivas, calcularEmisionesElectricidad } from '@/lib/agents/calc-agent';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org_001';
  const anio = parseInt(searchParams.get('anio') || '2024');
  const tipo = searchParams.get('tipo') || 'all';
  
  try {
    switch (tipo) {
      case 'organization':
        return NextResponse.json(jsonStore.loadOrganization(orgId, anio));
      case 'scope1_instalaciones':
        return NextResponse.json(jsonStore.loadScope1InstalacionesFijas(orgId, anio));
      case 'scope1_vehiculos':
        return NextResponse.json(jsonStore.loadScope1Vehiculos(orgId, anio));
      case 'scope1_fugitivas':
        return NextResponse.json(jsonStore.loadScope1Fugitivas(orgId, anio));
      case 'scope1_proceso':
        return NextResponse.json(jsonStore.loadScope1Proceso(orgId, anio));
      case 'scope2':
        return NextResponse.json(jsonStore.loadScope2Electricidad(orgId, anio));
      case 'results':
        return NextResponse.json(jsonStore.loadResults(orgId, anio));
      case 'factors':
        return NextResponse.json(jsonStore.loadEmissionFactors());
      case 'dropdowns':
        return NextResponse.json(jsonStore.loadDropdowns());
      case 'years':
        return NextResponse.json(jsonStore.listOrgYears(orgId));
      case 'all':
      default:
        return NextResponse.json(jsonStore.loadAllOrgData(orgId, anio));
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId = 'org_001', anio = 2024, tipo, data, userId = 'usr_001' } = body;
    
    // Inicializar estructura si es la primera vez
    jsonStore.initializeOrgYear(orgId, anio);
    
    switch (tipo) {
      case 'organization':
        jsonStore.saveOrganization(orgId, anio, { ...data, id: data.id || uuidv4() });
        break;
        
      case 'scope1_instalacion_fija': {
        const current = jsonStore.loadScope1InstalacionesFijas(orgId, anio);
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
          jsonStore.saveScope1InstalacionesFijas(orgId, anio, current);
        }
        break;
      }
        
      case 'scope1_fugitiva': {
        const current = jsonStore.loadScope1Fugitivas(orgId, anio);
        if (current) {
          const newItem = {
            ...data,
            id: data.id || uuidv4(),
            emisiones_kg_co2e: calcularEmisionesFugitivas(data.recarga_kg || 0, data.pca || 0),
          };
          current.climatizacion_refrigeracion.push(newItem);
          jsonStore.saveScope1Fugitivas(orgId, anio, current);
        }
        break;
      }
      
      case 'scope2_electricidad': {
        const current = jsonStore.loadScope2Electricidad(orgId, anio);
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
          jsonStore.saveScope2Electricidad(orgId, anio, current);
        }
        break;
      }
      
      case 'initialize':
        jsonStore.initializeOrgYear(orgId, anio);
        break;
        
      default:
        return NextResponse.json({ error: `Tipo no soportado: ${tipo}` }, { status: 400 });
    }
    
    // Recalcular resultados
    const { results, alerts } = await orchestrator.onCalculate(userId, orgId, anio);
    
    return NextResponse.json({ success: true, results, alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId = 'org_001', anio = 2024, tipo, itemId, userId = 'usr_001' } = body;
    
    switch (tipo) {
      case 'scope1_instalacion_fija': {
        const current = jsonStore.loadScope1InstalacionesFijas(orgId, anio);
        if (current) {
          current.no_sujetas_ley_1_2005 = current.no_sujetas_ley_1_2005.filter(i => i.id !== itemId);
          jsonStore.saveScope1InstalacionesFijas(orgId, anio, current);
        }
        break;
      }
      case 'scope1_fugitiva': {
        const current = jsonStore.loadScope1Fugitivas(orgId, anio);
        if (current) {
          current.climatizacion_refrigeracion = current.climatizacion_refrigeracion.filter(i => i.id !== itemId);
          jsonStore.saveScope1Fugitivas(orgId, anio, current);
        }
        break;
      }
      case 'scope2_electricidad': {
        const current = jsonStore.loadScope2Electricidad(orgId, anio);
        if (current) {
          current.electricidad_edificios = current.electricidad_edificios.filter(i => i.id !== itemId);
          jsonStore.saveScope2Electricidad(orgId, anio, current);
        }
        break;
      }
    }
    
    // Recalcular
    const { results, alerts } = await orchestrator.onCalculate(userId, orgId, anio);
    return NextResponse.json({ success: true, results, alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
