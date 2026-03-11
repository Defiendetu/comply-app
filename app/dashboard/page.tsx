'use client';

import { useState, useCallback } from 'react';
import { Shield, LogOut, Upload, FileText, CheckCircle, AlertCircle, Download, Loader2, X, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Upload, 2: Form, 3: Generating, 4: Done
  const [files, setFiles] = useState<{ certificado?: File; rut?: File }>({});
  const [formData, setFormData] = useState({
    sector: '',
    manejaEfectivo: '',
    operaExtranjeros: '',
    canales: ''
  });
  const [generatedDocs, setGeneratedDocs] = useState<{ manual?: string; matriz?: string }>({});

  const handleLogout = () => {
    localStorage.removeItem('comply_user');
    router.push('/');
  };

  const handleFileChange = (type: 'certificado' | 'rut', file: File | null) => {
    if (file) {
      setFiles({ ...files, [type]: file });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, type: 'certificado' | 'rut') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handleFileChange(type, file);
    }
  }, [files]);

  const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    setStep(3);
    
    // Aquí se conectará con n8n
    // Por ahora simulamos el proceso
    setTimeout(() => {
      setGeneratedDocs({
        manual: '/docs/manual.docx',
        matriz: '/docs/matriz.xlsx'
      });
      setStep(4);
    }, 3000);
  };

  const canProceedToForm = files.certificado;
  const canGenerate = formData.sector && formData.manejaEfectivo && formData.operaExtranjeros && formData.canales;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Comply</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {[
              { num: 1, label: 'Documentos' },
              { num: 2, label: 'Información' },
              { num: 3, label: 'Generar' },
              { num: 4, label: 'Descargar' }
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  step >= s.num 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                {i < 3 && (
                  <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                    step > s.num ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs sm:text-sm text-gray-500">
            <span>Documentos</span>
            <span>Información</span>
            <span>Generar</span>
            <span>Descargar</span>
          </div>
        </div>

        {/* Step 1: Upload Documents */}
        {step === 1 && (
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sube los documentos de tu empresa</h2>
            <p className="text-gray-600 mb-8">Extraeremos la información automáticamente</p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Certificado */}
              <div
                onDrop={(e) => handleDrop(e, 'certificado')}
                onDragOver={(e) => e.preventDefault()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  files.certificado 
                    ? 'border-accent-emerald bg-accent-emerald/5' 
                    : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50/50'
                }`}
              >
                {files.certificado ? (
                  <div>
                    <CheckCircle className="w-12 h-12 text-accent-emerald mx-auto mb-3" />
                    <p className="font-medium text-gray-900 mb-1">{files.certificado.name}</p>
                    <p className="text-sm text-gray-500 mb-3">
                      {(files.certificado.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => setFiles({ ...files, certificado: undefined })}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="font-medium text-gray-900 mb-1">Certificado de Cámara de Comercio</p>
                    <p className="text-sm text-gray-500 mb-3">PDF • Obligatorio</p>
                    <span className="btn-secondary text-sm">Seleccionar archivo</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange('certificado', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* RUT */}
              <div
                onDrop={(e) => handleDrop(e, 'rut')}
                onDragOver={(e) => e.preventDefault()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  files.rut 
                    ? 'border-accent-emerald bg-accent-emerald/5' 
                    : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50/50'
                }`}
              >
                {files.rut ? (
                  <div>
                    <CheckCircle className="w-12 h-12 text-accent-emerald mx-auto mb-3" />
                    <p className="font-medium text-gray-900 mb-1">{files.rut.name}</p>
                    <p className="text-sm text-gray-500 mb-3">
                      {(files.rut.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => setFiles({ ...files, rut: undefined })}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="font-medium text-gray-900 mb-1">RUT</p>
                    <p className="text-sm text-gray-500 mb-3">PDF • Recomendado</p>
                    <span className="btn-secondary text-sm">Seleccionar archivo</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange('rut', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedToForm}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Additional Info */}
        {step === 2 && (
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Información adicional</h2>
            <p className="text-gray-600 mb-8">Necesitamos algunos datos más para personalizar tus documentos</p>

            <div className="space-y-6 mb-8">
              <div>
                <label className="label">Sector de tu empresa</label>
                <select
                  name="sector"
                  value={formData.sector}
                  onChange={handleFormChange}
                  className="input-field"
                >
                  <option value="">Selecciona un sector</option>
                  <option value="inmobiliario">Agentes Inmobiliarios</option>
                  <option value="juridico">Servicios Jurídicos</option>
                  <option value="contable">Servicios Contables</option>
                  <option value="metales">Metales y Piedras Preciosas</option>
                </select>
              </div>

              <div>
                <label className="label">¿La empresa maneja efectivo?</label>
                <select
                  name="manejaEfectivo"
                  value={formData.manejaEfectivo}
                  onChange={handleFormChange}
                  className="input-field"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="no">No, solo transferencias bancarias</option>
                  <option value="aveces">A veces, en operaciones pequeñas</option>
                  <option value="si">Sí, frecuentemente</option>
                </select>
              </div>

              <div>
                <label className="label">¿Opera con clientes o proveedores extranjeros?</label>
                <select
                  name="operaExtranjeros"
                  value={formData.operaExtranjeros}
                  onChange={handleFormChange}
                  className="input-field"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="no">No, solo en Colombia</option>
                  <option value="si">Sí, tenemos operaciones internacionales</option>
                </select>
              </div>

              <div>
                <label className="label">Canales de atención</label>
                <select
                  name="canales"
                  value={formData.canales}
                  onChange={handleFormChange}
                  className="input-field"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="presencial">Solo presencial</option>
                  <option value="virtual">Solo virtual</option>
                  <option value="ambos">Presencial y virtual</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-outline">
                Atrás
              </button>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generar documentos
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 3 && (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Generando tus documentos</h2>
            <p className="text-gray-600 mb-6">
              Estamos procesando la información y creando tu Manual de Medidas Mínimas y Matriz de Riesgo...
            </p>
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-accent-emerald/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-accent-emerald" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">¡Documentos listos!</h2>
              <p className="text-gray-600">
                Tu Manual de Medidas Mínimas y Matriz de Riesgo han sido generados exitosamente.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Manual */}
              <div className="border border-gray-200 rounded-2xl p-6 hover:border-primary-300 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-7 h-7 text-primary-600" />
                  </div>
                  <span className="px-3 py-1 bg-accent-emerald/10 text-accent-emerald text-xs font-medium rounded-full">
                    Listo
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Manual de Medidas Mínimas</h3>
                <p className="text-sm text-gray-500 mb-4">Documento Word (.docx)</p>
                <button className="w-full btn-primary">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Manual
                </button>
              </div>

              {/* Matriz */}
              <div className="border border-gray-200 rounded-2xl p-6 hover:border-primary-300 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-accent-emerald/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-accent-emerald" />
                  </div>
                  <span className="px-3 py-1 bg-accent-emerald/10 text-accent-emerald text-xs font-medium rounded-full">
                    Listo
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Matriz de Riesgo</h3>
                <p className="text-sm text-gray-500 mb-4">Hoja de cálculo (.xlsx)</p>
                <button className="w-full btn-primary bg-accent-emerald hover:bg-emerald-600 shadow-emerald-500/25">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Matriz
                </button>
              </div>
            </div>

            <div className="bg-primary-50 rounded-xl p-6">
              <h4 className="font-semibold text-primary-900 mb-2">¿Qué sigue?</h4>
              <ul className="text-sm text-primary-700 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  Revisa los documentos y personaliza cualquier detalle específico
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  Presenta el Manual para aprobación de la Asamblea de Accionistas
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  Implementa los controles definidos en la Matriz de Riesgo
                </li>
              </ul>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setStep(1);
                  setFiles({});
                  setFormData({ sector: '', manejaEfectivo: '', operaExtranjeros: '', canales: '' });
                }}
                className="btn-outline"
              >
                Generar nuevos documentos
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
