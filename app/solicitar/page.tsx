'use client';

import { useState } from 'react';
import { Shield, ArrowLeft, Send, CheckCircle, Building2, User, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function Solicitar() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    empresa: '',
    nit: '',
    telefono: '',
    sector: '',
    mensaje: ''
  });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
     await fetch('https://defiendetetu.app.n8n.cloud/webhook-test/solicitud-acceso', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          fecha: new Date().toISOString(),
          tipo: 'solicitud_acceso'
        })
      });
      setEnviado(true);
    } catch (error) {
      console.error('Error:', error);
      setEnviado(true);
    }
    
    setEnviando(false);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (enviado) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="card p-8">
            <div className="w-16 h-16 bg-accent-emerald/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-accent-emerald" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Solicitud enviada!</h1>
            <p className="text-gray-600 mb-6">
              Hemos recibido tu solicitud. Te contactaremos pronto para activar tu cuenta.
            </p>
            <Link href="/" className="btn-primary">
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Comply</span>
            </Link>
            <Link href="/" className="flex items-center text-gray-600 hover:text-primary-600 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Link>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Solicitar acceso</h1>
          <p className="text-gray-600">
            Completa el formulario y te contactaremos para activar tu cuenta gratuita.
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="label">
                <User className="w-4 h-4 inline mr-2" />
                Nombre completo
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="input-field"
                placeholder="Tu nombre"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                <Mail className="w-4 h-4 inline mr-2" />
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="tu@email.com"
              />
            </div>

            {/* Empresa y NIT */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="empresa" className="label">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Nombre de la empresa
                </label>
                <input
                  type="text"
                  id="empresa"
                  name="empresa"
                  required
                  value={formData.empresa}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Empresa S.A.S."
                />
              </div>
              <div>
                <label htmlFor="nit" className="label">
                  NIT
                </label>
                <input
                  type="text"
                  id="nit"
                  name="nit"
                  value={formData.nit}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="900.123.456-7"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="label">
                <Phone className="w-4 h-4 inline mr-2" />
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="input-field"
                placeholder="+57 300 123 4567"
              />
            </div>

            {/* Sector */}
            <div>
              <label htmlFor="sector" className="label">
                Sector de tu empresa
              </label>
              <select
                id="sector"
                name="sector"
                required
                value={formData.sector}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Selecciona un sector</option>
                <option value="inmobiliario">Agentes Inmobiliarios</option>
                <option value="juridico">Servicios Jurídicos</option>
                <option value="contable">Servicios Contables</option>
                <option value="metales">Metales y Piedras Preciosas</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Mensaje */}
            <div>
              <label htmlFor="mensaje" className="label">
                Mensaje adicional (opcional)
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                rows={3}
                value={formData.mensaje}
                onChange={handleChange}
                className="input-field resize-none"
                placeholder="Cuéntanos más sobre tu empresa o dudas que tengas..."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={enviando}
              className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Send className="w-5 h-5 mr-2" />
                  Enviar solicitud
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
