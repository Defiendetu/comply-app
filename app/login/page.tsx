'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// USUARIOS DE PRUEBA - Agregar más aquí cuando lleguen solicitudes
const USUARIOS_AUTORIZADOS = [
  { email: 'demo@comply.com', password: 'demo2024', empresa: 'Demo Comply' },
  { email: 'admin@comply.com', password: 'admin2024', empresa: 'Admin' },
  // Agrega más usuarios aquí:
  // { email: 'nuevo@empresa.com', password: 'clave123', empresa: 'Empresa SAS' },
];

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Buscar usuario en la lista
    const usuario = USUARIOS_AUTORIZADOS.find(
      u => u.email.toLowerCase() === formData.email.toLowerCase() && u.password === formData.password
    );

    if (usuario) {
      // Guardar sesión en localStorage
      localStorage.setItem('complyUser', JSON.stringify({
        email: usuario.email,
        empresa: usuario.empresa,
        loggedIn: true
      }));
      
      // Redirigir al dashboard
      router.push('/dashboard');
    } else {
      setError('Email o contraseña incorrectos');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Comply</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Ingresa tus credenciales para continuar
          </p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@empresa.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                loading
                  ? 'bg-blue-400 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              ¿No tienes cuenta?{' '}
              <Link href="/solicitar" className="text-blue-600 hover:underline font-medium">
                Solicita acceso
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Demo: <span className="font-mono bg-gray-100 px-2 py-1 rounded">demo@comply.com</span> / <span className="font-mono bg-gray-100 px-2 py-1 rounded">demo2024</span>
          </p>
        </div>
      </div>
    </div>
  );
}
