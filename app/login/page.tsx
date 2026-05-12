'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAFA' }}>
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login')) setError('Email o contraseña incorrectos');
      else if (error.message.includes('Email not confirmed')) setError('Confirma tu email antes de ingresar. Revisa tu bandeja de entrada.');
      else setError(error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (error.message.includes('already registered')) setError('Este email ya está registrado. Intenta iniciar sesión.');
      else setError(error.message);
    } else {
      setSuccess('Cuenta creada. Revisa tu email para confirmar tu cuenta.');
      setMode('login');
      setPassword(''); setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) setError(error.message);
    else setSuccess('Se envió un enlace de recuperación a tu email.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: '#111' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-[14px]" style={{ background: '#333' }}>C</div>
          <span className="text-[18px] font-semibold text-white">Comply</span>
        </Link>
        <div>
          <h1 className="text-[40px] leading-tight text-white mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Cumplimiento<br />SAGRILAFT<br />simplificado
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: '#888' }}>
            Genera tu Manual de Medidas Mínimas, Matriz de Riesgo y documentos regulatorios en minutos con inteligencia artificial.
          </p>
        </div>
        <p className="text-[12px]" style={{ color: '#555' }}>© {new Date().getFullYear()} Comply. Todos los derechos reservados.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6" style={{ background: '#FAFAFA' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-[14px]" style={{ background: '#111' }}>C</div>
              <span className="text-[18px] font-semibold" style={{ color: '#111' }}>Comply</span>
            </Link>
          </div>

          <h2 className="text-[22px] font-semibold mb-1" style={{ color: '#111' }}>
            {mode === 'login' && 'Iniciar sesión'}
            {mode === 'register' && 'Crear cuenta'}
            {mode === 'forgot' && 'Recuperar contraseña'}
          </h2>
          <p className="text-[13px] mb-6" style={{ color: '#999' }}>
            {mode === 'login' && 'Ingresa tus credenciales para continuar'}
            {mode === 'register' && 'Regístrate para acceder a la plataforma'}
            {mode === 'forgot' && 'Te enviaremos un enlace de recuperación'}
          </p>

          {error && <div className="mb-4 p-3 rounded-lg text-[12px]" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>{error}</div>}
          {success && <div className="mb-4 p-3 rounded-lg text-[12px]" style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #BBF7D0' }}>{success}</div>}

          <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot}>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium block mb-1.5" style={{ color: '#555' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="tu@empresa.com"
                  className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none transition-all focus:ring-2 focus:ring-black/10"
                  style={{ background: '#fff', border: '1px solid #E0E0E0' }} />
              </div>

              {mode !== 'forgot' && (
                <div>
                  <label className="text-[12px] font-medium block mb-1.5" style={{ color: '#555' }}>Contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••" minLength={6}
                    className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none transition-all focus:ring-2 focus:ring-black/10"
                    style={{ background: '#fff', border: '1px solid #E0E0E0' }} />
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label className="text-[12px] font-medium block mb-1.5" style={{ color: '#555' }}>Confirmar contraseña</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    placeholder="••••••••" minLength={6}
                    className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none transition-all focus:ring-2 focus:ring-black/10"
                    style={{ background: '#fff', border: '1px solid #E0E0E0' }} />
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} className="text-[11px] font-medium hover:underline" style={{ color: '#999' }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-5 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: '#111' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Procesando...
                </span>
              ) : (
                <>
                  {mode === 'login' && 'Ingresar'}
                  {mode === 'register' && 'Crear cuenta'}
                  {mode === 'forgot' && 'Enviar enlace'}
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            {mode === 'login' && (
              <p className="text-[12px]" style={{ color: '#999' }}>
                ¿No tienes cuenta?{' '}
                <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }} className="font-medium hover:underline" style={{ color: '#111' }}>Regístrate</button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-[12px]" style={{ color: '#999' }}>
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="font-medium hover:underline" style={{ color: '#111' }}>Inicia sesión</button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-[12px]" style={{ color: '#999' }}>
                <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="font-medium hover:underline" style={{ color: '#111' }}>Volver al login</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
