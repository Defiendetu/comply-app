'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ActiveView = 'home' | 'documentos' | 'contrapartes' | 'trabajadores' | 'matriz' | 'agentes' | 'reportes';

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
  const [selectedDocs, setSelectedDocs] = useState<string[]>(['manual', 'matriz', 'fcc']);

  const [contrapartes, setContrapartes] = useState<any[]>([]);
  const [showNuevaContraparte, setShowNuevaContraparte] = useState(false);
  const [contraparteForm, setContraparteForm] = useState({ tipo_persona: 'juridica', tipo_relacion: 'cliente', razon_social: '', nit_cc: '', representante_legal: '', ciudad: '', certificadoBase64: '', certificadoNombre: '' });
  const [loadingContraparte, setLoadingContraparte] = useState(false);
  const contraparteFileRef = useRef<HTMLInputElement>(null);

  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [showNuevoTrabajador, setShowNuevoTrabajador] = useState(false);
  const [trabajadorForm, setTrabajadorForm] = useState({ nombre: '', cedula: '', cargo: '', area: '', fecha_ingreso: '', contratoBase64: '', contratoNombre: '' });
  const [loadingDeclaracion, setLoadingDeclaracion] = useState<string | null>(null);
  const [loadingExtraccion, setLoadingExtraccion] = useState(false);
  const [showListasForm, setShowListasForm] = useState(false);
  const [listasForm, setListasForm] = useState({ nombre: '', nit: '', tipo_persona: 'juridica', tipo_relacion: 'cliente' });
  const [loadingListas, setLoadingListas] = useState(false);
  const trabajadorFileRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    { icon: '📄', text: 'Recibimos tu certificado...', sub: 'Preparando el análisis' },
    { icon: '🔍', text: 'Extrayendo datos de tu empresa...', sub: 'Razón social, NIT, objeto social' },
    { icon: '🧠', text: 'Analizando riesgos de tu sector...', sub: 'Evaluando factores LA/FT/FPADM' },
    { icon: '📊', text: 'Construyendo la matriz de riesgo...', sub: 'Probabilidades e impactos' },
    { icon: '⚖️', text: 'Generando senales de alerta...', sub: 'Controles especificos' },
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ email: session.user.email || '', empresa: '' });
        loadEmpresaData(session.user.email || '');
      } else {
        router.push('/login');
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function loadEmpresaData(email: string) {
    setLoadingData(true);
    try {
      const { data: empresas } = await supabase.from('empresas').select('*').eq('user_email', email).order('created_at', { ascending: false }).limit(1);
      if (empresas && empresas.length > 0) {
        setEmpresaGuardada(empresas[0]);
        const { data: docs } = await supabase.from('documentos').select('*').eq('empresa_id', empresas[0].id).order('created_at', { ascending: false });
        if (docs) {
          setHistorialDocumentos(docs.slice(0, 8));
          if (docs.length > 8) {
            const idsToDelete = docs.slice(8).map(d => d.id);
            await supabase.from('documentos').delete().in('id', idsToDelete);
          }
        }
        const { data: contras } = await supabase.from('contrapartes').select('*').eq('empresa_id', empresas[0].id).order('created_at', { ascending: false });
        if (contras) { setContrapartes(contras); setTrabajadores(contras.filter((c: any) => c.tipo_relacion === 'empleado')); }
      }
    } catch (err) { console.error('Error loading data:', err); }
    finally { setLoadingData(false); }
  }

  async function saveEmpresa(data: any, email: string) {
    try {
      const { data: existing } = await supabase.from('empresas').select('id').eq('user_email', email).eq('nit', data.nit).limit(1);
      if (existing && existing.length > 0) {
        const { data: updated } = await supabase.from('empresas').update({ razon_social: data.empresa, razon_social_corto: data.empresaCorto || data.empresa, representante_legal: data.representante, tipo_sociedad: data.tipoSociedad, cedula_rep_legal: data.cedulaRep, ciudad: data.ciudad, sector_nombre: data.sectorNombre, codigo_ciiu: data.codigoCiiu, perfil_riesgo: data.perfilRiesgo }).eq('id', existing[0].id).select().single();
        if (updated) setEmpresaGuardada(updated);
        return existing[0].id;
      } else {
        const { data: inserted } = await supabase.from('empresas').insert({ user_email: email, razon_social: data.empresa, razon_social_corto: data.empresaCorto || data.empresa, nit: data.nit, representante_legal: data.representante, tipo_sociedad: data.tipoSociedad || '', cedula_rep_legal: data.cedulaRep || '', ciudad: data.ciudad || '', sector_nombre: data.sectorNombre || '', codigo_ciiu: data.codigoCiiu || '', perfil_riesgo: data.perfilRiesgo || 'MEDIO' }).select().single();
        if (inserted) setEmpresaGuardada(inserted);
        return inserted?.id;
      }
    } catch (err) { console.error('Error saving empresa:', err); return null; }
  }

  async function saveDocumento(empresaId: string, tipo: string, nombre: string, base64: string) {
    try {
      const { data } = await supabase.from('documentos').insert({ empresa_id: empresaId, tipo, nombre_archivo: nombre, base64 }).select().single();
      if (data) setHistorialDocumentos(prev => [data, ...prev]);
      return data;
    } catch (err) { console.error('Error saving documento:', err); return null; }
  }

  async function logActivity(empresaId: string, email: string, accion: string, detalle?: string) {
    try { await supabase.from('actividad').insert({ empresa_id: empresaId, user_email: email, accion, detalle }); }
    catch (err) { console.error('Error logging activity:', err); }
  }

  const handleContraparteCertificado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.type !== 'application/pdf') { setError('Solo archivos PDF'); return; }
    const reader = new FileReader();
    reader.onload = () => { const b = (reader.result as string).split(',')[1]; setContraparteForm(p => ({ ...p, certificadoBase64: b, certificadoNombre: file.name })); };
    reader.readAsDataURL(file);
  };

  const handleSaveContraparte = async () => {
    if (!contraparteForm.razon_social && !contraparteForm.certificadoBase64) { setError('Ingresa el nombre o sube un certificado'); return; }
    if (!empresaGuardada) { setError('Primero registra tu empresa'); return; }
    setLoadingContraparte(true); setError('');
    try {
      let finalData: any = { ...contraparteForm };
      if (contraparteForm.certificadoBase64) {
        try {
          const resp = await fetch('https://defiendetetu.app.n8n.cloud/webhook/extraer-contraparte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ certificadoBase64: contraparteForm.certificadoBase64 }) });
          const result = await resp.json();
          if (result.success && result.datosExtraidos && result.contraparte) { finalData = { ...finalData, ...result.contraparte, datos_extraidos: true }; }
          else { setError('La IA no pudo extraer los datos. ' + (result.error || 'Registra manualmente.')); setContraparteForm(p => ({ ...p, certificadoBase64: '', certificadoNombre: '' })); setLoadingContraparte(false); return; }
        } catch (fetchErr) { setError('Error de conexión con n8n. Intenta de nuevo.'); setLoadingContraparte(false); return; }
      }
      const { data: saved, error: dbError } = await supabase.from('contrapartes').insert({ empresa_id: empresaGuardada.id, tipo_persona: finalData.tipo_persona || 'juridica', tipo_relacion: finalData.tipo_relacion || 'cliente', razon_social: finalData.razon_social || '', nit_cc: finalData.nit_cc || finalData.nit || '', representante_legal: finalData.representante_legal || '', ciudad: finalData.ciudad || '', estado: 'activo', datos_extraidos: finalData.datos_extraidos ? finalData : null }).select().single();
      if (dbError) { setError('Error guardando: ' + dbError.message); setLoadingContraparte(false); return; }
      if (saved) { setContrapartes(prev => [saved, ...prev]); setShowNuevaContraparte(false); setContraparteForm({ tipo_persona: 'juridica', tipo_relacion: 'cliente', razon_social: '', nit_cc: '', representante_legal: '', ciudad: '', certificadoBase64: '', certificadoNombre: '' }); if (user) await logActivity(empresaGuardada.id, user.email, 'registrar_contraparte', `Contraparte: ${saved.razon_social}`); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Error al guardar contraparte'); }
    finally { setLoadingContraparte(false); }
  };

  const handleGenerarFCCContraparte = async (contraparte: any) => {
    if (!empresaGuardada) return;
    try {
      const cpData = { ...contraparte, ...(contraparte.datos_extraidos || {}), razon_social: contraparte.razon_social || contraparte.datos_extraidos?.razon_social || '', nit_cc: contraparte.nit_cc || contraparte.datos_extraidos?.nit_cc || contraparte.datos_extraidos?.nit || '', representante_legal: contraparte.representante_legal || contraparte.datos_extraidos?.representante_legal || '', ciudad: contraparte.ciudad || contraparte.datos_extraidos?.ciudad || '', direccion: contraparte.datos_extraidos?.direccion || '', objeto_social: contraparte.datos_extraidos?.objeto_social || '', cedula_rep_legal: contraparte.datos_extraidos?.cedula_rep_legal || '' };
      const resp = await fetch('/api/generar-fcc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ RAZON_SOCIAL: empresaGuardada.razon_social, NIT: empresaGuardada.nit, REPRESENTANTE_LEGAL: empresaGuardada.representante_legal, CIUDAD: empresaGuardada.ciudad, DIRECCION: (empresaGuardada as any).direccion || '', CONTRAPARTE: cpData }) });
      const result = await resp.json();
      if (result.success && result.base64) { dl(result.base64, result.filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); await saveDocumento(empresaGuardada.id, 'fcc', result.filename, result.base64); }
      else { setError('Error generando FCC: ' + (result.error || 'intenta de nuevo')); }
    } catch (err) { console.error('Error generating FCC:', err); setError('Error de conexión al generar FCC'); }
  };

  const handleGenerarListasRestrictivas = async (contraparte: any) => {
    if (!empresaGuardada) return;
    try {
      const cpData = { ...contraparte, ...(contraparte.datos_extraidos || {}), razon_social: contraparte.razon_social || contraparte.datos_extraidos?.razon_social || '', nit_cc: contraparte.nit_cc || contraparte.datos_extraidos?.nit_cc || contraparte.datos_extraidos?.nit || '', representante_legal: contraparte.representante_legal || contraparte.datos_extraidos?.representante_legal || '', ciudad: contraparte.ciudad || contraparte.datos_extraidos?.ciudad || '', direccion: contraparte.datos_extraidos?.direccion || '' };
      const resp = await fetch('/api/generar-listas-restrictivas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ RAZON_SOCIAL: empresaGuardada.razon_social, NIT: empresaGuardada.nit, REPRESENTANTE_LEGAL: empresaGuardada.representante_legal, CIUDAD: empresaGuardada.ciudad, CONTRAPARTE: cpData }) });
      const result = await resp.json();
      if (result.success && result.base64) { dl(result.base64, result.filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); await saveDocumento(empresaGuardada.id, 'listas_restrictivas', result.filename, result.base64); if (user) await logActivity(empresaGuardada.id, user.email, 'generar_listas_restrictivas', `Contraparte: ${cpData.razon_social}`); }
      else { setError('Error generando Listas Restrictivas: ' + (result.error || 'intenta de nuevo')); }
    } catch (err) { console.error('Error generating listas restrictivas:', err); setError('Error de conexión al generar Listas Restrictivas'); }
  };

  const handleContratoTrabajador = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.type !== 'application/pdf') { setError('Solo archivos PDF'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const b = (reader.result as string).split(',')[1];
      setTrabajadorForm(p => ({ ...p, contratoBase64: b, contratoNombre: file.name }));
      setLoadingExtraccion(true); setError('');
      try {
        const resp = await fetch('/api/extraer-trabajador', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contratoBase64: b }) });
        const result = await resp.json();
        if (result.success && result.trabajador) { const t = result.trabajador; setTrabajadorForm(p => ({ ...p, nombre: t.nombre || p.nombre, cedula: t.cedula || p.cedula, cargo: t.cargo || p.cargo, area: t.area || p.area, fecha_ingreso: t.fecha_ingreso || p.fecha_ingreso })); }
        else { setError('No se pudieron extraer datos. Completa manualmente.'); }
      } catch { setError('Error de conexión. Completa manualmente.'); }
      finally { setLoadingExtraccion(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTrabajador = async () => {
    if (!trabajadorForm.nombre) { setError('Ingresa el nombre del trabajador'); return; }
    if (!empresaGuardada) { setError('Primero registra tu empresa'); return; }
    setError('');
    try {
      const datosExtra = { cargo: trabajadorForm.cargo, area: trabajadorForm.area, fecha_ingreso: trabajadorForm.fecha_ingreso, fecha_ultima_declaracion: null, capacitado: false, fecha_capacitacion: null };
      const { data: saved, error: dbError } = await supabase.from('contrapartes').insert({ empresa_id: empresaGuardada.id, tipo_persona: 'natural', tipo_relacion: 'empleado', razon_social: trabajadorForm.nombre, nit_cc: trabajadorForm.cedula, estado: 'activo', datos_extraidos: datosExtra }).select().single();
      if (dbError) { setError('Error guardando: ' + dbError.message); return; }
      if (saved) { setTrabajadores(prev => [saved, ...prev]); setContrapartes(prev => [saved, ...prev]); setShowNuevoTrabajador(false); setTrabajadorForm({ nombre: '', cedula: '', cargo: '', area: '', fecha_ingreso: '', contratoBase64: '', contratoNombre: '' }); if (user) await logActivity(empresaGuardada.id, user.email, 'registrar_trabajador', `Trabajador: ${saved.razon_social}`); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Error al guardar'); }
  };

  const handleGenerarDeclaracion = async (trabajador: any) => {
    if (!empresaGuardada) return;
    setLoadingDeclaracion(trabajador.id);
    try {
      const resp = await fetch('/api/generar-declaración', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ RAZON_SOCIAL: empresaGuardada.razon_social, NIT: empresaGuardada.nit, REPRESENTANTE_LEGAL: empresaGuardada.representante_legal, CIUDAD: empresaGuardada.ciudad, SIGLAS: empresaGuardada.razon_social?.split(' ').filter((p: string) => p.length > 1).map((p: string) => p[0]).join('').substring(0, 4).toUpperCase(), TRABAJADOR: { nombre: trabajador.razon_social, cedula: trabajador.nit_cc, cargo: trabajador.datos_extraidos?.cargo || '', area: trabajador.datos_extraidos?.area || '' } }) });
      const result = await resp.json();
      if (result.success && result.base64) {
        dl(result.base64, result.filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        await saveDocumento(empresaGuardada.id, 'declaracion_trabajadores', result.filename, result.base64);
        const now = new Date().toISOString();
        const updatedDatos = { ...(trabajador.datos_extraidos || {}), fecha_ultima_declaracion: now };
        await supabase.from('contrapartes').update({ datos_extraidos: updatedDatos }).eq('id', trabajador.id);
        setTrabajadores(prev => prev.map(t => t.id === trabajador.id ? { ...t, datos_extraidos: updatedDatos } : t));
      } else { setError('Error generando declaración: ' + (result.error || 'intenta de nuevo')); }
    } catch (err) { setError('Error de conexión al generar declaración'); }
    finally { setLoadingDeclaracion(null); }
  };

  const handleToggleCapacitacion = async (trabajador: any) => {
    const wasCapacitado = trabajador.datos_extraidos?.capacitado;
    const updatedDatos = { ...(trabajador.datos_extraidos || {}), capacitado: !wasCapacitado, fecha_capacitacion: !wasCapacitado ? new Date().toISOString() : null };
    await supabase.from('contrapartes').update({ datos_extraidos: updatedDatos }).eq('id', trabajador.id);
    setTrabajadores(prev => prev.map(t => t.id === trabajador.id ? { ...t, datos_extraidos: updatedDatos } : t));
  };

  const getDeclaracionStatus = (trabajador: any) => {
    const fechaDecl = trabajador.datos_extraidos?.fecha_ultima_declaracion;
    if (!fechaDecl) return { status: 'pendiente', color: '#DC2626', bg: '#FEF2F2', label: 'Sin declaración' };
    const fecha = new Date(fechaDecl);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) return { status: 'vencida', color: '#DC2626', bg: '#FEF2F2', label: 'Vencida' };
    if (diffDays > 335) return { status: 'por_vencer', color: '#D97706', bg: '#FFFBEB', label: `Vence en ${365 - diffDays}d` };
    return { status: 'vigente', color: '#059669', bg: '#ECFDF5', label: 'Vigente' };
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };
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
      const r = await fetch('https://defiendetetu.app.n8n.cloud/webhook/generar-documentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ certificadoBase64: formData.certificadoBase64, manejaEfectivo: formData.manejaEfectivo, operaExtranjeros: formData.operaExtranjeros, canales: formData.canales.join(', '), tieneOficialCumplimiento: formData.tieneOficialCumplimiento || 'no', realizaDebidaDiligencia: formData.realizaDebidaDiligencia || 'no', consultaListasRestrictivas: formData.consultaListasRestrictivas || 'no', tieneProcedimientoROS: formData.tieneProcedimientoROS || 'no', capacitaPersonal: formData.capacitaPersonal || 'no' }) });
      const t = await r.text(); let d; try { d = JSON.parse(t); } catch { throw new Error('Error al procesar respuesta'); }
      if (d.success) {
        setDocumentosGenerados({ manualBase64: d.documentos?.manual?.base64||'', manualNombre: d.documentos?.manual?.nombre||'Manual.docx', matrizBase64: d.documentos?.matriz?.base64||'', matrizNombre: d.documentos?.matriz?.nombre||'Matriz.xlsx', fccBase64: d.documentos?.fcc?.base64||'', fccNombre: d.documentos?.fcc?.nombre||'FCC.xlsx', empresa: d.empresa||'', nit: d.nit||'', representante: d.representante||'' });
        if (user) {
          const empresaId = await saveEmpresa({ empresa: d.empresa, nit: d.nit, representante: d.representante, empresaCorto: d.empresa, sectorNombre: d.documentos?.matriz?.sector || '', codigoCiiu: d.documentos?.matriz?.ciiu || '', perfilRiesgo: d.documentos?.matriz?.perfil || 'MEDIO' }, user.email);
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
  const getMimeForType = (tipo: string) => ['manual', 'listas_restrictivas'].includes(tipo) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const getDocLabel = (tipo: string) => ({ manual: 'Manual de Medidas Mínimas', matriz: 'Matriz de Riesgo', fcc: 'Formulario FCC', fer: 'Evaluación de Riesgos', reporte_eventos: 'Reporte de Eventos', declaracion_trabajadores: 'Declaración de Trabajadores', listas_restrictivas: 'Listas Restrictivas' }[tipo] || tipo);
  const getDocColor = (tipo: string) => ({ manual: '#2563EB', matriz: '#059669', fcc: '#7C3AED', fer: '#D97706', reporte_eventos: '#DC2626', listas_restrictivas: '#1E40AF' }[tipo] || '#2563EB');
  const getDocExt = (tipo: string) => ['manual', 'listas_restrictivas'].includes(tipo) ? 'DOCX' : 'XLSX';

  if (!user) return null;

  const nav = [
    { id: 'home' as ActiveView, label: 'Inicio', svg: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'documentos' as ActiveView, label: 'Documentos', svg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'contrapartes' as ActiveView, label: 'Contrapartes', svg: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'trabajadores' as ActiveView, label: 'Trabajadores', svg: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'agentes' as ActiveView, label: 'AI Agents', svg: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', badge: 'Nuevo' },
    { id: 'matriz' as ActiveView, label: 'Matriz', svg: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7', badge: 'Próximo', disabled: true },
    { id: 'reportes' as ActiveView, label: 'Reportes', svg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', badge: 'Próximo', disabled: true },
  ];

  // Shared component styles
  const cardStyle = { background: '#fff', border: '1px solid #EBEBEB' };
  const btnPrimary = { background: '#111', color: '#fff' };
  const btnSecondary = { border: '1px solid #E0E0E0', color: '#555' };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7F7F7' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-[60px]'} transition-all duration-200 flex flex-col`} style={{ background: '#FAFAFA', borderRight: '1px solid #EBEBEB' }}>
        <div className={`p-4 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} h-14`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[11px]" style={{ background: '#111' }}>C</div>
              <span className="text-[14px] font-semibold" style={{ color: '#111' }}>Comply</span>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[11px]" style={{ background: '#111' }}>C</div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="#999" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} /></svg>
          </button>
        </div>

        <nav className="flex-1 px-2 mt-1 space-y-0.5">
          {nav.map(item => (
            <button key={item.id} onClick={() => !(item as any).disabled && setActiveView(item.id)} disabled={(item as any).disabled}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${(item as any).disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/[0.04]'}`}
              style={activeView === item.id ? { background: '#111', color: '#fff' } : {}}>
              <svg className="w-[16px] h-[16px] flex-shrink-0" fill="none" stroke={activeView === item.id ? '#fff' : '#888'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.svg} /></svg>
              {sidebarOpen && <>
                <span className="text-[13px] flex-1" style={{ color: activeView === item.id ? '#fff' : '#555' }}>{item.label}</span>
                {(item as any).badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                    style={(item as any).badge === 'Nuevo'
                      ? { background: activeView === item.id ? 'rgba(255,255,255,0.2)' : '#111', color: '#fff' }
                      : { background: '#F0F0F0', color: '#999' }
                    }>{(item as any).badge}</span>
                )}
              </>}
            </button>
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid #EBEBEB' }}>
          <div className={`flex items-center ${sidebarOpen ? 'gap-2.5' : 'justify-center'}`}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0" style={{ background: '#555' }}>{user.email[0].toUpperCase()}</div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-[11px] truncate" style={{ color: '#555' }}>{empresaGuardada?.razon_social || user.email}</div>
                <button onClick={handleLogout} className="text-[11px] hover:text-red-500" style={{ color: '#BBB' }}>Salir</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Top bar */}
        <header className="sticky top-0 z-20 px-8 h-14 flex items-center justify-between" style={{ background: 'rgba(247,247,247,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #EBEBEB' }}>
          <h1 className="text-[15px] font-semibold" style={{ color: '#111' }}>
            {activeView === 'home' && 'Panel de Control'}
            {activeView === 'documentos' && 'Generar Documentos'}
            {activeView === 'agentes' && 'AI Agents'}
            {activeView === 'contrapartes' && 'Contrapartes'}
            {activeView === 'trabajadores' && 'Trabajadores'}
          </h1>
          <button onClick={() => { setActiveView('documentos'); setStep(empresaGuardada ? 2 : 1); }}
            className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#111' }}>
            + Nuevo Análisis
          </button>
        </header>

        <div className="p-8">
          {/* ======== HOME ======== */}
          {activeView === 'home' && mounted && (
            <div>
              {/* Company card */}
              <div className="rounded-xl p-6 mb-6" style={cardStyle}>
                {empresaGuardada ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-[14px]" style={{ background: '#111' }}>
                        {empresaGuardada.razon_social?.[0] || 'E'}
                      </div>
                      <div>
                        <h2 className="text-[16px] font-semibold" style={{ color: '#111' }}>{empresaGuardada.razon_social}</h2>
                        <p className="text-[12px]" style={{ color: '#999' }}>NIT: {empresaGuardada.nit} &middot; {empresaGuardada.sector_nombre || 'Sector general'} &middot; Perfil: {empresaGuardada.perfil_riesgo || 'MEDIO'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center"><div className="text-xl font-bold" style={{ color: '#111' }}>{historialDocumentos.length}</div><div className="text-[10px]" style={{ color: '#999' }}>Documentos</div></div>
                      <div className="text-center"><div className="text-xl font-bold" style={{ color: '#111' }}>{contrapartes.filter(c => c.tipo_relacion !== 'empleado').length}</div><div className="text-[10px]" style={{ color: '#999' }}>Contrapartes</div></div>
                      <div className="text-center"><div className="text-xl font-bold" style={{ color: '#111' }}>{trabajadores.length}</div><div className="text-[10px]" style={{ color: '#999' }}>Trabajadores</div></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: '#F5F5F5' }}>
                      <svg className="w-5 h-5" fill="none" stroke="#999" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <div>
                      <h2 className="text-[16px] font-semibold" style={{ color: '#111' }}>Bienvenido a Comply</h2>
                      <p className="text-[13px]" style={{ color: '#999' }}>Sube tu Certificado de Cámara de Comercio para comenzar.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Compliance Charts */}
              {empresaGuardada && (
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {/* Chart 1: Declaraciones de trabajadores */}
                  {(() => {
                    const vigentes = trabajadores.filter(t => getDeclaracionStatus(t).status === 'vigente').length;
                    const porVencer = trabajadores.filter(t => getDeclaracionStatus(t).status === 'por_vencer').length;
                    const pendientes = trabajadores.filter(t => ['pendiente', 'vencida'].includes(getDeclaracionStatus(t).status)).length;
                    const total = trabajadores.length;
                    const pct = total > 0 ? Math.round((vigentes / total) * 100) : 0;
                    const circumference = 2 * Math.PI * 36;
                    const vigenteDash = total > 0 ? (vigentes / total) * circumference : 0;
                    const porVencerDash = total > 0 ? (porVencer / total) * circumference : 0;
                    const pendienteDash = total > 0 ? (pendientes / total) * circumference : circumference;
                    return (
                      <div className="rounded-xl p-5" style={cardStyle}>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: '#999' }}>Declaraciones Trabajadores</div>
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                              <circle cx="40" cy="40" r="36" fill="none" stroke="#F3F3F3" strokeWidth="6" />
                              {total > 0 && <>
                                <circle cx="40" cy="40" r="36" fill="none" stroke="#059669" strokeWidth="6" strokeDasharray={`${vigenteDash} ${circumference}`} strokeDashoffset="0" strokeLinecap="round" />
                                <circle cx="40" cy="40" r="36" fill="none" stroke="#D97706" strokeWidth="6" strokeDasharray={`${porVencerDash} ${circumference}`} strokeDashoffset={`${-vigenteDash}`} strokeLinecap="round" />
                                <circle cx="40" cy="40" r="36" fill="none" stroke="#DC2626" strokeWidth="6" strokeDasharray={`${pendienteDash} ${circumference}`} strokeDashoffset={`${-(vigenteDash + porVencerDash)}`} strokeLinecap="round" />
                              </>}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[16px] font-bold" style={{ color: '#111' }}>{pct}%</span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1.5">
                            {[
                              { label: 'Vigentes', value: vigentes, color: '#059669' },
                              { label: 'Por vencer', value: porVencer, color: '#D97706' },
                              { label: 'Pendientes', value: pendientes, color: '#DC2626' },
                            ].map((item, j) => (
                              <div key={j} className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }}></div>
                                  <span className="text-[11px]" style={{ color: '#666' }}>{item.label}</span>
                                </div>
                                <span className="text-[12px] font-semibold" style={{ color: '#333' }}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Chart 2: Contrapartes por tipo */}
                  {(() => {
                    const contrasOnly = contrapartes.filter(c => c.tipo_relacion !== 'empleado');
                    const tipos = [
                      { key: 'cliente', label: 'Clientes', color: '#2563EB' },
                      { key: 'proveedor', label: 'Proveedores', color: '#7C3AED' },
                      { key: 'aliado', label: 'Aliados', color: '#D97706' },
                    ];
                    const counts = tipos.map(t => ({ ...t, value: contrasOnly.filter(c => c.tipo_relacion === t.key).length }));
                    const otherCount = contrasOnly.length - counts.reduce((s, c) => s + c.value, 0);
                    if (otherCount > 0) counts.push({ key: 'otro', label: 'Otros', color: '#999', value: otherCount });
                    const maxVal = Math.max(...counts.map(c => c.value), 1);
                    return (
                      <div className="rounded-xl p-5" style={cardStyle}>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: '#999' }}>Contrapartes por Tipo</div>
                        <div className="space-y-3">
                          {counts.map((item, j) => (
                            <div key={j}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px]" style={{ color: '#666' }}>{item.label}</span>
                                <span className="text-[12px] font-semibold" style={{ color: '#333' }}>{item.value}</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F3F3' }}>
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(item.value / maxVal) * 100}%`, background: item.color, minWidth: item.value > 0 ? '4px' : '0' }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F5F5F5' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px]" style={{ color: '#999' }}>Total contrapartes</span>
                            <span className="text-[13px] font-bold" style={{ color: '#111' }}>{contrasOnly.length}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Chart 3: Cobertura documental */}
                  {(() => {
                    const docTypes = ['manual', 'matriz', 'fcc'];
                    const docLabels: Record<string, string> = { manual: 'Manual MM', matriz: 'Matriz de Riesgo', fcc: 'Formulario FCC' };
                    const docColors: Record<string, string> = { manual: '#2563EB', matriz: '#059669', fcc: '#7C3AED' };
                    const coverage = docTypes.map(t => ({ type: t, label: docLabels[t], color: docColors[t], generated: historialDocumentos.some(d => d.tipo === t) }));
                    const generatedCount = coverage.filter(c => c.generated).length;
                    const pct = Math.round((generatedCount / docTypes.length) * 100);
                    return (
                      <div className="rounded-xl p-5" style={cardStyle}>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: '#999' }}>Cobertura Documental</div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="text-[28px] font-bold" style={{ color: '#111' }}>{pct}%</div>
                          <div className="text-[11px] leading-tight" style={{ color: '#999' }}>{generatedCount} de {docTypes.length}<br />documentos generados</div>
                        </div>
                        <div className="space-y-2">
                          {coverage.map((doc, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: doc.generated ? doc.color : '#F3F3F3' }}>
                                {doc.generated ? (
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#CCC' }}></div>
                                )}
                              </div>
                              <span className="text-[11px]" style={{ color: doc.generated ? '#333' : '#BBB' }}>{doc.label}</span>
                            </div>
                          ))}
                        </div>
                        {generatedCount < docTypes.length && (
                          <button onClick={() => setActiveView('documentos')} className="w-full mt-3 py-1.5 rounded-lg text-[11px] font-medium" style={{ background: '#F5F5F5', color: '#555' }}>
                            Completar documentación
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Quick actions */}
              <div className="flex gap-3 mb-6">
                {[
                  { title: 'Generar Documentos', view: 'documentos' as ActiveView, svg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { title: 'Contrapartes', view: 'contrapartes' as ActiveView, svg: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                  { title: 'Trabajadores', view: 'trabajadores' as ActiveView, svg: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                ].map((btn, i) => (
                  <button key={i} onClick={() => setActiveView(btn.view)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all hover:shadow-sm" style={{ background: '#111', color: '#fff' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={btn.svg} /></svg>
                    {btn.title}
                    <svg className="w-3 h-3 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>

              {/* Document History */}
              {historialDocumentos.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: '#999' }}>Documentos recientes</h3>
                  <div className="rounded-xl overflow-hidden" style={cardStyle}>
                    {historialDocumentos.slice(0, 8).map((doc, i) => (
                      <div key={doc.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors" style={i > 0 ? { borderTop: '1px solid #F5F5F5' } : {}}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[9px] font-bold" style={{ background: getDocColor(doc.tipo) }}>{getDocExt(doc.tipo)[0]}</div>
                          <div>
                            <div className="font-medium text-[13px]" style={{ color: '#333' }}>{getDocLabel(doc.tipo)}</div>
                            <div className="text-[11px]" style={{ color: '#BBB' }}>{new Date(doc.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          </div>
                        </div>
                        <button onClick={() => dl(doc.base64, doc.nombre_archivo, getMimeForType(doc.tipo))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" title="Descargar">
                          <svg className="w-4 h-4" fill="none" stroke="#666" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 px-4 py-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="#BBB" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[11px]" style={{ color: '#BBB' }}>Tus documentos quedan guardados aquí. Descárgalos cuando quieras con el botón de descarga.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======== AI AGENTS ======== */}
          {activeView === 'agentes' && (
            <div>
              <div className="rounded-xl p-6 mb-6" style={{ ...cardStyle, background: '#111' }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: '#666' }}>COMPLY AI</p>
                <h2 className="text-2xl font-semibold text-white leading-tight mb-2">Agentes de IA especializados en compliance</h2>
                <p className="text-[13px]" style={{ color: '#888' }}>Copilotos autonomos que trabajan 24/7 automatizando screening, monitoreo y reportes.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'Vigia', role: 'Screening Agent', desc: 'Cruza contrapartes contra 300+ listas restrictivas. OFAC, ONU, Procuraduría y PEPs.', features: ['Cruce contra 300+ listas', 'Alertas instantáneas', 'Reportes de debida diligencia'], color: '#2563EB' },
                  { name: 'Centinela', role: 'Monitoring Agent', desc: 'Monitoreo continuo. Detecta operaciónes inusuales y evalua riesgos dinámicamente.', features: ['Monitoreo transaccional', 'Detección de anomalías', 'Evaluación dinámica de riesgo'], color: '#D97706' },
                  { name: 'Cumplidor', role: 'Compliance Agent', desc: 'Genera reportes regulatorios y gestiona el calendario de obligaciones.', features: ['Reportes automáticos', 'Calendario regulatorio', 'Actualización periódica KYC'], color: '#059669' },
                ].map((agent, i) => (
                  <div key={i} className="rounded-xl overflow-hidden" style={cardStyle}>
                    <div className="h-1" style={{ background: agent.color }}></div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[16px] font-semibold" style={{ color: '#111' }}>{agent.name}</h3>
                        <div className="w-2 h-2 rounded-full" style={{ background: agent.color }}></div>
                      </div>
                      <div className="text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: '#BBB' }}>{agent.role}</div>
                      <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#666' }}>{agent.desc}</p>
                      <div className="space-y-2">
                        {agent.features.map((f, j) => (
                          <div key={j} className="flex items-center gap-2 text-[12px]" style={{ color: '#555' }}>
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke={agent.color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-5 py-3" style={{ borderTop: '1px solid #F5F5F5' }}>
                      <button className="w-full py-2 rounded-lg text-[12px] font-medium" style={{ background: '#F5F5F5', color: '#999' }}>Próximamente</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======== CONTRAPARTES ======== */}
          {activeView === 'contrapartes' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="text-[13px]" style={{ color: '#999' }}>Registra y gestiona las contrapartes de tu empresa.</p>
                <button onClick={() => setShowNuevaContraparte(true)} className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#111' }}>+ Nueva Contraparte</button>
              </div>

              {showNuevaContraparte && (
                <div className="rounded-xl p-6 mb-5" style={cardStyle}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[15px]" style={{ color: '#111' }}>Registrar Contraparte</h3>
                    <button onClick={() => setShowNuevaContraparte(false)} className="text-[18px]" style={{ color: '#BBB' }}>x</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[12px] font-medium block mb-1.5" style={{ color: '#555' }}>Tipo de persona</label>
                      <div className="flex gap-2">
                        {['juridica', 'natural'].map(t => (
                          <button key={t} onClick={() => setContraparteForm(p => ({...p, tipo_persona: t}))} className="flex-1 px-3 py-2 rounded-lg text-[12px] font-medium transition-all"
                            style={contraparteForm.tipo_persona === t ? { background: '#111', color: '#fff' } : { background: '#F5F5F5', color: '#666' }}>
                            {t === 'juridica' ? 'Jurídica' : 'Natural'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium block mb-1.5" style={{ color: '#555' }}>Tipo de relación</label>
                      <div className="flex gap-2">
                        {['cliente', 'proveedor', 'empleado'].map(t => (
                          <button key={t} onClick={() => setContraparteForm(p => ({...p, tipo_relacion: t}))} className="flex-1 px-3 py-2 rounded-lg text-[12px] font-medium transition-all"
                            style={contraparteForm.tipo_relacion === t ? { background: '#111', color: '#fff' } : { background: '#F5F5F5', color: '#666' }}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 p-4 rounded-lg" style={{ background: '#FAFAFA', border: '1px dashed #DDD' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[13px]" style={{ color: '#333' }}>Certificado de Cámara de Comercio <span className="font-normal text-[11px]" style={{ color: '#BBB' }}>(opcional)</span></div>
                        <div className="text-[11px] mt-0.5" style={{ color: '#999' }}>Sube el certificado y la IA extraera los datos</div>
                      </div>
                      <button onClick={() => contraparteFileRef.current?.click()} className="px-3 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: '#F0F0F0', color: '#555' }}>
                        {contraparteForm.certificadoBase64 ? contraparteForm.certificadoNombre : 'Subir PDF'}
                      </button>
                      <input type="file" ref={contraparteFileRef} onChange={handleContraparteCertificado} accept=".pdf" className="hidden" />
                    </div>
                  </div>
                  {!contraparteForm.certificadoBase64 && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[12px] font-medium block mb-1" style={{ color: '#555' }}>{contraparteForm.tipo_persona === 'juridica' ? 'Razón Social' : 'Nombre'}</label>
                        <input type="text" value={contraparteForm.razon_social} onChange={e => setContraparteForm(p => ({...p, razon_social: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ border: '1px solid #E0E0E0' }} placeholder={contraparteForm.tipo_persona === 'juridica' ? 'Empresa S.A.S.' : 'Juan Perez'} />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium block mb-1" style={{ color: '#555' }}>{contraparteForm.tipo_persona === 'juridica' ? 'NIT' : 'Cédula'}</label>
                        <input type="text" value={contraparteForm.nit_cc} onChange={e => setContraparteForm(p => ({...p, nit_cc: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ border: '1px solid #E0E0E0' }} />
                      </div>
                      {contraparteForm.tipo_persona === 'juridica' && (
                        <div>
                          <label className="text-[12px] font-medium block mb-1" style={{ color: '#555' }}>Representante Legal</label>
                          <input type="text" value={contraparteForm.representante_legal} onChange={e => setContraparteForm(p => ({...p, representante_legal: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ border: '1px solid #E0E0E0' }} />
                        </div>
                      )}
                      <div>
                        <label className="text-[12px] font-medium block mb-1" style={{ color: '#555' }}>Ciudad</label>
                        <input type="text" value={contraparteForm.ciudad} onChange={e => setContraparteForm(p => ({...p, ciudad: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ border: '1px solid #E0E0E0' }} />
                      </div>
                    </div>
                  )}
                  {error && <div className="mb-4 p-3 rounded-lg text-[12px]" style={{ background: '#FEF2F2', color: '#DC2626' }}>{error}</div>}
                  <div className="flex gap-3">
                    <button onClick={handleSaveContraparte} disabled={loadingContraparte} className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={btnPrimary}>
                      {loadingContraparte ? 'Procesando...' : contraparteForm.certificadoBase64 ? 'Extraer datos y registrar' : 'Registrar'}
                    </button>
                    <button onClick={() => setShowNuevaContraparte(false)} className="px-4 py-2 rounded-lg text-[13px] font-medium" style={btnSecondary}>Cancelar</button>
                  </div>
                </div>
              )}

              {contrapartes.length > 0 ? (
                <div className="rounded-xl overflow-hidden" style={cardStyle}>
                  {contrapartes.map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors" style={i > 0 ? { borderTop: '1px solid #F5F5F5' } : {}}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px]" style={{ background: c.tipo_persona === 'juridica' ? '#DBEAFE' : '#FEF3C7' }}>
                          {c.tipo_persona === 'juridica' ? '🏢' : '👤'}
                        </div>
                        <div>
                          <div className="font-medium text-[13px]" style={{ color: '#111' }}>{c.razon_social || 'Sin nombre'}</div>
                          <div className="text-[11px]" style={{ color: '#BBB' }}>
                            {c.nit_cc || 'Sin doc'} &middot; {c.tipo_relacion?.charAt(0).toUpperCase() + c.tipo_relacion?.slice(1)} &middot; {c.ciudad || ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={c.estado === 'activo' ? { background: '#ECFDF5', color: '#059669' } : { background: '#FEF2F2', color: '#DC2626' }}>
                          {c.estado === 'activo' ? 'Activo' : c.estado}
                        </span>
                        <button onClick={() => handleGenerarFCCContraparte(c)} className="px-3 py-1 rounded-lg text-[11px] font-medium text-white" style={{ background: '#7C3AED' }}>FCC</button>
                        <button onClick={() => handleGenerarListasRestrictivas(c)} className="px-3 py-1 rounded-lg text-[11px] font-medium text-white" style={{ background: '#2563EB' }}>Listas</button>
                        <button onClick={async () => { if (confirm('Eliminar contraparte?')) { await supabase.from('contrapartes').delete().eq('id', c.id); setContrapartes(prev => prev.filter(x => x.id !== c.id)); }}} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50" style={{ color: '#DC2626' }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !showNuevaContraparte && (
                <div className="text-center py-14 rounded-xl" style={cardStyle}>
                  <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="#DDD" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <h3 className="font-semibold text-[14px] mb-1" style={{ color: '#333' }}>No tienes contrapartes</h3>
                  <p className="text-[12px] mb-4" style={{ color: '#999' }}>Registra clientes y proveedores para generar FCC.</p>
                  <button onClick={() => setShowNuevaContraparte(true)} className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white" style={btnPrimary}>+ Registrar primera</button>
                </div>
              )}
            </div>
          )}

          {/* ======== TRABAJADORES ======== */}
          {activeView === 'trabajadores' && (
            <div>
              {trabajadores.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Total', value: trabajadores.length, color: '#111' },
                    { label: 'Vigentes', value: trabajadores.filter(t => getDeclaracionStatus(t).status === 'vigente').length, color: '#059669' },
                    { label: 'Por vencer', value: trabajadores.filter(t => getDeclaracionStatus(t).status === 'por_vencer').length, color: '#D97706' },
                    { label: 'Pendientes', value: trabajadores.filter(t => ['pendiente', 'vencida'].includes(getDeclaracionStatus(t).status)).length, color: '#DC2626' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl p-4 text-center" style={cardStyle}>
                      <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[11px] font-medium mt-0.5" style={{ color: '#999' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-5">
                <p className="text-[13px]" style={{ color: '#999' }}>Declaraciones SAGRILAFT y control de capacitaciones.</p>
                <button onClick={() => setShowNuevoTrabajador(true)} className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={btnPrimary}>+ Nuevo Trabajador</button>
              </div>

              {showNuevoTrabajador && (
                <div className="rounded-xl p-6 mb-5" style={cardStyle}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[15px]" style={{ color: '#111' }}>Registrar Trabajador</h3>
                    <button onClick={() => setShowNuevoTrabajador(false)} className="text-[18px]" style={{ color: '#BBB' }}>x</button>
                  </div>
                  <div className="mb-4 p-4 rounded-lg" style={{ background: '#FAFAFA', border: '1px dashed #DDD' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[13px]" style={{ color: '#333' }}>Contrato laboral <span className="font-normal text-[11px]" style={{ color: '#BBB' }}>(opcional)</span></div>
                        <div className="text-[11px] mt-0.5" style={{ color: '#999' }}>La IA extraera nombre, cedula, cargo, area y fecha</div>
                      </div>
                      <button onClick={() => trabajadorFileRef.current?.click()} disabled={loadingExtraccion} className="px-3 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-50" style={{ background: '#F0F0F0', color: '#555' }}>
                        {loadingExtraccion ? 'Extrayendo...' : trabajadorForm.contratoBase64 ? trabajadorForm.contratoNombre : 'Subir PDF'}
                      </button>
                      <input type="file" ref={trabajadorFileRef} onChange={handleContratoTrabajador} accept=".pdf" className="hidden" />
                    </div>
                    {loadingExtraccion && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[11px]" style={{ color: '#666' }}>Analizando contrato con IA...</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[
                      { key: 'nombre', label: 'Nombre completo *', placeholder: 'Juan Perez Lopez' },
                      { key: 'cedula', label: 'Cédula *', placeholder: '1023456789' },
                      { key: 'cargo', label: 'Cargo', placeholder: 'Asesor Comercial' },
                      { key: 'area', label: 'Area', placeholder: 'Ventas' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[12px] font-medium block mb-1" style={{ color: '#555' }}>{f.label}</label>
                        <input type="text" value={(trabajadorForm as any)[f.key]} onChange={e => setTrabajadorForm(p => ({...p, [f.key]: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-colors" style={{ border: `1px solid ${(trabajadorForm as any)[f.key] && trabajadorForm.contratoBase64 ? '#059669' : '#E0E0E0'}`, background: (trabajadorForm as any)[f.key] && trabajadorForm.contratoBase64 ? '#ECFDF5' : '#fff' }} placeholder={f.placeholder} />
                      </div>
                    ))}
                    <div>
                      <label className="text-[12px] font-medium block mb-1" style={{ color: '#555' }}>Fecha de ingreso</label>
                      <input type="date" value={trabajadorForm.fecha_ingreso} onChange={e => setTrabajadorForm(p => ({...p, fecha_ingreso: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ border: `1px solid ${trabajadorForm.fecha_ingreso && trabajadorForm.contratoBase64 ? '#059669' : '#E0E0E0'}`, background: trabajadorForm.fecha_ingreso && trabajadorForm.contratoBase64 ? '#ECFDF5' : '#fff' }} />
                    </div>
                  </div>
                  {error && <div className="mb-4 p-3 rounded-lg text-[12px]" style={{ background: '#FEF2F2', color: '#DC2626' }}>{error}</div>}
                  <div className="flex gap-3">
                    <button onClick={handleSaveTrabajador} disabled={loadingExtraccion} className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={btnPrimary}>
                      {loadingExtraccion ? 'Extrayendo datos...' : 'Registrar trabajador'}
                    </button>
                    <button onClick={() => setShowNuevoTrabajador(false)} className="px-4 py-2 rounded-lg text-[13px] font-medium" style={btnSecondary}>Cancelar</button>
                  </div>
                </div>
              )}

              {trabajadores.length > 0 ? (
                <div className="rounded-xl overflow-hidden" style={cardStyle}>
                  {trabajadores.map((t, i) => {
                    const declStatus = getDeclaracionStatus(t);
                    const capacitado = t.datos_extraidos?.capacitado;
                    return (
                      <div key={t.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors" style={i > 0 ? { borderTop: '1px solid #F5F5F5' } : {}}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white" style={{ background: '#111' }}>
                            {t.razon_social?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-[13px]" style={{ color: '#111' }}>{t.razon_social || 'Sin nombre'}</div>
                            <div className="text-[11px]" style={{ color: '#BBB' }}>
                              C.C. {t.nit_cc || 'N/A'} &middot; {t.datos_extraidos?.cargo || 'Sin cargo'} &middot; {t.datos_extraidos?.area || ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggleCapacitacion(t)} className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
                            style={capacitado ? { background: '#ECFDF5', color: '#059669' } : { background: '#FEF2F2', color: '#DC2626' }}>
                            {capacitado ? 'Capacitado' : 'Sin capacitar'}
                          </button>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: declStatus.bg, color: declStatus.color }}>{declStatus.label}</span>
                          <button onClick={() => handleGenerarDeclaracion(t)} disabled={loadingDeclaracion === t.id} className="px-3 py-1 rounded-lg text-[11px] font-medium text-white disabled:opacity-50" style={btnPrimary}>
                            {loadingDeclaracion === t.id ? '...' : 'Declaracion'}
                          </button>
                          <button onClick={async () => { if (confirm('Eliminar trabajador?')) { await supabase.from('contrapartes').delete().eq('id', t.id); setTrabajadores(prev => prev.filter(x => x.id !== t.id)); setContrapartes(prev => prev.filter(x => x.id !== t.id)); }}} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50" style={{ color: '#DC2626' }}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !showNuevoTrabajador && (
                <div className="text-center py-14 rounded-xl" style={cardStyle}>
                  <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="#DDD" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <h3 className="font-semibold text-[14px] mb-1" style={{ color: '#333' }}>No tienes trabajadores registrados</h3>
                  <p className="text-[12px] mb-4" style={{ color: '#999' }}>Registra empleados para declaraciones SAGRILAFT.</p>
                  <button onClick={() => setShowNuevoTrabajador(true)} className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white" style={btnPrimary}>+ Registrar primero</button>
                </div>
              )}
            </div>
          )}

          {/* ======== DOCUMENTOS ======== */}
          {activeView === 'documentos' && (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-8 gap-2">
                {[{ n: 1, l: 'Subir' }, { n: 2, l: 'Información' }, { n: 3, l: 'Descargar' }].map((s, i) => (
                  <div key={s.n} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold ${step >= s.n ? 'text-white' : ''}`}
                      style={step >= s.n ? { background: '#111' } : { background: '#F0F0F0', color: '#BBB' }}>
                      {step > s.n ? '✓' : s.n}
                    </div>
                    <span className="text-[12px] font-medium" style={{ color: step >= s.n ? '#111' : '#BBB' }}>{s.l}</span>
                    {i < 2 && <div className="w-10 h-px" style={{ background: step > s.n ? '#111' : '#E0E0E0' }}></div>}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <div className="rounded-xl p-7" style={cardStyle}>
                  {empresaGuardada ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4 p-4 rounded-lg" style={{ background: '#ECFDF5', border: '1px solid #BBF7D0' }}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <div>
                          <div className="font-semibold text-[13px]" style={{ color: '#059669' }}>{empresaGuardada.razon_social}</div>
                          <div className="text-[11px]" style={{ color: '#059669' }}>NIT: {empresaGuardada.nit} — Datos guardados</div>
                        </div>
                      </div>
                      {/* What will be generated */}
                      <div className="mb-5">
                        <p className="text-[13px] font-medium mb-3" style={{ color: '#555' }}>Se generarán los siguientes documentos regulatorios:</p>
                        <div className="space-y-2">
                          {[
                            { name: 'Manual de Medidas Mínimas', desc: 'Documento obligatorio que describe tu sistema de prevención LA/FT/FPADM', ext: 'DOCX', color: '#2563EB' },
                            { name: 'Matriz de Riesgo', desc: 'Evaluación de riesgos con señales de alerta y controles por sector', ext: 'XLSX', color: '#059669' },
                            { name: 'Formulario FCC', desc: 'Formato de Conocimiento del Cliente para debida diligencia', ext: 'XLSX', color: '#7C3AED' },
                          ].map((doc, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#FAFAFA' }}>
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background: doc.color }}>{doc.ext[0]}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-medium" style={{ color: '#333' }}>{doc.name}</div>
                                <div className="text-[11px]" style={{ color: '#999' }}>{doc.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] mt-3" style={{ color: '#BBB' }}>Personalizados con IA para tu sector APNFD según la Resolución 100-006322 de 2023.</p>
                      </div>

                      {/* Listas Restrictivas - standalone */}
                      <div className="mb-5 p-4 rounded-xl" style={{ background: '#F0F4FF', border: '1px solid #DBEAFE' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold" style={{ background: '#1E40AF' }}>D</div>
                          <div>
                            <div className="text-[12px] font-semibold" style={{ color: '#1E40AF' }}>Listas Restrictivas</div>
                            <div className="text-[10px]" style={{ color: '#6B7FAA' }}>Formato de consulta por contraparte — OFAC, ONU, Procuraduría y más</div>
                          </div>
                        </div>
                        {!showListasForm ? (
                          <button onClick={() => setShowListasForm(true)} className="w-full mt-1 py-2 rounded-lg text-[12px] font-medium" style={{ background: '#1E40AF', color: '#fff' }}>
                            Generar formato de consulta
                          </button>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input placeholder="Nombre o Razón Social" value={listasForm.nombre} onChange={e => setListasForm(p => ({ ...p, nombre: e.target.value }))}
                                className="px-3 py-2 rounded-lg text-[12px] outline-none" style={{ background: '#fff', border: '1px solid #DBEAFE' }} />
                              <input placeholder="NIT o Cédula" value={listasForm.nit} onChange={e => setListasForm(p => ({ ...p, nit: e.target.value }))}
                                className="px-3 py-2 rounded-lg text-[12px] outline-none" style={{ background: '#fff', border: '1px solid #DBEAFE' }} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <select value={listasForm.tipo_persona} onChange={e => setListasForm(p => ({ ...p, tipo_persona: e.target.value }))}
                                className="px-3 py-2 rounded-lg text-[12px] outline-none" style={{ background: '#fff', border: '1px solid #DBEAFE' }}>
                                <option value="juridica">Persona Jurídica</option>
                                <option value="natural">Persona Natural</option>
                              </select>
                              <select value={listasForm.tipo_relacion} onChange={e => setListasForm(p => ({ ...p, tipo_relacion: e.target.value }))}
                                className="px-3 py-2 rounded-lg text-[12px] outline-none" style={{ background: '#fff', border: '1px solid #DBEAFE' }}>
                                <option value="cliente">Cliente</option>
                                <option value="proveedor">Proveedor</option>
                                <option value="aliado">Aliado</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setShowListasForm(false)} className="px-3 py-2 rounded-lg text-[12px] font-medium" style={btnSecondary}>Cancelar</button>
                              <button disabled={!listasForm.nombre || loadingListas} onClick={async () => {
                                setLoadingListas(true); setError('');
                                try {
                                  const resp = await fetch('/api/generar-listas-restrictivas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ RAZON_SOCIAL: empresaGuardada.razon_social, NIT: empresaGuardada.nit, REPRESENTANTE_LEGAL: empresaGuardada.representante_legal, CIUDAD: empresaGuardada.ciudad, CONTRAPARTE: { razon_social: listasForm.nombre, nit_cc: listasForm.nit, tipo_persona: listasForm.tipo_persona, tipo_relacion: listasForm.tipo_relacion } }) });
                                  const result = await resp.json();
                                  if (result.success && result.base64) { dl(result.base64, result.filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); await saveDocumento(empresaGuardada.id, 'listas_restrictivas', result.filename, result.base64); if (user) await logActivity(empresaGuardada.id, user.email, 'generar_listas_restrictivas', `Consulta: ${listasForm.nombre}`); setShowListasForm(false); setListasForm({ nombre: '', nit: '', tipo_persona: 'juridica', tipo_relacion: 'cliente' }); }
                                  else { setError('Error: ' + (result.error || 'intenta de nuevo')); }
                                } catch (err) { setError('Error de conexión'); }
                                finally { setLoadingListas(false); }
                              }} className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50" style={{ background: '#1E40AF' }}>
                                {loadingListas ? 'Generando...' : 'Generar Listas Restrictivas'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg text-white font-semibold text-[13px]" style={btnPrimary}>Continuar con la generación</button>
                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 rounded-lg text-[13px] font-medium" style={btnSecondary}>Actualizar certificado</button>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-[17px] font-semibold mb-1" style={{ color: '#111' }}>Sube tu Certificado de Cámara de Comercio</h2>
                      <p className="text-[13px] mb-5" style={{ color: '#999' }}>La IA generara documentos personalizados para tu empresa.</p>
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all hover:border-gray-400"
                        style={{ borderColor: formData.certificadoBase64 ? '#059669' : '#E0E0E0', background: formData.certificadoBase64 ? '#ECFDF5' : '#FAFAFA' }}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                        {formData.certificadoBase64 ? (
                          <><svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><p className="font-medium text-[13px]" style={{ color: '#059669' }}>{formData.certificadoNombre}</p></>
                        ) : (
                          <><svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="#CCC" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg><p className="font-medium text-[13px]" style={{ color: '#555' }}>Arrastra o haz clic para subir</p><p className="text-[11px] mt-1" style={{ color: '#BBB' }}>PDF — Máximo 10MB</p></>
                        )}
                      </div>
                      {formData.certificadoBase64 && <button onClick={() => setStep(2)} className="w-full mt-5 py-2.5 rounded-lg text-white font-semibold text-[13px]" style={btnPrimary}>Continuar</button>}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="rounded-xl p-7" style={cardStyle}>
                  <h2 className="text-[17px] font-semibold mb-5" style={{ color: '#111' }}>Información Adicional</h2>
                  {[{ key: 'manejaEfectivo', q: 'Tu empresa maneja efectivo?' }, { key: 'operaExtranjeros', q: 'Opera con extranjeros?' }].map(q => (
                    <div key={q.key} className="mb-4">
                      <label className="text-[13px] font-medium block mb-2" style={{ color: '#333' }}>{q.q}</label>
                      <div className="flex gap-2">
                        {['Si', 'No'].map(o => (
                          <button key={o} onClick={() => setFormData(p => ({ ...p, [q.key]: o.toLowerCase() }))} className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
                            style={(formData as any)[q.key] === o.toLowerCase() ? { background: '#111', color: '#fff' } : { background: '#F5F5F5', color: '#666' }}>{o}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="mb-4">
                    <label className="text-[13px] font-medium block mb-2" style={{ color: '#333' }}>Canales de operación</label>
                    <div className="flex flex-wrap gap-2">
                      {['Presencial', 'Virtual', 'Telefónico', 'Mixto'].map(c => (
                        <button key={c} onClick={() => handleCanalesChange(c.toLowerCase())} className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
                          style={formData.canales.includes(c.toLowerCase()) ? { background: '#111', color: '#fff' } : { background: '#F5F5F5', color: '#666' }}>{c}</button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 p-4 rounded-lg" style={{ background: '#FAFAFA' }}>
                    <h3 className="text-[12px] font-semibold mb-3" style={{ color: '#555' }}>Estado de cumplimiento</h3>
                    {[{ key: 'tieneOficialCumplimiento', q: 'Oficial de cumplimiento?' },{ key: 'realizaDebidaDiligencia', q: 'Debida diligencia?' },{ key: 'consultaListasRestrictivas', q: 'Consulta listas restrictivas?' },{ key: 'tieneProcedimientoROS', q: 'Procedimiento para ROS?' },{ key: 'capacitaPersonal', q: 'Capacita personal en LA/FT?' }].map(q => (
                      <div key={q.key} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F0F0F0' }}>
                        <span className="text-[12px]" style={{ color: '#555' }}>{q.q}</span>
                        <div className="flex gap-1">
                          {['Si', 'En proceso', 'No'].map(o => (
                            <button key={o} onClick={() => setFormData(p => ({ ...p, [q.key]: o.toLowerCase() }))} className="px-2 py-0.5 rounded text-[10px] font-medium transition-all"
                              style={(formData as any)[q.key] === o.toLowerCase()
                                ? { background: o === 'Si' ? '#059669' : o === 'En proceso' ? '#D97706' : '#DC2626', color: '#fff' }
                                : { background: '#F0F0F0', color: '#BBB' }
                              }>{o}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {error && <div className="mt-4 p-3 rounded-lg text-[12px]" style={{ background: '#FEF2F2', color: '#DC2626' }}>{error}</div>}

                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-lg text-[13px] font-medium" style={btnSecondary}>Atras</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 rounded-lg text-white font-semibold text-[13px] disabled:opacity-50" style={btnPrimary}>
                      {loading ? 'Generando...' : 'Generar Documentos'}
                    </button>
                  </div>

                  {loading && (
                    <div className="mt-6 p-5 rounded-lg text-center" style={{ background: '#FAFAFA' }}>
                      <div className="text-3xl mb-2">{loadingMessages[loadingStep]?.icon}</div>
                      <h3 className="text-[14px] font-semibold mb-0.5" style={{ color: '#111' }}>{loadingMessages[loadingStep]?.text}</h3>
                      <p className="text-[11px] mb-3" style={{ color: '#999' }}>{loadingMessages[loadingStep]?.sub}</p>
                      <div className="max-w-xs mx-auto">
                        <div className="flex justify-between text-[10px] mb-1" style={{ color: '#BBB' }}><span>Progreso</span><span>{Math.round(((loadingStep+1)/loadingMessages.length)*100)}%</span></div>
                        <div className="w-full rounded-full h-1" style={{ background: '#E0E0E0' }}><div className="h-1 rounded-full transition-all duration-1000" style={{ width: `${((loadingStep+1)/loadingMessages.length)*100}%`, background: '#111' }}></div></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && documentosGenerados && (
                <div>
                  <div className="p-5 rounded-xl mb-5" style={{ background: '#ECFDF5', border: '1px solid #BBF7D0' }}>
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <div>
                        <h2 className="text-[15px] font-semibold" style={{ color: '#059669' }}>Documentos listos</h2>
                        <p className="text-[12px]" style={{ color: '#059669' }}>{documentosGenerados.empresa} — NIT: {documentosGenerados.nit}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mb-5">
                    {[
                      { name: 'Manual de Medidas Mínimas', type: 'DOCX', color: '#2563EB', fn: () => dl(documentosGenerados.manualBase64, documentosGenerados.manualNombre, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') },
                      { name: 'Matriz de Riesgo', type: 'XLSX', color: '#059669', fn: () => dl(documentosGenerados.matrizBase64, documentosGenerados.matrizNombre, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') },
                      { name: 'Formulario FCC', type: 'XLSX', color: '#7C3AED', fn: () => dl(documentosGenerados.fccBase64, documentosGenerados.fccNombre, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') },
                    ].map((doc, i) => (
                      <div key={i} className="rounded-xl p-5" style={cardStyle}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: doc.color }}>{doc.type[0]}</div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#F5F5F5', color: '#999' }}>{doc.type}</span>
                        </div>
                        <h4 className="font-medium text-[13px] mb-3" style={{ color: '#111' }}>{doc.name}</h4>
                        <button onClick={doc.fn} className="w-full py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: doc.color }}>Descargar</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setActiveView('home'); setDocumentosGenerados(null); if (user) loadEmpresaData(user.email); }} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white" style={btnPrimary}>Ver Panel</button>
                    <button onClick={() => { setStep(2); setDocumentosGenerados(null); }} className="px-5 py-2.5 rounded-lg text-[13px] font-medium" style={btnSecondary}>Regenerar</button>
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
