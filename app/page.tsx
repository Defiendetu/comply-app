'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [activeModule, setActiveModule] = useState(0);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const interval = setInterval(() => { setActiveModule(p => (p + 1) % 4); }, 4000);
    return () => clearInterval(interval);
  }, []);

  const modules = [
    { name: 'Generación Documental', desc: 'Manual de Medidas Mínimas, Matriz de Riesgo y FCC generados automáticamente desde tu Cámara de Comercio.', features: ['Análisis de riesgos por sector con IA', 'Señales de alerta con referencia GAFI/UIAF', 'Criterios de valoración basados en DAFP'], icon: '📋', color: '#6366F1' },
    { name: 'Screening de Listas', desc: 'Cruce automático contra listas restrictivas nacionales e internacionales. OFAC, ONU, Procuraduría, Contraloría y PEPs.', features: ['Consulta de 300+ fuentes en segundos', 'Alertas por coincidencias en tiempo real', 'Integración con Tusdatos y Apitude'], icon: '🔍', color: '#F59E0B' },
    { name: 'Monitoreo Continuo', desc: 'Vigilancia permanente de tus contrapartes con alertas automáticas cuando cambian las condiciones de riesgo.', features: ['Recálculo periódico de riesgos', 'Notificaciones por cambios en listas', 'Dashboard de estado en tiempo real'], icon: '📡', color: '#10B981' },
    { name: 'Reportes Regulatorios', desc: 'Generación automática de informes de gestión, reportes de operaciones y certificaciones para la Superintendencia.', features: ['Informe de Gestión Anual automático', 'Calendario de obligaciones regulatorias', 'Exportación en formatos oficiales'], icon: '📊', color: '#EF4444' },
  ];

  return (
    <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", background: '#FAFAFA' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Outfit', system-ui, sans-serif; }
        .hero-mesh { background: radial-gradient(ellipse at 30% 30%, rgba(99,102,241,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(168,85,247,0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(236,72,153,0.05) 0%, transparent 50%); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 30px rgba(99,102,241,0.2); } 50% { box-shadow: 0 0 60px rgba(99,102,241,0.4); } }
        .fu { animation: fadeUp 0.8s ease-out forwards; }
        .fu1 { animation-delay: 0.1s; opacity: 0; }
        .fu2 { animation-delay: 0.2s; opacity: 0; }
        .fu3 { animation-delay: 0.3s; opacity: 0; }
        .fu4 { animation-delay: 0.4s; opacity: 0; }
        .fu5 { animation-delay: 0.5s; opacity: 0; }
        .float { animation: float 4s ease-in-out infinite; }
        .card-lift { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); }
        .card-lift:hover { transform: translateY(-6px); box-shadow: 0 25px 60px rgba(0,0,0,0.12); }
        .gradient-border { position: relative; }
        .gradient-border::after { content: ''; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; background: linear-gradient(135deg, rgba(99,102,241,0.4), rgba(168,85,247,0.4), rgba(236,72,153,0.2)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
        .nav-glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px) saturate(180%); }
        .dark-section { background: linear-gradient(180deg, #0F172A 0%, #1E1B4B 100%); }
        .stat-glow { animation: glow-pulse 3s ease-in-out infinite; }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-glass" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs" style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}>C</div>
            <span className="text-lg font-bold" style={{ color: '#18181B' }}>Comply</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#modulos" className="text-[13px] font-medium" style={{ color: '#71717A' }}>Módulos</a>
            <a href="#agentes" className="text-[13px] font-medium" style={{ color: '#71717A' }}>AI Agents</a>
            <a href="#sectores" className="text-[13px] font-medium" style={{ color: '#71717A' }}>Sectores</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px] font-medium" style={{ color: '#71717A' }}>Iniciar sesión</Link>
            <Link href="/solicitar" className="px-4 py-2 rounded-full text-[13px] font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>Solicitar acceso</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 overflow-hidden hero-mesh">
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', filter: 'blur(80px)' }}></div>
        <div className="absolute bottom-0 left-10 w-[400px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)', filter: 'blur(60px)' }}></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {mounted && <>
              <div className="fu fu1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: '#6366F1' }}></span>
                <span className="text-[12px] font-semibold" style={{ color: '#6366F1' }}>Plataforma de cumplimiento con IA</span>
              </div>

              <h1 className="fu fu2 text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6" style={{ color: '#09090B' }}>
                Cumplimiento<br/>
                <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sin fricciones</span>
              </h1>

              <p className="fu fu3 text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#52525B' }}>
                La plataforma que automatiza tu cumplimiento LA/FT/FPADM.
                Genera documentos regulatorios, monitorea contrapartes y protege tu empresa
                con agentes de inteligencia artificial.
              </p>

              <div className="fu fu4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link href="/solicitar" className="px-8 py-4 rounded-2xl text-[15px] font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 8px 30px rgba(99,102,241,0.3)' }}>
                  Solicitar acceso gratuito →
                </Link>
                <a href="#modulos" className="px-8 py-4 rounded-2xl text-[15px] font-semibold transition-all hover:bg-gray-50" style={{ color: '#3F3F46', border: '1px solid #E4E4E7' }}>
                  Ver módulos
                </a>
              </div>

              <div className="fu fu5 flex flex-wrap items-center justify-center gap-8 text-[13px]" style={{ color: '#A1A1AA' }}>
                {['Capítulo X Circular Básica Jurídica', 'Resolución 100-006322 de 2023', 'Metodología DAFP'].map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="#10B981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </>}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="dark-section py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { n: '3', l: 'Documentos generados', s: 'Manual + Matriz + FCC' },
              { n: '6', l: 'Sectores APNFD', s: 'Inmobiliario, Jurídico, Contable...' },
              { n: '300+', l: 'Fuentes consultadas', s: 'OFAC, ONU, GAFI, UIAF...' },
              { n: 'IA', l: 'Agentes autónomos', s: 'Vigía, Centinela, Cumplidor' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl lg:text-5xl font-black mb-2" style={{ color: '#A5B4FC' }}>{s.n}</div>
                <div className="text-[14px] font-semibold text-white mb-1">{s.l}</div>
                <div className="text-[11px]" style={{ color: '#64748B' }}>{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES — Interactive carousel like Complif */}
      <section id="modulos" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#A1A1AA' }}>Descubre cómo</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-extrabold text-center mb-3 leading-tight" style={{ color: '#09090B' }}>
            Automatizamos el <span style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ciclo completo</span><br/>del cumplimiento
          </h2>
          <p className="text-center text-[15px] mb-12 max-w-xl mx-auto" style={{ color: '#71717A' }}>De la generación documental al monitoreo continuo</p>

          {/* Module tabs */}
          <div className="flex items-center justify-center gap-3 mb-12 flex-wrap">
            {modules.map((m, i) => (
              <button key={i} onClick={() => setActiveModule(i)}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all"
                style={activeModule === i ? { background: m.color, color: '#fff', boxShadow: `0 4px 20px ${m.color}40` } : { background: '#F4F4F5', color: '#71717A' }}>
                {m.name}
              </button>
            ))}
          </div>

          {/* Active module content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <div className="text-4xl mb-4">{modules[activeModule].icon}</div>
              <h3 className="text-2xl font-extrabold mb-3" style={{ color: '#18181B' }}>{modules[activeModule].name}</h3>
              <div className="w-12 h-1 rounded-full mb-4" style={{ background: modules[activeModule].color }}></div>
              <p className="text-[15px] leading-relaxed mb-6" style={{ color: '#52525B' }}>{modules[activeModule].desc}</p>
              <div className="space-y-3">
                {modules[activeModule].features.map((f, j) => (
                  <div key={j} className="flex items-center gap-3 text-[14px]" style={{ color: '#3F3F46' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0" style={{ background: modules[activeModule].color }}>
                      {String(j + 1).padStart(2, '0')}
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/solicitar" className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl text-[13px] font-bold text-white" style={{ background: modules[activeModule].color }}>
                Solicitar acceso →
              </Link>
            </div>
            <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: '#F4F4F5', minHeight: '320px' }}>
              <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 50% 50%, ${modules[activeModule].color}, transparent 70%)` }}></div>
              <div className="relative z-10 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <div className="w-10 h-10 rounded-lg" style={{ background: modules[activeModule].color + '15' }}></div>
                    <div className="flex-1">
                      <div className="h-3 rounded-full mb-2" style={{ background: '#E4E4E7', width: `${70 + i * 5}%` }}></div>
                      <div className="h-2 rounded-full" style={{ background: '#F4F4F5', width: `${40 + i * 10}%` }}></div>
                    </div>
                    <div className="w-16 h-6 rounded-full" style={{ background: modules[activeModule].color + '20' }}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI AGENTS */}
      <section id="agentes" className="py-24 lg:py-32 dark-section relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #A855F7, transparent)', filter: 'blur(100px)' }}></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4 inline-block" style={{ color: '#818CF8' }}>COMPLY AI</span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Suma nuestros<br/>
              <span style={{ color: '#C4B5FD' }}>Agents de IA</span><br/>
              a tu equipo
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: '#94A3B8' }}>
              Agentes especializados que actúan como copilotos de cumplimiento,
              automatizando tareas repetitivas para que tu equipo se enfoque en
              las decisiones estratégicas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Vigía', role: 'Screening Agent', desc: 'Automatiza la investigación de contrapartes contra listas restrictivas. Cruza OFAC, ONU, Procuraduría y PEPs.', features: ['Cruce contra 300+ listas', 'Alertas instantáneas', 'Reportes de debida diligencia'], gradient: 'linear-gradient(135deg, #6366F1, #818CF8)', tag: '#6366F1' },
              { name: 'Centinela', role: 'Monitoring Agent', desc: 'Monitoreo continuo de operaciones y contrapartes. Detecta patrones inusuales y evalúa riesgos dinámicamente.', features: ['Monitoreo transaccional', 'Detección de anomalías', 'Evaluación dinámica de riesgo'], gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)', tag: '#F59E0B' },
              { name: 'Cumplidor', role: 'Compliance Agent', desc: 'Tu copiloto de cumplimiento normativo. Genera reportes regulatorios y gestiona el calendario de obligaciones.', features: ['Reportes automáticos', 'Calendario regulatorio', 'Actualización periódica KYC'], gradient: 'linear-gradient(135deg, #10B981, #34D399)', tag: '#10B981' },
            ].map((agent, i) => (
              <div key={i} className="card-lift rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-1.5" style={{ background: agent.gradient }}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-extrabold text-white">{agent.name}</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-white" style={{ background: agent.gradient }}>NUEVO</span>
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: '#525264' }}>{agent.role}</div>
                  <p className="text-[13px] leading-relaxed mb-6" style={{ color: '#94A3B8' }}>{agent.desc}</p>
                  <div className="space-y-2.5">
                    {agent.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2.5 text-[12px] text-white/70">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white flex-shrink-0" style={{ background: agent.gradient }}>{j + 1}</div>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTORS */}
      <section id="sectores" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3 inline-block" style={{ color: '#A1A1AA' }}>Sectores APNFD</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-3" style={{ color: '#09090B' }}>Personalizado para tu sector</h2>
            <p className="text-[15px] max-w-xl mx-auto" style={{ color: '#71717A' }}>Señales de alerta, controles y riesgos específicos adaptados a tu actividad económica</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Inmobiliario', icon: '🏢', desc: 'Agentes inmobiliarios, constructores' },
              { name: 'Jurídico', icon: '⚖️', desc: 'Abogados, notarías, servicios legales' },
              { name: 'Contable', icon: '📒', desc: 'Contadores, firmas de auditoría' },
              { name: 'Tecnología', icon: '💻', desc: 'Software, SaaS, servicios digitales' },
              { name: 'Comercio', icon: '🏪', desc: 'Comercio general, importadores' },
              { name: 'Otros', icon: '🏭', desc: 'Sector real, manufactura, servicios' },
            ].map((s, i) => (
              <div key={i} className="card-lift p-5 rounded-2xl text-center" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className="font-bold text-[13px] mb-1" style={{ color: '#18181B' }}>{s.name}</div>
                <div className="text-[11px]" style={{ color: '#A1A1AA' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 lg:py-32" style={{ background: '#F4F4F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3 inline-block" style={{ color: '#A1A1AA' }}>Así de simple</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold" style={{ color: '#09090B' }}>¿Cómo funciona?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Sube tu documento', desc: 'Carga el Certificado de Cámara de Comercio de tu empresa en formato PDF.' },
              { step: '02', title: 'La IA analiza', desc: 'Nuestra IA extrae datos, identifica tu sector APNFD y evalúa los riesgos específicos.' },
              { step: '03', title: 'Descarga todo', desc: 'Recibe tu Manual de Medidas Mínimas, Matriz de Riesgo y FCC personalizados.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-xl font-black text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}>{s.step}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#18181B' }}>{s.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: '#71717A' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="rounded-3xl p-12 lg:p-16 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)' }}>
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #818CF8, transparent)', filter: 'blur(60px)' }}></div>
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #A855F7, transparent)', filter: 'blur(40px)' }}></div>
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                Cumplimiento sin fricciones<br/>
                <span style={{ color: '#A5B4FC' }}>empieza aquí</span>
              </h2>
              <p className="text-[15px] mb-8 max-w-lg mx-auto" style={{ color: '#94A3B8' }}>
                Únete a las empresas que están automatizando su cumplimiento LA/FT/FPADM
                con inteligencia artificial.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/solicitar" className="px-8 py-4 rounded-2xl text-[15px] font-bold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 8px 30px rgba(99,102,241,0.3)' }}>
                  Solicitar acceso gratuito →
                </Link>
                <Link href="/login" className="px-8 py-4 rounded-2xl text-[15px] font-semibold transition-all" style={{ color: '#E0E7FF', border: '1px solid rgba(255,255,255,0.15)' }}>
                  Ya tengo cuenta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#09090B', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs" style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}>C</div>
                <span className="text-lg font-bold text-white">Comply</span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: '#525264' }}>
                Plataforma de cumplimiento LA/FT/FPADM impulsada por inteligencia artificial
                para empresas del sector real colombiano.
              </p>
            </div>
            {[
              { title: 'Módulos', items: ['Generación Documental', 'Screening de Listas', 'Monitoreo Continuo', 'Reportes Regulatorios'] },
              { title: 'AI Agents', items: ['Vigía — Screening', 'Centinela — Monitoreo', 'Cumplidor — Compliance'] },
              { title: 'Legal', items: ['Términos de Servicio', 'Política de Privacidad', 'Tratamiento de Datos'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: '#71717A' }}>{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.items.map((item, j) => (
                    <li key={j} className="text-[13px]" style={{ color: '#525264' }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 pt-8 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[12px]" style={{ color: '#3F3F46' }}>© 2026 Comply SAGRILAFT. Todos los derechos reservados.</div>
            <div className="text-[12px]" style={{ color: '#3F3F46' }}>Hecho en Colombia 🇨🇴</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
