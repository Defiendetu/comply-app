import { SupabaseClient } from '@supabase/supabase-js';
import { getObligacionesPorRegimen, Regimen, ObligacionNormativa } from './obligaciones-minimas';

export interface EventoCalendario {
  id: string;
  empresa_id: string;
  user_email: string;
  regimen: string;
  obligacion_key: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  fecha_vencimiento: string;
  fecha_completado: string | null;
  recurrencia: string | null;
  evento_origen_id: string | null;
  entidad_tipo: string | null;
  entidad_id: string | null;
  entidad_nombre: string | null;
  estado: string;
  prioridad: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function recurrenciaToDias(rec: string | null): number {
  switch (rec) {
    case 'mensual': return 30;
    case 'trimestral': return 90;
    case 'semestral': return 180;
    case 'anual': return 365;
    default: return 365;
  }
}

export async function inicializarCalendario(
  supabase: SupabaseClient,
  empresaId: string,
  email: string,
  regimen: Regimen
): Promise<void> {
  const { data: existentes } = await supabase
    .from('eventos_calendario')
    .select('obligacion_key, entidad_id')
    .eq('empresa_id', empresaId)
    .in('estado', ['pendiente', 'proximo']);

  const existentesSet = new Set(
    (existentes || []).map(e => `${e.obligacion_key}::${e.entidad_id || ''}`)
  );

  const obligaciones = getObligacionesPorRegimen(regimen);
  const generales = obligaciones.filter(o => !o.requiereEntidad);
  const now = new Date();

  const eventosNuevos = generales
    .filter(o => !existentesSet.has(`${o.key}::`))
    .map(o => ({
      empresa_id: empresaId,
      user_email: email,
      regimen,
      obligacion_key: o.key,
      titulo: o.titulo,
      descripcion: o.descripcion,
      categoria: o.categoria,
      fecha_vencimiento: addDays(now, o.diasParaVencimiento).toISOString(),
      recurrencia: o.recurrencia,
      estado: 'pendiente',
      prioridad: o.prioridad,
    }));

  if (eventosNuevos.length > 0) {
    await supabase.from('eventos_calendario').insert(eventosNuevos);
  }
}

export async function crearEventosParaEntidad(
  supabase: SupabaseClient,
  empresaId: string,
  email: string,
  regimen: Regimen,
  entidadId: string,
  entidadTipo: 'contraparte' | 'trabajador',
  entidadNombre: string
): Promise<void> {
  const { data: existentes } = await supabase
    .from('eventos_calendario')
    .select('obligacion_key')
    .eq('empresa_id', empresaId)
    .eq('entidad_id', entidadId)
    .in('estado', ['pendiente', 'proximo']);

  const existentesKeys = new Set((existentes || []).map(e => e.obligacion_key));

  const obligaciones = getObligacionesPorRegimen(regimen)
    .filter(o => o.requiereEntidad === entidadTipo);

  const now = new Date();

  const eventosNuevos = obligaciones
    .filter(o => !existentesKeys.has(o.key))
    .map(o => ({
      empresa_id: empresaId,
      user_email: email,
      regimen,
      obligacion_key: o.key,
      titulo: `${o.titulo}: ${entidadNombre}`,
      descripcion: o.descripcion,
      categoria: o.categoria,
      fecha_vencimiento: addDays(now, o.diasParaVencimiento).toISOString(),
      recurrencia: o.recurrencia,
      entidad_tipo: entidadTipo,
      entidad_id: entidadId,
      entidad_nombre: entidadNombre,
      estado: 'pendiente',
      prioridad: o.prioridad,
    }));

  if (eventosNuevos.length > 0) {
    await supabase.from('eventos_calendario').insert(eventosNuevos);
  }
}

export async function completarEvento(
  supabase: SupabaseClient,
  empresaId: string,
  email: string,
  regimen: Regimen,
  obligacionKey: string,
  entidadId?: string,
  entidadNombre?: string
): Promise<void> {
  let query = supabase
    .from('eventos_calendario')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('obligacion_key', obligacionKey)
    .in('estado', ['pendiente', 'proximo', 'vencido'])
    .order('fecha_vencimiento', { ascending: true })
    .limit(1);

  if (entidadId) query = query.eq('entidad_id', entidadId);

  const { data } = await query;
  const evento = data?.[0];
  const now = new Date();

  if (evento) {
    await supabase
      .from('eventos_calendario')
      .update({ estado: 'completado', fecha_completado: now.toISOString(), updated_at: now.toISOString() })
      .eq('id', evento.id);

    if (evento.recurrencia) {
      const dias = recurrenciaToDias(evento.recurrencia);
      await supabase.from('eventos_calendario').insert({
        empresa_id: empresaId,
        user_email: email,
        regimen,
        obligacion_key: evento.obligacion_key,
        titulo: evento.titulo,
        descripcion: evento.descripcion,
        categoria: evento.categoria,
        fecha_vencimiento: addDays(now, dias).toISOString(),
        recurrencia: evento.recurrencia,
        evento_origen_id: evento.id,
        entidad_tipo: evento.entidad_tipo,
        entidad_id: evento.entidad_id,
        entidad_nombre: entidadNombre || evento.entidad_nombre,
        estado: 'pendiente',
        prioridad: evento.prioridad,
      });
    }
  } else {
    const obligacion = getObligacionesPorRegimen(regimen).find(o => o.key === obligacionKey);
    if (obligacion) {
      const dias = recurrenciaToDias(obligacion.recurrencia);
      const titulo = entidadNombre ? `${obligacion.titulo}: ${entidadNombre}` : obligacion.titulo;
      await supabase.from('eventos_calendario').insert({
        empresa_id: empresaId,
        user_email: email,
        regimen,
        obligacion_key: obligacion.key,
        titulo,
        descripcion: obligacion.descripcion,
        categoria: obligacion.categoria,
        fecha_vencimiento: addDays(now, dias).toISOString(),
        fecha_completado: now.toISOString(),
        recurrencia: obligacion.recurrencia,
        entidad_tipo: obligacion.requiereEntidad || null,
        entidad_id: entidadId || null,
        entidad_nombre: entidadNombre || null,
        estado: 'completado',
        prioridad: obligacion.prioridad,
      });
      if (obligacion.recurrencia) {
        await supabase.from('eventos_calendario').insert({
          empresa_id: empresaId,
          user_email: email,
          regimen,
          obligacion_key: obligacion.key,
          titulo,
          descripcion: obligacion.descripcion,
          categoria: obligacion.categoria,
          fecha_vencimiento: addDays(now, dias).toISOString(),
          recurrencia: obligacion.recurrencia,
          entidad_tipo: obligacion.requiereEntidad || null,
          entidad_id: entidadId || null,
          entidad_nombre: entidadNombre || null,
          estado: 'pendiente',
          prioridad: obligacion.prioridad,
        });
      }
    }
  }
}

export async function getEventosCalendario(
  supabase: SupabaseClient,
  empresaId: string,
  filtros?: { estado?: string; categoria?: string; mes?: number; anio?: number }
): Promise<EventoCalendario[]> {
  let query = supabase
    .from('eventos_calendario')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('fecha_vencimiento', { ascending: true });

  if (filtros?.estado && filtros.estado !== 'todos') {
    query = query.eq('estado', filtros.estado);
  }
  if (filtros?.categoria && filtros.categoria !== 'todas') {
    query = query.eq('categoria', filtros.categoria);
  }
  if (filtros?.mes !== undefined && filtros?.anio !== undefined) {
    const start = new Date(filtros.anio, filtros.mes, 1);
    const end = new Date(filtros.anio, filtros.mes + 1, 0, 23, 59, 59);
    query = query.gte('fecha_vencimiento', start.toISOString()).lte('fecha_vencimiento', end.toISOString());
  }

  const { data } = await query;
  return (data || []) as EventoCalendario[];
}

export async function getProximosEventos(
  supabase: SupabaseClient,
  empresaId: string,
  limit: number = 5
): Promise<EventoCalendario[]> {
  const { data } = await supabase
    .from('eventos_calendario')
    .select('*')
    .eq('empresa_id', empresaId)
    .in('estado', ['pendiente', 'proximo', 'vencido'])
    .order('fecha_vencimiento', { ascending: true })
    .limit(limit);

  return (data || []) as EventoCalendario[];
}

export async function actualizarEstados(
  supabase: SupabaseClient,
  empresaId: string
): Promise<void> {
  const now = new Date();
  const en30dias = addDays(now, 30);

  const { data: pendientes } = await supabase
    .from('eventos_calendario')
    .select('id, fecha_vencimiento, estado')
    .eq('empresa_id', empresaId)
    .in('estado', ['pendiente', 'proximo']);

  if (!pendientes) return;

  for (const ev of pendientes) {
    const venc = new Date(ev.fecha_vencimiento);
    let nuevoEstado = ev.estado;

    if (venc < now) nuevoEstado = 'vencido';
    else if (venc <= en30dias) nuevoEstado = 'proximo';
    else nuevoEstado = 'pendiente';

    if (nuevoEstado !== ev.estado) {
      await supabase
        .from('eventos_calendario')
        .update({ estado: nuevoEstado, updated_at: now.toISOString() })
        .eq('id', ev.id);
    }
  }
}

export function getEstadoColor(estado: string): { bg: string; text: string } {
  switch (estado) {
    case 'vencido': return { bg: '#FEE2E2', text: '#991B1B' };
    case 'proximo': return { bg: '#FEF3C7', text: '#92400E' };
    case 'pendiente': return { bg: '#F3F4F6', text: '#374151' };
    case 'completado': return { bg: '#D1FAE5', text: '#065F46' };
    case 'cancelado': return { bg: '#E5E7EB', text: '#6B7280' };
    default: return { bg: '#F3F4F6', text: '#374151' };
  }
}

export function getEstadoLabel(estado: string): string {
  switch (estado) {
    case 'vencido': return 'Vencido';
    case 'proximo': return 'Próximo';
    case 'pendiente': return 'Pendiente';
    case 'completado': return 'Completado';
    case 'cancelado': return 'Cancelado';
    default: return estado;
  }
}

export function diasRestantes(fechaVencimiento: string): number {
  const now = new Date();
  const venc = new Date(fechaVencimiento);
  return Math.ceil((venc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
