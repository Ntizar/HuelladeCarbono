/**
 * Alcance 1 - Instalaciones Fijas (Pestaña 3 del Excel MITECO)
 * 
 * Permite registrar consumos de combustibles en instalaciones fijas:
 * - No sujetas a Ley 1/2005 (la mayoría de organizaciones)
 * - Sujetas a Ley 1/2005 (Directiva ETS de comercio de emisiones)
 * 
 * Fórmula: emisiones_co2e = cantidad × FE_CO2 + (cantidad × FE_CH4 / 1000 × 27.9) + (cantidad × FE_N2O / 1000 × 273)
 */

'use client';

import { useEffect, useState } from 'react';

interface InstalacionFija {
  id: string;
  edificio_sede: string;
  tipo_combustible: string;
  cantidad: number;
  factor_emision: { co2_kg_ud: number; ch4_g_ud: number; n2o_g_ud: number };
  emisiones_parciales: { co2_kg: number; ch4_g: number; n2o_g: number };
  emisiones_totales_kg_co2e: number;
}

interface FactoresMap {
  [key: string]: {
    nombre: string;
    unidad: string;
    factores: { [anio: string]: { co2_kg_ud: number; ch4_g_ud: number; n2o_g_ud: number } };
  };
}

export default function InstalacionesFijasPage() {
  const [instalaciones, setInstalaciones] = useState<InstalacionFija[]>([]);
  const [factores, setFactores] = useState<FactoresMap>({});
  const [dropdowns, setDropdowns] = useState<{ tipos_combustible_fijo: string[] }>({ tipos_combustible_fijo: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form state
  const [edificio, setEdificio] = useState('');
  const [combustible, setCombustible] = useState('');
  const [cantidad, setCantidad] = useState('');
  
  useEffect(() => {
    Promise.all([
      fetch('/api/data?tipo=scope1_instalaciones&orgId=org_001&anio=2024').then(r => r.json()),
      fetch('/api/data?tipo=factors').then(r => r.json()),
      fetch('/api/data?tipo=dropdowns').then(r => r.json()),
    ]).then(([data, factors, dd]) => {
      if (data?.no_sujetas_ley_1_2005) {
        setInstalaciones(data.no_sujetas_ley_1_2005);
      }
      if (factors?.combustibles_instalaciones_fijas) {
        setFactores(factors.combustibles_instalaciones_fijas);
      }
      if (dd?.tipos_combustible_fijo) {
        setDropdowns(dd);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  
  // Map nombre del dropdown a clave del factor
  const getCombustibleKey = (nombre: string): string => {
    const map: Record<string, string> = {
      'Gas natural (kWh PCS)': 'gas_natural_kWhPCS',
      'Gas natural (m³)': 'gas_natural_m3',
      'Gasóleo calefacción (litros)': 'gasoleo_calefaccion_litros',
      'GLP (litros)': 'glp_litros',
      'GLP (kg)': 'glp_kg',
      'Carbón (kg)': 'carbon_kg',
      'Biomasa - Pellets (kg)': 'biomasa_pellets_kg',
      'Biomasa - Astillas (kg)': 'biomasa_astillas_kg',
    };
    return map[nombre] || nombre;
  };
  
  const handleAdd = async () => {
    if (!edificio || !combustible || !cantidad) {
      setMessage('Completa todos los campos');
      return;
    }
    
    setSaving(true);
    const key = getCombustibleKey(combustible);
    const fe = factores[key]?.factores?.['2024'] || { co2_kg_ud: 0, ch4_g_ud: 0, n2o_g_ud: 0 };
    
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: 'org_001',
          anio: 2024,
          tipo: 'scope1_instalacion_fija',
          data: {
            edificio_sede: edificio,
            tipo_combustible: combustible,
            cantidad: parseFloat(cantidad),
            factor_emision: fe,
          },
        }),
      });
      
      const result = await res.json();
      if (result.success) {
        setMessage('✅ Instalación añadida y emisiones recalculadas');
        // Reload data
        const updated = await fetch('/api/data?tipo=scope1_instalaciones&orgId=org_001&anio=2024').then(r => r.json());
        if (updated?.no_sujetas_ley_1_2005) {
          setInstalaciones(updated.no_sujetas_ley_1_2005);
        }
        setEdificio('');
        setCombustible('');
        setCantidad('');
      }
    } catch {
      setMessage('Error al guardar');
    }
    setSaving(false);
  };
  
  const handleDelete = async (id: string) => {
    const res = await fetch('/api/data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: 'org_001', anio: 2024,
        tipo: 'scope1_instalacion_fija', itemId: id,
      }),
    });
    const result = await res.json();
    if (result.success) {
      setInstalaciones(prev => prev.filter(i => i.id !== id));
      setMessage('✅ Eliminado');
    }
  };
  
  const totalKg = instalaciones.reduce((s, i) => s + i.emisiones_totales_kg_co2e, 0);
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏭 Instalaciones Fijas</h1>
        <p className="text-gray-500 mt-1">Alcance 1 · Combustión en equipos fijos (calderas, hornos, etc.)</p>
      </div>
      
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          {message}
          <button onClick={() => setMessage('')} className="float-right text-green-600">×</button>
        </div>
      )}
      
      {/* Formulario */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Añadir consumo de combustible</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Edificio / Sede</label>
            <input
              type="text"
              value={edificio}
              onChange={(e) => setEdificio(e.target.value)}
              className="form-input"
              placeholder="Sede Central"
            />
          </div>
          <div>
            <label className="form-label">Tipo de combustible</label>
            <select
              value={combustible}
              onChange={(e) => setCombustible(e.target.value)}
              className="form-select"
            >
              <option value="">Seleccionar...</option>
              {dropdowns.tipos_combustible_fijo.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Cantidad consumida</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="form-input"
              placeholder="50000"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleAdd} disabled={saving} className="btn-primary w-full">
              {saving ? 'Guardando...' : '+ Añadir'}
            </button>
          </div>
        </div>
        
        {combustible && (
          <div className="mt-3 text-xs text-gray-500">
            Factor de emisión ({combustible}, 2024):{' '}
            {(() => {
              const key = getCombustibleKey(combustible);
              const fe = factores[key]?.factores?.['2024'];
              return fe ? `CO₂: ${fe.co2_kg_ud} kg/ud · CH₄: ${fe.ch4_g_ud} g/ud · N₂O: ${fe.n2o_g_ud} g/ud` : 'No disponible';
            })()}
          </div>
        )}
      </div>
      
      {/* Tabla de datos */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Registros ({instalaciones.length})
          </h2>
          <div className="badge-green">
            Total: {(totalKg / 1000).toFixed(3)} t CO₂e
          </div>
        </div>
        
        {loading ? (
          <p className="text-gray-400 py-8 text-center">Cargando...</p>
        ) : instalaciones.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">No hay registros. Añade tu primer consumo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Edificio/Sede</th>
                  <th>Combustible</th>
                  <th>Cantidad</th>
                  <th>CO₂ (kg)</th>
                  <th>CH₄ (g)</th>
                  <th>N₂O (g)</th>
                  <th>Total kg CO₂e</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {instalaciones.map((inst) => (
                  <tr key={inst.id}>
                    <td className="font-medium">{inst.edificio_sede}</td>
                    <td>{inst.tipo_combustible}</td>
                    <td className="text-right">{inst.cantidad?.toLocaleString('es-ES')}</td>
                    <td className="text-right">{inst.emisiones_parciales?.co2_kg?.toFixed(1)}</td>
                    <td className="text-right">{inst.emisiones_parciales?.ch4_g?.toFixed(3)}</td>
                    <td className="text-right">{inst.emisiones_parciales?.n2o_g?.toFixed(3)}</td>
                    <td className="text-right font-semibold text-green-700">
                      {inst.emisiones_totales_kg_co2e?.toFixed(2)}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(inst.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Info box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <strong>Fórmula MITECO:</strong> Emisiones CO₂e = Cantidad × FE_CO₂ + (Cantidad × FE_CH₄ / 1000 × 27,9) + (Cantidad × FE_N₂O / 1000 × 273)
        <br />
        PCA del AR6 IPCC: CH₄ = 27,9 · N₂O = 273
      </div>
    </div>
  );
}
