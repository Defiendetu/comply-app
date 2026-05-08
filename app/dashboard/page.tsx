'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ActiveView = 'home' | 'documentos' | 'contrapartes' | 'matriz' | 'agentes' | 'reportes';

interface EmpresaData {
  id: string;
  razon_social: string;
  razon_social_corto: string;
  nit: string;
  tipo_sociedad: string;
  representante_legal: string;
  cedula_rep_legal: string;
  ciudad: string;
  sector_nombre: string;
  codigo_ciiu: string;
  perfil_riesgo: string;
  created_at: string;
}

interface DocumentoHistorial {
  id: string;
  tipo: string;
  version: string;
  nombre_archivo: string;
  created_at: string;
  base64: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; empresa: string } | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Supabase data
  const [empresaGuardada, setEmpresaGuardada] = useState<EmpresaData | null>(null);
  const [historialDocumentos, setHistorialDocumentos] = useState<DocumentoHistorial[]>([]);

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
  // Document selection
  const [selectedDocs, setSelectedDocs] = useState<string[]>(['manual', 'matriz', 'fcc']);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    { icon: '📄', text: 'Recibimos tu certificado...', sub: 'Preparando el análisis' },
    { icon: '🔍', text: 'Extrayendo datos de tu empresa...', sub: 'Razón social, NIT, objeto social' },
    { icon: '🧠', text: 'Analizando riesgos de tu sector...', sub: 'Evaluando factores LA/FT/FPADM' },
    { icon: '📊', text: 'Construyendo la matriz de riesgo...', sub: 'Probabilidades e impactos' },
    { icon: '⚖️', text: 'Generando señales de alerta...', sub: 'Controles específicos' },
    { icon: '📋', text: 'Redactando tu Manual...', sub: 'Personalizando cada sección' },
    { icon: '✨', text: 'Formato profesional...', sub: 'Ya casi terminamos' },
    { icon: '🔒', text: 'Finalizando...', sub: 'Empaquetando todo para ti' },
  ];

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => { setLoadingStep(prev => prev < loadingMessages.length - 1 ? prev + 1 : prev); }, 8000);
    return () => clearInterval(interval);
  }, [loading]);

  // Auth check + load empresa data from Supabase
  useEffect(() => {
    const s = localStorage.getItem('complyUser');
    if (s) {
      const u = JSON.parse(s);
      if (u.loggedIn) {
        setUser(u);
        loadEmpresaData(u.email);
      } else { router.push('/login'); }
    } else { router.push('/login'); }
  }, [router]);

  // Load empresa and document history from Supabase
  async function loadEmpresaData(email: string) {
    setLoadingData(true);
    try {
      const { data: empresas } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false })
        .limit(1);

      if (empresas && empresas.length > 0) {
        setEmpresaGuardada(empresas[0]);
        const { data: docs } = await supabase
          .from('documentos')
          .select('*')
          .eq('empresa_id', empresas[0].id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (docs) setHistorialDocumentos(docs);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  }

  // Save empresa to Supabase
  async function saveEmpresa(data: any, email: string) {
    try {
      // Check if empresa already exists for this user
      const { data: existing } = await supabase
        .from('empresas')
        .select('id')
        .eq('user_email', email)
        .eq('nit', data.nit)
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing
        const { data: updated } = await supabase
          .from('empresas')
          .update({
            razon_social: data.empresa,
            razon_social_corto: data.empresaCorto || data.empresa,
            representante_legal: data.representante,
            tipo_sociedad: data.tipoSociedad,
            cedula_rep_legal: data.cedulaRep,
            ciudad: data.ciudad,
            sector_nombre: data.sectorNombre,
            codigo_ciiu: data.codigoCiiu,
            perfil_riesgo: data.perfilRiesgo,
          })
          .eq('id', existing[0].id)
          .select()
          .single();
        if (updated) setEmpresaGuardada(updated);
        return existing[0].id;
      } else {
        // Insert new
        const { data: inserted } = await supabase
          .from('empresas')
          .insert({
            user_email: email,
            razon_social: data.empresa,
            razon_social_corto: data.empresaCorto || data.empresa,
            nit: data.nit,
            representante_legal: data.representante,
            tipo_sociedad: data.tipoSociedad || '',
            cedula_rep_legal: data.cedulaRep || '',
            ciudad: data.ciudad || '',
            sector_nombre: data.sectorNombre || '',
            codigo_ciiu: data.codigoCiiu || '',
            perfil_riesgo: data.perfilRiesgo || 'MEDIO',
          })
          .select()
          .single();
        if (inserted) setEmpresaGuardada(inserted);
        return inserted?.id;
      }
    } catch (err) {
      console.error('Error saving empresa:', err);
      return null;
    }
  }

  // Save document to Supabase
  async function saveDocumento(empresaId: string, tipo: string, nombre: string, base64: string) {
    try {
      const { data } = await supabase
        .from('documentos')
        .insert({ empresa_id: empresaId, tipo, nombre_archivo: nombre, base64 })
        .select()
        .single();
      if (data) setHistorialDocumentos(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error saving documento:', err);
      return null;
    }
  }

  // Log activity
  async function logActivity(empresaId: string, email: string, accion: string, detalle?: string) {
    try {
      await supabase.from('actividad').insert({ empresa_id: empresaId, user_email: email, accion, detalle });
    } catch (err) { console.error('Error logging activity:', err); }
  }

  const handleLogout = () => { localStorage.removeItem('complyUser'); router.push('/login'); };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.type !== 'application/pdf') { setError('Solo archivos PDF'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Máximo 10MB'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = () => { const b = (reader.result as string).split(',')[1]; setFormData(p => ({ ...p, certificadoBase64: b, certificadoNombre: file.name })); };
    reader.readAsDataURL(file);
  };
  const handleCanalesChange = (c: string) => { setFormData(p => ({ ...p, canales: p.canales.includes(c) ? p.canales.filter(x => x !== c) : [...p.canales, c] })); };

  const handleSubmit = async () => {
    if (!formData.certificadoBase64) { setError('Sube el Certificado de Cámara de Comercio'); return; }
    if (!formData.manejaEfectivo) { setError('Indica si manejas efectivo'); return; }
    if (!formData.operaExtranjeros) { setError('Indica si operas con extranjeros'); return; }
    if (formData.canales.length === 0) { setError('Selecciona al menos un canal'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('https://defiendetetu.app.n8n.cloud/webhook/generar-documentos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificadoBase64: formData.certificadoBase64, manejaEfectivo: formData.manejaEfectivo, operaExtranjeros: formData.operaExtranjeros, canales: formData.canales.join(', '), tieneOficialCumplimiento: formData.tieneOficialCumplimiento || 'no', realizaDebidaDiligencia: formData.realizaDebidaDiligencia || 'no', consultaListasRestrictivas: formData.consultaListasRestrictivas || 'no', tieneProcedimientoROS: formData.tieneProcedimientoROS || 'no', capacitaPersonal: formData.capacitaPersonal || 'no' }),
      });
      const t = await r.text(); let d; try { d = JSON.parse(t); } catch { throw new Error('Error al procesar respuesta'); }
      if (d.success) {
        setDocumentosGenerados({ manualBase64: d.documentos?.manual?.base64||'', manualNombre: d.documentos?.manual?.nombre||'Manual.docx', matrizBase64: d.documentos?.matriz?.base64||'', matrizNombre: d.documentos?.matriz?.nombre||'Matriz.xlsx', fccBase64: d.documentos?.fcc?.base64||'', fccNombre: d.documentos?.fcc?.nombre||'FCC.xlsx', empresa: d.empresa||'', nit: d.nit||'', representante: d.representante||'' });

        // Save to Supabase
        if (user) {
          const empresaId = await saveEmpresa({
            empresa: d.empresa, nit: d.nit, representante: d.representante,
            empresaCorto: d.empresa, sectorNombre: d.documentos?.matriz?.sector || '',
            codigoCiiu: d.documentos?.matriz?.ciiu || '', perfilRiesgo: d.documentos?.matriz?.perfil || 'MEDIO',
          }, user.email);

          if (empresaId) {
            if (d.documentos?.manual?.base64) await saveDocumento(empresaId, 'manual', d.documentos.manual.nombre, d.documentos.manual.base64);
            if (d.documentos?.matriz?.base64) await saveDocumento(empresaId, 'matriz', d.documentos.matriz.nombre, d.documentos.matriz.base64);
            if (d.documentos?.fcc?.base64) await saveDocumento(empresaId, 'fcc', d.documentos.fcc.nombre, d.documentos.fcc.base64);
            await logActivity(empresaId, user.email, 'generar_documentos', `Manual + Matriz + FCC generados para ${d.empresa}`);
          }
        }
        setStep(3);
      } else { setError(d.error || 'Error al generar documentos'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Error de conexión'); } finally { setLoading(false); }
  };

  const dl = (b64: string, fn: string, mime: string) => { const bc = atob(b64); const bn = new Array(bc.length); for (let i=0;i<bc.length;i++) bn[i]=bc.charCodeAt(i); const blob = new Blob([new Uint8Array(bn)],{type:mime}); const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download=fn; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); };

  const getMimeForType = (tipo: string) => tipo === 'manual' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const getDocLabel = (tipo: string) => ({ manual: 'Manual de Medidas Mínimas', matriz: 'Matriz de Riesgo', fcc: 'Formulario FCC', fer: 'Evaluación de Riesgos', reporte_eventos: 'Reporte de Eventos', declaracion_trabajadores: 'Declaración Trabajadores', listas_restrictivas: 'Listas Restrictivas' }[tipo] || tipo);
  const getDocColor = (tipo: string) => ({ manual: '#6366F1', matriz: '#10B981', fcc: '#8B5CF6', fer: '#F59E0B', reporte_eventos: '#EF4444' }[tipo] || '#6366F1');
  const getDocExt = (tipo: string) => tipo === 'manual' ? 'DOCX' : 'XLSX';

  if (!user) return null;

  const nav = [
    { id: 'home' as ActiveView, label: 'Inicio', svg: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'documentos' as ActiveView, label: 'Documentos', svg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'contrapartes' as ActiveView, label: 'Contrapartes', svg: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', badge: 'Próximo', disabled: true },
    { id: 'agentes' as ActiveView, label: 'AI Agents', svg: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', badge: 'Nuevo' },
    { id: 'matriz' as ActiveView, label: 'Matriz', svg: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7', badge: 'Próximo', disabled: true },
    { id: 'reportes' as ActiveView, label: 'Reportes', svg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', badge: 'Próximo', disabled: true },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#09090B' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Outfit', system-ui, sans-serif; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); }
        .card-lift { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); }
        .card-lift:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .fu { animation: fadeUp 0.8s ease-out forwards; }
        .fu1 { animation-delay: 0.1s; opacity: 0; }
        .fu2 { animation-delay: 0.2s; opacity: 0; }
        .fu3 { animation-delay: 0.3s; opacity: 0; }
        .fu4 { animation-delay: 0.4s; opacity: 0; }
        .float { animation: float 4s ease-in-out infinite; }
        .mesh-bg { background: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.06) 0%, transparent 50%); }
        .active-nav { background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1)) !important; border-left: 2px solid #818CF8; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .badge-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
      `}</style>

      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-[72px]'} transition-all duration-300 flex flex-col border-r`} style={{ background: '#0C0C0F', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className={`p-4 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} h-16`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs" style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}>C</div>
              <div><div className="text-white font-bold text-[15px] tracking-tight">Comply</div><div className="text-[10px] font-medium tracking-widest" style={{ color: '#525264' }}>SAGRILAFT</div></div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs" style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}>C</div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="#525264" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} /></svg>
          </button>
        </div>
        <nav className="flex-1 px-2 mt-2 space-y-0.5">
          {nav.map(item => (
            <button key={item.id} onClick={() => !(item as any).disabled && setActiveView(item.id)} disabled={(item as any).disabled}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${activeView === item.id ? 'active-nav' : 'hover:bg-white/[0.03]'} ${(item as any).disabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
              <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke={activeView === item.id ? '#A5B4FC' : '#525264'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.svg} /></svg>
              {sidebarOpen && <>
                <span className="text-[13px] flex-1" style={{ color: activeView === item.id ? '#E0E7FF' : '#71717A' }}>{item.label}</span>
                {(item as any).badge && <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${(item as any).badge === 'Nuevo' ? 'text-white badge-pulse' : ''}`} style={(item as any).badge === 'Nuevo' ? { background: 'linear-gradient(135deg, #6366F1, #A855F7)' } : { background: 'rgba(255,255,255,0.05)', color: '#525264' }}>{(item as any).badge}</span>}
              </>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className={`flex items-center ${sidebarOpen ? 'gap-2.5' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #334155, #475569)' }}>{user.email[0].toUpperCase()}</div>
            {sidebarOpen && <div className="flex-1 min-w-0"><div className="text-[12px] text-white/70 truncate">{empresaGuardada?.razon_social || user.empresa || user.email}</div><button onClick={handleLogout} className="text-[11px] text-white/30 hover:text-red-400">Salir</button></div>}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto scrollbar-hide mesh-bg" style={{ background: '#FAFAFA' }}>
        <header className="sticky top-0 z-20 px-8 h-16 flex items-center justify-between" style={{ background: 'rgba(250,250,250,0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#0F172A' }}>
              {activeView === 'home' && 'Panel de Control'}{activeView === 'documentos' && 'Generar Documentos'}{activeView === 'agentes' && 'AI Agents'}
            </h1>
          </div>
          <button onClick={() => { setActiveView('documentos'); setStep(empresaGuardada ? 2 : 1); }} className="px-4 py-2 rounded-full text-[13px] font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>+ Nuevo Análisis</button>
        </header>

        <div className="p-8">
          {/* ======== HOME ======== */}
          {activeView === 'home' && mounted && (
            <div>
              {/* Hero with empresa info if exists */}
              <div className="fu fu1 rounded-2xl p-8 mb-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 40%, #312E81 100%)' }}>
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #818CF8, transparent 70%)', filter: 'blur(60px)' }}></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="max-w-lg">
                    {empresaGuardada ? (
                      <>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 inline-block px-3 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.2)', color: '#6EE7B7' }}>EMPRESA REGISTRADA</span>
                        <h2 className="text-2xl font-extrabold text-white mt-2">{empresaGuardada.razon_social}</h2>
                        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>NIT: {empresaGuardada.nit} — {empresaGuardada.sector_nombre || 'Sector general'} — Perfil: {empresaGuardada.perfil_riesgo || 'MEDIO'}</p>
                        <p className="text-xs mt-2" style={{ color: '#64748B' }}>Rep. Legal: {empresaGuardada.representante_legal} — {empresaGuardada.ciudad}</p>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 inline-block px-3 py-1 rounded-full" style={{ background: 'rgba(129,140,248,0.2)', color: '#A5B4FC' }}>PLATAFORMA COMPLY</span>
                        <h2 className="text-2xl font-extrabold text-white mt-2">Bienvenido a Comply</h2>
                        <p className="text-sm mt-2" style={{ color: '#94A3B8' }}>Sube tu Certificado de Cámara de Comercio para comenzar. Tu información se guardará para futuras sesiones.</p>
                      </>
                    )}
                  </div>
                  <div className="hidden lg:flex items-center gap-8">
                    <div className="text-center"><div className="text-3xl font-black" style={{ color: '#818CF8' }}>{historialDocumentos.length || 0}</div><div className="text-[11px]" style={{ color: '#64748B' }}>Documentos</div></div>
                    <div className="text-center"><div className="text-3xl font-black" style={{ color: '#A78BFA' }}>6</div><div className="text-[11px]" style={{ color: '#64748B' }}>Sectores</div></div>
                    <div className="text-center"><div className="text-3xl font-black" style={{ color: '#C084FC' }}>IA</div><div className="text-[11px]" style={{ color: '#64748B' }}>Agents</div></div>
                  </div>
                </div>
              </div>

              {/* Document History */}
              {historialDocumentos.length > 0 && (
                <div className="mb-8 fu fu2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: '#A1A1AA' }}>Documentos recientes</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {historialDocumentos.slice(0, 6).map((doc) => (
                      <div key={doc.id} className="card-lift p-4 rounded-xl flex items-center gap-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0" style={{ background: getDocColor(doc.tipo) }}>{getDocExt(doc.tipo)[0]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[12px] truncate" style={{ color: '#18181B' }}>{getDocLabel(doc.tipo)}</div>
                          <div className="text-[10px]" style={{ color: '#A1A1AA' }}>{new Date(doc.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <button onClick={() => dl(doc.base64, doc.nombre_archivo, getMimeForType(doc.tipo))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" title="Descargar">
                          <svg className="w-4 h-4" fill="none" stroke="#6366F1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: '#A1A1AA' }}>Acciones Rápidas</h3>
              <div className="grid md:grid-cols-3 gap-5 mb-10 fu fu3">
                {[
                  { title: 'Generar Documentos', desc: empresaGuardada ? 'Genera nuevos documentos con tus datos guardados' : 'Sube tu Cámara de Comercio para comenzar', icon: '📋', view: 'documentos' as ActiveView, active: true },
                  { title: 'Consultar Contrapartes', desc: 'Verifica antecedentes, listas restrictivas y PEPs', icon: '🔍', view: 'contrapartes' as ActiveView, badge: 'Próximamente' },
                  { title: 'AI Agents', desc: 'Agentes autónomos que protegen tu empresa 24/7', icon: '🤖', view: 'agentes' as ActiveView, badge: 'Nuevo', active: true },
                ].map((card, i) => (
                  <div key={i} onClick={() => card.active && setActiveView(card.view)} className={`card-lift rounded-2xl p-6 relative overflow-hidden ${card.active ? 'cursor-pointer' : ''}`} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
                    {card.badge && <span className={`absolute top-4 right-4 text-[9px] px-2 py-0.5 rounded-full font-bold ${card.badge === 'Nuevo' ? 'text-white badge-pulse' : ''}`} style={card.badge === 'Nuevo' ? { background: 'linear-gradient(135deg, #6366F1, #A855F7)' } : { background: '#F1F5F9', color: '#94A3B8' }}>{card.badge}</span>}
                    <div className="text-2xl mb-3">{card.icon}</div>
                    <h3 className="font-bold text-[15px] mb-1" style={{ color: '#18181B' }}>{card.title}</h3>
                    <p className="text-[13px]" style={{ color: '#71717A' }}>{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* Modules */}
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4 fu fu4" style={{ color: '#A1A1AA' }}>Módulos</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 fu fu4">
                {[
                  { name: 'Documentos', sub: 'Manual, Matriz, FCC y formatos', icon: '📄', active: true, color: '#6366F1' },
                  { name: 'Contrapartes', sub: 'KYC, debida diligencia, screening', icon: '👥', active: false, color: '#F59E0B' },
                  { name: 'Monitoreo', sub: 'Alertas automáticas continuas', icon: '📡', active: false, color: '#10B981' },
                  { name: 'Reportes', sub: 'Informes regulatorios y gestión', icon: '📊', active: false, color: '#EF4444' },
                ].map((m, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: '#fff', border: `1px solid ${m.active ? m.color + '30' : 'rgba(0,0,0,0.05)'}` }}>
                    <div className="flex items-center justify-between mb-2"><span className="text-xl">{m.icon}</span><span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={m.active ? { background: m.color, color: '#fff' } : { background: '#F4F4F5', color: '#A1A1AA' }}>{m.active ? 'Activo' : 'Próximo'}</span></div>
                    <div className="font-semibold text-[13px]" style={{ color: '#18181B' }}>{m.name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: '#A1A1AA' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======== AI AGENTS ======== */}
          {activeView === 'agentes' && (
            <div>
              <div className="rounded-2xl p-8 mb-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)' }}>
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #A855F7, transparent)', filter: 'blur(60px)' }}></div>
                <div className="relative z-10 max-w-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full inline-block mb-4" style={{ background: 'rgba(168,85,247,0.2)', color: '#C4B5FD' }}>COMPLY AI</span>
                  <h2 className="text-3xl font-extrabold text-white leading-tight">Agentes de IA<br/>especializados en <span style={{ color: '#C4B5FD' }}>compliance</span></h2>
                  <p className="text-sm mt-3" style={{ color: '#94A3B8' }}>Copilotos autónomos que trabajan 24/7 automatizando screening, monitoreo y reportes.</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: 'Vigía', role: 'Screening Agent', desc: 'Cruza contrapartes contra 300+ listas restrictivas. OFAC, ONU, Procuraduría y PEPs.', features: ['Cruce contra 300+ listas', 'Alertas instantáneas', 'Reportes de debida diligencia'], gradient: 'linear-gradient(135deg, #6366F1, #818CF8)' },
                  { name: 'Centinela', role: 'Monitoring Agent', desc: 'Monitoreo continuo. Detecta operaciones inusuales y evalúa riesgos dinámicamente.', features: ['Monitoreo transaccional', 'Detección de anomalías', 'Evaluación dinámica de riesgo'], gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)' },
                  { name: 'Cumplidor', role: 'Compliance Agent', desc: 'Genera reportes regulatorios y gestiona el calendario de obligaciones.', features: ['Reportes automáticos', 'Calendario regulatorio', 'Actualización periódica KYC'], gradient: 'linear-gradient(135deg, #10B981, #34D399)' },
                ].map((agent, i) => (
                  <div key={i} className="card-lift rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="h-1.5" style={{ background: agent.gradient }}></div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-1"><h3 className="text-xl font-extrabold" style={{ color: '#18181B' }}>{agent.name}</h3><span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-white" style={{ background: agent.gradient }}>NUEVO</span></div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: '#A1A1AA' }}>{agent.role}</div>
                      <p className="text-[13px] leading-relaxed mb-5" style={{ color: '#71717A' }}>{agent.desc}</p>
                      <div className="space-y-2.5">{agent.features.map((f, j) => (<div key={j} className="flex items-start gap-2.5 text-[12px]" style={{ color: '#3F3F46' }}><div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 mt-0.5" style={{ background: agent.gradient }}>{j+1}</div>{f}</div>))}</div>
                    </div>
                    <div className="px-6 py-4" style={{ background: '#FAFAFA', borderTop: '1px solid rgba(0,0,0,0.04)' }}><button className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: agent.gradient }}>Próximamente</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======== DOCUMENTOS ======== */}
          {activeView === 'documentos' && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-center mb-8 gap-2">
                {[{ n: 1, l: 'Subir' }, { n: 2, l: 'Información' }, { n: 3, l: 'Descargar' }].map((s, i) => (
                  <div key={s.n} className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold ${step >= s.n ? 'text-white' : ''}`} style={step >= s.n ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' } : { background: '#F4F4F5', color: '#A1A1AA' }}>{step > s.n ? '✓' : s.n}</div>
                    <span className="text-[12px] font-medium" style={{ color: step >= s.n ? '#6366F1' : '#A1A1AA' }}>{s.l}</span>
                    {i < 2 && <div className="w-12 h-px" style={{ background: step > s.n ? '#6366F1' : '#E4E4E7' }}></div>}
                  </div>
                ))}
              </div>

              {/* Step 1 — Skip if empresa exists */}
              {step === 1 && (
                <div className="rounded-2xl p-8" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>
                  {empresaGuardada ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4 p-4 rounded-xl" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                        <span className="text-2xl">✅</span>
                        <div>
                          <div className="font-bold text-[14px]" style={{ color: '#4338CA' }}>{empresaGuardada.razon_social}</div>
                          <div className="text-[12px]" style={{ color: '#6366F1' }}>NIT: {empresaGuardada.nit} — Datos guardados</div>
                        </div>
                      </div>
                      <p className="text-[13px] mb-4" style={{ color: '#71717A' }}>Tus datos ya están guardados. Puedes generar nuevos documentos directamente o subir un certificado actualizado.</p>
                      <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>Generar con datos guardados →</button>
                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-3 rounded-xl text-[13px] font-semibold" style={{ border: '1px solid #E4E4E7', color: '#71717A' }}>Actualizar certificado</button>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-xl font-bold mb-1" style={{ color: '#18181B' }}>Sube tu Certificado de Cámara de Comercio</h2>
                      <p className="text-[13px] mb-6" style={{ color: '#71717A' }}>Nuestra IA generará documentos personalizados. Tus datos se guardarán para futuras sesiones.</p>
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all hover:border-indigo-300" style={{ borderColor: formData.certificadoBase64 ? '#6366F1' : '#E4E4E7', background: formData.certificadoBase64 ? '#EEF2FF' : '#FAFAFA' }}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                        <div className="text-4xl mb-3">{formData.certificadoBase64 ? '✅' : '📎'}</div>
                        {formData.certificadoBase64 ? <><p className="font-bold" style={{ color: '#6366F1' }}>{formData.certificadoNombre}</p><p className="text-[12px] mt-1" style={{ color: '#A1A1AA' }}>Clic para cambiar</p></> : <><p className="font-semibold" style={{ color: '#3F3F46' }}>Arrastra o haz clic para subir</p><p className="text-[12px] mt-1" style={{ color: '#A1A1AA' }}>PDF — Máximo 10MB</p></>}
                      </div>
                      {formData.certificadoBase64 && <button onClick={() => setStep(2)} className="w-full mt-6 py-3 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>Continuar →</button>}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="rounded-2xl p-8" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <h2 className="text-xl font-bold mb-6" style={{ color: '#18181B' }}>Información Adicional</h2>
                  {[{ key: 'manejaEfectivo', q: '¿Tu empresa maneja efectivo?' }, { key: 'operaExtranjeros', q: '¿Opera con extranjeros?' }].map(q => (
                    <div key={q.key} className="mb-5"><label className="text-[13px] font-semibold block mb-2" style={{ color: '#3F3F46' }}>{q.q}</label><div className="flex gap-2">{['Sí', 'No'].map(o => (<button key={o} onClick={() => setFormData(p => ({ ...p, [q.key]: o.toLowerCase() }))} className="px-5 py-2 rounded-lg text-[13px] font-medium border transition-all" style={(formData as any)[q.key] === o.toLowerCase() ? { background: '#EEF2FF', borderColor: '#6366F1', color: '#4338CA' } : { borderColor: '#E4E4E7', color: '#71717A' }}>{o}</button>))}</div></div>
                  ))}
                  <div className="mb-5"><label className="text-[13px] font-semibold block mb-2" style={{ color: '#3F3F46' }}>Canales de operación</label><div className="flex flex-wrap gap-2">{['Presencial', 'Virtual', 'Telefónico', 'Mixto'].map(c => (<button key={c} onClick={() => handleCanalesChange(c.toLowerCase())} className="px-4 py-2 rounded-lg text-[13px] font-medium border transition-all" style={formData.canales.includes(c.toLowerCase()) ? { background: '#EEF2FF', borderColor: '#6366F1', color: '#4338CA' } : { borderColor: '#E4E4E7', color: '#71717A' }}>{c}</button>))}</div></div>

                  <div className="mt-6 p-5 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <h3 className="text-[13px] font-bold mb-3" style={{ color: '#3F3F46' }}>Estado de cumplimiento</h3>
                    {[{ key: 'tieneOficialCumplimiento', q: '¿Oficial de cumplimiento?' },{ key: 'realizaDebidaDiligencia', q: '¿Debida diligencia?' },{ key: 'consultaListasRestrictivas', q: '¿Consulta listas restrictivas?' },{ key: 'tieneProcedimientoROS', q: '¿Procedimiento para ROS?' },{ key: 'capacitaPersonal', q: '¿Capacita personal en LA/FT?' }].map(q => (
                      <div key={q.key} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#F4F4F5' }}><span className="text-[12px]" style={{ color: '#52525B' }}>{q.q}</span><div className="flex gap-1.5">{['Sí', 'En proceso', 'No'].map(o => (<button key={o} onClick={() => setFormData(p => ({ ...p, [q.key]: o.toLowerCase() }))} className="px-2.5 py-1 rounded text-[10px] font-semibold transition-all" style={(formData as any)[q.key] === o.toLowerCase() ? { background: o === 'Sí' ? '#10B981' : o === 'En proceso' ? '#F59E0B' : '#EF4444', color: '#fff' } : { background: '#F4F4F5', color: '#A1A1AA' }}>{o}</button>))}</div></div>
                    ))}
                  </div>

                  {error && <div className="mt-4 p-3 rounded-lg text-[13px] text-red-700" style={{ background: '#FEF2F2' }}>{error}</div>}

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl text-[13px] font-semibold" style={{ border: '1px solid #E4E4E7', color: '#71717A' }}>← Atrás</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-xl text-white font-bold text-[14px] disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>{loading ? 'Generando...' : 'Generar Documentos'}</button>
                  </div>

                  {loading && (
                    <div className="mt-8 p-6 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.04)' }}>
                      <div className="text-center">
                        <div className="text-4xl mb-3 float">{loadingMessages[loadingStep]?.icon}</div>
                        <h3 className="text-[15px] font-bold mb-1" style={{ color: '#18181B' }}>{loadingMessages[loadingStep]?.text}</h3>
                        <p className="text-[12px] mb-4" style={{ color: '#6366F1' }}>{loadingMessages[loadingStep]?.sub}</p>
                        <div className="max-w-xs mx-auto"><div className="flex justify-between text-[10px] mb-1" style={{ color: '#A1A1AA' }}><span>Progreso</span><span>{Math.round(((loadingStep+1)/loadingMessages.length)*100)}%</span></div><div className="w-full rounded-full h-1.5" style={{ background: '#E4E4E7' }}><div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${((loadingStep+1)/loadingMessages.length)*100}%`, background: 'linear-gradient(90deg, #6366F1, #A855F7)' }}></div></div></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && documentosGenerados && (
                <div>
                  <div className="p-6 rounded-2xl mb-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
                    <div className="relative z-10 flex items-center gap-4"><div className="text-4xl float">🎉</div><div><h2 className="text-xl font-extrabold text-white">¡Documentos listos!</h2><p className="text-green-100 text-[13px] mt-0.5">{documentosGenerados.empresa} — NIT: {documentosGenerados.nit}</p><p className="text-green-200 text-[11px] mt-1">Guardados en tu historial — siempre disponibles para descargar</p></div></div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {[
                      { name: 'Manual de Medidas Mínimas', type: 'DOCX', color: '#6366F1', fn: () => dl(documentosGenerados.manualBase64, documentosGenerados.manualNombre, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') },
                      { name: 'Matriz de Riesgo', type: 'XLSX', color: '#10B981', fn: () => dl(documentosGenerados.matrizBase64, documentosGenerados.matrizNombre, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') },
                      { name: 'Formulario FCC', type: 'XLSX', color: '#8B5CF6', fn: () => dl(documentosGenerados.fccBase64, documentosGenerados.fccNombre, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') },
                    ].map((doc, i) => (
                      <div key={i} className="card-lift rounded-2xl p-5" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <div className="flex items-center justify-between mb-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[11px] font-black" style={{ background: doc.color }}>{doc.type[0]}</div><span className="text-[9px] px-2 py-0.5 rounded font-bold" style={{ background: doc.color + '15', color: doc.color }}>{doc.type}</span></div>
                        <h4 className="font-bold text-[13px] mb-3" style={{ color: '#18181B' }}>{doc.name}</h4>
                        <button onClick={doc.fn} className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white hover:opacity-90" style={{ background: doc.color }}>↓ Descargar</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setActiveView('home'); setDocumentosGenerados(null); if (user) loadEmpresaData(user.email); }} className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>Ver Panel de Control →</button>
                    <button onClick={() => { setStep(2); setDocumentosGenerados(null); }} className="px-6 py-3 rounded-xl text-[13px] font-semibold" style={{ border: '1px solid #E4E4E7', color: '#71717A' }}>Regenerar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
