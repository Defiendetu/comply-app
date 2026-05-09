export interface ObligacionNormativa {
  key: string;
  titulo: string;
  descripcion: string;
  categoria: 'documental' | 'debida_diligencia' | 'capacitacion' | 'monitoreo' | 'reporte';
  recurrencia: 'anual' | 'semestral' | 'trimestral' | 'mensual' | null;
  prioridad: 'alta' | 'media' | 'baja';
  diasParaVencimiento: number;
  requiereEntidad?: 'contraparte' | 'trabajador';
  accionTrigger: string;
  fundamentoLegal?: string;
}

export type Regimen = 'minimas' | 'sagrilaft' | 'sarlaft';

export const REGIMEN_LABELS: Record<Regimen, string> = {
  minimas: 'Medidas Mínimas',
  sagrilaft: 'SAGRILAFT',
  sarlaft: 'SARLAFT',
};

export const CATEGORIA_LABELS: Record<string, string> = {
  documental: 'Documental',
  debida_diligencia: 'Debida Diligencia',
  capacitacion: 'Capacitación',
  monitoreo: 'Monitoreo',
  reporte: 'Reporte',
};

export const CATEGORIA_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  documental: { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
  debida_diligencia: { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  capacitacion: { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' },
  monitoreo: { bg: '#FDF2F8', text: '#9D174D', dot: '#EC4899' },
  reporte: { bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6' },
};

export const OBLIGACIONES_MINIMAS: ObligacionNormativa[] = [
  {
    key: 'renovar_manual',
    titulo: 'Actualizar Manual de Medidas Mínimas',
    descripcion: 'Revisar y actualizar el manual de prevención LA/FT/FPADM conforme a la normativa vigente',
    categoria: 'documental',
    recurrencia: 'anual',
    prioridad: 'alta',
    diasParaVencimiento: 365,
    accionTrigger: 'generar_manual',
    fundamentoLegal: 'Res. 100-006322 de 2023, Art. 4',
  },
  {
    key: 'renovar_matriz',
    titulo: 'Actualizar Matriz de Riesgo',
    descripcion: 'Revisar factores de riesgo, señales de alerta y controles según perfil de la empresa',
    categoria: 'documental',
    recurrencia: 'anual',
    prioridad: 'alta',
    diasParaVencimiento: 365,
    accionTrigger: 'generar_matriz',
    fundamentoLegal: 'Res. 100-006322 de 2023, Art. 5',
  },
  {
    key: 'renovar_fcc',
    titulo: 'Actualizar Formulario de Conocimiento del Cliente',
    descripcion: 'Renovar el FCC con información actualizada de la empresa',
    categoria: 'documental',
    recurrencia: 'anual',
    prioridad: 'media',
    diasParaVencimiento: 365,
    accionTrigger: 'generar_fcc',
    fundamentoLegal: 'Res. 100-006322 de 2023, Art. 6',
  },
  {
    key: 'actualizar_fcc_contraparte',
    titulo: 'Renovar FCC de contraparte',
    descripcion: 'Actualizar el Formulario de Conocimiento del Cliente de esta contraparte',
    categoria: 'debida_diligencia',
    recurrencia: 'anual',
    prioridad: 'media',
    diasParaVencimiento: 365,
    requiereEntidad: 'contraparte',
    accionTrigger: 'generar_fcc_contraparte',
    fundamentoLegal: 'Res. 100-006322 de 2023, Art. 6',
  },
  {
    key: 'consultar_listas_contraparte',
    titulo: 'Consultar listas restrictivas de contraparte',
    descripcion: 'Verificar a la contraparte contra listas OFAC, ONU, Procuraduría, Contraloría y Policía',
    categoria: 'debida_diligencia',
    recurrencia: 'semestral',
    prioridad: 'alta',
    diasParaVencimiento: 180,
    requiereEntidad: 'contraparte',
    accionTrigger: 'generar_listas_restrictivas',
    fundamentoLegal: 'Res. 100-006322 de 2023, Art. 7',
  },
  {
    key: 'declaracion_trabajador',
    titulo: 'Renovar declaración de trabajador',
    descripcion: 'La declaración SAGRILAFT del trabajador vence anualmente y debe renovarse',
    categoria: 'capacitacion',
    recurrencia: 'anual',
    prioridad: 'alta',
    diasParaVencimiento: 365,
    requiereEntidad: 'trabajador',
    accionTrigger: 'generar_declaracion',
    fundamentoLegal: 'Res. 100-006322 de 2023, Art. 8',
  },
  {
    key: 'capacitacion_trabajador',
    titulo: 'Capacitación anual del trabajador',
    descripcion: 'Realizar capacitación en prevención LA/FT/FPADM a este trabajador',
    categoria: 'capacitacion',
    recurrencia: 'anual',
    prioridad: 'media',
    diasParaVencimiento: 365,
    requiereEntidad: 'trabajador',
    accionTrigger: 'capacitar_trabajador',
    fundamentoLegal: 'Res. 100-006322 de 2023, Art. 9',
  },
  {
    key: 'revision_fer',
    titulo: 'Revisión periódica de evaluación de riesgos',
    descripcion: 'Revisar y actualizar las evaluaciones de riesgo (FER) realizadas',
    categoria: 'monitoreo',
    recurrencia: 'semestral',
    prioridad: 'media',
    diasParaVencimiento: 180,
    accionTrigger: 'generar_fer',
    fundamentoLegal: 'Res. 100-006322 de 2023, Art. 10',
  },
  {
    key: 'reporte_oficial_cumplimiento',
    titulo: 'Informe del Oficial de Cumplimiento',
    descripcion: 'El responsable del SAGRILAFT debe presentar informe de gestión a la administración',
    categoria: 'reporte',
    recurrencia: 'anual',
    prioridad: 'alta',
    diasParaVencimiento: 365,
    accionTrigger: 'manual',
    fundamentoLegal: 'Res. 100-006322 de 2023, Art. 11',
  },
  {
    key: 'revision_procedimiento_ros',
    titulo: 'Revisión de procedimiento ROS',
    descripcion: 'Verificar que el procedimiento de Reporte de Operaciones Sospechosas está actualizado',
    categoria: 'monitoreo',
    recurrencia: 'semestral',
    prioridad: 'media',
    diasParaVencimiento: 180,
    accionTrigger: 'manual',
    fundamentoLegal: 'Res. 100-006322 de 2023, Art. 12',
  },
  {
    key: 'reporte_anual_uiaf',
    titulo: 'Verificar obligación de reporte ante UIAF',
    descripcion: 'Determinar si la empresa tiene obligación de reportar y cumplir con los plazos de la UIAF',
    categoria: 'reporte',
    recurrencia: 'anual',
    prioridad: 'alta',
    diasParaVencimiento: 365,
    accionTrigger: 'manual',
    fundamentoLegal: 'Ley 526 de 1999',
  },
];

export function getObligacionesPorRegimen(regimen: Regimen): ObligacionNormativa[] {
  switch (regimen) {
    case 'minimas': return OBLIGACIONES_MINIMAS;
    case 'sagrilaft': return OBLIGACIONES_MINIMAS; // TODO: catálogo SAGRILAFT
    case 'sarlaft': return OBLIGACIONES_MINIMAS; // TODO: catálogo SARLAFT
    default: return OBLIGACIONES_MINIMAS;
  }
}
