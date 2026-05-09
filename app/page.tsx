'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [activeModule, setActiveModule] = useState(0);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const interval = setInterval(() => { setActiveModule(p => (p + 1) % 5); }, 3000);
    return () => clearInterval(interval);
  }, []);

  const modules = [
    { name: 'Generacion Documental', desc: 'Manual de Medidas Minimas, Matriz de Riesgo y FCC generados automaticamente desde tu Camara de Comercio.', icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    ), color: '#2563EB' },
    { name: 'Screening de Listas', desc: 'Cruce automatico contra listas restrictivas nacionales e internacionales. OFAC, ONU, Procuraduria.', icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    ), color: '#D97706' },
    { name: 'Gestion de Trabajadores', desc: 'Declaraciones SAGRILAFT, control de capacitaciones y alertas de renovacion anual automaticas.', icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    ), color: '#059669' },
    { name: 'Monitoreo Continuo', desc: 'Vigilancia permanente de contrapartes con alertas automaticas cuando cambian las condiciones de riesgo.', icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    ), color: '#7C3AED' },
    { name: 'Reportes Regulatorios', desc: 'Generacion automatica de informes de gestion y certificaciones para la Superintendencia.', icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    ), color: '#DC2626' },
  ];

  const features = [
    { title: 'Manual de Medidas Minimas', desc: 'Documento completo generado con IA, personalizado para tu sector APNFD y actividad economica.', accent: '#FEF3C7', accentBorder: '#FDE68A', iconColor: '#D97706', icon: (
      <svg className="w-6 h-6" fill="none" stroke="#D97706" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    )},
    { title: 'Matriz de Riesgo', desc: 'Evaluacion probabilidad-impacto con senales de alerta especificas y controles recomendados por sector.', accent: '#DCFCE7', accentBorder: '#BBF7D0', iconColor: '#059669', icon: (
      <svg className="w-6 h-6" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    )},
    { title: 'Formulario FCC', desc: 'Conocimiento del cliente pre-diligenciado con datos extraidos automaticamente del certificado de camara.', accent: '#EDE9FE', accentBorder: '#DDD6FE', iconColor: '#7C3AED', icon: (
      <svg className="w-6 h-6" fill="none" stroke="#7C3AED" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
    )},
    { title: 'Declaracion de Trabajadores', desc: 'Formato de declaracion LA/FT/FPADM con extraccion automatica de datos desde contratos laborales.', accent: '#DBEAFE', accentBorder: '#BFDBFE', iconColor: '#2563EB', icon: (
      <svg className="w-6 h-6" fill="none" stroke="#2563EB" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    )},
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#FFFFFF' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap');
        .font-serif-display { font-family: 'Instrument Serif', 'Georgia', serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideModule { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fu { animation: fadeUp 0.7s ease-out forwards; }
        .animate-fi { animation: fadeIn 0.5s ease-out forwards; }
        .animate-module { animation: slideModule 0.4s ease-out forwards; }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .delay-4 { animation-delay: 0.4s; opacity: 0; }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #F0F0F0' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-[60px]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[11px]" style={{ background: '#111' }}>C</div>
            <span className="text-[15px] font-semibold" style={{ color: '#111' }}>Comply</span>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <a href="#modulos" className="text-[13px] font-medium" style={{ color: '#666' }}>Modulos</a>
            <a href="#como" className="text-[13px] font-medium" style={{ color: '#666' }}>Como funciona</a>
            <a href="#agentes" className="text-[13px] font-medium" style={{ color: '#666' }}>AI Agents</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px] font-medium" style={{ color: '#666' }}>Ingresar</Link>
            <Link href="/solicitar" className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#111' }}>Solicitar acceso</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            {mounted && <>
              <div className="animate-fu delay-1 inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6" style={{ background: '#F5F5F5', border: '1px solid #E5E5E5' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }}></span>
                <span className="text-[11px] font-medium" style={{ color: '#666' }}>Plataforma de cumplimiento LA/FT con IA</span>
              </div>

              <h1 className="animate-fu delay-2 font-serif-display text-5xl sm:text-6xl lg:text-7xl leading-[1.08] mb-6" style={{ color: '#111' }}>
                La plataforma de{' '}
                <em className="font-serif-display">cumplimiento</em>{' '}
                para empresas
              </h1>

              <p className="animate-fu delay-3 text-[17px] lg:text-[19px] max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: '#666' }}>
                Automatiza tu SAGRILAFT. Genera documentos regulatorios, gestiona contrapartes y
                protege tu empresa con inteligencia artificial.
              </p>

              <div className="animate-fu delay-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/solicitar" className="px-7 py-3.5 rounded-lg text-[14px] font-semibold text-white transition-all hover:opacity-90" style={{ background: '#111' }}>
                  Comenzar gratis
                </Link>
                <a href="#modulos" className="px-7 py-3.5 rounded-lg text-[14px] font-medium transition-all hover:bg-gray-50" style={{ color: '#333', border: '1px solid #E0E0E0' }}>
                  Ver modulos
                </a>
              </div>
            </>}
          </div>
        </div>
      </section>

      {/* COMPLIANCE BADGES */}
      <section className="pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-[12px]" style={{ color: '#999' }}>
            {['Capitulo X Circular Basica Juridica', 'Resolucion 100-006322 de 2023', 'Metodologia DAFP', 'Regimen de Medidas Minimas'].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="#22C55E" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES CAROUSEL — Complif-style animated card */}
      <section id="modulos" className="py-20 lg:py-28" style={{ background: '#FAFAFA' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: '#999' }}>Modulos</p>
            <h2 className="font-serif-display text-4xl lg:text-5xl" style={{ color: '#111' }}>
              Todo lo que necesitas para cumplir
            </h2>
          </div>

          {/* Carousel container */}
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl p-8 lg:p-10 relative overflow-hidden" style={{ background: '#fff', border: '1px solid #EBEBEB', minHeight: '200px' }}>
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {modules.map((_, i) => (
                  <button key={i} onClick={() => setActiveModule(i)}
                    className="transition-all duration-300"
                    style={{
                      width: activeModule === i ? '24px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      background: activeModule === i ? '#111' : '#DDD',
                    }}
                  />
                ))}
              </div>

              {/* Module content with animation */}
              <div key={activeModule} className="animate-module text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: modules[activeModule].color + '12', color: modules[activeModule].color }}>
                  {modules[activeModule].icon}
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#111' }}>{modules[activeModule].name}</h3>
                <p className="text-[15px] leading-relaxed max-w-md mx-auto" style={{ color: '#666' }}>{modules[activeModule].desc}</p>
              </div>

              {/* Module tabs below */}
              <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                {modules.map((m, i) => (
                  <button key={i} onClick={() => setActiveModule(i)}
                    className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
                    style={activeModule === i
                      ? { background: '#111', color: '#fff' }
                      : { background: '#F5F5F5', color: '#888' }
                    }>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: '#999' }}>Documentos</p>
            <h2 className="font-serif-display text-4xl lg:text-5xl" style={{ color: '#111' }}>
              Generados con inteligencia artificial
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <div key={i} className="rounded-2xl p-7 transition-all hover:shadow-lg hover:shadow-gray-100" style={{ background: f.accent, border: `1px solid ${f.accentBorder}` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: '#fff' }}>
                  {f.icon}
                </div>
                <h3 className="text-[17px] font-semibold mb-2" style={{ color: '#111' }}>{f.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: '#555' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como" className="py-20 lg:py-28" style={{ background: '#FAFAFA' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: '#999' }}>Proceso</p>
            <h2 className="font-serif-display text-4xl lg:text-5xl" style={{ color: '#111' }}>
              Tres pasos, cero fricciones
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Sube tu documento', desc: 'Carga el Certificado de Camara de Comercio de tu empresa en formato PDF.' },
              { step: '2', title: 'La IA analiza', desc: 'Extraemos datos, identificamos tu sector APNFD y evaluamos riesgos especificos.' },
              { step: '3', title: 'Descarga todo', desc: 'Recibe Manual, Matriz de Riesgo y FCC personalizados y listos para presentar.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5 text-[18px] font-semibold" style={{ background: '#111', color: '#fff' }}>{s.step}</div>
                <h3 className="text-[17px] font-semibold mb-2" style={{ color: '#111' }}>{s.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: '#666' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI AGENTS */}
      <section id="agentes" className="py-20 lg:py-28" style={{ background: '#111' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: '#666' }}>AI Agents</p>
            <h2 className="font-serif-display text-4xl lg:text-5xl text-white leading-tight mb-4">
              Suma nuestros agentes<br/>de IA a tu equipo
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: '#888' }}>
              Copilotos especializados que automatizan screening, monitoreo
              y reportes regulatorios las 24 horas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Vigia', role: 'Screening Agent', desc: 'Cruza contrapartes contra 300+ listas restrictivas. OFAC, ONU, Procuraduria y PEPs.', color: '#3B82F6' },
              { name: 'Centinela', role: 'Monitoring Agent', desc: 'Monitoreo continuo de operaciones. Detecta patrones inusuales y evalua riesgos.', color: '#F59E0B' },
              { name: 'Cumplidor', role: 'Compliance Agent', desc: 'Genera reportes regulatorios y gestiona el calendario de obligaciones.', color: '#10B981' },
            ].map((agent, i) => (
              <div key={i} className="rounded-2xl p-6 transition-all hover:bg-white/[0.06]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-2 h-2 rounded-full mb-4" style={{ background: agent.color }}></div>
                <h3 className="text-[18px] font-semibold text-white mb-0.5">{agent.name}</h3>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-4" style={{ color: '#555' }}>{agent.role}</p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#888' }}>{agent.desc}</p>
                <div className="mt-5 inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: agent.color }}>
                  Proximamente
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTORS */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: '#999' }}>Sectores APNFD</p>
            <h2 className="font-serif-display text-4xl lg:text-5xl" style={{ color: '#111' }}>
              Personalizado para tu sector
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Inmobiliario', icon: '🏢' },
              { name: 'Juridico', icon: '⚖️' },
              { name: 'Contable', icon: '📒' },
              { name: 'Tecnologia', icon: '💻' },
              { name: 'Comercio', icon: '🏪' },
              { name: 'Otros', icon: '🏭' },
            ].map((s, i) => (
              <div key={i} className="p-5 rounded-xl text-center transition-all hover:shadow-md" style={{ background: '#FAFAFA', border: '1px solid #EBEBEB' }}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="font-medium text-[13px]" style={{ color: '#333' }}>{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28" style={{ background: '#FAFAFA' }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-2xl p-12 lg:p-16 text-center" style={{ background: '#111' }}>
            <h2 className="font-serif-display text-3xl lg:text-4xl text-white mb-4 leading-tight">
              Cumplimiento sin fricciones,<br/>empieza hoy
            </h2>
            <p className="text-[15px] mb-8 max-w-md mx-auto" style={{ color: '#888' }}>
              Unete a las empresas que estan automatizando su SAGRILAFT con inteligencia artificial.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/solicitar" className="px-7 py-3.5 rounded-lg text-[14px] font-semibold text-black transition-all hover:opacity-90" style={{ background: '#fff' }}>
                Solicitar acceso gratuito
              </Link>
              <Link href="/login" className="px-7 py-3.5 rounded-lg text-[14px] font-medium transition-all" style={{ color: '#999', border: '1px solid rgba(255,255,255,0.15)' }}>
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #F0F0F0' }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[11px]" style={{ background: '#111' }}>C</div>
                <span className="text-[15px] font-semibold" style={{ color: '#111' }}>Comply</span>
              </div>
              <p className="text-[13px] max-w-xs" style={{ color: '#999' }}>
                Plataforma de cumplimiento LA/FT/FPADM con IA para empresas del sector real colombiano.
              </p>
            </div>
            <div className="flex gap-12">
              {[
                { title: 'Producto', items: ['Generacion Documental', 'Screening', 'Monitoreo', 'Reportes'] },
                { title: 'Legal', items: ['Terminos de Servicio', 'Politica de Privacidad', 'Tratamiento de Datos'] },
              ].map((col, i) => (
                <div key={i}>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: '#999' }}>{col.title}</h4>
                  <ul className="space-y-2">
                    {col.items.map((item, j) => (
                      <li key={j} className="text-[13px]" style={{ color: '#666' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 pt-6 flex items-center justify-between" style={{ borderTop: '1px solid #F0F0F0' }}>
            <div className="text-[12px]" style={{ color: '#BBB' }}>2026 Comply SAGRILAFT. Todos los derechos reservados.</div>
            <div className="text-[12px]" style={{ color: '#BBB' }}>Hecho en Colombia</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
