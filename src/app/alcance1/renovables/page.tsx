/**
 * Alcance 1 - Energías Renovables (Pestaña 7 del Excel MITECO)
 * 
 * Registro informativo de biomasa y biocombustibles consumidos.
 * Las emisiones de biomasa/biocombustible se consideran neutras (biogénicas)
 * pero se informa por separado conforme a GHG Protocol.
 */

'use client';

import { useEffect, useState } from 'react';

interface RenovableEntry {
  id: string;
  edificio_sede: string;
  tipo_biomasa: string;
  cantidad_kg: number;
  emisiones_biogenicas_t_co2: number;
}

export default function RenovablesPage() {
  const [data, setData] = useState<RenovableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [edificio, setEdificio] = useState('');
  const [tipo, setTipo] = useState('');
  const [cantidad, setCantidad] = useState('');
  
  const tiposBiomasa = [
    'Pellets de madera',
    'Astillas de madera',
    'Leña',
    'Hueso de aceituna',
    'Cáscara de almendra',
    'Biogás',
    'Biodiésel',
    'Bioetanol',
    'Otro biocombustible sólido',
    'Otro biocombustible líquido',
  ];
  
  useEffect(() => {
    // Load any existing data
    setLoading(false);
  }, []);
  
  const total = data.reduce((s, d) => s + (d.emisiones_biogenicas_t_co2 || 0), 0);
  
  const handleAdd = () => {
    if (!edificio || !tipo || !cantidad) {
      setMessage('⚠️ Completa todos los campos');
      return;
    }
    const entry: RenovableEntry = {
      id: crypto.randomUUID(),
      edificio_sede: edificio,
      tipo_biomasa: tipo,
      cantidad_kg: parseFloat(cantidad),
      emisiones_biogenicas_t_co2: 0, // informational, biogenic emissions not counted in total
    };
    setData(prev => [...prev, entry]);
    setEdificio(''); setTipo(''); setCantidad('');
    setMessage('✅ Registro añadido (informativo, no computa en totales)');
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🌱 Energías Renovables</h1>
        <p className="text-gray-500 mt-1">Alcance 1 · Consumo de biomasa y biocombustibles (información complementaria)</p>
      </div>
      
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">×</button>
        </div>
      )}
      
      <div className="card mb-6 bg-emerald-50 border-emerald-200">
        <p className="text-sm text-emerald-800">
          <strong>Información:</strong> Las emisiones derivadas de la combustión de biomasa y biocombustibles se consideran 
          <strong> biogénicas</strong> y no se suman al total de la organización (GHG Protocol). 
          Se registran aquí con carácter informativo para el informe final.
        </p>
      </div>
      
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Añadir consumo de biomasa/biocombustible</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Edificio / Sede *</label>
            <input type="text" value={edificio} onChange={e => setEdificio(e.target.value)} className="form-input" placeholder="Caldera biomasa" />
          </div>
          <div>
            <label className="form-label">Tipo de biomasa/biocombustible *</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="form-select">
              <option value="">Seleccionar...</option>
              {tiposBiomasa.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Cantidad (kg o litros) *</label>
            <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} className="form-input" min="0" step="0.01" />
          </div>
          <div className="flex items-end">
            <button onClick={handleAdd} className="btn-primary w-full">+ Añadir</button>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Consumos de biomasa ({data.length})</h2>
          <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
            Emisiones biogénicas: {total.toFixed(3)} t CO₂ (no computan)
          </div>
        </div>
        
        {loading ? (
          <p className="text-gray-400 py-8 text-center">Cargando...</p>
        ) : data.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">No hay consumos de biomasa registrados.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sede</th>
                <th>Tipo</th>
                <th>Cantidad (kg/l)</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id}>
                  <td>{d.edificio_sede}</td>
                  <td>{d.tipo_biomasa}</td>
                  <td className="text-right">{d.cantidad_kg?.toLocaleString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
