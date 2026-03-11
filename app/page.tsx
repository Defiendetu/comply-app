'use client';

import { Shield, FileText, Clock, CheckCircle, ArrowRight, Sparkles, Building2, Scale, Users, ChevronRight, Upload, Settings, Download } from 'lucide-react';
import Link from 'next/link';

// Componente Navbar
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Comply</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#beneficios" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">Beneficios</a>
            <a href="#como-funciona" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">Cómo funciona</a>
            <a href="#sectores" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">Sectores</a>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-primary-600 transition-colors font-medium hidden sm:block">Iniciar sesión</Link>
            <Link href="/solicitar" className="btn-primary text-sm">Solicitar acceso</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Componente Hero
function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-emerald/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 bg-primary-50 rounded-full mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary-600 mr-2" />
            <span className="text-sm font-medium text-primary-700">Cumplimiento SAGRILAFT simplificado</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6 animate-slide-up">
            Genera tu documentación{' '}
            <span className="gradient-text">LA/FT/FPADM</span>{' '}
            en minutos
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-slide-up">
            Manual de Medidas Mínimas y Matriz de Riesgo personalizados para tu empresa. 
            Cumple con la Superintendencia de Sociedades sin complicaciones.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up">
            <Link href="/solicitar" className="btn-primary text-lg px-8 py-4">
              Solicitar acceso gratuito
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a href="#como-funciona" className="btn-outline text-lg px-8 py-4">Ver cómo funciona</a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 animate-fade-in">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-accent-emerald mr-2" />
              <span>Conforme al Capítulo X</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-accent-emerald mr-2" />
              <span>Circular 100-000016</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-accent-emerald mr-2" />
              <span>Actualizado 2024</span>
            </div>
          </div>
        </div>

        {/* Preview mockup */}
        <div className="mt-16 relative animate-slide-up">
          <div className="relative mx-auto max-w-5xl">
            <div className="card p-2 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-t-xl border-b border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-white rounded-md text-xs text-gray-400 border border-gray-200">comply.app/dashboard</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-b-xl">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary-600" />
                      </div>
                      <span className="px-3 py-1 bg-accent-emerald/10 text-accent-emerald text-xs font-medium rounded-full">Generado</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Manual de Medidas Mínimas</h3>
                    <p className="text-sm text-gray-500">Documento Word personalizado</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-accent-emerald/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-accent-emerald" />
                      </div>
                      <span className="px-3 py-1 bg-accent-emerald/10 text-accent-emerald text-xs font-medium rounded-full">Generado</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Matriz de Riesgo</h3>
                    <p className="text-sm text-gray-500">Excel con fórmulas automáticas</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -left-4 top-1/3 animate-float hidden lg:block">
              <div className="bg-white px-4 py-3 rounded-xl shadow-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-emerald/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-accent-emerald" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Documento listo</p>
                    <p className="text-xs text-gray-500">Hace 2 minutos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Componente Beneficios
function Beneficios() {
  const beneficios = [
    { icon: Clock, title: 'Ahorra tiempo', description: 'Genera documentos en minutos, no en semanas. Sin necesidad de contratar consultores externos.', color: 'primary' },
    { icon: Shield, title: 'Cumplimiento garantizado', description: 'Documentos alineados con el Capítulo X de la Circular Básica Jurídica de la Superintendencia de Sociedades.', color: 'emerald' },
    { icon: FileText, title: 'Documentos profesionales', description: 'Manual y Matriz de Riesgo con formato profesional, listos para presentar a la autoridad.', color: 'primary' },
    { icon: Users, title: 'Sin oficial de cumplimiento', description: 'Las Medidas Mínimas pueden ser gestionadas directamente por el Representante Legal.', color: 'emerald' }
  ];

  return (
    <section id="beneficios" className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">¿Por qué elegir Comply?</h2>
          <p className="text-lg text-gray-600">Simplificamos el cumplimiento SAGRILAFT para que puedas enfocarte en tu negocio</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {beneficios.map((beneficio, index) => (
            <div key={index} className="card-hover p-6 text-center">
              <div className={`w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center ${beneficio.color === 'emerald' ? 'bg-accent-emerald/10' : 'bg-primary-100'}`}>
                <beneficio.icon className={`w-7 h-7 ${beneficio.color === 'emerald' ? 'text-accent-emerald' : 'text-primary-600'}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{beneficio.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{beneficio.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Componente Cómo Funciona
function ComoFunciona() {
  const pasos = [
    { numero: '01', titulo: 'Sube tus documentos', descripcion: 'Carga el Certificado de Cámara de Comercio y RUT de tu empresa. Extraemos la información automáticamente.', icon: Upload },
    { numero: '02', titulo: 'Completa datos adicionales', descripcion: 'Responde unas pocas preguntas sobre tu operación: sector, canales, manejo de efectivo.', icon: Settings },
    { numero: '03', titulo: 'Descarga tus documentos', descripcion: 'Recibe tu Manual de Medidas Mínimas en Word y tu Matriz de Riesgo en Excel, listos para usar.', icon: Download }
  ];

  return (
    <section id="como-funciona" className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">¿Cómo funciona?</h2>
          <p className="text-lg text-gray-600">Tres simples pasos para obtener tu documentación SAGRILAFT</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {pasos.map((paso, index) => (
            <div key={index} className="relative">
              {index < pasos.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary-200 to-transparent -translate-x-1/2 z-0" />
              )}
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/30 mb-6">
                  <paso.icon className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold text-primary-600 mb-2">PASO {paso.numero}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{paso.titulo}</h3>
                <p className="text-gray-600">{paso.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Componente Sectores
function Sectores() {
  const sectores = [
    { icon: Building2, nombre: 'Agentes Inmobiliarios', descripcion: 'Intermediación en compra, venta y arriendo de inmuebles' },
    { icon: Scale, nombre: 'Servicios Jurídicos', descripcion: 'Abogados y firmas de abogados (CIIU 6910)' },
    { icon: FileText, nombre: 'Servicios Contables', descripcion: 'Contadores y firmas de contabilidad (CIIU M69)' },
    { icon: Sparkles, nombre: 'Metales y Piedras Preciosas', descripcion: 'Comercialización de metales y piedras preciosas' }
  ];

  return (
    <section id="sectores" className="py-20 lg:py-32 bg-primary-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Sectores que aplican</h2>
          <p className="text-lg text-primary-200">El Régimen de Medidas Mínimas aplica para estos sectores según el Capítulo X</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sectores.map((sector, index) => (
            <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                <sector.icon className="w-6 h-6 text-primary-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{sector.nombre}</h3>
              <p className="text-primary-300 text-sm">{sector.descripcion}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-primary-300 mb-6">
            Aplica para empresas con ingresos entre 3,000 y 30,000 SMLMV o activos entre 5,000 y 40,000 SMLMV
          </p>
          <Link href="/solicitar" className="inline-flex items-center text-white font-medium hover:text-primary-300 transition-colors">
            Verificar si mi empresa aplica
            <ChevronRight className="w-5 h-5 ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Componente CTA Final
function CTAFinal() {
  return (
    <section className="py-20 lg:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="card p-12 lg:p-16 bg-gradient-to-br from-primary-50 to-white border-primary-100">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            ¿Listo para simplificar tu cumplimiento?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Únete a las empresas que ya generan su documentación SAGRILAFT de forma automática. 
            Solicita tu acceso gratuito hoy.
          </p>
          <Link href="/solicitar" className="btn-primary text-lg px-8 py-4">
            Solicitar acceso gratuito
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Comply</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2024 Comply. Cumplimiento SAGRILAFT simplificado.
          </p>
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <a href="#" className="hover:text-primary-600 transition-colors">Términos</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Contacto</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Página Principal
export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Beneficios />
      <ComoFunciona />
      <Sectores />
      <CTAFinal />
      <Footer />
    </main>
  );
}
