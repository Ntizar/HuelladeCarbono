/**
 * Alcance 1 - Emisiones de Proceso (Pestaña 6 del Excel MITECO)
 * 
 * Emisiones derivadas de procesos industriales (p. ej., clinker, cal, vidrio, cerámica).
 * El usuario introduce directamente las emisiones en t CO₂e.
 */

'use client';

import { useEffect, useState } from 'react';

interface ProcesoEntry {
  id: string;
  edificio_sede: string;
  descripcion_proceso: string;
  emisiones_t_co2: number;
}

export default function ProcesoPage() {
  const [data, setData] = useState<ProcesoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [edificio, setEdificio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [emisiones, setEmisiones] = useState('');
  
  useEffect(() => {
    fetch('/api/data?tipo=scope1_proceso&orgId=org_001&anio=2024')
      .then(r => r.json())
      .then(d => {
        if (d?.procesos) setData(d.procesos);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  const total = data.reduce((s, d) => s + (d.emisiones_t_co2 || 0), 0);
  
  const handleAdd = async () => {
    if (!edificio || !descripcion || !emisiones) {
      setMessage('⚠️ Completa todos los campos');
      return;
    }
    const entry = {
      edificio_sede: edificio,
      descripcion_proceso: descripcion,
      emisiones_t_co2: parseFloat(emisiones),
    };
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'scope1_proceso', orgId: 'org_001', anio: 2024, entry }),
      });
      if (res.ok) {
        setData(prev => [...prev, { ...entry, id: crypto.randomUUID() }]);
        setEdificio(''); setDescripcion(''); setEmisiones('');
        setMessage('✅ Proceso añadido');
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
        body: JSON.stringify({ tipo: 'scope1_proceso', orgId: 'org_001', anio: 2024, entryId: id }),
      });
      setData(prev => prev.filter(d => d.id !== id));
    } catch { /* ignore */ }
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏭 Emisiones de Proceso</h1>
        <p className="text-gray-500 mt-1">Alcance 1 · Procesos industriales que generan emisiones de CO₂</p>
      </div>
      
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">×</button>
        </div>
      )}
      
      <div className="card mb-6 bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Nota:</strong> Las emisiones de proceso se introducen directamente en t CO₂. 
          Consulte el inventario de emisiones de su instalación o los informes PRTR para obtener este dato.
        </p>
      </div>
      
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Añadir proceso</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Edificio / Sede *</label>
            <input type="text" value={edificio} onChange={e => setEdificio(e.target.value)} className="form-input" placeholder="Planta industrial" />
          </div>
          <div>
            <label className="form-label">Descripción del proceso *</label>
            <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} className="form-input" placeholder="Fabricación de clinker" />
          </div>
          <div>
            <label className="form-label">Emisiones (t CO₂) *</label>
            <input type="number" value={emisiones} onChange={e => setEmisiones(e.target.value)} className="form-input" min="0" step="0.001" />
          </div>
          <div className="flex items-end">
            <button onClick={handleAdd} className="btn-primary w-full">+ Añadir</button>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Procesos ({data.length})</h2>
          <div className="badge-blue">Total: {total.toFixed(3)} t CO₂</div>
        </div>
        
        {loading ? (
          <p className="text-gray-400 py-8 text-center">Cargando...</p>
        ) : data.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">No hay emisiones de proceso registradas.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sede</th>
                <th>Proceso</th>
                <th>t CO₂</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id}>
                  <td>{d.edificio_sede}</td>
                  <td>{d.descripcion_proceso}</td>
                  <td className="text-right font-semibold text-green-700">{d.emisiones_t_co2?.toFixed(3)}</td>
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
