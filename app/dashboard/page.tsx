'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { inicializarCalendario, crearEventosParaEntidad, completarEvento, getEventosCalendario, getProximosEventos, actualizarEstados, getEstadoColor, getEstadoLabel, diasRestantes, EventoCalendario } from '@/lib/calendario';
import { CATEGORIA_LABELS, CATEGORIA_COLORS, Regimen } from '@/lib/obligaciones-minimas';

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
  regimen: string;
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
  const [hitosManuales, setHitosManuales] = useState<Record<string, { completado: boolean; fecha?: string; nota?: string }>>({});
  const [editingHito, setEditingHito] = useState<string | null>(null);
  const [hitoNota, setHitoNota] = useState('');
  const [showFerForm, setShowFerForm] = useState(false);
  const [ferStep, setFerStep] = useState(1);
  const [ferForm, setFerForm] = useState({
    reportante_nombre: '', reportante_cargo: '', reportante_area: '', reportante_superior: '',
    descripcion: '', naturaleza: 'operacion_inusual', impacto: 'moderado', probabilidad: 'moderada',
    contraparte_nombre: '', continuar: true, justificacion: '',
    plan_objetivo: 'reducir', plan_descripcion: '', plan_monitoreo: 'trimestral',
  });
  const [loadingFer, setLoadingFer] = useState(false);
  const [ferPrefilledFrom, setFerPrefilledFrom] = useState<string | null>(null);
  const [ferContraparteId, setFerContraparteId] = useState<string>('');
  const [ferAnalyzing, setFerAnalyzing] = useState(false);
  const [ferSuggested, setFerSuggested] = useState(false);
  const [eventosCalendario, setEventosCalendario] = useState<EventoCalendario[]>([]);
  const [proximosEventos, setProximosEventos] = useState<EventoCalendario[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calFiltroEstado, setCalFiltroEstado] = useState('todos');
  const [calFiltroCategoria, setCalFiltroCategoria] = useState('todas');
  const [calVista, setCalVista] = useState<'lista' | 'grilla'>('lista');
  // Reporte de eventos de riesgo
  const [eventosRiesgo, setEventosRiesgo] = useState<any[]>([]);
  const [showReporteForm, setShowReporteForm] = useState(false);
  const [reporteStep, setReporteStep] = useState(1);
  const [reporteForm, setReporteForm] = useState({
    descripcion: '', impacto_potencial: '', acciones_tomadas: '', comentarios: '',
    clasificacion: '', tipo_riesgo: '', nivel_riesgo: '',
    reportante_nombre: '', reportante_identificacion: '',
    contraparte_id: '', contraparte_nombre: '',
  });
  const [reporteAnalisis, setReporteAnalisis] = useState<any>(null);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [loadingClasificacion, setLoadingClasificacion] = useState(false);
  const [reporteFiltro, setReporteFiltro] = useState('todos');
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
        if (empresas[0].hitos_cumplimiento && typeof empresas[0].hitos_cumplimiento === 'object') {
          setHitosManuales(empresas[0].hitos_cumplimiento);
        }
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
        // Load risk events
        const { data: evRiesgo } = await supabase.from('eventos_riesgo').select('*').eq('empresa_id', empresas[0].id).order('created_at', { ascending: false });
        if (evRiesgo) setEventosRiesgo(evRiesgo);
        // Calendar: initialize + load
        const regimen = (empresas[0].regimen || 'minimas') as Regimen;
        await inicializarCalendario(supabase, empresas[0].id, email, regimen);
        await actualizarEstados(supabase, empresas[0].id);
        const prox = await getProximosEventos(supabase, empresas[0].id, 5);
        setProximosEventos(prox);
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
      if (saved) { setContrapartes(prev => [saved, ...prev]); setShowNuevaContraparte(false); setContraparteForm({ tipo_persona: 'juridica', tipo_relacion: 'cliente', razon_social: '', nit_cc: '', representante_legal: '', ciudad: '', certificadoBase64: '', certificadoNombre: '' }); if (user) { await logActivity(empresaGuardada.id, user.email, 'registrar_contraparte', `Contraparte: ${saved.razon_social}`); const regimen = (empresaGuardada.regimen || 'minimas') as Regimen; await crearEventosParaEntidad(supabase, empresaGuardada.id, user.email, regimen, saved.id, 'contraparte', saved.razon_social || ''); const prox = await getProximosEventos(supabase, empresaGuardada.id, 5); setProximosEventos(prox); } }
    } catch (err) { setError(err instanceof Error ? err.message : 'Error al guardar contraparte'); }
    finally { setLoadingContraparte(false); }
  };

  const handleGenerarFCCContraparte = async (contraparte: any) => {
    if (!empresaGuardada) return;
    try {
      const cpData = { ...contraparte, ...(contraparte.datos_extraidos || {}), razon_social: contraparte.razon_social || contraparte.datos_extraidos?.razon_social || '', nit_cc: contraparte.nit_cc || contraparte.datos_extraidos?.nit_cc || contraparte.datos_extraidos?.nit || '', representante_legal: contraparte.representante_legal || contraparte.datos_extraidos?.representante_legal || '', ciudad: contraparte.ciudad || contraparte.datos_extraidos?.ciudad || '', direccion: contraparte.datos_extraidos?.direccion || '', objeto_social: contraparte.datos_extraidos?.objeto_social || '', cedula_rep_legal: contraparte.datos_extraidos?.cedula_rep_legal || '' };
      const resp = await fetch('/api/generar-fcc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ RAZON_SOCIAL: empresaGuardada.razon_social, NIT: empresaGuardada.nit, REPRESENTANTE_LEGAL: empresaGuardada.representante_legal, CIUDAD: empresaGuardada.ciudad, DIRECCION: (empresaGuardada as any).direccion || '', CONTRAPARTE: cpData }) });
      const result = await resp.json();
      if (result.success && result.base64) { dl(result.base64, result.filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); await saveDocumento(empresaGuardada.id, 'fcc', result.filename, result.base64); if (user) { const regimen = (empresaGuardada.regimen || 'minimas') as Regimen; await completarEvento(supabase, empresaGuardada.id, user.email, regimen, 'actualizar_fcc_contraparte', contraparte.id, contraparte.razon_social); const prox = await getProximosEventos(supabase, empresaGuardada.id, 5); setProximosEventos(prox); } }
      else { setError('Error generando FCC: ' + (result.error || 'intenta de nuevo')); }
    } catch (err) { console.error('Error generating FCC:', err); setError('Error de conexión al generar FCC'); }
  };

  const handleGenerarListasRestrictivas = async (contraparte: any) => {
    if (!empresaGuardada) return;
    try {
      const cpData = { ...contraparte, ...(contraparte.datos_extraidos || {}), razon_social: contraparte.razon_social || contraparte.datos_extraidos?.razon_social || '', nit_cc: contraparte.nit_cc || contraparte.datos_extraidos?.nit_cc || contraparte.datos_extraidos?.nit || '', representante_legal: contraparte.representante_legal || contraparte.datos_extraidos?.representante_legal || '', ciudad: contraparte.ciudad || contraparte.datos_extraidos?.ciudad || '', direccion: contraparte.datos_extraidos?.direccion || '' };
      const resp = await fetch('/api/generar-listas-restrictivas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ RAZON_SOCIAL: empresaGuardada.razon_social, NIT: empresaGuardada.nit, REPRESENTANTE_LEGAL: empresaGuardada.representante_legal, CIUDAD: empresaGuardada.ciudad, CONTRAPARTE: cpData }) });
      const result = await resp.json();
      if (result.success && result.base64) { dl(result.base64, result.filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); await saveDocumento(empresaGuardada.id, 'listas_restrictivas', result.filename, result.base64); if (user) { await logActivity(empresaGuardada.id, user.email, 'generar_listas_restrictivas', `Contraparte: ${cpData.razon_social}`); const regimen = (empresaGuardada.regimen || 'minimas') as Regimen; await completarEvento(supabase, empresaGuardada.id, user.email, regimen, 'consultar_listas_contraparte', contraparte.id, cpData.razon_social); const prox = await getProximosEventos(supabase, empresaGuardada.id, 5); setProximosEventos(prox); } }
      else { setError('Error generando Listas Restrictivas: ' + (result.error || 'intenta de nuevo')); }
    } catch (err) { console.error('Error generating listas restrictivas:', err); setError('Error de conexión al generar Listas Restrictivas'); }
  };

  const handleOpenFer = (opts?: { trabajador?: any; contraparte?: any }) => {
    const resetForm = {
      reportante_nombre: '', reportante_cargo: '', reportante_area: '', reportante_superior: empresaGuardada?.representante_legal || '',
      descripcion: '', naturaleza: '', impacto: '', probabilidad: '',
      contraparte_nombre: '', continuar: true, justificacion: '',
      plan_objetivo: 'reducir', plan_descripcion: '', plan_monitoreo: 'trimestral',
    };
    setFerContraparteId('');
    setFerSuggested(false);
    if (opts?.trabajador) {
      resetForm.reportante_nombre = opts.trabajador.razon_social || '';
      resetForm.reportante_cargo = opts.trabajador.datos_extraidos?.cargo || '';
      resetForm.reportante_area = opts.trabajador.datos_extraidos?.area || '';
      setFerPrefilledFrom(opts.trabajador.razon_social || null);
    } else if (opts?.contraparte) {
      resetForm.contraparte_nombre = opts.contraparte.razon_social || '';
      setFerContraparteId(opts.contraparte.id || '');
      setFerPrefilledFrom(opts.contraparte.razon_social || null);
    } else {
      setFerPrefilledFrom(null);
    }
    setFerForm(resetForm);
    setFerStep(1);
    setShowFerForm(true);
  };

  const handleToggleHito = async (key: string) => {
    if (!empresaGuardada) return;
    const current = hitosManuales[key];
    const updated = { ...hitosManuales };
    if (current?.completado) {
      updated[key] = { completado: false };
      setEditingHito(null);
    } else {
      setEditingHito(key);
      setHitoNota('');
      return;
    }
    setHitosManuales(updated);
    await supabase.from('empresas').update({ hitos_cumplimiento: updated }).eq('id', empresaGuardada.id);
  };

  const handleConfirmHito = async (key: string) => {
    if (!empresaGuardada) return;
    const updated = { ...hitosManuales, [key]: { completado: true, fecha: new Date().toISOString(), nota: hitoNota || undefined } };
    setHitosManuales(updated);
    setEditingHito(null);
    setHitoNota('');
    await supabase.from('empresas').update({ hitos_cumplimiento: updated }).eq('id', empresaGuardada.id);
    if (user) await logActivity(empresaGuardada.id, user.email, 'completar_hito', `Hito: ${key}${hitoNota ? ' — ' + hitoNota : ''}`);
  };

  const handleGenerarFer = async () => {
    if (!empresaGuardada) return;
    setLoadingFer(true); setError('');
    try {
      const matrizRiesgo: Record<string, Record<string, string>> = {
        alta: { alto: 'alto', moderado: 'alto', bajo: 'moderado' },
        moderada: { alto: 'alto', moderado: 'moderado', bajo: 'bajo' },
        baja: { alto: 'moderado', moderado: 'bajo', bajo: 'bajo' },
      };
      const riesgoInherente = matrizRiesgo[ferForm.probabilidad]?.[ferForm.impacto] || 'moderado';
      const resp = await fetch('/api/generar-fer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        RAZON_SOCIAL: empresaGuardada.razon_social, NIT: empresaGuardada.nit, REPRESENTANTE_LEGAL: empresaGuardada.representante_legal, CIUDAD: empresaGuardada.ciudad,
        REPORTANTE: { nombre: ferForm.reportante_nombre, cargo: ferForm.reportante_cargo, area: ferForm.reportante_area, superior: ferForm.reportante_superior || empresaGuardada.representante_legal },
        EVENTO: { descripcion: ferForm.descripcion, naturaleza: ferForm.naturaleza, impacto: ferForm.impacto, probabilidad: ferForm.probabilidad },
        DECISION: { continuar: ferForm.continuar, justificacion: ferForm.justificacion },
        PLAN: { objetivo: ferForm.plan_objetivo, descripcion: ferForm.plan_descripcion, monitoreo: ferForm.plan_monitoreo, prioridad: riesgoInherente === 'alto' ? 'alta' : riesgoInherente === 'moderado' ? 'media' : 'baja' },
        CONTRAPARTE_NOMBRE: ferForm.contraparte_nombre,
      }) });
      const result = await resp.json();
      if (result.success && result.base64) {
        dl(result.base64, result.filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        await saveDocumento(empresaGuardada.id, 'fer', result.filename, result.base64);
        if (user) { await logActivity(empresaGuardada.id, user.email, 'generar_fer', `FER: ${ferForm.naturaleza} — ${ferForm.contraparte_nombre || 'sin contraparte'}`); const regimen = (empresaGuardada.regimen || 'minimas') as Regimen; await completarEvento(supabase, empresaGuardada.id, user.email, regimen, 'revision_fer'); const prox = await getProximosEventos(supabase, empresaGuardada.id, 5); setProximosEventos(prox); }
        setShowFerForm(false);
      } else { setError('Error generando FER: ' + (result.error || 'intenta de nuevo')); }
    } catch (err) { setError('Error de conexión al generar FER'); }
    finally { setLoadingFer(false); }
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
      if (saved) { setTrabajadores(prev => [saved, ...prev]); setContrapartes(prev => [saved, ...prev]); setShowNuevoTrabajador(false); setTrabajadorForm({ nombre: '', cedula: '', cargo: '', area: '', fecha_ingreso: '', contratoBase64: '', contratoNombre: '' }); if (user) { await logActivity(empresaGuardada.id, user.email, 'registrar_trabajador', `Trabajador: ${saved.razon_social}`); const regimen = (empresaGuardada.regimen || 'minimas') as Regimen; await crearEventosParaEntidad(supabase, empresaGuardada.id, user.email, regimen, saved.id, 'trabajador', saved.razon_social || ''); const prox = await getProximosEventos(supabase, empresaGuardada.id, 5); setProximosEventos(prox); } }
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
        if (user) { const regimen = (empresaGuardada.regimen || 'minimas') as Regimen; await completarEvento(supabase, empresaGuardada.id, user.email, regimen, 'declaracion_trabajador', trabajador.id, trabajador.razon_social); const prox = await getProximosEventos(supabase, empresaGuardada.id, 5); setProximosEventos(prox); }
      } else { setError('Error generando declaración: ' + (result.error || 'intenta de nuevo')); }
    } catch (err) { setError('Error de conexión al generar declaración'); }
    finally { setLoadingDeclaracion(null); }
  };

  const handleToggleCapacitacion = async (trabajador: any) => {
    const wasCapacitado = trabajador.datos_extraidos?.capacitado;
    const updatedDatos = { ...(trabajador.datos_extraidos || {}), capacitado: !wasCapacitado, fecha_capacitacion: !wasCapacitado ? new Date().toISOString() : null };
    await supabase.from('contrapartes').update({ datos_extraidos: updatedDatos }).eq('id', trabajador.id);
    setTrabajadores(prev => prev.map(t => t.id === trabajador.id ? { ...t, datos_extraidos: updatedDatos } : t));
    if (!wasCapacitado && user && empresaGuardada) { const regimen = (empresaGuardada.regimen || 'minimas') as Regimen; await completarEvento(supabase, empresaGuardada.id, user.email, regimen, 'capacitacion_trabajador', trabajador.id, trabajador.razon_social); const prox = await getProximosEventos(supabase, empresaGuardada.id, 5); setProximosEventos(prox); }
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
            const regimen = 'minimas' as Regimen;
            await inicializarCalendario(supabase, empresaId, user.email, regimen);
            if (d.documentos?.manual?.base64) await completarEvento(supabase, empresaId, user.email, regimen, 'renovar_manual');
            if (d.documentos?.matriz?.base64) await completarEvento(supabase, empresaId, user.email, regimen, 'renovar_matriz');
            if (d.documentos?.fcc?.base64) await completarEvento(supabase, empresaId, user.email, regimen, 'renovar_fcc');
            const prox = await getProximosEventos(supabase, empresaId, 5);
            setProximosEventos(prox);
          }
        }
        setStep(3);
      } else { setError(d.error || 'Error al generar documentos'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Error de conexión'); } finally { setLoading(false); }
  };

  const dl = (b64: string, fn: string, mime: string) => { const bc = atob(b64); const bn = new Array(bc.length); for (let i=0;i<bc.length;i++) bn[i]=bc.charCodeAt(i); const blob = new Blob([new Uint8Array(bn)],{type:mime}); const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download=fn; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); };
  const getMimeForType = (tipo: string) => ['manual', 'listas_restrictivas', 'fer'].includes(tipo) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const getDocLabel = (tipo: string) => ({ manual: 'Manual de Medidas Mínimas', matriz: 'Matriz de Riesgo', fcc: 'Formulario FCC', fer: 'Evaluación de Riesgos (FER)', reporte_eventos: 'Reporte de Eventos', declaracion_trabajadores: 'Declaración de Trabajadores', listas_restrictivas: 'Listas Restrictivas' }[tipo] || tipo);
  const getDocColor = (tipo: string) => ({ manual: '#2563EB', matriz: '#059669', fcc: '#7C3AED', fer: '#D97706', reporte_eventos: '#DC2626', listas_restrictivas: '#1E40AF' }[tipo] || '#2563EB');
  const getDocExt = (tipo: string) => ['manual', 'listas_restrictivas', 'fer'].includes(tipo) ? 'DOCX' : 'XLSX';

  if (!user) return null;

  const nav = [
    { id: 'home' as ActiveView, label: 'Inicio', svg: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'documentos' as ActiveView, label: 'Documentos', svg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'contrapartes' as ActiveView, label: 'Contrapartes', svg: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'trabajadores' as ActiveView, label: 'Trabajadores', svg: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'agentes' as ActiveView, label: 'AI Agents', svg: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', badge: 'Nuevo' },
    { id: 'matriz' as ActiveView, label: 'Matriz', svg: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7', badge: 'Próximo', disabled: true },
    { id: 'reportes' as ActiveView, label: 'Reportes', svg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', badge: 'Nuevo' },
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
            {activeView === 'reportes' && 'Reporte de Eventos de Riesgo'}
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

              {/* Compliance Tracker */}
              {empresaGuardada && (() => {
                const autoHitos = [
                  { key: 'manual', label: 'Manual de Medidas Mínimas', desc: 'Se genera en la sección Documentos', done: historialDocumentos.some(d => d.tipo === 'manual') },
                  { key: 'matriz', label: 'Matriz de Riesgo', desc: 'Se genera en la sección Documentos', done: historialDocumentos.some(d => d.tipo === 'matriz') },
                  { key: 'fcc', label: 'Formulario FCC', desc: 'Se genera en la sección Documentos', done: historialDocumentos.some(d => d.tipo === 'fcc') },
                  { key: 'listas', label: 'Consulta de Listas Restrictivas', desc: 'Se genera desde Contrapartes o Documentos', done: historialDocumentos.some(d => d.tipo === 'listas_restrictivas') },
                  { key: 'fer', label: 'Evaluación de Riesgos (FER)', desc: 'Se genera desde Trabajadores, Contrapartes o Documentos', done: historialDocumentos.some(d => d.tipo === 'fer') },
                  ...(trabajadores.length > 0 ? [
                    { key: 'capacitacion', label: 'Capacitación del personal', desc: `${trabajadores.filter(t => t.datos_extraidos?.capacitado).length}/${trabajadores.length} marcados como capacitados en Trabajadores`, done: trabajadores.every(t => t.datos_extraidos?.capacitado) },
                    { key: 'declaraciones', label: 'Declaraciones de trabajadores', desc: `${trabajadores.filter(t => getDeclaracionStatus(t).status === 'vigente').length}/${trabajadores.length} con declaración vigente`, done: trabajadores.every(t => getDeclaracionStatus(t).status === 'vigente') },
                  ] : []),
                ];
                const manualHitosData = [
                  { key: 'oficial_cumplimiento', label: 'Oficial de cumplimiento designado', desc: 'Designar formalmente a la persona responsable del sistema SAGRILAFT mediante acta o resolución interna.', placeholder: 'Ej: Acta No. 12 del 15/03/2026 — María López designada', done: hitosManuales.oficial_cumplimiento?.completado || false },
                  { key: 'debida_diligencia', label: 'Debida diligencia implementada', desc: 'Tener documentado el procedimiento de conocimiento del cliente (KYC) y aplicarlo a nuevas contrapartes.', placeholder: 'Ej: Procedimiento DD-001 aprobado el 10/02/2026', done: hitosManuales.debida_diligencia?.completado || false },
                  { key: 'procedimiento_ros', label: 'Procedimiento para ROS', desc: 'Establecer el procedimiento interno para detectar y reportar Operaciones Sospechosas ante la UIAF.', placeholder: 'Ej: Protocolo ROS aprobado por junta directiva', done: hitosManuales.procedimiento_ros?.completado || false },
                ];
                const allHitos = [...autoHitos, ...manualHitosData];
                const completed = allHitos.filter(h => h.done).length;
                const total = allHitos.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const circumference = 2 * Math.PI * 40;
                const dashOffset = circumference - (pct / 100) * circumference;
                const pctColor = pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626';

                return (
                  <div className="rounded-xl mb-6 overflow-hidden" style={cardStyle}>
                    {/* Score header */}
                    <div className="p-6">
                      <div className="flex items-center gap-5">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
                            <circle cx="44" cy="44" r="40" fill="none" stroke="#F3F3F3" strokeWidth="5" />
                            <circle cx="44" cy="44" r="40" fill="none" stroke={pctColor} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-700" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[20px] font-bold" style={{ color: pctColor }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-1" style={{ color: '#999' }}>Cumplimiento SAGRILAFT</div>
                          <div className="text-[15px] font-semibold mb-1" style={{ color: '#111' }}>{completed} de {total} hitos completados</div>
                          <p className="text-[11px]" style={{ color: '#999' }}>
                            {pct === 100 ? 'Todos los hitos de cumplimiento están al día.' :
                             pct >= 80 ? 'Buen nivel de cumplimiento. Completa los hitos restantes.' :
                             pct >= 50 ? 'Nivel intermedio. Continúa avanzando en los hitos pendientes.' :
                             'Tu cumplimiento necesita atención. Completa los hitos prioritarios.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Group 1: Auto-detected */}
                    <div className="px-6 py-2" style={{ background: '#FAFAFA', borderTop: '1px solid #F0F0F0' }}>
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="#999" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#999' }}>Se detectan automáticamente</span>
                        <span className="text-[10px]" style={{ color: '#CCC' }}>— se marcan cuando usas la plataforma</span>
                      </div>
                    </div>
                    <div>
                      {autoHitos.map((hito, i) => (
                        <div key={hito.key} className="flex items-center gap-3 px-6 py-3" style={i > 0 ? { borderTop: '1px solid #FAFAFA' } : {}}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: hito.done ? '#059669' : '#F0F0F0' }}>
                            {hito.done ? (
                              <svg className="w-3 h-3" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#CCC' }}></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium" style={{ color: hito.done ? '#333' : '#888' }}>{hito.label}</div>
                            <div className="text-[10px]" style={{ color: hito.done ? '#999' : '#CCC' }}>{hito.desc}</div>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded font-medium flex-shrink-0" style={hito.done ? { background: '#ECFDF5', color: '#059669' } : { background: '#F5F5F5', color: '#CCC' }}>
                            {hito.done ? 'Completado' : 'Pendiente'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Group 2: Manual confirmation */}
                    <div className="px-6 py-2" style={{ background: '#FFFBEB', borderTop: '1px solid #F0F0F0' }}>
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="#D97706" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#92400E' }}>Requieren tu confirmación</span>
                        <span className="text-[10px]" style={{ color: '#B45309' }}>— marca cuando los hayas implementado</span>
                      </div>
                    </div>
                    <div>
                      {manualHitosData.map((hito, i) => (
                        <div key={hito.key}>
                          <div className="flex items-start gap-3 px-6 py-3.5" style={i > 0 ? { borderTop: '1px solid #FAFAFA' } : {}}>
                            <button onClick={() => handleToggleHito(hito.key)} className="w-5 h-5 mt-0.5 rounded flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: hito.done ? '#059669' : '#fff', border: hito.done ? 'none' : '2px solid #D0D0D0', cursor: 'pointer', borderRadius: '4px' }}>
                              {hito.done && <svg className="w-3 h-3" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-medium" style={{ color: hito.done ? '#333' : '#555' }}>{hito.label}</div>
                              <div className="text-[10px] mt-0.5 leading-relaxed" style={{ color: '#999' }}>{hito.desc}</div>
                              {hito.done && hitosManuales[hito.key]?.fecha && (
                                <div className="text-[10px] mt-1 flex items-center gap-1" style={{ color: '#059669' }}>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  Confirmado el {new Date(hitosManuales[hito.key].fecha!).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  {hitosManuales[hito.key]?.nota && <> — {hitosManuales[hito.key].nota}</>}
                                </div>
                              )}
                            </div>
                            {!hito.done && (
                              <button onClick={() => handleToggleHito(hito.key)} className="px-3 py-1.5 rounded-lg text-[11px] font-medium flex-shrink-0 transition-colors hover:shadow-sm" style={{ background: '#111', color: '#fff' }}>
                                Confirmar
                              </button>
                            )}
                          </div>
                          {editingHito === hito.key && (
                            <div className="px-6 pb-4 pt-1 ml-8" style={{ background: '#FAFAFA' }}>
                              <div className="p-3 rounded-lg" style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
                                <label className="text-[10px] font-semibold block mb-1.5" style={{ color: '#555' }}>Describe brevemente la evidencia o acción realizada</label>
                                <input type="text" value={hitoNota} onChange={e => setHitoNota(e.target.value)} autoFocus
                                  className="w-full px-3 py-2 rounded-lg text-[12px] outline-none mb-2" style={{ border: '1px solid #E0E0E0' }}
                                  placeholder={hito.placeholder} onKeyDown={e => e.key === 'Enter' && handleConfirmHito(hito.key)} />
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => setEditingHito(null)} className="px-3 py-1.5 rounded-lg text-[11px] font-medium" style={{ background: '#F0F0F0', color: '#999' }}>Cancelar</button>
                                  <button onClick={() => handleConfirmHito(hito.key)} className="px-4 py-1.5 rounded-lg text-[11px] font-medium text-white" style={{ background: '#059669' }}>
                                    Confirmar hito
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

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

              {/* Calendario de Cumplimiento inline */}
              {empresaGuardada && (() => {
                const loadCalData = async () => {
                  const data = await getEventosCalendario(supabase, empresaGuardada.id, {
                    estado: calFiltroEstado, categoria: calFiltroCategoria,
                    mes: calendarMonth.getMonth(), anio: calendarMonth.getFullYear(),
                  });
                  setEventosCalendario(data);
                };
                if (eventosCalendario.length === 0 && calFiltroEstado === 'todos' && calFiltroCategoria === 'todas') {
                  loadCalData();
                }

                const mesNombre = calendarMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
                const primerDia = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
                const ultimoDia = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
                const diasEnMes = ultimoDia.getDate();
                const primerDiaSemana = primerDia.getDay();
                const hoy = new Date();
                const eventosPorDia: Record<number, EventoCalendario[]> = {};
                eventosCalendario.forEach(ev => {
                  const d = new Date(ev.fecha_vencimiento);
                  if (d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear()) {
                    const day = d.getDate();
                    if (!eventosPorDia[day]) eventosPorDia[day] = [];
                    eventosPorDia[day].push(ev);
                  }
                });

                const cambiarMes = async (dir: number) => {
                  const nuevo = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + dir, 1);
                  setCalendarMonth(nuevo);
                  const data = await getEventosCalendario(supabase, empresaGuardada.id, {
                    estado: calFiltroEstado, categoria: calFiltroCategoria,
                    mes: nuevo.getMonth(), anio: nuevo.getFullYear(),
                  });
                  setEventosCalendario(data);
                };

                const aplicarFiltro = async (est: string, cat: string) => {
                  setCalFiltroEstado(est);
                  setCalFiltroCategoria(cat);
                  const data = await getEventosCalendario(supabase, empresaGuardada.id, {
                    estado: est, categoria: cat,
                    mes: calendarMonth.getMonth(), anio: calendarMonth.getFullYear(),
                  });
                  setEventosCalendario(data);
                };

                const completarManual = async (ev: EventoCalendario) => {
                  const regimen = (empresaGuardada.regimen || 'minimas') as Regimen;
                  await completarEvento(supabase, empresaGuardada.id, user!.email, regimen, ev.obligacion_key, ev.entidad_id || undefined, ev.entidad_nombre || undefined);
                  await logActivity(empresaGuardada.id, user!.email, 'completar_evento_calendario', ev.titulo);
                  const data = await getEventosCalendario(supabase, empresaGuardada.id, {
                    estado: calFiltroEstado, categoria: calFiltroCategoria,
                    mes: calendarMonth.getMonth(), anio: calendarMonth.getFullYear(),
                  });
                  setEventosCalendario(data);
                  const prox = await getProximosEventos(supabase, empresaGuardada.id, 5);
                  setProximosEventos(prox);
                };

                const vencidos = proximosEventos.filter(e => e.estado === 'vencido').length;
                const proximos = proximosEventos.filter(e => e.estado === 'proximo').length;

                return (
                  <div className="rounded-xl mb-6 overflow-hidden" style={cardStyle}>
                    {/* Calendar header */}
                    <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F0F0F0' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FFFBEB' }}>
                          <svg className="w-4 h-4" fill="none" stroke="#D97706" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <span className="text-[13px] font-semibold" style={{ color: '#111' }}>Calendario Normativo</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {vencidos > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#FEE2E2', color: '#991B1B' }}>{vencidos} vencido{vencidos > 1 ? 's' : ''}</span>}
                            {proximos > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#FEF3C7', color: '#92400E' }}>{proximos} próximo{proximos > 1 ? 's' : ''}</span>}
                            {vencidos === 0 && proximos === 0 && <span className="text-[10px]" style={{ color: '#999' }}>Todo al día</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #E0E0E0' }}>
                          <button onClick={() => setCalVista('lista')} className="px-2.5 py-1 text-[10px] font-medium" style={calVista === 'lista' ? { background: '#111', color: '#fff' } : { background: '#fff', color: '#666' }}>Lista</button>
                          <button onClick={() => setCalVista('grilla')} className="px-2.5 py-1 text-[10px] font-medium" style={calVista === 'grilla' ? { background: '#111', color: '#fff' } : { background: '#fff', color: '#666' }}>Grilla</button>
                        </div>
                      </div>
                    </div>

                    {/* Month nav + filters */}
                    <div className="px-6 py-3 flex items-center gap-3" style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                      <button onClick={() => cambiarMes(-1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white" style={{ border: '1px solid #E0E0E0' }}>
                        <svg className="w-3 h-3" fill="none" stroke="#555" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-[12px] font-semibold capitalize min-w-[120px] text-center" style={{ color: '#111' }}>{mesNombre}</span>
                      <button onClick={() => cambiarMes(1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white" style={{ border: '1px solid #E0E0E0' }}>
                        <svg className="w-3 h-3" fill="none" stroke="#555" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <div className="flex-1"></div>
                      <select value={calFiltroEstado} onChange={e => aplicarFiltro(e.target.value, calFiltroCategoria)}
                        className="px-2 py-1 rounded text-[10px] outline-none" style={{ border: '1px solid #E0E0E0', background: '#fff' }}>
                        <option value="todos">Todos</option>
                        <option value="vencido">Vencidos</option>
                        <option value="proximo">Próximos</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="completado">Completados</option>
                      </select>
                      <select value={calFiltroCategoria} onChange={e => aplicarFiltro(calFiltroEstado, e.target.value)}
                        className="px-2 py-1 rounded text-[10px] outline-none" style={{ border: '1px solid #E0E0E0', background: '#fff' }}>
                        <option value="todas">Todas</option>
                        {Object.entries(CATEGORIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>

                    {/* Grid view */}
                    {calVista === 'grilla' && (
                      <div>
                        <div className="grid grid-cols-7">
                          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                            <div key={d} className="text-center py-1.5 text-[9px] font-semibold uppercase" style={{ color: '#999', background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7">
                          {Array.from({ length: primerDiaSemana }).map((_, i) => (
                            <div key={`e-${i}`} className="min-h-[72px] p-1" style={{ borderBottom: '1px solid #F5F5F5', borderRight: '1px solid #F5F5F5' }}></div>
                          ))}
                          {Array.from({ length: diasEnMes }).map((_, i) => {
                            const dia = i + 1;
                            const esHoy = dia === hoy.getDate() && calendarMonth.getMonth() === hoy.getMonth() && calendarMonth.getFullYear() === hoy.getFullYear();
                            const evsDia = eventosPorDia[dia] || [];
                            return (
                              <div key={dia} className="min-h-[72px] p-1" style={{ borderBottom: '1px solid #F5F5F5', borderRight: '1px solid #F5F5F5', background: esHoy ? '#FFFBEB' : 'transparent' }}>
                                <div className={`text-[10px] font-medium mb-0.5 ${esHoy ? 'w-5 h-5 rounded-full flex items-center justify-center text-white' : ''}`}
                                  style={esHoy ? { background: '#D97706' } : { color: '#555' }}>{dia}</div>
                                {evsDia.slice(0, 2).map(ev => {
                                  const catC = CATEGORIA_COLORS[ev.categoria] || CATEGORIA_COLORS.documental;
                                  return (
                                    <div key={ev.id} className="flex items-center gap-0.5 mb-0.5" title={ev.titulo}>
                                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ev.estado === 'completado' ? '#059669' : ev.estado === 'vencido' ? '#DC2626' : catC.dot }}></div>
                                      <span className="text-[8px] truncate" style={{ color: '#666' }}>{ev.titulo.length > 15 ? ev.titulo.slice(0, 15) + '…' : ev.titulo}</span>
                                    </div>
                                  );
                                })}
                                {evsDia.length > 2 && <span className="text-[8px]" style={{ color: '#999' }}>+{evsDia.length - 2}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* List view */}
                    {calVista === 'lista' && (
                      <div>
                        {eventosCalendario.length === 0 ? (
                          <div className="py-8 text-center">
                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="#DDD" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="text-[12px]" style={{ color: '#999' }}>Sin eventos para este mes</p>
                          </div>
                        ) : eventosCalendario.map((ev, i) => {
                          const dias = diasRestantes(ev.fecha_vencimiento);
                          const estadoC = getEstadoColor(ev.estado);
                          const catC = CATEGORIA_COLORS[ev.categoria] || CATEGORIA_COLORS.documental;
                          return (
                            <div key={ev.id} className="flex items-center gap-3 px-6 py-3" style={i > 0 ? { borderTop: '1px solid #F5F5F5' } : {}}>
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: catC.bg }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: catC.dot }}></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-medium" style={{ color: ev.estado === 'completado' ? '#999' : '#333', textDecoration: ev.estado === 'completado' ? 'line-through' : 'none' }}>{ev.titulo}</div>
                                <div className="text-[10px]" style={{ color: '#999' }}>
                                  {new Date(ev.fecha_vencimiento).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {' · '}{CATEGORIA_LABELS[ev.categoria] || ev.categoria}
                                  {ev.recurrencia && <> · Recurrente ({ev.recurrencia})</>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: estadoC.bg, color: estadoC.text }}>
                                  {ev.estado === 'completado' ? 'Hecho' : dias < 0 ? `Vencido (${Math.abs(dias)}d)` : dias === 0 ? 'Hoy' : `${dias}d`}
                                </span>
                                {ev.estado !== 'completado' && ev.estado !== 'cancelado' && (
                                  <button onClick={() => completarManual(ev)} className="px-2 py-0.5 rounded text-[9px] font-medium text-white" style={{ background: '#059669' }}>
                                    Completar
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Category legend */}
                    <div className="px-6 py-2.5 flex flex-wrap gap-3" style={{ background: '#FAFAFA', borderTop: '1px solid #F0F0F0' }}>
                      {Object.entries(CATEGORIA_LABELS).map(([key, label]) => {
                        const c = CATEGORIA_COLORS[key];
                        return (
                          <div key={key} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: c.dot }}></div>
                            <span className="text-[9px]" style={{ color: '#888' }}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

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

          {/* ======== REPORTES DE EVENTOS DE RIESGO ======== */}
          {activeView === 'reportes' && (
            <div>
              {/* Header */}
              <div className="rounded-xl p-6 mb-6" style={{ ...cardStyle, background: '#111' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: '#666' }}>SAGRILAFT</p>
                    <h2 className="text-xl font-semibold text-white leading-tight mb-2">Reporte de Eventos de Riesgo</h2>
                    <p className="text-[13px]" style={{ color: '#888' }}>Clasifica y reporta operaciones inusuales o sospechosas. El sistema analiza el evento y sugiere la clasificación.</p>
                  </div>
                  <button onClick={() => { setShowReporteForm(true); setReporteStep(1); setReporteForm({ descripcion: '', impacto_potencial: '', acciones_tomadas: '', comentarios: '', clasificacion: '', tipo_riesgo: '', nivel_riesgo: '', reportante_nombre: '', reportante_identificacion: '', contraparte_id: '', contraparte_nombre: '' }); setReporteAnalisis(null); }}
                    className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white flex-shrink-0" style={{ background: '#DC2626' }}>
                    + Reportar Evento
                  </button>
                </div>
              </div>

              {/* Stats */}
              {eventosRiesgo.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total eventos', value: eventosRiesgo.length, color: '#111' },
                    { label: 'Abiertos', value: eventosRiesgo.filter(e => e.estado === 'abierto').length, color: '#D97706' },
                    { label: 'Op. Sospechosas', value: eventosRiesgo.filter(e => e.clasificacion === 'sospechosa').length, color: '#DC2626' },
                    { label: 'Reportados UIAF', value: eventosRiesgo.filter(e => e.estado === 'reportado_uiaf').length, color: '#059669' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl p-4 text-center" style={cardStyle}>
                      <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[10px] mt-1" style={{ color: '#999' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Filter */}
              <div className="flex items-center gap-3 mb-4">
                {['todos', 'abierto', 'en_revision', 'cerrado', 'reportado_uiaf'].map(f => (
                  <button key={f} onClick={() => setReporteFiltro(f)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                    style={reporteFiltro === f ? { background: '#111', color: '#fff' } : { background: '#fff', color: '#666', border: '1px solid #E0E0E0' }}>
                    {f === 'todos' ? 'Todos' : f === 'abierto' ? 'Abiertos' : f === 'en_revision' ? 'En revisión' : f === 'cerrado' ? 'Cerrados' : 'Reportados UIAF'}
                  </button>
                ))}
              </div>

              {/* Events table */}
              <div className="rounded-xl overflow-hidden mb-6" style={cardStyle}>
                {eventosRiesgo.filter(e => reporteFiltro === 'todos' || e.estado === reporteFiltro).length === 0 ? (
                  <div className="py-12 text-center">
                    <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="#DDD" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-[13px] font-medium" style={{ color: '#999' }}>No hay eventos registrados</p>
                    <p className="text-[11px] mt-1" style={{ color: '#CCC' }}>Reporta tu primer evento de riesgo</p>
                  </div>
                ) : eventosRiesgo.filter(e => reporteFiltro === 'todos' || e.estado === reporteFiltro).map((ev, i) => {
                  const estadoColors: Record<string, { bg: string; text: string }> = {
                    abierto: { bg: '#FEF3C7', text: '#92400E' },
                    en_revision: { bg: '#DBEAFE', text: '#1E40AF' },
                    cerrado: { bg: '#E5E7EB', text: '#374151' },
                    reportado_uiaf: { bg: '#D1FAE5', text: '#065F46' },
                  };
                  const ec = estadoColors[ev.estado] || estadoColors.abierto;
                  const contraparteEventos = ev.contraparte_id ? eventosRiesgo.filter(e => e.contraparte_id === ev.contraparte_id).length : 0;
                  return (
                    <div key={ev.id} className="px-6 py-4" style={i > 0 ? { borderTop: '1px solid #F5F5F5' } : {}}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: ev.clasificacion === 'sospechosa' ? '#FEE2E2' : '#FEF3C7' }}>
                          <svg className="w-4 h-4" fill="none" stroke={ev.clasificacion === 'sospechosa' ? '#DC2626' : '#D97706'} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[12px] font-semibold" style={{ color: ev.clasificacion === 'sospechosa' ? '#DC2626' : '#D97706' }}>
                              {ev.clasificacion === 'sospechosa' ? 'Op. Sospechosa' : 'Op. Inusual'}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: ec.bg, color: ec.text }}>
                              {ev.estado === 'abierto' ? 'Abierto' : ev.estado === 'en_revision' ? 'En revisión' : ev.estado === 'cerrado' ? 'Cerrado' : 'Reportado UIAF'}
                            </span>
                            {ev.nivel_riesgo_sugerido && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                                style={{ background: ev.nivel_riesgo_sugerido === 'critico' || ev.nivel_riesgo_sugerido === 'alto' ? '#FEE2E2' : ev.nivel_riesgo_sugerido === 'medio' ? '#FEF3C7' : '#D1FAE5', color: ev.nivel_riesgo_sugerido === 'critico' || ev.nivel_riesgo_sugerido === 'alto' ? '#991B1B' : ev.nivel_riesgo_sugerido === 'medio' ? '#92400E' : '#065F46' }}>
                                Riesgo {ev.nivel_riesgo_sugerido}
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] mb-1" style={{ color: '#333' }}>{ev.descripcion?.slice(0, 150)}{ev.descripcion?.length > 150 ? '...' : ''}</p>
                          <div className="flex items-center gap-3 text-[10px]" style={{ color: '#999' }}>
                            <span>{new Date(ev.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {ev.contraparte_nombre && <span>Contraparte: {ev.contraparte_nombre}</span>}
                            {contraparteEventos > 1 && <span className="font-medium" style={{ color: '#DC2626' }}>{contraparteEventos} eventos acumulados</span>}
                            {ev.tipo_riesgo && <span>{ev.tipo_riesgo === 'lavado' ? 'LA' : ev.tipo_riesgo === 'terrorismo' ? 'FT' : 'FPADM'}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {ev.estado === 'abierto' && (
                            <select value={ev.estado} onChange={async (e) => {
                              const nuevoEstado = e.target.value;
                              await supabase.from('eventos_riesgo').update({ estado: nuevoEstado, ...(nuevoEstado === 'reportado_uiaf' ? { fecha_reporte_uiaf: new Date().toISOString() } : {}), updated_at: new Date().toISOString() }).eq('id', ev.id);
                              setEventosRiesgo(prev => prev.map(x => x.id === ev.id ? { ...x, estado: nuevoEstado } : x));
                              if (user && empresaGuardada) await logActivity(empresaGuardada.id, user.email, 'cambiar_estado_evento', `Evento ${ev.id.slice(0, 8)} → ${nuevoEstado}`);
                            }} className="px-2 py-1 rounded text-[10px] outline-none" style={{ border: '1px solid #E0E0E0' }}>
                              <option value="abierto">Abierto</option>
                              <option value="en_revision">En revisión</option>
                              <option value="cerrado">Cerrar</option>
                              <option value="reportado_uiaf">Reportado UIAF</option>
                            </select>
                          )}
                          {ev.documento_id && (
                            <button onClick={() => {
                              const doc = historialDocumentos.find(d => d.id === ev.documento_id);
                              if (doc) dl(doc.base64, doc.nombre_archivo, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                            }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100" title="Descargar reporte">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="#666" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reporte Evento Modal */}
          {showReporteForm && empresaGuardada && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6" style={{ background: '#fff' }}>
                {/* Step indicator */}
                <div className="flex items-center gap-3 mb-6">
                  {['Descripción', 'Clasificación IA', 'Reportante'].map((label, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={reporteStep > i + 1 ? { background: '#059669', color: '#fff' } : reporteStep === i + 1 ? { background: '#111', color: '#fff' } : { background: '#F0F0F0', color: '#999' }}>
                        {reporteStep > i + 1 ? '✓' : i + 1}
                      </div>
                      <span className="text-[11px] font-medium" style={{ color: reporteStep === i + 1 ? '#111' : '#999' }}>{label}</span>
                      {i < 2 && <div className="w-8 h-px" style={{ background: '#E0E0E0' }}></div>}
                    </div>
                  ))}
                  <div className="flex-1"></div>
                  <button onClick={() => setShowReporteForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="#999" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Step 1: Description + contraparte */}
                {reporteStep === 1 && (
                  <div>
                    <h3 className="text-[16px] font-semibold mb-1" style={{ color: '#111' }}>Describe el evento de riesgo</h3>
                    <p className="text-[12px] mb-4" style={{ color: '#999' }}>El sistema analizará la descripción para sugerir la clasificación automáticamente.</p>

                    <label className="text-[11px] font-semibold block mb-1.5" style={{ color: '#555' }}>Contraparte involucrada (opcional)</label>
                    <select value={reporteForm.contraparte_id} onChange={e => {
                      const id = e.target.value;
                      const cp = contrapartes.find(c => c.id === id);
                      setReporteForm(p => ({ ...p, contraparte_id: id, contraparte_nombre: cp?.razon_social || '' }));
                    }} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none mb-4" style={{ border: '1px solid #E0E0E0' }}>
                      <option value="">Sin contraparte</option>
                      {contrapartes.filter(c => c.tipo_relacion !== 'empleado').map(c => (
                        <option key={c.id} value={c.id}>{c.razon_social} ({c.tipo_relacion})</option>
                      ))}
                    </select>

                    {reporteForm.contraparte_id && (() => {
                      const prevEvents = eventosRiesgo.filter(e => e.contraparte_id === reporteForm.contraparte_id);
                      const cpListas = historialDocumentos.filter(d => d.tipo === 'listas_restrictivas');
                      const cpFer = historialDocumentos.filter(d => d.tipo === 'fer');
                      if (prevEvents.length > 0 || cpListas.length > 0) {
                        return (
                          <div className="rounded-lg p-3 mb-4" style={{ background: prevEvents.length >= 2 ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${prevEvents.length >= 2 ? '#FECACA' : '#FDE68A'}` }}>
                            <div className="text-[11px] font-semibold mb-1" style={{ color: prevEvents.length >= 2 ? '#991B1B' : '#92400E' }}>
                              Historial de {reporteForm.contraparte_nombre}
                            </div>
                            <div className="text-[10px] space-y-0.5" style={{ color: '#666' }}>
                              <div>{prevEvents.length} evento(s) de riesgo previo(s) {prevEvents.filter(e => e.clasificacion === 'sospechosa').length > 0 && <span style={{ color: '#DC2626' }}>(incluye sospechosas)</span>}</div>
                              <div>{cpListas.length} consulta(s) de listas restrictivas</div>
                              <div>{cpFer.length} evaluación(es) de riesgo (FER)</div>
                              {prevEvents.length >= 2 && <div className="font-semibold mt-1" style={{ color: '#DC2626' }}>Contraparte con eventos acumulados — considerar escalamiento</div>}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <label className="text-[11px] font-semibold block mb-1.5" style={{ color: '#555' }}>Descripción del evento *</label>
                    <textarea value={reporteForm.descripcion} onChange={e => setReporteForm(p => ({ ...p, descripcion: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-[12px] outline-none mb-4" style={{ border: '1px solid #E0E0E0', minHeight: '120px' }}
                      placeholder="Describe detalladamente el evento observado: qué ocurrió, quién estuvo involucrado, montos, fechas, circunstancias..." />

                    <label className="text-[11px] font-semibold block mb-1.5" style={{ color: '#555' }}>Impacto potencial</label>
                    <textarea value={reporteForm.impacto_potencial} onChange={e => setReporteForm(p => ({ ...p, impacto_potencial: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-[12px] outline-none mb-4" style={{ border: '1px solid #E0E0E0', minHeight: '60px' }}
                      placeholder="¿Qué consecuencias podría tener este evento para la organización?" />

                    <label className="text-[11px] font-semibold block mb-1.5" style={{ color: '#555' }}>Acciones tomadas hasta ahora</label>
                    <textarea value={reporteForm.acciones_tomadas} onChange={e => setReporteForm(p => ({ ...p, acciones_tomadas: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-[12px] outline-none mb-4" style={{ border: '1px solid #E0E0E0', minHeight: '60px' }}
                      placeholder="¿Se han tomado medidas? ¿Se notificó a alguien?" />

                    <div className="flex justify-end gap-3">
                      <button onClick={() => setShowReporteForm(false)} className="px-4 py-2 rounded-lg text-[12px] font-medium" style={{ background: '#F0F0F0', color: '#999' }}>Cancelar</button>
                      <button onClick={async () => {
                        if (!reporteForm.descripcion || reporteForm.descripcion.length < 20) { setError('La descripción debe tener al menos 20 caracteres'); return; }
                        setLoadingClasificacion(true);
                        try {
                          const prevEvents = reporteForm.contraparte_id ? eventosRiesgo.filter(e => e.contraparte_id === reporteForm.contraparte_id).length : 0;
                          const resp = await fetch('/api/clasificar-evento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ descripcion: reporteForm.descripcion, contraparte_eventos_previos: prevEvents }) });
                          const result = await resp.json();
                          if (result.success) {
                            setReporteAnalisis(result);
                            setReporteForm(p => ({ ...p, clasificacion: result.clasificacion, tipo_riesgo: result.tipo_riesgo, nivel_riesgo: result.nivel_riesgo }));
                            setReporteStep(2);
                          } else { setError('Error al clasificar: ' + result.error); }
                        } catch { setError('Error de conexión'); }
                        finally { setLoadingClasificacion(false); }
                      }} disabled={loadingClasificacion} className="px-5 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#111' }}>
                        {loadingClasificacion ? 'Analizando...' : 'Analizar evento →'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: AI Classification */}
                {reporteStep === 2 && reporteAnalisis && (
                  <div>
                    <h3 className="text-[16px] font-semibold mb-4" style={{ color: '#111' }}>Clasificación del evento</h3>

                    {/* Classification result */}
                    <div className="rounded-xl p-4 mb-4" style={{ background: reporteForm.clasificacion === 'sospechosa' ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${reporteForm.clasificacion === 'sospechosa' ? '#FECACA' : '#FDE68A'}` }}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: reporteForm.clasificacion === 'sospechosa' ? '#DC2626' : '#D97706' }}>
                          <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        </div>
                        <div>
                          <div className="text-[14px] font-bold" style={{ color: reporteForm.clasificacion === 'sospechosa' ? '#991B1B' : '#92400E' }}>
                            {reporteForm.clasificacion === 'sospechosa' ? 'Operación Sospechosa' : 'Operación Inusual'}
                          </div>
                          <div className="text-[11px]" style={{ color: '#999' }}>Confianza: {reporteAnalisis.confianza} — Puedes modificar la clasificación abajo</div>
                        </div>
                      </div>
                      {reporteAnalisis.explicaciones?.map((exp: string, i: number) => (
                        <div key={i} className="text-[11px] flex items-start gap-1.5 mt-1" style={{ color: '#666' }}>
                          <span>•</span><span>{exp}</span>
                        </div>
                      ))}
                    </div>

                    {reporteForm.clasificacion === 'sospechosa' && (
                      <div className="rounded-lg p-3 mb-4 flex items-start gap-2" style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}>
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="#DC2626" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div className="text-[11px]" style={{ color: '#991B1B' }}>
                          <span className="font-bold">Obligación legal:</span> Las operaciones sospechosas deben reportarse a la UIAF dentro de las 24 horas siguientes. No alertar a la contraparte (deber de reserva).
                        </div>
                      </div>
                    )}

                    {/* Recommended actions */}
                    {reporteAnalisis.acciones_recomendadas?.length > 0 && (
                      <div className="rounded-lg p-3 mb-4" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                        <div className="text-[11px] font-semibold mb-1" style={{ color: '#1E40AF' }}>Acciones recomendadas:</div>
                        {reporteAnalisis.acciones_recomendadas.map((a: string, i: number) => (
                          <div key={i} className="text-[10px] flex items-start gap-1.5 mt-0.5" style={{ color: '#1E40AF' }}>
                            <span>{i + 1}.</span><span>{a}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Editable classification */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[11px] font-semibold block mb-1.5" style={{ color: '#555' }}>Clasificación</label>
                        <select value={reporteForm.clasificacion} onChange={e => setReporteForm(p => ({ ...p, clasificacion: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0' }}>
                          <option value="inusual">Operación Inusual</option>
                          <option value="sospechosa">Operación Sospechosa</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold block mb-1.5" style={{ color: '#555' }}>Tipo de riesgo</label>
                        <select value={reporteForm.tipo_riesgo} onChange={e => setReporteForm(p => ({ ...p, tipo_riesgo: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0' }}>
                          <option value="lavado">Lavado de Activos</option>
                          <option value="terrorismo">Financiamiento del Terrorismo</option>
                          <option value="proliferacion">Proliferación de Armas</option>
                        </select>
                      </div>
                    </div>

                    <label className="text-[11px] font-semibold block mb-1.5" style={{ color: '#555' }}>Comentarios adicionales</label>
                    <textarea value={reporteForm.comentarios} onChange={e => setReporteForm(p => ({ ...p, comentarios: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-[12px] outline-none mb-4" style={{ border: '1px solid #E0E0E0', minHeight: '60px' }}
                      placeholder="Observaciones o contexto adicional..." />

                    <div className="flex justify-between">
                      <button onClick={() => setReporteStep(1)} className="px-4 py-2 rounded-lg text-[12px] font-medium" style={{ background: '#F0F0F0', color: '#666' }}>← Volver</button>
                      <button onClick={() => setReporteStep(3)} className="px-5 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#111' }}>Continuar →</button>
                    </div>
                  </div>
                )}

                {/* Step 3: Reporter + generate */}
                {reporteStep === 3 && (
                  <div>
                    <h3 className="text-[16px] font-semibold mb-1" style={{ color: '#111' }}>Datos del reportante</h3>
                    <p className="text-[12px] mb-4" style={{ color: '#999' }}>Quien detectó o tiene conocimiento del evento.</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="text-[11px] font-semibold block mb-1.5" style={{ color: '#555' }}>Nombre del reportante</label>
                        <input type="text" value={reporteForm.reportante_nombre} onChange={e => setReporteForm(p => ({ ...p, reportante_nombre: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0' }} placeholder="Nombre completo" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold block mb-1.5" style={{ color: '#555' }}>Identificación</label>
                        <input type="text" value={reporteForm.reportante_identificacion} onChange={e => setReporteForm(p => ({ ...p, reportante_identificacion: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0' }} placeholder="Cédula o documento" />
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="rounded-lg p-4 mb-6" style={{ background: '#FAFAFA', border: '1px solid #EBEBEB' }}>
                      <div className="text-[11px] font-semibold mb-2" style={{ color: '#555' }}>Resumen del reporte</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><span style={{ color: '#999' }}>Clasificación:</span> <span className="font-medium" style={{ color: reporteForm.clasificacion === 'sospechosa' ? '#DC2626' : '#D97706' }}>{reporteForm.clasificacion === 'sospechosa' ? 'Op. Sospechosa' : 'Op. Inusual'}</span></div>
                        <div><span style={{ color: '#999' }}>Tipo:</span> <span className="font-medium" style={{ color: '#333' }}>{reporteForm.tipo_riesgo === 'lavado' ? 'LA' : reporteForm.tipo_riesgo === 'terrorismo' ? 'FT' : 'FPADM'}</span></div>
                        <div><span style={{ color: '#999' }}>Nivel de riesgo:</span> <span className="font-medium">{reporteForm.nivel_riesgo}</span></div>
                        {reporteForm.contraparte_nombre && <div><span style={{ color: '#999' }}>Contraparte:</span> <span className="font-medium">{reporteForm.contraparte_nombre}</span></div>}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <button onClick={() => setReporteStep(2)} className="px-4 py-2 rounded-lg text-[12px] font-medium" style={{ background: '#F0F0F0', color: '#666' }}>← Volver</button>
                      <button onClick={async () => {
                        setLoadingReporte(true); setError('');
                        try {
                          // Get contraparte history
                          let historial = null;
                          if (reporteForm.contraparte_id) {
                            const prevEv = eventosRiesgo.filter(e => e.contraparte_id === reporteForm.contraparte_id);
                            const cpListas = historialDocumentos.filter(d => d.tipo === 'listas_restrictivas');
                            const cpFer = historialDocumentos.filter(d => d.tipo === 'fer');
                            historial = { nombre: reporteForm.contraparte_nombre, eventos_previos: prevEv.length, ultima_consulta_listas: cpListas.length > 0 ? new Date(cpListas[0].created_at).toLocaleDateString('es-CO') : null, fer_count: cpFer.length };
                          }
                          // Generate document
                          const resp = await fetch('/api/generar-reporte-evento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                            RAZON_SOCIAL: empresaGuardada.razon_social, NIT: empresaGuardada.nit, REPRESENTANTE_LEGAL: empresaGuardada.representante_legal, CIUDAD: empresaGuardada.ciudad,
                            EVENTO: { clasificacion: reporteForm.clasificacion, tipo_riesgo: reporteForm.tipo_riesgo, descripcion: reporteForm.descripcion, impacto_potencial: reporteForm.impacto_potencial, acciones_tomadas: reporteForm.acciones_tomadas, comentarios: reporteForm.comentarios },
                            REPORTANTE: { nombre: reporteForm.reportante_nombre, identificacion: reporteForm.reportante_identificacion },
                            ANALISIS: reporteAnalisis, HISTORIAL_CONTRAPARTE: historial,
                          }) });
                          const result = await resp.json();
                          if (result.success && result.base64) {
                            dl(result.base64, result.filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                            const savedDoc = await saveDocumento(empresaGuardada.id, 'reporte_eventos', result.filename, result.base64);
                            // Save event to DB
                            const { data: savedEvento } = await supabase.from('eventos_riesgo').insert({
                              empresa_id: empresaGuardada.id, user_email: user!.email,
                              clasificacion: reporteForm.clasificacion, tipo_riesgo: reporteForm.tipo_riesgo,
                              descripcion: reporteForm.descripcion, impacto_potencial: reporteForm.impacto_potencial,
                              acciones_tomadas: reporteForm.acciones_tomadas, comentarios: reporteForm.comentarios,
                              reportante_nombre: reporteForm.reportante_nombre, reportante_identificacion: reporteForm.reportante_identificacion,
                              contraparte_id: reporteForm.contraparte_id || null, contraparte_nombre: reporteForm.contraparte_nombre || null,
                              estado: 'abierto', nivel_riesgo_sugerido: reporteForm.nivel_riesgo,
                              confianza_clasificacion: reporteAnalisis?.confianza || null,
                              analisis_ia: reporteAnalisis, documento_id: savedDoc?.id || null,
                              mes_reporte: new Date().toLocaleDateString('es-CO', { month: 'long' }),
                              anio_reporte: new Date().getFullYear(),
                            }).select().single();
                            if (savedEvento) setEventosRiesgo(prev => [savedEvento, ...prev]);
                            // Calendar: UIAF alert for sospechosa
                            if (reporteForm.clasificacion === 'sospechosa') {
                              const regimen = (empresaGuardada.regimen || 'minimas') as Regimen;
                              const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                              await supabase.from('eventos_calendario').insert({
                                empresa_id: empresaGuardada.id, user_email: user!.email, regimen,
                                obligacion_key: 'reporte_uiaf_urgente', titulo: 'URGENTE: Reportar operación sospechosa a UIAF',
                                descripcion: `Operación sospechosa detectada: ${reporteForm.descripcion.slice(0, 100)}...`,
                                categoria: 'reporte', fecha_vencimiento: tomorrow.toISOString(),
                                recurrencia: null, estado: 'proximo', prioridad: 'alta',
                                entidad_tipo: 'evento_riesgo', entidad_id: savedEvento?.id || null,
                              });
                              const prox = await getProximosEventos(supabase, empresaGuardada.id, 5);
                              setProximosEventos(prox);
                            }
                            await logActivity(empresaGuardada.id, user!.email, 'generar_reporte_evento', `${reporteForm.clasificacion}: ${reporteForm.descripcion.slice(0, 80)}`);
                            setShowReporteForm(false);
                          } else { setError('Error generando reporte: ' + (result.error || '')); }
                        } catch (err) { setError('Error de conexión al generar reporte'); }
                        finally { setLoadingReporte(false); }
                      }} disabled={loadingReporte} className="px-5 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#DC2626' }}>
                        {loadingReporte ? 'Generando...' : 'Generar reporte'}
                      </button>
                    </div>
                  </div>
                )}
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
                        {['cliente', 'proveedor', 'aliado'].map(t => (
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
                        <div className="font-medium text-[13px]" style={{ color: '#333' }}>
                          {contraparteForm.tipo_persona === 'juridica' ? 'Certificado de Cámara de Comercio' : 'RUT o Cédula'}{' '}
                          <span className="font-normal text-[11px]" style={{ color: '#BBB' }}>(opcional)</span>
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: '#999' }}>
                          {contraparteForm.tipo_persona === 'juridica'
                            ? 'Sube el certificado y la IA extraerá los datos'
                            : 'Sube el RUT o cédula en PDF y la IA extraerá los datos'}
                        </div>
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
                        <button onClick={() => handleOpenFer({ contraparte: c })} className="px-3 py-1 rounded-lg text-[11px] font-medium text-white" style={{ background: '#D97706' }}>FER</button>
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
                          <button onClick={() => handleOpenFer({ trabajador: t })} className="px-3 py-1 rounded-lg text-[11px] font-medium text-white" style={{ background: '#D97706' }}>FER</button>
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
            <div className="max-w-5xl mx-auto">
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
                <div>
                  {empresaGuardada ? (
                    <div>
                      {/* Company banner */}
                      <div className="rounded-xl p-5 mb-6 flex items-center justify-between" style={cardStyle}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-[13px]" style={{ background: '#111' }}>
                            {empresaGuardada.razon_social?.[0] || 'E'}
                          </div>
                          <div>
                            <div className="font-semibold text-[14px]" style={{ color: '#111' }}>{empresaGuardada.razon_social}</div>
                            <div className="text-[11px]" style={{ color: '#999' }}>NIT: {empresaGuardada.nit} &middot; Datos guardados</div>
                          </div>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-lg text-[11px] font-medium" style={btnSecondary}>Actualizar certificado</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                      </div>

                      {/* SECTION 1: Main regulatory documents */}
                      <div className="rounded-xl p-6 mb-6" style={cardStyle}>
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <h3 className="text-[14px] font-semibold" style={{ color: '#111' }}>Documentos regulatorios</h3>
                            <p className="text-[11px] mt-0.5" style={{ color: '#999' }}>Generados con IA para tu sector APNFD — Resolución 100-006322 de 2023</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          {[
                            { name: 'Manual de Medidas Mínimas', desc: 'Sistema de prevención LA/FT/FPADM obligatorio', svg: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: '#2563EB' },
                            { name: 'Matriz de Riesgo', desc: 'Señales de alerta y controles por sector', svg: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7', color: '#059669' },
                            { name: 'Formulario FCC', desc: 'Conocimiento del Cliente para debida diligencia', svg: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: '#7C3AED' },
                          ].map((doc, i) => (
                            <div key={i} className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: doc.color + '15' }}>
                                <svg className="w-5 h-5" fill="none" stroke={doc.color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={doc.svg} /></svg>
                              </div>
                              <div className="text-[13px] font-semibold mb-1" style={{ color: '#111' }}>{doc.name}</div>
                              <div className="text-[11px]" style={{ color: '#999' }}>{doc.desc}</div>
                            </div>
                          ))}
                        </div>

                        <button onClick={() => setStep(2)} className="w-full py-3 rounded-lg text-white font-semibold text-[13px]" style={btnPrimary}>
                          Continuar con la generación
                          <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                      </div>

                      {/* SECTION 2: Additional documents */}
                      <div className="mb-1">
                        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: '#999' }}>Documentos adicionales</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Listas Restrictivas */}
                        <div className="rounded-xl overflow-hidden" style={cardStyle}>
                          <div className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                                <svg className="w-5 h-5" fill="none" stroke="#2563EB" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                              </div>
                              <div>
                                <div className="text-[13px] font-semibold" style={{ color: '#111' }}>Listas Restrictivas</div>
                                <div className="text-[10px]" style={{ color: '#999' }}>OFAC, ONU, Procuraduría y más</div>
                              </div>
                            </div>
                            {!showListasForm ? (
                              <button onClick={() => setShowListasForm(true)} className="w-full py-2 rounded-lg text-[12px] font-medium text-white" style={{ background: '#2563EB' }}>
                                Generar consulta
                              </button>
                            ) : (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <input placeholder="Nombre o Razón Social" value={listasForm.nombre} onChange={e => setListasForm(p => ({ ...p, nombre: e.target.value }))}
                                    className="px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0' }} />
                                  <input placeholder="NIT o Cédula" value={listasForm.nit} onChange={e => setListasForm(p => ({ ...p, nit: e.target.value }))}
                                    className="px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0' }} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <select value={listasForm.tipo_persona} onChange={e => setListasForm(p => ({ ...p, tipo_persona: e.target.value }))}
                                    className="px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0', background: '#fff' }}>
                                    <option value="juridica">Jurídica</option>
                                    <option value="natural">Natural</option>
                                  </select>
                                  <select value={listasForm.tipo_relacion} onChange={e => setListasForm(p => ({ ...p, tipo_relacion: e.target.value }))}
                                    className="px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0', background: '#fff' }}>
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
                                  }} className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50" style={{ background: '#2563EB' }}>
                                    {loadingListas ? 'Generando...' : 'Generar'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* FER */}
                        <div className="rounded-xl overflow-hidden" style={cardStyle}>
                          <div className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#FFFBEB' }}>
                                <svg className="w-5 h-5" fill="none" stroke="#D97706" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                              </div>
                              <div>
                                <div className="text-[13px] font-semibold" style={{ color: '#111' }}>Evaluación de Riesgos (FER)</div>
                                <div className="text-[10px]" style={{ color: '#999' }}>Evaluación guiada con IA</div>
                              </div>
                            </div>
                            <button onClick={() => handleOpenFer()} className="w-full py-2 rounded-lg text-[12px] font-medium text-white" style={{ background: '#D97706' }}>
                              Iniciar evaluación
                            </button>
                          </div>
                        </div>
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

        {/* ======== FER MODAL ======== */}
        {showFerForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-lg mx-4 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide" style={{ background: '#fff' }}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 rounded-t-xl" style={{ background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
                <div>
                  <h3 className="font-semibold text-[15px]" style={{ color: '#111' }}>Evaluación de Riesgos (FER)</h3>
                  <p className="text-[11px]" style={{ color: '#999' }}>
                    {ferPrefilledFrom ? `Desde: ${ferPrefilledFrom}` : 'Evaluación guiada LA/FT/FPADM'}
                    {' — '}Paso {ferStep} de 3
                  </p>
                </div>
                <button onClick={() => setShowFerForm(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100" style={{ color: '#BBB' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-1 px-6 pt-4">
                {[1,2,3].map(s => (
                  <div key={s} className="flex-1 h-1 rounded-full" style={{ background: ferStep >= s ? '#D97706' : '#F0F0F0' }}></div>
                ))}
              </div>

              <div className="p-6">
                {/* FER STEP 1: Reportante + Evento */}
                {ferStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#D97706' }}>Datos del reportante</div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'reportante_nombre', label: 'Nombre', placeholder: 'Quien reporta el evento' },
                          { key: 'reportante_cargo', label: 'Cargo', placeholder: 'Ej: Asesor comercial' },
                          { key: 'reportante_area', label: 'Area', placeholder: 'Ej: Ventas' },
                          { key: 'reportante_superior', label: 'Superior jerárquico', placeholder: empresaGuardada?.representante_legal || '' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="text-[11px] font-medium block mb-1" style={{ color: '#555' }}>{f.label}</label>
                            <input type="text" value={(ferForm as any)[f.key]} onChange={e => setFerForm(p => ({...p, [f.key]: e.target.value}))}
                              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0' }} placeholder={f.placeholder} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#D97706' }}>Contraparte involucrada (opcional)</div>
                      {contrapartes.filter(c => c.tipo_relacion !== 'empleado').length > 0 ? (
                        <select value={ferContraparteId} onChange={e => {
                          const id = e.target.value;
                          setFerContraparteId(id);
                          if (id === '') { setFerForm(p => ({...p, contraparte_nombre: ''})); }
                          else if (id === '__manual__') { setFerForm(p => ({...p, contraparte_nombre: ''})); }
                          else { const cp = contrapartes.find(c => c.id === id); setFerForm(p => ({...p, contraparte_nombre: cp?.razon_social || ''})); }
                        }} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0', background: '#fff' }}>
                          <option value="">Sin contraparte</option>
                          {contrapartes.filter(c => c.tipo_relacion !== 'empleado').map(c => (
                            <option key={c.id} value={c.id}>{c.razon_social} — {c.tipo_relacion} {c.nit_cc ? `(${c.nit_cc})` : ''}</option>
                          ))}
                          <option value="__manual__">Otra (escribir nombre)</option>
                        </select>
                      ) : (
                        <input type="text" value={ferForm.contraparte_nombre} onChange={e => setFerForm(p => ({...p, contraparte_nombre: e.target.value}))}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0' }} placeholder="Nombre de la contraparte, si aplica" />
                      )}
                      {ferContraparteId === '__manual__' && (
                        <input type="text" value={ferForm.contraparte_nombre} onChange={e => setFerForm(p => ({...p, contraparte_nombre: e.target.value}))}
                          className="w-full mt-2 px-3 py-2 rounded-lg text-[12px] outline-none" style={{ border: '1px solid #E0E0E0' }} placeholder="Nombre de la contraparte" />
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#D97706' }}>Descripción del evento</div>
                      <textarea value={ferForm.descripcion} onChange={e => setFerForm(p => ({...p, descripcion: e.target.value}))} rows={3}
                        className="w-full px-3 py-2 rounded-lg text-[12px] outline-none resize-none" style={{ border: '1px solid #E0E0E0' }}
                        placeholder="Describe detalladamente el evento de riesgo identificado: fechas, personas, montos, circunstancias..." />
                    </div>

                    <button onClick={async () => {
                      if (ferForm.descripcion.length >= 20) {
                        setFerAnalyzing(true);
                        try {
                          const resp = await fetch('/api/analizar-evento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ descripcion: ferForm.descripcion }) });
                          const result = await resp.json();
                          if (result.success && result.sugerencia) {
                            setFerForm(p => ({ ...p, naturaleza: result.sugerencia.naturaleza, impacto: result.sugerencia.impacto, probabilidad: result.sugerencia.probabilidad }));
                            setFerSuggested(true);
                          }
                        } catch {}
                        setFerAnalyzing(false);
                      }
                      setFerStep(2);
                    }} disabled={!ferForm.reportante_nombre || !ferForm.descripcion || ferAnalyzing}
                      className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40" style={{ background: '#D97706' }}>
                      {ferAnalyzing ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                          Analizando evento...
                        </span>
                      ) : 'Siguiente: Evaluar riesgo'}
                    </button>
                  </div>
                )}

                {/* FER STEP 2: Evaluación del riesgo */}
                {ferStep === 2 && (
                  <div className="space-y-4">
                    {ferSuggested && (
                      <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="#D97706" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        <div>
                          <div className="text-[11px] font-semibold" style={{ color: '#92400E' }}>Clasificación sugerida por IA</div>
                          <div className="text-[10px] mt-0.5" style={{ color: '#B45309' }}>Basada en tu descripción. Revisa y ajusta si es necesario.</div>
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#D97706' }}>Naturaleza del evento</div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'fraude', label: 'Fraude', icon: '💰' },
                          { key: 'lavado', label: 'Lavado de activos', icon: '🏦' },
                          { key: 'terrorismo', label: 'Financiación terrorismo', icon: '⚠️' },
                          { key: 'corrupcion', label: 'Corrupción', icon: '🔗' },
                          { key: 'operacion_inusual', label: 'Operación inusual', icon: '🔍' },
                          { key: 'otro', label: 'Otro', icon: '📋' },
                        ].map(n => (
                          <button key={n.key} onClick={() => setFerForm(p => ({...p, naturaleza: n.key}))}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium text-left transition-all"
                            style={ferForm.naturaleza === n.key ? { background: '#FFFBEB', border: '1.5px solid #D97706', color: '#92400E' } : { background: '#FAFAFA', border: '1.5px solid #F0F0F0', color: '#666' }}>
                            <span>{n.icon}</span> {n.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#D97706' }}>Impacto potencial</div>
                      <div className="flex gap-2">
                        {[
                          { key: 'bajo', label: 'Bajo', desc: 'Impacto menor', color: '#059669', bg: '#ECFDF5' },
                          { key: 'moderado', label: 'Moderado', desc: 'Impacto controlable', color: '#D97706', bg: '#FFFBEB' },
                          { key: 'alto', label: 'Alto', desc: 'Pérdida significativa', color: '#DC2626', bg: '#FEF2F2' },
                        ].map(imp => (
                          <button key={imp.key} onClick={() => setFerForm(p => ({...p, impacto: imp.key}))}
                            className="flex-1 p-3 rounded-lg text-center transition-all"
                            style={ferForm.impacto === imp.key ? { background: imp.bg, border: `1.5px solid ${imp.color}` } : { background: '#FAFAFA', border: '1.5px solid #F0F0F0' }}>
                            <div className="text-[12px] font-semibold" style={{ color: ferForm.impacto === imp.key ? imp.color : '#999' }}>{imp.label}</div>
                            <div className="text-[10px] mt-0.5" style={{ color: ferForm.impacto === imp.key ? imp.color : '#CCC' }}>{imp.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#D97706' }}>Probabilidad de ocurrencia</div>
                      <div className="flex gap-2">
                        {[
                          { key: 'baja', label: 'Baja', desc: 'Poco probable', color: '#059669', bg: '#ECFDF5' },
                          { key: 'moderada', label: 'Moderada', desc: 'Podría ocurrir', color: '#D97706', bg: '#FFFBEB' },
                          { key: 'alta', label: 'Alta', desc: 'Probable que ocurra', color: '#DC2626', bg: '#FEF2F2' },
                        ].map(prob => (
                          <button key={prob.key} onClick={() => setFerForm(p => ({...p, probabilidad: prob.key}))}
                            className="flex-1 p-3 rounded-lg text-center transition-all"
                            style={ferForm.probabilidad === prob.key ? { background: prob.bg, border: `1.5px solid ${prob.color}` } : { background: '#FAFAFA', border: '1.5px solid #F0F0F0' }}>
                            <div className="text-[12px] font-semibold" style={{ color: ferForm.probabilidad === prob.key ? prob.color : '#999' }}>{prob.label}</div>
                            <div className="text-[10px] mt-0.5" style={{ color: ferForm.probabilidad === prob.key ? prob.color : '#CCC' }}>{prob.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Risk preview */}
                    {(() => {
                      const matrizRiesgo: Record<string, Record<string, string>> = {
                        alta: { alto: 'alto', moderado: 'alto', bajo: 'moderado' },
                        moderada: { alto: 'alto', moderado: 'moderado', bajo: 'bajo' },
                        baja: { alto: 'moderado', moderado: 'bajo', bajo: 'bajo' },
                      };
                      const ri = matrizRiesgo[ferForm.probabilidad]?.[ferForm.impacto] || 'moderado';
                      const riColor = ri === 'alto' ? '#DC2626' : ri === 'moderado' ? '#D97706' : '#059669';
                      const riBg = ri === 'alto' ? '#FEF2F2' : ri === 'moderado' ? '#FFFBEB' : '#ECFDF5';
                      return (
                        <div className="p-3 rounded-lg flex items-center justify-between" style={{ background: riBg }}>
                          <span className="text-[12px] font-medium" style={{ color: riColor }}>Riesgo inherente calculado:</span>
                          <span className="text-[13px] font-bold uppercase" style={{ color: riColor }}>{ri}</span>
                        </div>
                      );
                    })()}

                    <div className="flex gap-3">
                      <button onClick={() => setFerStep(1)} className="px-4 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E0E0E0', color: '#555' }}>Atrás</button>
                      <button onClick={() => setFerStep(3)} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#D97706' }}>
                        Siguiente: Decisión y plan
                      </button>
                    </div>
                  </div>
                )}

                {/* FER STEP 3: Decisión + generar */}
                {ferStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#D97706' }}>Decisión frente al evento</div>
                      <div className="flex gap-2">
                        <button onClick={() => setFerForm(p => ({...p, continuar: false}))}
                          className="flex-1 p-3 rounded-lg text-left transition-all"
                          style={!ferForm.continuar ? { background: '#FEF2F2', border: '1.5px solid #DC2626' } : { background: '#FAFAFA', border: '1.5px solid #F0F0F0' }}>
                          <div className="text-[12px] font-semibold" style={{ color: !ferForm.continuar ? '#DC2626' : '#999' }}>No continuar</div>
                          <div className="text-[10px] mt-0.5" style={{ color: !ferForm.continuar ? '#DC2626' : '#CCC' }}>Detener la situación o actividad</div>
                        </button>
                        <button onClick={() => setFerForm(p => ({...p, continuar: true}))}
                          className="flex-1 p-3 rounded-lg text-left transition-all"
                          style={ferForm.continuar ? { background: '#FFFBEB', border: '1.5px solid #D97706' } : { background: '#FAFAFA', border: '1.5px solid #F0F0F0' }}>
                          <div className="text-[12px] font-semibold" style={{ color: ferForm.continuar ? '#D97706' : '#999' }}>Continuar con plan</div>
                          <div className="text-[10px] mt-0.5" style={{ color: ferForm.continuar ? '#D97706' : '#CCC' }}>Aplicar plan de tratamiento</div>
                        </button>
                      </div>
                    </div>

                    {ferForm.continuar && (
                      <>
                        <div>
                          <label className="text-[11px] font-medium block mb-1" style={{ color: '#555' }}>Justificación para continuar</label>
                          <textarea value={ferForm.justificacion} onChange={e => setFerForm(p => ({...p, justificacion: e.target.value}))} rows={2}
                            className="w-full px-3 py-2 rounded-lg text-[12px] outline-none resize-none" style={{ border: '1px solid #E0E0E0' }}
                            placeholder="Explica por qué es viable continuar con la actividad..." />
                        </div>

                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#D97706' }}>Plan de tratamiento</div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-[11px] font-medium block mb-1.5" style={{ color: '#555' }}>Objetivo del plan</label>
                              <div className="flex gap-2">
                                {[
                                  { key: 'evitar', label: 'Evitar el riesgo' },
                                  { key: 'reducir', label: 'Reducir impacto' },
                                  { key: 'transferir', label: 'Transferir riesgo' },
                                ].map(o => (
                                  <button key={o.key} onClick={() => setFerForm(p => ({...p, plan_objetivo: o.key}))}
                                    className="flex-1 px-2 py-2 rounded-lg text-[11px] font-medium transition-all"
                                    style={ferForm.plan_objetivo === o.key ? { background: '#111', color: '#fff' } : { background: '#F5F5F5', color: '#666' }}>
                                    {o.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] font-medium block mb-1" style={{ color: '#555' }}>Descripción del plan</label>
                              <textarea value={ferForm.plan_descripcion} onChange={e => setFerForm(p => ({...p, plan_descripcion: e.target.value}))} rows={2}
                                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none resize-none" style={{ border: '1px solid #E0E0E0' }}
                                placeholder="Acciones concretas a implementar..." />
                            </div>
                            <div>
                              <label className="text-[11px] font-medium block mb-1.5" style={{ color: '#555' }}>Monitoreo</label>
                              <div className="flex gap-2">
                                {['mensual', 'bimestral', 'trimestral', 'semestral'].map(m => (
                                  <button key={m} onClick={() => setFerForm(p => ({...p, plan_monitoreo: m}))}
                                    className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all"
                                    style={ferForm.plan_monitoreo === m ? { background: '#111', color: '#fff' } : { background: '#F5F5F5', color: '#666' }}>
                                    {m}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {error && <div className="p-3 rounded-lg text-[12px]" style={{ background: '#FEF2F2', color: '#DC2626' }}>{error}</div>}

                    <div className="flex gap-3">
                      <button onClick={() => setFerStep(2)} className="px-4 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E0E0E0', color: '#555' }}>Atrás</button>
                      <button onClick={handleGenerarFer} disabled={loadingFer}
                        className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: '#D97706' }}>
                        {loadingFer ? 'Generando FER...' : 'Generar Evaluación de Riesgos'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
