'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; empresa: string } | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [documentosGenerados, setDocumentosGenerados] = useState<{
    manualHTML: string;
    matrizCSV: string;
    empresa: string;
    nit: string;
    representante: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    certificadoBase64: '',
    certificadoNombre: '',
    sector: '',
    manejaEfectivo: '',
    operaExtranjeros: '',
    canales: [] as string[],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar sesión al cargar
  useEffect(() => {
    const storedUser = localStorage.getItem('complyUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.loggedIn) {
        setUser(userData);
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('complyUser');
    router.push('/login');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Por favor sube un archivo PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10MB');
      return;
    }

    setError('');
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setFormData(prev => ({
        ...prev,
        certificadoBase64: base64,
        certificadoNombre: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCanalesChange = (canal: string) => {
    setFormData(prev => ({
      ...prev,
      canales: prev.canales.includes(canal)
        ? prev.canales.filter(c => c !== canal)
        : [...prev.canales, canal]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.certificadoBase64) {
      setError('Debes subir el Certificado de Cámara de Comercio');
      return;
    }
    if (!formData.sector) {
      setError('Selecciona el sector de tu empresa');
      return;
    }
    if (!formData.manejaEfectivo) {
      setError('Indica si manejas efectivo');
      return;
    }
    if (!formData.operaExtranjeros) {
      setError('Indica si operas con extranjeros');
      return;
    }
    if (formData.canales.length === 0) {
      setError('Selecciona al menos un canal de operación');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://defiendetetu.app.n8n.cloud/webhook/generar-documentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificadoBase64: formData.certificadoBase64,
          sector: formData.sector,
          manejaEfectivo: formData.manejaEfectivo,
          operaExtranjeros: formData.operaExtranjeros,
          canales: formData.canales.join(', '),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar documentos');
      }

      const data = await response.json();
      
      if (data.success) {
        setDocumentosGenerados({
          manualHTML: data.documentos.manualHTML,
          matrizCSV: data.documentos.matrizCSV,
          empresa: data.empresa,
          nit: data.nit,
          representante: data.representante,
        });
        setStep(3);
      } else {
        throw new Error(data.mensaje || 'Error al procesar');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const descargarManual = () => {
    if (!documentosGenerados) return;
    
    const blob = new Blob([documentosGenerados.manualHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Manual_Medidas_Minimas_${documentosGenerados.empresa.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const descargarMatriz = () => {
    if (!documentosGenerados) return;
    
    const blob = new Blob([documentosGenerados.matrizCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Matriz_Riesgo_${documentosGenerados.empresa.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Mostrar loading mientras verifica sesión
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Comply</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-8 text-sm text-gray-600">
            <span className={step === 1 ? 'font-semibold text-blue-600' : ''}>Documentos</span>
            <span className={step === 2 ? 'font-semibold text-blue-600' : ''}>Información</span>
            <span className={step === 3 ? 'font-semibold text-blue-600' : ''}>Descargar</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Upload Documents */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sube tu Certificado de Cámara de Comercio
            </h2>
            <p className="text-gray-600 mb-6">
              Extraeremos automáticamente los datos de tu empresa usando inteligencia artificial.
            </p>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                formData.certificadoBase64 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {formData.certificadoBase64 ? (
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-700 font-medium">{formData.certificadoNombre}</p>
                  <p className="text-green-600 text-sm mt-1">Archivo cargado correctamente</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, certificadoBase64: '', certificadoNombre: '' }));
                    }}
                    className="text-red-500 text-sm mt-2 hover:underline"
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium">Haz clic para subir tu PDF</p>
                  <p className="text-gray-500 text-sm mt-1">o arrastra y suelta aquí</p>
                  <p className="text-gray-400 text-xs mt-4">Máximo 10MB • Solo archivos PDF</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => formData.certificadoBase64 && setStep(2)}
                disabled={!formData.certificadoBase64}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  formData.certificadoBase64
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Additional Information */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Información adicional
            </h2>
            <p className="text-gray-600 mb-6">
              Estos datos nos ayudan a personalizar tu matriz de riesgo.
            </p>

            <div className="space-y-6">
              {/* Sector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sector de tu empresa *
                </label>
                <select
                  value={formData.sector}
                  onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona un sector</option>
                  <option value="inmobiliario">Inmobiliario</option>
                  <option value="juridico">Servicios Jurídicos</option>
                  <option value="contable">Servicios Contables</option>
                  <option value="metales">Metales y Piedras Preciosas</option>
                  <option value="otro">Otro sector APNFD</option>
                </select>
              </div>

              {/* Maneja Efectivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Tu empresa maneja efectivo? *
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'no', label: 'No' },
                    { value: 'aveces', label: 'A veces' },
                    { value: 'si', label: 'Sí, frecuentemente' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, manejaEfectivo: option.value }))}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                        formData.manejaEfectivo === option.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opera con Extranjeros */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Operas con clientes o proveedores extranjeros? *
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'no', label: 'No' },
                    { value: 'si', label: 'Sí' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, operaExtranjeros: option.value }))}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                        formData.operaExtranjeros === option.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Canales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Qué canales de operación utilizas? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'presencial', label: '🏢 Presencial' },
                    { value: 'virtual', label: '💻 Virtual / En línea' },
                    { value: 'telefono', label: '📞 Teléfono' },
                    { value: 'domicilio', label: '🚗 A domicilio' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleCanalesChange(option.value)}
                      className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors text-left ${
                        formData.canales.includes(option.value)
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  loading
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando documentos...
                  </span>
                ) : (
                  'Generar Documentos'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Download Documents */}
        {step === 3 && documentosGenerados && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Documentos generados exitosamente!
              </h2>
              <p className="text-gray-600">
                Hemos extraído los datos de <strong>{documentosGenerados.empresa}</strong> y generado tus documentos.
              </p>
            </div>

            {/* Company Info Card */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Datos extraídos:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Empresa:</span> {documentosGenerados.empresa}</div>
                <div><span className="text-gray-500">NIT:</span> {documentosGenerados.nit}</div>
                <div className="col-span-2"><span className="text-gray-500">Rep. Legal:</span> {documentosGenerados.representante}</div>
              </div>
            </div>

            {/* Download Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {/* Manual */}
              <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">HTML</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Manual de Medidas Mínimas</h3>
                <p className="text-sm text-gray-500 mb-4">Documento completo con políticas LA/FT/FPADM</p>
                <button
                  onClick={descargarManual}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar Manual
                </button>
              </div>

              {/* Matriz */}
              <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">CSV</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Matriz de Riesgo LA/FT/FPADM</h3>
                <p className="text-sm text-gray-500 mb-4">Análisis de riesgos con controles aplicados</p>
                <button
                  onClick={descargarMatriz}
                  className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar Matriz
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">💡 Próximos pasos:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Abre el Manual HTML en tu navegador y guárdalo como PDF (Ctrl+P → Guardar como PDF)</li>
                <li>• Abre el CSV en Excel para ver la matriz con formato de tabla</li>
                <li>• Presenta estos documentos a tu Asamblea de Accionistas para aprobación</li>
                <li>• Envía la certificación a la Superintendencia de Sociedades antes del 30 de abril</li>
              </ul>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setStep(1);
                  setFormData({
                    certificadoBase64: '',
                    certificadoNombre: '',
                    sector: '',
                    manejaEfectivo: '',
                    operaExtranjeros: '',
                    canales: [],
                  });
                  setDocumentosGenerados(null);
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                Generar documentos para otra empresa
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
