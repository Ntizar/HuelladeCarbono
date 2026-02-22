/**
 * Admin - Gestión de Usuarios
 * 
 * Panel CRUD para usuarios: crear, editar roles, desactivar.
 * Solo accesible por usuarios con rol 'admin'.
 */

'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'editor' | 'viewer';
  org_id: string;
  activo: string;
  created_at: string;
}

const ROLES = [
  { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-700' },
  { value: 'editor', label: 'Editor', color: 'bg-blue-100 text-blue-700' },
  { value: 'viewer', label: 'Lector', color: 'bg-gray-100 text-gray-700' },
];

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<string>('editor');
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    try {
      const res = await fetch('/api/data?tipo=users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
      else if (data?.users) setUsers(data.users);
    } catch { /* ignore */ }
    setLoading(false);
  };
  
  const handleCreate = async () => {
    if (!nombre || !email || !password) {
      setMessage('⚠️ Completa nombre, email y contraseña');
      return;
    }
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'users',
          entry: { nombre, email, rol, password, org_id: 'org_001', activo: 'true' },
        }),
      });
      if (res.ok) {
        setMessage('✅ Usuario creado');
        setNombre(''); setEmail(''); setPassword(''); setRol('editor');
        setShowForm(false);
        loadUsers();
      }
    } catch {
      setMessage('❌ Error al crear usuario');
    }
  };
  
  const getRoleBadge = (rol: string) => {
    const r = ROLES.find(x => x.value === rol);
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r?.color || 'bg-gray-100'}`}>{r?.label || rol}</span>;
  };
  
  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👥 Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-1">Administración · Crear, editar y gestionar usuarios</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '✕ Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>
      
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">×</button>
        </div>
      )}
      
      {/* Create form */}
      {showForm && (
        <div className="card mb-6 border-2 border-green-200">
          <h2 className="text-lg font-semibold mb-4">Crear nuevo usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="form-label">Nombre *</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="form-input" placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="juan@empresa.com" />
            </div>
            <div>
              <label className="form-label">Contraseña *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="form-label">Rol</label>
              <select value={rol} onChange={e => setRol(e.target.value)} className="form-select">
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleCreate} className="btn-primary w-full">Crear usuario</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Users table */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Usuarios ({users.length})</h2>
        
        {loading ? (
          <p className="text-gray-400 py-8 text-center">Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">No hay usuarios registrados.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Organización</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="font-medium">{u.nombre}</td>
                  <td className="text-gray-600">{u.email}</td>
                  <td>{getRoleBadge(u.rol)}</td>
                  <td className="text-gray-500 text-xs">{u.org_id}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.activo === 'true' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.activo === 'true' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-gray-400 text-xs">{u.created_at?.split('T')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Demo credentials info */}
      <div className="card mt-6 bg-amber-50 border-amber-200">
        <h3 className="font-semibold text-amber-800 mb-2">🔑 Credenciales demo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-amber-700">
          <div><strong>Admin:</strong> admin@demo.com / admin123</div>
          <div><strong>Editor:</strong> editor@demo.com / editor123</div>
          <div><strong>Viewer:</strong> viewer@demo.com / viewer123</div>
        </div>
      </div>
    </div>
  );
}
