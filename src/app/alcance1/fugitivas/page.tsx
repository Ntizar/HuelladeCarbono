/**
 * Alcance 1 - Emisiones Fugitivas (Pestaña 5 del Excel MITECO)
 * 
 * Fórmula: Emisiones (t CO₂e) = recarga_kg × PCA / 1000
 * Gases: HFC-134a, R-410A, R-407C, R-404A, SF6, etc.
 */

'use client';

import { useEffect, useState } from 'react';

interface FugitivaEntry {
  id: string;
  edificio_sede: string;
  equipo: string;
  tipo_gas: string;
  cantidad_recarga_kg: number;
  pca: number;
  emisiones_t_co2e: number;
}

const PCA_GASES: Record<string, number> = {
  'HFC-134a': 1430,
  'HFC-32': 675,
  'R-410A': 2088,
  'R-407C': 1774,
  'R-404A': 3922,
  'R-507A': 3985,
  'R-422D': 2729,
  'R-417A': 2346,
  'R-422A': 3143,
  'R-427A': 2138,
  'R-438A': 2265,
  'SF6': 22800,
  'HFC-125': 3500,
  'HFC-143a': 4470,
  'HFC-152a': 124,
  'HFC-227ea': 3220,
  'HFC-236fa': 9810,
  'HFC-245fa': 1030,
  'HFC-365mfc': 794,
  'HFC-43-10mee': 1640,
};

export default function FugitivasPage() {
  const [data, setData] = useState<FugitivaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Form
  const [edificio, setEdificio] = useState('');
  const [equipo, setEquipo] = useState('');
  const [gasSeleccionado, setGasSeleccionado] = useState('');
  const [recarga, setRecarga] = useState('');
  
  useEffect(() => {
    fetch('/api/data?tipo=scope1_fugitivas&orgId=org_001&anio=2024')
      .then(r => r.json())
      .then(d => {
        if (d?.equipos_refrigeracion) setData(d.equipos_refrigeracion);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  const pcaActual = PCA_GASES[gasSeleccionado] || 0;
  const recargaNum = parseFloat(recarga) || 0;
  const emisionPreview = recargaNum > 0 && pcaActual > 0 ? (recargaNum * pcaActual / 1000) : 0;
  
  const totalT = data.reduce((s, d) => s + (d.emisiones_t_co2e || 0), 0);
  
  const handleAdd = async () => {
    if (!edificio || !gasSeleccionado || !recarga) {
      setMessage('⚠️ Completa todos los campos obligatorios');
      return;
    }
    try {
      const entry = {
        edificio_sede: edificio,
        equipo,
        tipo_gas: gasSeleccionado,
        cantidad_recarga_kg: recargaNum,
        pca: pcaActual,
        emisiones_t_co2e: emisionPreview,
      };
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'scope1_fugitivas', orgId: 'org_001', anio: 2024, entry }),
      });
      if (res.ok) {
        setData(prev => [...prev, { ...entry, id: crypto.randomUUID() }]);
        setEdificio(''); setEquipo(''); setGasSeleccionado(''); setRecarga('');
        setMessage('✅ Registro añadido correctamente');
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
        body: JSON.stringify({ tipo: 'scope1_fugitivas', orgId: 'org_001', anio: 2024, entryId: id }),
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
        <h1 className="text-3xl font-bold text-gray-900">❄️ Emisiones Fugitivas</h1>
        <p className="text-gray-500 mt-1">Alcance 1 · Fugas de gases fluorados en equipos de refrigeración y climatización</p>
      </div>
      
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">×</button>
        </div>
      )}
      
      {/* Info */}
      <div className="card mb-6 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Fórmula:</strong> Emisiones (t CO₂e) = Recarga (kg) × PCA / 1000<br/>
          Los PCA (Potencial de Calentamiento Atmosférico) corresponden al AR6 del IPCC.
        </p>
      </div>
      
      {/* Form */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Añadir equipo / recarga</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="form-label">Edificio / Sede *</label>
            <input type="text" value={edificio} onChange={e => setEdificio(e.target.value)} className="form-input" placeholder="Sede Central" />
          </div>
          <div>
            <label className="form-label">Equipo</label>
            <input type="text" value={equipo} onChange={e => setEquipo(e.target.value)} className="form-input" placeholder="Aire acondicionado #1" />
          </div>
          <div>
            <label className="form-label">Gas refrigerante *</label>
            <select value={gasSeleccionado} onChange={e => setGasSeleccionado(e.target.value)} className="form-select">
              <option value="">Seleccionar gas...</option>
              {Object.keys(PCA_GASES).map(g => (
                <option key={g} value={g}>{g} (PCA: {PCA_GASES[g].toLocaleString('es-ES')})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Recarga (kg) *</label>
            <input type="number" value={recarga} onChange={e => setRecarga(e.target.value)} className="form-input" min="0" step="0.01" />
          </div>
          <div className="flex items-end">
            <button onClick={handleAdd} className="btn-primary w-full">+ Añadir</button>
          </div>
        </div>
        
        {/* Preview */}
        {emisionPreview > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 text-sm">
            <strong>Vista previa:</strong> {recargaNum.toFixed(2)} kg × {pcaActual.toLocaleString('es-ES')} PCA / 1000 = <span className="font-bold text-green-700">{emisionPreview.toFixed(4)} t CO₂e</span>
          </div>
        )}
      </div>
      
      {/* Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Equipos de refrigeración ({data.length})</h2>
          <div className="badge-blue">Total: {totalT.toFixed(4)} t CO₂e</div>
        </div>
        
        {loading ? (
          <p className="text-gray-400 py-8 text-center">Cargando...</p>
        ) : data.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">No hay registros de emisiones fugitivas.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sede</th>
                <th>Equipo</th>
                <th>Gas</th>
                <th>Recarga (kg)</th>
                <th>PCA</th>
                <th>t CO₂e</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id}>
                  <td>{d.edificio_sede}</td>
                  <td>{d.equipo || '—'}</td>
                  <td><span className="badge-blue">{d.tipo_gas}</span></td>
                  <td className="text-right">{d.cantidad_recarga_kg?.toFixed(2)}</td>
                  <td className="text-right">{d.pca?.toLocaleString('es-ES')}</td>
                  <td className="text-right font-semibold text-green-700">{d.emisiones_t_co2e?.toFixed(4)}</td>
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
