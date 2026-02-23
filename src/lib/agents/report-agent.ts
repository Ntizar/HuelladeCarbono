/**
 * Agente de Informes (ReportAgent)
 * 
 * Genera informes en distintos formatos:
 * - PDF: Informe formal estilo MITECO con tablas y gráficas
 * - Excel: Exportación compatible con la calculadora original del MITECO
 * - CSV: Exportación raw de todos los datos introducidos
 */

import ExcelJS from 'exceljs';
import { loadAllOrgData, loadOrganization, loadResults } from '@/lib/db/pg-store';
import type { Resultados, Organizacion } from '@/types/hc-schemas';

/**
 * ReportAgent - Genera informes de huella de carbono en múltiples formatos
 */
export class ReportAgent {
  /**
   * Genera un informe Excel compatible con el formato MITECO
   */
  async generateExcel(orgId: string, anio: number): Promise<Buffer> {
    const org = await loadOrganization(orgId, anio);
    const results = await loadResults(orgId, anio);
    const allData = await loadAllOrgData(orgId, anio);
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SaaS Huella de Carbono';
    workbook.created = new Date();
    
    // ─── Hoja 1: Datos de la Organización ─────────────
    const wsOrg = workbook.addWorksheet('Datos Organización');
    wsOrg.columns = [
      { header: 'Campo', key: 'campo', width: 30 },
      { header: 'Valor', key: 'valor', width: 40 },
    ];
    
    if (org) {
      wsOrg.addRows([
        { campo: 'Nombre', valor: org.nombre },
        { campo: 'CIF/NIF', valor: org.cif_nif },
        { campo: 'Tipo de organización', valor: org.tipo_organizacion },
        { campo: 'Sector', valor: org.sector },
        { campo: 'Año de cálculo', valor: org.anio_calculo },
        { campo: 'Superficie (m²)', valor: org.superficie_m2 },
        { campo: 'Nº empleados', valor: org.num_empleados },
        { campo: 'Índice de actividad', valor: `${org.indice_actividad.valor} ${org.indice_actividad.unidades}` },
      ]);
    }
    
    // Estilo del encabezado
    wsOrg.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
    });
    
    // ─── Hoja 2: Resultados ─────────────────────────
    const wsRes = workbook.addWorksheet('Resultados');
    wsRes.columns = [
      { header: 'Concepto', key: 'concepto', width: 50 },
      { header: 't CO2e', key: 'valor', width: 15 },
    ];
    
    if (results) {
      wsRes.addRows([
        { concepto: 'ALCANCE 1', valor: '' },
        { concepto: '  Instalaciones fijas (no Ley 1/2005)', valor: results.alcance_1.instalaciones_fijas_no_ley },
        { concepto: '  Instalaciones fijas (Ley 1/2005)', valor: results.alcance_1.instalaciones_fijas_ley },
        { concepto: '  Transporte por carretera', valor: results.alcance_1.transporte_carretera },
        { concepto: '  Transporte ferroviario/marítimo/aéreo', valor: results.alcance_1.transporte_ferroviario_maritimo_aereo },
        { concepto: '  Maquinaria', valor: results.alcance_1.maquinaria },
        { concepto: '  Emisiones fugitivas', valor: results.alcance_1.fugitivas },
        { concepto: '  Emisiones de proceso', valor: results.alcance_1.proceso },
        { concepto: '  TOTAL ALCANCE 1', valor: results.alcance_1.total_t_co2e },
        { concepto: '', valor: '' },
        { concepto: 'ALCANCE 2', valor: '' },
        { concepto: '  Electricidad edificios', valor: results.alcance_2.electricidad_edificios },
        { concepto: '  Electricidad vehículos', valor: results.alcance_2.electricidad_vehiculos },
        { concepto: '  Calor/Vapor/Frío', valor: results.alcance_2.calor_vapor_frio },
        { concepto: '  TOTAL ALCANCE 2', valor: results.alcance_2.total_t_co2e },
        { concepto: '', valor: '' },
        { concepto: 'TOTAL ALCANCE 1+2', valor: results.total_alcance_1_2_t_co2e },
        { concepto: '', valor: '' },
        { concepto: 'RATIOS', valor: '' },
        { concepto: '  t CO2e / empleado', valor: results.ratios.t_co2e_por_empleado },
        { concepto: '  t CO2e / m²', valor: results.ratios.t_co2e_por_m2 },
        { concepto: '  t CO2e / índice actividad', valor: results.ratios.t_co2e_por_indice_actividad },
      ]);
    }
    
    wsRes.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
    });
    
    // ─── Hoja 3: Alcance 1 Detalle ──────────────────
    const wsScope1 = workbook.addWorksheet('Alcance 1 - Detalle');
    wsScope1.columns = [
      { header: 'Categoría', key: 'categoria', width: 25 },
      { header: 'Edificio/Sede', key: 'sede', width: 20 },
      { header: 'Combustible/Gas', key: 'combustible', width: 25 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'kg CO2e', key: 'co2e', width: 15 },
    ];
    
    if (allData.scope1_instalaciones_fijas) {
      for (const inst of allData.scope1_instalaciones_fijas.no_sujetas_ley_1_2005) {
        wsScope1.addRow({
          categoria: 'Inst. Fija (no Ley)',
          sede: inst.edificio_sede,
          combustible: inst.tipo_combustible,
          cantidad: inst.cantidad,
          co2e: inst.emisiones_totales_kg_co2e,
        });
      }
    }
    
    if (allData.scope1_fugitivas) {
      for (const fug of allData.scope1_fugitivas.climatizacion_refrigeracion) {
        wsScope1.addRow({
          categoria: 'Fugitiva',
          sede: fug.edificio_sede,
          combustible: fug.gas,
          cantidad: fug.recarga_kg,
          co2e: fug.emisiones_kg_co2e,
        });
      }
    }
    
    wsScope1.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
    });
    
    // ─── Hoja 4: Alcance 2 Detalle ──────────────────
    const wsScope2 = workbook.addWorksheet('Alcance 2 - Detalle');
    wsScope2.columns = [
      { header: 'Edificio/Sede', key: 'sede', width: 20 },
      { header: 'Comercializadora', key: 'comercializadora', width: 20 },
      { header: 'GdO', key: 'gdo', width: 8 },
      { header: 'kWh', key: 'kwh', width: 12 },
      { header: 'Factor', key: 'factor', width: 10 },
      { header: 'kg CO2', key: 'co2', width: 15 },
    ];
    
    if (allData.scope2_electricidad) {
      for (const elec of allData.scope2_electricidad.electricidad_edificios) {
        wsScope2.addRow({
          sede: elec.edificio_sede,
          comercializadora: elec.comercializadora,
          gdo: elec.garantia_origen ? 'Sí' : 'No',
          kwh: elec.kwh_consumidos,
          factor: elec.factor_mix_kg_co2_kwh,
          co2: elec.emisiones_kg_co2,
        });
      }
    }
    
    wsScope2.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6F00' } };
    });
    
    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
  
  /**
   * Genera datos CSV de todos los registros de la organización
   */
  async generateCSV(orgId: string, anio: number): Promise<string> {
    const allData = await loadAllOrgData(orgId, anio);
    const lines: string[] = [];
    
    lines.push('categoria,subcategoria,edificio_sede,detalle,cantidad,unidad,emisiones_kg_co2e');
    
    // Scope 1 - Instalaciones fijas
    if (allData.scope1_instalaciones_fijas) {
      for (const inst of allData.scope1_instalaciones_fijas.no_sujetas_ley_1_2005) {
        lines.push(
          `Instalaciones fijas,No Ley 1/2005,${inst.edificio_sede},${inst.tipo_combustible},${inst.cantidad},,${inst.emisiones_totales_kg_co2e}`
        );
      }
    }
    
    // Scope 1 - Fugitivas
    if (allData.scope1_fugitivas) {
      for (const fug of allData.scope1_fugitivas.climatizacion_refrigeracion) {
        lines.push(
          `Fugitivas,Climatización,${fug.edificio_sede},${fug.gas},${fug.recarga_kg},kg,${fug.emisiones_kg_co2e}`
        );
      }
    }
    
    // Scope 2 - Electricidad
    if (allData.scope2_electricidad) {
      for (const elec of allData.scope2_electricidad.electricidad_edificios) {
        lines.push(
          `Electricidad,Edificios,${elec.edificio_sede},${elec.comercializadora},${elec.kwh_consumidos},kWh,${elec.emisiones_kg_co2}`
        );
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * Genera datos para el informe PDF (se renderiza en el frontend con react-pdf)
   */
  async generatePDFData(orgId: string, anio: number): Promise<{
    org: Organizacion | null;
    results: Resultados | null;
    generatedAt: string;
  }> {
    return {
      org: await loadOrganization(orgId, anio),
      results: await loadResults(orgId, anio),
      generatedAt: new Date().toISOString(),
    };
  }
}

export const reportAgent = new ReportAgent();
