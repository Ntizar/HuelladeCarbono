/**
 * Página de Organización — Pestaña 1 del Calculador de Huella de Carbono (MITECO)
 *
 * Recoge los datos generales de la organización que se registran ante el
 * Registro de Huella de Carbono del MITECO conforme al Real Decreto 163/2014.
 *
 * Campos principales:
 *  - Nombre, CIF/NIF, tipo de organización, sector (CNAE agrupado)
 *  - Año de cálculo (rango 2007-2024, versión V.31 del Excel MITECO)
 *  - Superficie (m²), número de empleados
 *  - Índice de actividad (nombre, valor y unidades) utilizado para los ratios
 *    de intensidad de emisiones (t CO₂e / unidad de actividad).
 *
 * Estos datos se persisten en   data/orgs/{orgId}/{anio}/organization.json
 * a través de la ruta API /api/data (tipo=organization).
 */

'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';

/* ------------------------------------------------------------------ */
/*  Tipos locales                                                      */
/* ------------------------------------------------------------------ */

interface IndiceActividad {
  nombre: string;
  valor: number | '';
  unidades: string;
}

interface OrgFormData {
  nombre: string;
  cif_nif: string;
  tipo_organizacion: string;
  sector: string;
  anio_calculo: number;
  superficie_m2: number | '';
  num_empleados: number | '';
  indice_actividad: IndiceActividad;
}

interface DropdownData {
  tipos_organizacion?: string[];
  sectores?: string[];
  anios_calculo?: number[];
}

/* ------------------------------------------------------------------ */
/*  Valores por defecto                                                */
/* ------------------------------------------------------------------ */

const DEFAULT_ORG: OrgFormData = {
  nombre: '',
  cif_nif: '',
  tipo_organizacion: '',
  sector: '',
  anio_calculo: 2024,
  superficie_m2: '',
  num_empleados: '',
  indice_actividad: { nombre: '', valor: '', unidades: '' },
};

const TIPOS_ORGANIZACION_FALLBACK = [
  'Empresa privada',
  'Empresa pública',
  'Administración Pública',
  'Fundación / ONG',
  'Autónomo',
  'Otra',
];

const ANIOS_FALLBACK = Array.from({ length: 2027 - 2007 + 1 }, (_, i) => 2007 + i);

/* ================================================================== */
/*  Componente principal                                               */
/* ================================================================== */

export default function OrganizacionPage() {
  /* ---------- Estado ---------- */
  const [form, setForm] = useState<OrgFormData>(DEFAULT_ORG);
  const [dropdowns, setDropdowns] = useState<DropdownData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* ---------- Carga inicial ---------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar dropdowns y datos de organización en paralelo
        const [ddRes, orgRes] = await Promise.all([
          fetch('/api/data?tipo=dropdowns'),
          fetch('/api/data?tipo=organization&orgId=org_001&anio=2024'),
        ]);

        if (ddRes.ok) {
          const dd: DropdownData = await ddRes.json();
          setDropdowns(dd);
        }

        if (orgRes.ok) {
          const orgData = await orgRes.json();
          if (orgData && orgData.nombre) {
            setForm({
              nombre: orgData.nombre ?? '',
              cif_nif: orgData.cif_nif ?? '',
              tipo_organizacion: orgData.tipo_organizacion ?? '',
              sector: orgData.sector ?? '',
              anio_calculo: orgData.anio_calculo ?? 2024,
              superficie_m2: orgData.superficie_m2 ?? '',
              num_empleados: orgData.num_empleados ?? '',
              indice_actividad: {
                nombre: orgData.indice_actividad?.nombre ?? '',
                valor: orgData.indice_actividad?.valor ?? '',
                unidades: orgData.indice_actividad?.unidades ?? '',
              },
            });
          }
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* ---------- Helpers ---------- */

  /** Actualiza un campo de primer nivel del formulario */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? value === ''
            ? ''
            : Number(value)
          : value,
    }));
    setMessage(null);
  };

  /** Actualiza un sub-campo del índice de actividad */
  const handleIndiceChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      indice_actividad: {
        ...prev.indice_actividad,
        [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
      },
    }));
    setMessage(null);
  };

  /* ---------- Envío ---------- */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Validaciones básicas del lado del cliente
      if (!form.nombre.trim()) throw new Error('El nombre de la organización es obligatorio.');
      if (!form.cif_nif.trim()) throw new Error('El CIF/NIF es obligatorio.');
      if (!form.tipo_organizacion) throw new Error('Selecciona un tipo de organización.');
      if (!form.sector) throw new Error('Selecciona un sector.');

      const payload = {
        orgId: 'org_001',
        anio: form.anio_calculo,
        tipo: 'organization',
        data: {
          ...form,
          superficie_m2: form.superficie_m2 === '' ? 0 : Number(form.superficie_m2),
          num_empleados: form.num_empleados === '' ? 0 : Number(form.num_empleados),
          indice_actividad: {
            nombre: form.indice_actividad.nombre,
            valor: form.indice_actividad.valor === '' ? 0 : Number(form.indice_actividad.valor),
            unidades: form.indice_actividad.unidades,
          },
        },
      };

      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar los datos.');
      }

      setMessage({ type: 'success', text: 'Datos de organización guardados correctamente.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error inesperado.' });
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Listas para selects ---------- */

  const tiposOrganizacion = dropdowns.tipos_organizacion?.length
    ? dropdowns.tipos_organizacion
    : TIPOS_ORGANIZACION_FALLBACK;

  const sectores = dropdowns.sectores ?? [];
  const anios = dropdowns.anios_calculo?.length ? dropdowns.anios_calculo : ANIOS_FALLBACK;

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Cargando datos de organización…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Datos de la Organización</h1>
        <p className="text-gray-500 mt-1">
          Información general requerida por el Registro de Huella de Carbono (MITECO) · Pestaña 1
        </p>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Sección: Identificación ── */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Identificación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="form-label">
                Nombre de la organización <span className="text-red-500">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                className="form-input"
                placeholder="Ej. Ejemplo S.L."
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>

            {/* CIF / NIF */}
            <div>
              <label htmlFor="cif_nif" className="form-label">
                CIF / NIF <span className="text-red-500">*</span>
              </label>
              <input
                id="cif_nif"
                name="cif_nif"
                type="text"
                className="form-input"
                placeholder="Ej. B12345678"
                value={form.cif_nif}
                onChange={handleChange}
                required
              />
              <p className="mt-1 text-xs text-gray-400">Formato: letra + 8 dígitos (CIF) o 8 dígitos + letra (NIF)</p>
            </div>

            {/* Tipo de organización */}
            <div>
              <label htmlFor="tipo_organizacion" className="form-label">
                Tipo de organización <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo_organizacion"
                name="tipo_organizacion"
                className="form-select"
                value={form.tipo_organizacion}
                onChange={handleChange}
                required
              >
                <option value="">— Seleccionar —</option>
                {tiposOrganizacion.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Sector */}
            <div>
              <label htmlFor="sector" className="form-label">
                Sector de actividad <span className="text-red-500">*</span>
              </label>
              <select
                id="sector"
                name="sector"
                className="form-select"
                value={form.sector}
                onChange={handleChange}
                required
              >
                <option value="">— Seleccionar —</option>
                {sectores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {sectores.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No se pudieron cargar los sectores. Comprueba la conexión con el servidor.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Sección: Parámetros del cálculo ── */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Parámetros del cálculo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Año de cálculo */}
            <div>
              <label htmlFor="anio_calculo" className="form-label">
                Año de cálculo <span className="text-red-500">*</span>
              </label>
              <select
                id="anio_calculo"
                name="anio_calculo"
                className="form-select"
                value={form.anio_calculo}
                onChange={handleChange}
                required
              >
                {anios.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Superficie */}
            <div>
              <label htmlFor="superficie_m2" className="form-label">
                Superficie (m²)
              </label>
              <input
                id="superficie_m2"
                name="superficie_m2"
                type="number"
                min={0}
                step="any"
                className="form-input"
                placeholder="Ej. 1500"
                value={form.superficie_m2}
                onChange={handleChange}
              />
            </div>

            {/* Nº empleados */}
            <div>
              <label htmlFor="num_empleados" className="form-label">
                Nº de empleados
              </label>
              <input
                id="num_empleados"
                name="num_empleados"
                type="number"
                min={0}
                step={1}
                className="form-input"
                placeholder="Ej. 45"
                value={form.num_empleados}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* ── Sección: Índice de actividad ── */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Índice de actividad</h2>
          <p className="text-sm text-gray-500 mb-4">
            Magnitud representativa de la actividad de la organización que se usará para calcular
            el ratio de intensidad (t&nbsp;CO₂e&nbsp;/&nbsp;unidad).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Nombre del índice */}
            <div>
              <label htmlFor="ia_nombre" className="form-label">
                Nombre del índice
              </label>
              <input
                id="ia_nombre"
                name="nombre"
                type="text"
                className="form-input"
                placeholder="Ej. Facturación"
                value={form.indice_actividad.nombre}
                onChange={handleIndiceChange}
              />
            </div>

            {/* Valor */}
            <div>
              <label htmlFor="ia_valor" className="form-label">
                Valor
              </label>
              <input
                id="ia_valor"
                name="valor"
                type="number"
                min={0}
                step="any"
                className="form-input"
                placeholder="Ej. 5000000"
                value={form.indice_actividad.valor}
                onChange={handleIndiceChange}
              />
            </div>

            {/* Unidades */}
            <div>
              <label htmlFor="ia_unidades" className="form-label">
                Unidades
              </label>
              <input
                id="ia_unidades"
                name="unidades"
                type="text"
                className="form-input"
                placeholder="Ej. € / MWh / t producidas"
                value={form.indice_actividad.unidades}
                onChange={handleIndiceChange}
              />
            </div>
          </div>
        </section>

        {/* ── Botones de acción ── */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setForm(DEFAULT_ORG);
              setMessage(null);
            }}
          >
            Restablecer
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar organización'}
          </button>
        </div>
      </form>
    </div>
  );
}
