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
    { name: 'Generación Documental', desc: 'Manual de Medidas Mínimas, Matriz de Riesgo y FCC generados automáticamente desde tu Cámara de Comercio.', num: '01', color: '#111' },
    { name: 'Screening de Listas', desc: 'Cruce automático contra listas restrictivas nacionales e internacionales. OFAC, ONU, Procuraduría y PEPs.', num: '02', color: '#111' },
    { name: 'Gestión de Trabajadores', desc: 'Declaraciones SAGRILAFT, control de capacitaciones y alertas de renovación anual automáticas.', num: '03', color: '#111' },
    { name: 'Monitoreo Continuo', desc: 'Vigilancia permanente de contrapartes con alertas automáticas cuando cambian las condiciones de riesgo.', num: '04', color: '#111' },
    { name: 'Reportes Regulatorios', desc: 'Generación automática de informes de gestión y certificaciones para la Superintendencia.', num: '05', color: '#111' },
  ];

  const features = [
    { title: 'Manual de Medidas Mínimas', desc: 'Documento completo generado con IA, personalizado para tu sector APNFD y actividad económica.', num: '01', bg: '#0A1E33', accent: '#3B82F6', border: '#1E3A5F' },
    { title: 'Matriz de Riesgo', desc: 'Evaluación probabilidad-impacto con señales de alerta específicas y controles recomendados por sector.', num: '02', bg: '#0A2E1A', accent: '#22C55E', border: '#1A4D2E' },
    { title: 'Formulario FCC', desc: 'Conocimiento del cliente pre-diligenciado con datos extraídos automáticamente del certificado de cámara.', num: '03', bg: '#1A0F2E', accent: '#A78BFA', border: '#2D1B4E' },
    { title: 'Declaración de Trabajadores', desc: 'Formato de declaración LA/FT/FPADM con extracción automática de datos desde contratos laborales.', num: '04', bg: '#2D1B0E', accent: '#F59E0B', border: '#4D2E1A' },
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
            <a href="#modulos" className="text-[13px] font-medium" style={{ color: '#666' }}>Módulos</a>
            <a href="#como" className="text-[13px] font-medium" style={{ color: '#666' }}>Cómo funciona</a>
            <a href="#agentes" className="text-[13px] font-medium" style={{ color: '#666' }}>AI Agents</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px] font-medium" style={{ color: '#666' }}>Ingresar</Link>
            <Link href="/login?mode=register" className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#111' }}>Crear cuenta</Link>
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
                  Ver módulos
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
            {['Capítulo X Circular Básica Jurídica', 'Resolución 100-006322 de 2023', 'Metodología DAFP', 'Régimen de Medidas Mínimas'].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="#22C55E" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES CAROUSEL */}
      <section id="modulos" className="py-20 lg:py-28" style={{ background: '#FAFAFA' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: '#999' }}>Módulos</p>
            <h2 className="font-serif-display text-4xl lg:text-5xl" style={{ color: '#111' }}>
              Todo lo que necesitas para cumplir
            </h2>
          </div>

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

              {/* Module content — number instead of icon */}
              <div key={activeModule} className="animate-module text-center">
                <div className="text-[48px] font-serif-display mb-2" style={{ color: '#DDD' }}>
                  {modules[activeModule].num}
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

      {/* FEATURES GRID — Dark cards */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: '#999' }}>Documentos</p>
            <h2 className="font-serif-display text-4xl lg:text-5xl" style={{ color: '#111' }}>
              Generados con inteligencia artificial
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className="rounded-2xl p-7 transition-all hover:scale-[1.02]" style={{ background: f.bg, border: `1px solid ${f.border}` }}>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[11px] font-semibold tracking-wider" style={{ color: f.accent }}>{f.num}</span>
                  <div className="w-8 h-[1px]" style={{ background: f.border }}></div>
                </div>
                <h3 className="text-[17px] font-semibold mb-2 text-white">{f.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: `${f.accent}99` }}>{f.desc}</p>
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
              { step: '1', title: 'Sube tu documento', desc: 'Carga el Certificado de Cámara de Comercio de tu empresa en formato PDF.' },
              { step: '2', title: 'La IA analiza', desc: 'Extraemos datos, identificamos tu sector APNFD y evaluamos riesgos específicos.' },
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
              { name: 'Vigía', role: 'Screening Agent', desc: 'Cruza contrapartes contra 300+ listas restrictivas. OFAC, ONU, Procuraduría y PEPs.', color: '#3B82F6' },
              { name: 'Centinela', role: 'Monitoring Agent', desc: 'Monitoreo continuo de operaciones. Detecta patrones inusuales y evalúa riesgos.', color: '#F59E0B' },
              { name: 'Cumplidor', role: 'Compliance Agent', desc: 'Genera reportes regulatorios y gestiona el calendario de obligaciones.', color: '#10B981' },
            ].map((agent, i) => (
              <div key={i} className="rounded-2xl p-6 transition-all hover:bg-white/[0.06]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-2 h-2 rounded-full mb-4" style={{ background: agent.color }}></div>
                <h3 className="text-[18px] font-semibold text-white mb-0.5">{agent.name}</h3>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-4" style={{ color: '#555' }}>{agent.role}</p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#888' }}>{agent.desc}</p>
                <div className="mt-5 inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: agent.color }}>
                  Próximamente
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
              { name: 'Jurídico', icon: '⚖️' },
              { name: 'Contable', icon: '📒' },
              { name: 'Tecnología', icon: '💻' },
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
              Únete a las empresas que están automatizando su SAGRILAFT con inteligencia artificial.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/login?mode=register" className="px-7 py-3.5 rounded-lg text-[14px] font-semibold text-black transition-all hover:opacity-90" style={{ background: '#fff' }}>
                Crear cuenta gratis
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
                { title: 'Producto', items: ['Generación Documental', 'Screening', 'Monitoreo', 'Reportes'] },
                { title: 'Legal', items: ['Términos de Servicio', 'Política de Privacidad', 'Tratamiento de Datos'] },
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
            <div className="text-[12px]" style={{ color: '#BBB' }}>© 2026 Comply SAGRILAFT. Todos los derechos reservados.</div>
            <div className="text-[12px]" style={{ color: '#BBB' }}>Hecho en Colombia 🇨🇴</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
