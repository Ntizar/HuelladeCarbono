/**
 * Admin - Panel de Auditoría
 * 
 * Visualización del log de auditoría con filtros por usuario, acción, tipo y fecha.
 * Solo accesible por usuarios con rol 'admin'.
 */

'use client';

import { useEffect, useState } from 'react';

interface AuditEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_email: string;
  action: string;
  tipo_dato: string;
  org_id: string;
  detalle: string;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  
  useEffect(() => {
    fetch('/api/data?tipo=audit_log')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setLogs(d);
        else if (d?.logs) setLogs(d.logs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  const actions = Array.from(new Set(logs.map(l => l.action))).filter(Boolean);
  
  const filtered = logs.filter(l => {
    const matchText = !filter || 
      l.user_email?.toLowerCase().includes(filter.toLowerCase()) ||
      l.tipo_dato?.toLowerCase().includes(filter.toLowerCase()) ||
      l.detalle?.toLowerCase().includes(filter.toLowerCase());
    const matchAction = !actionFilter || l.action === actionFilter;
    return matchText && matchAction;
  });
  
  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      'CREATE': 'bg-green-100 text-green-700',
      'UPDATE': 'bg-blue-100 text-blue-700',
      'DELETE': 'bg-red-100 text-red-700',
      'CALCULATE': 'bg-purple-100 text-purple-700',
      'EXPORT': 'bg-amber-100 text-amber-700',
      'LOGIN': 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[action] || 'bg-gray-100 text-gray-600'}`}>
        {action}
      </span>
    );
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📜 Auditoría</h1>
        <p className="text-gray-500 mt-1">Administración · Registro de todas las acciones del sistema</p>
      </div>
      
      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="form-label">Buscar</label>
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="form-input"
              placeholder="Buscar por email, tipo, detalle..."
            />
          </div>
          <div className="w-48">
            <label className="form-label">Acción</label>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="form-select">
              <option value="">Todas</option>
              {actions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-sm text-gray-500">{filtered.length} de {logs.length} registros</span>
          </div>
        </div>
      </div>
      
      {/* Log table */}
      <div className="card">
        {loading ? (
          <p className="text-gray-400 py-16 text-center">Cargando registros de auditoría...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-2">No hay registros de auditoría</p>
            <p className="text-gray-300 text-sm">Las acciones se registrarán automáticamente al usar la aplicación.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Tipo dato</th>
                  <th>Organización</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map(l => (
                  <tr key={l.id}>
                    <td className="text-xs text-gray-500 whitespace-nowrap">
                      {l.timestamp ? new Date(l.timestamp).toLocaleString('es-ES') : '—'}
                    </td>
                    <td className="text-sm">{l.user_email || l.user_id}</td>
                    <td>{getActionBadge(l.action)}</td>
                    <td className="text-sm text-gray-600">{l.tipo_dato || '—'}</td>
                    <td className="text-xs text-gray-400">{l.org_id}</td>
                    <td className="text-xs text-gray-500 max-w-xs truncate">{l.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 200 && (
              <p className="text-center text-sm text-gray-400 mt-4">
                Mostrando 200 de {filtered.length} registros. Use los filtros para refinar la búsqueda.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
