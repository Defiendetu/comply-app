'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ================================================================
// TYPES
// ================================================================
type ActiveView = 'home' | 'documentos' | 'contrapartes' | 'matriz' | 'agentes' | 'reportes' | 'configuracion';

// ================================================================
// MAIN COMPONENT
// ================================================================
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; empresa: string } | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Document generation state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [documentosGenerados, setDocumentosGenerados] = useState<{
    manualBase64: string; manualNombre: string;
    matrizBase64: string; matrizNombre: string;
    fccBase64: string; fccNombre: string;
    empresa: string; nit: string; representante: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    certificadoBase64: '', certificadoNombre: '',
    manejaEfectivo: '', operaExtranjeros: '', canales: [] as string[],
    tieneOficialCumplimiento: '', realizaDebidaDiligencia: '',
    consultaListasRestrictivas: '', tieneProcedimientoROS: '', capacitaPersonal: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    { icon: '📄', text: 'Recibimos tu certificado de Cámara de Comercio...', sub: 'Preparando el análisis' },
    { icon: '🔍', text: 'Nuestra IA está extrayendo los datos de tu empresa...', sub: 'Identificando razón social, NIT, objeto social' },
    { icon: '🧠', text: 'Analizando los riesgos específicos de tu sector...', sub: 'Evaluando factores LA/FT/FPADM' },
    { icon: '📊', text: 'Construyendo tu matriz de riesgo personalizada...', sub: 'Calculando probabilidades e impactos' },
    { icon: '⚖️', text: 'Generando señales de alerta para tu actividad económica...', sub: 'Identificando controles específicos' },
    { icon: '📋', text: 'Redactando tu Manual de Medidas Mínimas...', sub: 'Personalizando cada sección para tu empresa' },
    { icon: '✨', text: 'Aplicando formato profesional a tus documentos...', sub: 'Ya casi terminamos...' },
    { icon: '🔒', text: 'Finalizando la protección para tu empresa...', sub: 'Empaquetando todo para ti' },
  ];

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < loadingMessages.length - 1 ? prev + 1 : prev);
    }, 8000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const storedUser = localStorage.getItem('complyUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.loggedIn) setUser(userData);
      else router.push('/login');
    } else router.push('/login');
  }, [router]);

  // ================================================================
  // HANDLERS
  // ================================================================
  const handleLogout = () => { localStorage.removeItem('complyUser'); router.push('/login'); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Por favor sube un archivo PDF'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('El archivo no puede superar 10MB'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setFormData(prev => ({ ...prev, certificadoBase64: base64, certificadoNombre: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const handleCanalesChange = (canal: string) => {
    setFormData(prev => ({
      ...prev,
      canales: prev.canales.includes(canal) ? prev.canales.filter(c => c !== canal) : [...prev.canales, canal]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.certificadoBase64) { setError('Debes subir el Certificado de Cámara de Comercio'); return; }
    if (!formData.manejaEfectivo) { setError('Indica si manejas efectivo'); return; }
    if (!formData.operaExtranjeros) { setError('Indica si operas con extranjeros'); return; }
    if (formData.canales.length === 0) { setError('Selecciona al menos un canal de operación'); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch('https://defiendetetu.app.n8n.cloud/webhook/generar-documentos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificadoBase64: formData.certificadoBase64, manejaEfectivo: formData.manejaEfectivo,
          operaExtranjeros: formData.operaExtranjeros, canales: formData.canales.join(', '),
          tieneOficialCumplimiento: formData.tieneOficialCumplimiento || 'no',
          realizaDebidaDiligencia: formData.realizaDebidaDiligencia || 'no',
          consultaListasRestrictivas: formData.consultaListasRestrictivas || 'no',
          tieneProcedimientoROS: formData.tieneProcedimientoROS || 'no',
          capacitaPersonal: formData.capacitaPersonal || 'no',
        }),
      });
      const responseText = await response.text();
      let data;
      try { data = JSON.parse(responseText); } catch (e) { throw new Error('Error al procesar la respuesta'); }
      if (data.success) {
        setDocumentosGenerados({
          manualBase64: data.documentos?.manual?.base64 || '', manualNombre: data.documentos?.manual?.nombre || 'Manual_Medidas_Minimas.docx',
          matrizBase64: data.documentos?.matriz?.base64 || '', matrizNombre: data.documentos?.matriz?.nombre || 'Matriz_Riesgo.xlsx',
          fccBase64: data.documentos?.fcc?.base64 || '', fccNombre: data.documentos?.fcc?.nombre || 'FCC.xlsx',
          empresa: data.empresa || '', nit: data.nit || '', representante: data.representante || '',
        });
        setStep(3);
      } else { setError(data.error || 'Error al generar los documentos'); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión. Intenta de nuevo.');
    } finally { setLoading(false); }
  };

  const downloadBase64 = (base64: string, filename: string, mime: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const descargarManual = () => documentosGenerados?.manualBase64 && downloadBase64(documentosGenerados.manualBase64, documentosGenerados.manualNombre, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const descargarMatriz = () => documentosGenerados?.matrizBase64 && downloadBase64(documentosGenerados.matrizBase64, documentosGenerados.matrizNombre, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const descargarFCC = () => documentosGenerados?.fccBase64 && downloadBase64(documentosGenerados.fccBase64, documentosGenerados.fccNombre, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  if (!user) return null;

  // ================================================================
  // SIDEBAR MENU ITEMS
  // ================================================================
  const menuItems: { id: ActiveView; label: string; icon: string; badge?: string; disabled?: boolean }[] = [
    { id: 'home', label: 'Inicio', icon: '⌂' },
    { id: 'documentos', label: 'Documentos', icon: '◉' },
    { id: 'contrapartes', label: 'Contrapartes', icon: '◎', badge: 'Próximo', disabled: true },
    { id: 'matriz', label: 'Matriz de Riesgo', icon: '◈', badge: 'Próximo', disabled: true },
    { id: 'agentes', label: 'AI Agents', icon: '◇', badge: 'Nuevo' },
    { id: 'reportes', label: 'Reportes', icon: '▤', badge: 'Próximo', disabled: true },
  ];

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <div className="flex h-screen" style={{ fontFamily: "'DM Sans', 'Satoshi', system-ui, sans-serif", background: '#FAFBFC' }}>
      {/* Google Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
        * { font-family: 'DM Sans', system-ui, sans-serif; }
        .sidebar-item { transition: all 0.2s ease; }
        .sidebar-item:hover { background: rgba(255,255,255,0.08); }
        .sidebar-item.active { background: rgba(255,255,255,0.12); border-left: 3px solid #6366F1; }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
        .badge-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .gradient-text { background: linear-gradient(135deg, #1E293B 0%, #6366F1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>

      {/* SIDEBAR */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 flex flex-col`} style={{ background: '#0F172A' }}>
        {/* Logo */}
        <div className="p-5 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>C</div>
              <div>
                <div className="text-white font-bold text-lg tracking-tight">Comply</div>
                <div className="text-xs" style={{ color: '#64748B' }}>SAGRILAFT</div>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-500 hover:text-white transition-colors p-1">
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => !item.disabled && setActiveView(item.id)}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left ${activeView === item.id ? 'active' : ''} ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-lg w-6 text-center" style={{ color: activeView === item.id ? '#A5B4FC' : '#94A3B8' }}>{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className={`text-sm flex-1 ${activeView === item.id ? 'text-white font-semibold' : ''}`} style={{ color: activeView === item.id ? '#fff' : '#CBD5E1' }}>{item.label}</span>
                  {item.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.badge === 'Nuevo' ? 'bg-indigo-500 text-white badge-pulse' : ''}`} style={item.badge === 'Próximo' ? { background: '#1E293B', color: '#64748B', fontSize: '10px' } : {}}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t" style={{ borderColor: '#1E293B' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#334155' }}>
              {user.email[0].toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{user.empresa || user.email}</div>
                <button onClick={handleLogout} className="text-xs hover:text-red-400 transition-colors" style={{ color: '#64748B' }}>Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between" style={{ background: 'rgba(250,251,252,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0' }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
              {activeView === 'home' && 'Panel de Control'}
              {activeView === 'documentos' && 'Generar Documentos'}
              {activeView === 'agentes' && 'AI Agents'}
              {activeView === 'contrapartes' && 'Contrapartes'}
              {activeView === 'matriz' && 'Matriz de Riesgo'}
              {activeView === 'reportes' && 'Reportes'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
              {activeView === 'home' && 'Resumen de tu cumplimiento LA/FT/FPADM'}
              {activeView === 'documentos' && 'Genera tu paquete de cumplimiento desde la Cámara de Comercio'}
              {activeView === 'agentes' && 'Automatiza tu cumplimiento con inteligencia artificial'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('documentos')} className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              + Nuevo Análisis
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* ============================================ */}
          {/* HOME VIEW */}
          {/* ============================================ */}
          {activeView === 'home' && (
            <div>
              {/* Welcome */}
              <div className="mb-8 p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a Comply</h2>
                    <p className="text-sm" style={{ color: '#94A3B8' }}>
                      Tu plataforma de cumplimiento LA/FT/FPADM impulsada por inteligencia artificial.
                      Genera documentos, monitorea contrapartes y automatiza tu cumplimiento normativo.
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-center px-6">
                      <div className="text-3xl font-bold text-white">3</div>
                      <div className="text-xs" style={{ color: '#64748B' }}>Documentos</div>
                    </div>
                    <div className="w-px h-12" style={{ background: '#334155' }}></div>
                    <div className="text-center px-6">
                      <div className="text-3xl font-bold text-white">6</div>
                      <div className="text-xs" style={{ color: '#64748B' }}>Sectores</div>
                    </div>
                    <div className="w-px h-12" style={{ background: '#334155' }}></div>
                    <div className="text-center px-6">
                      <div className="text-3xl font-bold" style={{ color: '#A5B4FC' }}>IA</div>
                      <div className="text-xs" style={{ color: '#64748B' }}>Powered</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#94A3B8' }}>Acciones Rápidas</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-10">
                <button onClick={() => setActiveView('documentos')} className="card-hover p-6 rounded-xl text-left border" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-xl" style={{ background: '#EEF2FF' }}>📋</div>
                  <h4 className="font-semibold mb-1" style={{ color: '#0F172A' }}>Generar Documentos</h4>
                  <p className="text-sm" style={{ color: '#64748B' }}>Manual, Matriz de Riesgo y FCC desde tu Cámara de Comercio</p>
                </button>
                <div className="card-hover p-6 rounded-xl text-left border relative" style={{ background: '#fff', borderColor: '#E2E8F0', opacity: 0.7 }}>
                  <span className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F1F5F9', color: '#94A3B8' }}>Próximamente</span>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-xl" style={{ background: '#FFF7ED' }}>🔍</div>
                  <h4 className="font-semibold mb-1" style={{ color: '#0F172A' }}>Consultar Contraparte</h4>
                  <p className="text-sm" style={{ color: '#64748B' }}>Verifica antecedentes, listas restrictivas y PEPs en segundos</p>
                </div>
                <button onClick={() => setActiveView('agentes')} className="card-hover p-6 rounded-xl text-left border" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                  <span className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-500 text-white badge-pulse" style={{ position: 'relative' }}>Nuevo</span>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-xl" style={{ background: '#EDE9FE' }}>🤖</div>
                  <h4 className="font-semibold mb-1" style={{ color: '#0F172A' }}>AI Agents</h4>
                  <p className="text-sm" style={{ color: '#64748B' }}>Agentes de IA que automatizan tu cumplimiento 24/7</p>
                </button>
              </div>

              {/* Modules Overview */}
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#94A3B8' }}>Módulos de la Plataforma</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Documentos', desc: 'Manual, Matriz, FCC y formatos de cumplimiento', icon: '📄', color: '#6366F1', active: true },
                  { name: 'Contrapartes', desc: 'KYC, debida diligencia y screening de listas', icon: '👥', color: '#F59E0B', active: false },
                  { name: 'Monitoreo', desc: 'Alertas automáticas y monitoreo continuo', icon: '📡', color: '#10B981', active: false },
                  { name: 'Reportes', desc: 'Informes regulatorios y de gestión', icon: '📊', color: '#EF4444', active: false },
                ].map((mod, i) => (
                  <div key={i} className="p-5 rounded-xl border" style={{ background: '#fff', borderColor: mod.active ? mod.color + '40' : '#E2E8F0' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{mod.icon}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mod.active ? 'text-white' : ''}`} style={{ background: mod.active ? mod.color : '#F1F5F9', color: mod.active ? '#fff' : '#94A3B8' }}>
                        {mod.active ? 'Activo' : 'Próximo'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1" style={{ color: '#0F172A' }}>{mod.name}</h4>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>{mod.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* AI AGENTS VIEW */}
          {/* ============================================ */}
          {activeView === 'agentes' && (
            <div>
              {/* Hero */}
              <div className="mb-8 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)' }}>
                <div className="max-w-2xl">
                  <span className="text-xs font-semibold uppercase tracking-widest mb-3 inline-block" style={{ color: '#818CF8' }}>COMPLY VA MÁS ALLÁ DE LA AUTOMATIZACIÓN</span>
                  <h2 className="text-3xl font-bold text-white mb-3">
                    Suma nuestros Agents<br />de IA a tu equipo
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
                    Hemos creado Agentes de IA especializados que actúan como copilotos de tu equipo,
                    automatizando el screening de contrapartes, el monitoreo de listas restrictivas y
                    la evaluación de riesgos para que tu empresa se enfoque en lo que realmente importa.
                  </p>
                </div>
              </div>

              {/* Agents Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Agent 1: Vigía */}
                <div className="card-hover rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold" style={{ color: '#0F172A' }}>Vigía</h3>
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-500 text-white badge-pulse">NUEVO</span>
                    </div>
                    <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                      Automatiza el screening de contrapartes contra listas restrictivas.
                      Consulta OFAC, ONU, Procuraduría, Contraloría y PEPs en segundos.
                    </p>
                    <div className="space-y-2 mb-6">
                      {['Cruce automático contra 300+ listas', 'Alertas en tiempo real por coincidencias', 'Reportes de debida diligencia'].map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#334155' }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#6366F1' }}>{i + 1}</span>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 py-4" style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                    <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#6366F1' }}>
                      Próximamente
                    </button>
                  </div>
                </div>

                {/* Agent 2: Centinela */}
                <div className="card-hover rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold" style={{ color: '#0F172A' }}>Centinela</h3>
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-500 text-white badge-pulse">NUEVO</span>
                    </div>
                    <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                      Tu aliado en monitoreo transaccional y evaluación continua de riesgos.
                      Detecta operaciones inusuales y genera alertas automáticas.
                    </p>
                    <div className="space-y-2 mb-6">
                      {['Monitoreo transaccional con IA', 'Detección de operaciones inusuales', 'Evaluación dinámica de riesgo'].map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#334155' }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#F59E0B' }}>{i + 1}</span>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 py-4" style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                    <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#F59E0B' }}>
                      Próximamente
                    </button>
                  </div>
                </div>

                {/* Agent 3: Cumplidor */}
                <div className="card-hover rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold" style={{ color: '#0F172A' }}>Cumplidor</h3>
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-500 text-white badge-pulse">NUEVO</span>
                    </div>
                    <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                      Automatiza la generación de reportes regulatorios, informes de gestión
                      y actualización de expedientes. Tu copiloto de cumplimiento normativo.
                    </p>
                    <div className="space-y-2 mb-6">
                      {['Generación automática de reportes', 'Calendario de obligaciones regulatorias', 'Actualización periódica de KYC'].map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#334155' }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#10B981' }}>{i + 1}</span>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 py-4" style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                    <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#10B981' }}>
                      Próximamente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* DOCUMENTOS VIEW */}
          {/* ============================================ */}
          {activeView === 'documentos' && (
            <div className="max-w-4xl mx-auto">
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-8">
                {[{ n: 1, label: 'Documentos' }, { n: 2, label: 'Información' }, { n: 3, label: 'Descargar' }].map((s, i) => (
                  <div key={s.n} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.n ? 'text-white' : ''}`} style={{ background: step >= s.n ? '#6366F1' : '#E2E8F0', color: step >= s.n ? '#fff' : '#94A3B8' }}>
                        {step > s.n ? '✓' : s.n}
                      </div>
                      <span className="text-xs mt-1.5 font-medium" style={{ color: step >= s.n ? '#6366F1' : '#94A3B8' }}>{s.label}</span>
                    </div>
                    {i < 2 && <div className="w-20 h-0.5 mx-3 mt-[-12px]" style={{ background: step > s.n ? '#6366F1' : '#E2E8F0' }}></div>}
                  </div>
                ))}
              </div>

              {/* STEP 1: Upload */}
              {step === 1 && (
                <div className="rounded-2xl border p-8" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                  <h2 className="text-xl font-bold mb-2" style={{ color: '#0F172A' }}>Sube tu Certificado de Cámara de Comercio</h2>
                  <p className="text-sm mb-6" style={{ color: '#64748B' }}>Nuestra IA extraerá automáticamente los datos de tu empresa y generará documentos personalizados.</p>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all hover:border-indigo-400"
                    style={{ borderColor: formData.certificadoBase64 ? '#6366F1' : '#CBD5E1', background: formData.certificadoBase64 ? '#EEF2FF' : '#FAFBFC' }}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                    {formData.certificadoBase64 ? (
                      <div>
                        <div className="text-3xl mb-2">✅</div>
                        <p className="font-semibold" style={{ color: '#6366F1' }}>{formData.certificadoNombre}</p>
                        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Clic para cambiar archivo</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-3xl mb-2">📎</div>
                        <p className="font-semibold" style={{ color: '#334155' }}>Haz clic para subir tu PDF</p>
                        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>o arrastra y suelta aquí — Máximo 10MB</p>
                      </div>
                    )}
                  </div>

                  {formData.certificadoBase64 && (
                    <button onClick={() => setStep(2)} className="w-full mt-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                      Continuar →
                    </button>
                  )}
                </div>
              )}

              {/* STEP 2: Info + Checklist */}
              {step === 2 && (
                <div className="rounded-2xl border p-8" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                  <h2 className="text-xl font-bold mb-6" style={{ color: '#0F172A' }}>Información Adicional</h2>

                  {/* Radio Questions */}
                  {[
                    { key: 'manejaEfectivo', label: '¿Tu empresa maneja efectivo de forma regular?' },
                    { key: 'operaExtranjeros', label: '¿Opera con clientes o proveedores extranjeros?' },
                  ].map(q => (
                    <div key={q.key} className="mb-5">
                      <label className="text-sm font-semibold block mb-2" style={{ color: '#334155' }}>{q.label}</label>
                      <div className="flex gap-3">
                        {['Sí', 'No'].map(opt => (
                          <button key={opt} onClick={() => setFormData(prev => ({ ...prev, [q.key]: opt.toLowerCase() }))}
                            className={`px-5 py-2 rounded-lg text-sm font-medium border transition-all ${(formData as any)[q.key] === opt.toLowerCase() ? 'border-indigo-500 text-indigo-700' : 'border-gray-200'}`}
                            style={(formData as any)[q.key] === opt.toLowerCase() ? { background: '#EEF2FF' } : { background: '#fff' }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Canales */}
                  <div className="mb-5">
                    <label className="text-sm font-semibold block mb-2" style={{ color: '#334155' }}>Canales de operación</label>
                    <div className="flex flex-wrap gap-2">
                      {['Presencial', 'Virtual', 'Telefónico', 'Mixto'].map(canal => (
                        <button key={canal} onClick={() => handleCanalesChange(canal.toLowerCase())}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${formData.canales.includes(canal.toLowerCase()) ? 'border-indigo-500 text-indigo-700' : 'border-gray-200'}`}
                          style={formData.canales.includes(canal.toLowerCase()) ? { background: '#EEF2FF' } : { background: '#fff' }}>
                          {canal}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="mt-6 p-5 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: '#334155' }}>Estado actual de cumplimiento</h3>
                    {[
                      { key: 'tieneOficialCumplimiento', label: '¿Tiene oficial de cumplimiento designado?' },
                      { key: 'realizaDebidaDiligencia', label: '¿Realiza debida diligencia a contrapartes?' },
                      { key: 'consultaListasRestrictivas', label: '¿Consulta listas restrictivas?' },
                      { key: 'tieneProcedimientoROS', label: '¿Tiene procedimiento para ROS?' },
                      { key: 'capacitaPersonal', label: '¿Capacita al personal en LA/FT/FPADM?' },
                    ].map(q => (
                      <div key={q.key} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#E2E8F0' }}>
                        <span className="text-sm" style={{ color: '#475569' }}>{q.label}</span>
                        <div className="flex gap-2">
                          {['Sí', 'En proceso', 'No'].map(opt => (
                            <button key={opt} onClick={() => setFormData(prev => ({ ...prev, [q.key]: opt.toLowerCase() }))}
                              className={`px-3 py-1 rounded text-xs font-medium transition-all ${(formData as any)[q.key] === opt.toLowerCase() ? 'text-white' : 'border'}`}
                              style={(formData as any)[q.key] === opt.toLowerCase()
                                ? { background: opt === 'Sí' ? '#10B981' : opt === 'En proceso' ? '#F59E0B' : '#EF4444' }
                                : { borderColor: '#E2E8F0', background: '#fff', color: '#94A3B8' }}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {error && <div className="mt-4 p-3 rounded-lg text-sm text-red-700" style={{ background: '#FEF2F2' }}>{error}</div>}

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: '#E2E8F0', color: '#64748B' }}>
                      ← Atrás
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                      className="flex-1 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                      {loading ? 'Generando...' : 'Generar Documentos'}
                    </button>
                  </div>

                  {/* Loading Progress */}
                  {loading && (
                    <div className="mt-8 p-6 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div className="text-center">
                        <div className="text-4xl mb-3">{loadingMessages[loadingStep]?.icon}</div>
                        <h3 className="text-base font-bold mb-1" style={{ color: '#0F172A' }}>{loadingMessages[loadingStep]?.text}</h3>
                        <p className="text-sm mb-4" style={{ color: '#6366F1' }}>{loadingMessages[loadingStep]?.sub}</p>
                        <div className="max-w-sm mx-auto">
                          <div className="flex justify-between text-xs mb-1" style={{ color: '#94A3B8' }}>
                            <span>Progreso</span>
                            <span>{Math.round(((loadingStep + 1) / loadingMessages.length) * 100)}%</span>
                          </div>
                          <div className="w-full rounded-full h-2" style={{ background: '#E2E8F0' }}>
                            <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}></div>
                          </div>
                        </div>
                        <p className="text-xs mt-4" style={{ color: '#CBD5E1' }}>Este proceso puede tomar entre 30 segundos y 2 minutos</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Download */}
              {step === 3 && documentosGenerados && (
                <div>
                  {/* Success Banner */}
                  <div className="p-6 rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">🎉</div>
                      <div>
                        <h2 className="text-xl font-bold text-white">¡Documentos generados exitosamente!</h2>
                        <p className="text-sm text-green-100 mt-1">{documentosGenerados.empresa} — NIT: {documentosGenerados.nit}</p>
                      </div>
                    </div>
                  </div>

                  {/* Download Cards */}
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {[
                      { name: 'Manual de Medidas Mínimas', desc: 'Documento Word con todas las políticas LA/FT/FPADM', type: 'DOCX', color: '#6366F1', onClick: descargarManual },
                      { name: 'Matriz de Riesgo', desc: 'Análisis con factores de riesgo y controles', type: 'XLSX', color: '#10B981', onClick: descargarMatriz },
                      { name: 'Formulario Contraparte (FCC)', desc: 'Conocimiento de contrapartes para clientes y proveedores', type: 'XLSX', color: '#8B5CF6', onClick: descargarFCC },
                    ].map((doc, i) => (
                      <div key={i} className="card-hover rounded-xl border p-6" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: doc.color }}>{doc.type[0]}</div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: doc.color + '15', color: doc.color }}>{doc.type}</span>
                        </div>
                        <h4 className="font-semibold text-sm mb-1" style={{ color: '#0F172A' }}>{doc.name}</h4>
                        <p className="text-xs mb-4" style={{ color: '#94A3B8' }}>{doc.desc}</p>
                        <button onClick={doc.onClick} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: doc.color }}>
                          ↓ Descargar
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => { setStep(1); setDocumentosGenerados(null); setFormData(prev => ({ ...prev, certificadoBase64: '', certificadoNombre: '' })); }}
                    className="w-full py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-gray-50" style={{ borderColor: '#E2E8F0', color: '#64748B' }}>
                    ← Generar nuevos documentos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
