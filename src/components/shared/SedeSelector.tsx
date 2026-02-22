/**
 * SedeSelector — Componente reutilizable para seleccionar o crear sedes
 * 
 * Se usa en todas las secciones de Alcance 1 y 2 para que las sedes
 * estén conectadas y siempre disponibles en todos los formularios.
 * 
 * Las sedes se almacenan en data/orgs/{orgId}/{anio}/sedes.json
 * y se comparten entre instalaciones, vehículos, fugitivas y electricidad.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

interface Sede {
  id: string;
  nombre: string;
  direccion?: string;
}

interface SedeSelectorProps {
  value: string;
  onChange: (sede: string) => void;
  orgId?: string;
  anio?: number;
  label?: string;
  placeholder?: string;
}

// Cache global de sedes para no hacer fetch múltiples
let sedesCache: Sede[] | null = null;
let sedesCacheKey = '';

export default function SedeSelector({
  value,
  onChange,
  orgId = 'org_001',
  anio = 2024,
  label = 'Sede / Centro de trabajo',
  placeholder = 'Seleccionar o crear sede...',
}: SedeSelectorProps) {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newDireccion, setNewDireccion] = useState('');
  const [saving, setSaving] = useState(false);

  const cacheKey = `${orgId}-${anio}`;

  const loadSedes = useCallback(async () => {
    if (sedesCache && sedesCacheKey === cacheKey) {
      setSedes(sedesCache);
      return;
    }
    try {
      const res = await fetch(`/api/data?tipo=sedes&orgId=${orgId}&anio=${anio}`);
      if (res.ok) {
        const data = await res.json();
        const list = data?.sedes || [];
        setSedes(list);
        sedesCache = list;
        sedesCacheKey = cacheKey;
      }
    } catch {
      // Si no existe el archivo, empezamos vacíos
    }
  }, [orgId, anio, cacheKey]);

  useEffect(() => {
    loadSedes();
  }, [loadSedes]);

  const handleCreateSede = async () => {
    if (!newNombre.trim()) return;
    setSaving(true);
    try {
      const newSede: Sede = {
        id: `sede_${Date.now()}`,
        nombre: newNombre.trim(),
        direccion: newDireccion.trim() || undefined,
      };
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          anio,
          tipo: 'sedes',
          data: { sede: newSede },
        }),
      });
      if (res.ok) {
        const updated = [...sedes, newSede];
        setSedes(updated);
        sedesCache = updated;
        sedesCacheKey = cacheKey;
        onChange(newSede.nombre);
        setNewNombre('');
        setNewDireccion('');
        setShowNew(false);
      }
    } catch {
      // Error silencioso — la sede se puede escribir manualmente
    }
    setSaving(false);
  };

  return (
    <div>
      <label className="form-label">{label}</label>
      {!showNew ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-select flex-1"
          >
            <option value="">{placeholder}</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.nombre}>
                {s.nombre}{s.direccion ? ` — ${s.direccion}` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="px-3 py-2 bg-green-50 text-green-700 border border-green-300 rounded-lg hover:bg-green-100 text-sm font-medium whitespace-nowrap"
            title="Crear nueva sede"
          >
            + Nueva
          </button>
        </div>
      ) : (
        <div className="border border-green-300 bg-green-50 rounded-lg p-3 space-y-2">
          <p className="text-xs text-green-700 font-medium">Nueva sede</p>
          <input
            type="text"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            className="form-input"
            placeholder="Nombre (ej. Sede Central Madrid)"
            autoFocus
          />
          <input
            type="text"
            value={newDireccion}
            onChange={(e) => setNewDireccion(e.target.value)}
            className="form-input"
            placeholder="Dirección (opcional)"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateSede}
              disabled={saving || !newNombre.trim()}
              className="btn-primary text-sm py-1.5"
            >
              {saving ? 'Creando...' : 'Crear sede'}
            </button>
            <button
              type="button"
              onClick={() => { setShowNew(false); setNewNombre(''); setNewDireccion(''); }}
              className="btn-secondary text-sm py-1.5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {/* Fallback: siempre permitir escribir manualmente */}
      {!showNew && sedes.length === 0 && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="form-input mt-2"
          placeholder="Escribe el nombre de la sede"
        />
      )}
    </div>
  );
}

/**
 * Hook para obtener las sedes desde cualquier componente
 */
export function useSedes(orgId = 'org_001', anio = 2024) {
  const [sedes, setSedes] = useState<Sede[]>([]);

  useEffect(() => {
    fetch(`/api/data?tipo=sedes&orgId=${orgId}&anio=${anio}`)
      .then((r) => r.json())
      .then((d) => setSedes(d?.sedes || []))
      .catch(() => {});
  }, [orgId, anio]);

  return sedes;
}
