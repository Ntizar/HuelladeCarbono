/**
 * Alcance 2 - Emisiones por Electricidad (Pestaña 8 del Excel MITECO)
 * 
 * Fórmula: Emisiones (t CO₂) = kWh × factor_emisión / 1000
 * Si la organización tiene Garantía de Origen (GdO) renovable → emisiones = 0
 * 
 * Factor emisión por comercializadora obtenido de CNMC (última publicación disponible).
 */

'use client';

import { useEffect, useState } from 'react';

interface ElectricidadEntry {
  id: string;
  edificio_sede: string;
  comercializadora: string;
  consumo_kwh: number;
  factor_emision: number;
  garantia_origen_renovable: boolean;
  emisiones_t_co2: number;
}

export default function Alcance2Page() {
  const [data, setData] = useState<ElectricidadEntry[]>([]);
  const [dropdowns, setDropdowns] = useState<any>({});
  const [factors, setFactors] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [edificio, setEdificio] = useState('');
  const [comercializadora, setComercializadora] = useState('');
  const [consumo, setConsumo] = useState('');
  const [gdo, setGdo] = useState(false);
  
  useEffect(() => {
    Promise.all([
      fetch('/api/data?tipo=scope2_electricidad&orgId=org_001&anio=2024').then(r => r.json()),
      fetch('/api/data?tipo=dropdowns').then(r => r.json()),
      fetch('/api/data?tipo=emission_factors').then(r => r.json()),
    ]).then(([d, dd, ef]) => {
      if (d?.consumos) setData(d.consumos);
      setDropdowns(dd || {});
      setFactors(ef || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  
  const getFactorEmision = (com: string): number => {
    if (!factors.electricidad) return 0.26; // fallback media residual España
    const found = factors.electricidad.find((e: any) => e.comercializadora === com);
    return found?.factor_co2_kg_kwh || 0.26;
  };
  
  const consumoNum = parseFloat(consumo) || 0;
  const factorActual = getFactorEmision(comercializadora);
  const emisionPreview = gdo ? 0 : (consumoNum * factorActual / 1000);
  
  const totalT = data.reduce((s, d) => s + (d.emisiones_t_co2 || 0), 0);
  const totalKwh = data.reduce((s, d) => s + (d.consumo_kwh || 0), 0);
  
  const handleAdd = async () => {
    if (!edificio || !comercializadora || !consumo) {
      setMessage('⚠️ Completa todos los campos obligatorios');
      return;
    }
    const entry = {
      edificio_sede: edificio,
      comercializadora,
      consumo_kwh: consumoNum,
      factor_emision: factorActual,
      garantia_origen_renovable: gdo,
      emisiones_t_co2: emisionPreview,
    };
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'scope2_electricidad', orgId: 'org_001', anio: 2024, entry }),
      });
      if (res.ok) {
        setData(prev => [...prev, { ...entry, id: crypto.randomUUID() }]);
        setEdificio(''); setComercializadora(''); setConsumo(''); setGdo(false);
        setMessage('✅ Consumo eléctrico añadido');
      }
    } catch {
      setMessage('❌ Error al guardar');
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'scope2_electricidad', orgId: 'org_001', anio: 2024, entryId: id }),
      });
      setData(prev => prev.filter(d => d.id !== id));
      setMessage('🗑️ Registro eliminado');
    } catch {
      setMessage('❌ Error al eliminar');
    }
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">⚡ Alcance 2 · Electricidad</h1>
        <p className="text-gray-500 mt-1">Emisiones indirectas por consumo de electricidad adquirida</p>
      </div>
      
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">×</button>
        </div>
      )}
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="kpi-card">
          <p className="text-sm text-gray-500">Total Consumo</p>
          <p className="text-2xl font-bold text-gray-900">{totalKwh.toLocaleString('es-ES')} kWh</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-gray-500">Emisiones Alcance 2</p>
          <p className="text-2xl font-bold text-blue-700">{totalT.toFixed(3)} t CO₂</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-gray-500">Registros</p>
          <p className="text-2xl font-bold text-gray-900">{data.length}</p>
        </div>
      </div>
      
      {/* Form */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Añadir consumo eléctrico</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="form-label">Edificio / Sede *</label>
            <input type="text" value={edificio} onChange={e => setEdificio(e.target.value)} className="form-input" placeholder="Oficina Madrid" />
          </div>
          <div>
            <label className="form-label">Comercializadora *</label>
            <select value={comercializadora} onChange={e => setComercializadora(e.target.value)} className="form-select">
              <option value="">Seleccionar...</option>
              {(dropdowns.comercializadoras_electricidad || [
                'Iberdrola', 'Endesa', 'Naturgy', 'EDP', 'Repsol', 'TotalEnergies',
                'Holaluz', 'Lucera', 'Nexus Energía', 'Factor Energía',
                'Media residual española',
              ]).map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Consumo (kWh) *</label>
            <input type="number" value={consumo} onChange={e => setConsumo(e.target.value)} className="form-input" min="0" step="0.01" />
          </div>
          <div>
            <label className="form-label">¿GdO Renovable?</label>
            <div className="flex items-center mt-2 gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={gdo} onChange={e => setGdo(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                <span className="ml-2 text-sm text-gray-700">{gdo ? 'Sí' : 'No'}</span>
              </label>
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={handleAdd} className="btn-primary w-full">+ Añadir</button>
          </div>
        </div>
        
        {/* Preview */}
        {consumoNum > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 text-sm">
            {gdo ? (
              <span className="text-emerald-700 font-semibold">✅ Con Garantía de Origen → Emisiones = 0 t CO₂</span>
            ) : (
              <span>
                <strong>Cálculo:</strong> {consumoNum.toLocaleString('es-ES')} kWh × {factorActual.toFixed(4)} kg CO₂/kWh / 1000 = <span className="font-bold text-blue-700">{emisionPreview.toFixed(4)} t CO₂</span>
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Table */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Consumos eléctricos</h2>
        {loading ? (
          <p className="text-gray-400 py-8 text-center">Cargando...</p>
        ) : data.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">No hay consumos eléctricos registrados.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sede</th>
                <th>Comercializadora</th>
                <th>kWh</th>
                <th>Factor</th>
                <th>GdO</th>
                <th>t CO₂</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id}>
                  <td>{d.edificio_sede}</td>
                  <td>{d.comercializadora}</td>
                  <td className="text-right">{d.consumo_kwh?.toLocaleString('es-ES')}</td>
                  <td className="text-right text-xs">{d.factor_emision?.toFixed(4)}</td>
                  <td className="text-center">{d.garantia_origen_renovable ? '✅' : '—'}</td>
                  <td className="text-right font-semibold text-blue-700">{d.emisiones_t_co2?.toFixed(4)}</td>
                  <td>
                    <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
