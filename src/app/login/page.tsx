/**
 * Página de Login
 * 
 * Autenticación con email + password para acceder al SaaS.
 * Demo: david@empresa.com / demo123
 */

'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('david@empresa.com');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    
    if (result?.error) {
      setError('Credenciales incorrectas');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100" style={{ marginLeft: '-16rem' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🌿</div>
            <h1 className="text-2xl font-bold text-gray-900">Huella de Carbono</h1>
            <p className="text-sm text-gray-500 mt-1">Calculadora MITECO V.31 · España</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="tu@empresa.com"
                required
              />
            </div>
            
            <div>
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>
          
          {/* Demo credentials */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-1">Credenciales de demo:</p>
            <p className="text-xs text-gray-600">Email: david@empresa.com</p>
            <p className="text-xs text-gray-600">Password: demo123</p>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-4">
          GHG Protocol · Alcance 1 + 2 · Real Decreto 163/2014
        </p>
      </div>
    </div>
  );
}
