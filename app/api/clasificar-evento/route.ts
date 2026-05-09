import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const SOSPECHOSA_KEYWORDS = [
  'intencional', 'deliberado', 'ocultar', 'encubrir', 'disimular', 'falsificar',
  'documentos falsos', 'identidad falsa', 'testaferro', 'tercero interpuesto',
  'fraccionamiento', 'pitufeo', 'estructuración', 'múltiples cuentas',
  'paraíso fiscal', 'offshore', 'empresa fachada', 'shell company',
  'sin justificación económica', 'sin razón aparente', 'desproporcionado',
  'origen desconocido', 'procedencia dudosa', 'no puede explicar',
  'se niega a', 'rehúsa', 'evasivo', 'contradictorio', 'inconsistencias graves',
  'lista clinton', 'ofac', 'sanciones', 'vinculado a', 'investigado por',
  'captura', 'orden judicial', 'proceso penal', 'condena',
  'narcotráfico', 'extorsión', 'secuestro', 'terrorismo', 'armas',
  'financiación del terrorismo', 'proliferación',
  'reincidente', 'patrón repetido', 'sistemático', 'múltiples eventos',
  'complicidad', 'colusión', 'confabulación',
  'efectivo inusual', 'grandes sumas', 'millones', 'transferencias inusuales',
];

const INUSUAL_KEYWORDS = [
  'inusual', 'atípico', 'atípica', 'fuera de perfil', 'no habitual',
  'primera vez', 'cambio repentino', 'sin precedente',
  'monto mayor al esperado', 'frecuencia anormal', 'horario inusual',
  'cliente nuevo', 'sin historial', 'sin referencias',
  'inconsistente', 'no coincide', 'discrepancia',
  'error', 'descuido', 'omisión', 'olvido',
  'documentación incompleta', 'información faltante',
  'comportamiento extraño', 'nervioso', 'presión',
  'pago en efectivo', 'transacción poco común',
  'zona de riesgo', 'sector vulnerable',
];

const LAVADO_KEYWORDS = [
  'lavado', 'blanqueo', 'dinero ilícito', 'recursos ilícitos', 'origen de fondos',
  'efectivo', 'transferencia', 'fraccionamiento', 'pitufeo', 'estructuración',
  'paraíso fiscal', 'offshore', 'testaferro', 'empresa fachada',
  'sobrefacturación', 'subfacturación', 'factura ficticia',
  'narcotráfico', 'corrupción', 'soborno', 'desfalco', 'malversación',
  'cuenta bancaria', 'giro', 'remesa', 'criptomoneda',
];

const TERRORISMO_KEYWORDS = [
  'terrorismo', 'financiación del terror', 'grupo armado', 'insurgente',
  'explosivo', 'arma', 'secuestro', 'extorsión', 'reclutamiento',
  'zona de conflicto', 'lista clinton', 'ofac', 'sanciones', 'onu',
  'propaganda', 'radicalización',
];

const PROLIFERACION_KEYWORDS = [
  'proliferación', 'armas de destrucción masiva', 'nuclear', 'químico',
  'biológico', 'radiológico', 'material controlado', 'doble uso',
  'exportación restringida', 'embargo', 'sanciones',
  'programa nuclear', 'irán', 'corea del norte',
];

const SEVERITY_INDICATORS = {
  critico: ['condena', 'proceso penal', 'captura', 'lista clinton', 'ofac', 'terrorismo', 'narcotráfico', 'armas de destrucción', 'financiación del terror'],
  alto: ['intencional', 'deliberado', 'falsificar', 'ocultar', 'testaferro', 'empresa fachada', 'patrón repetido', 'sistemático', 'grandes sumas', 'millones', 'reincidente'],
  medio: ['inconsistencias', 'documentos falsos', 'origen desconocido', 'sin justificación', 'fraccionamiento', 'múltiples cuentas', 'se niega a'],
  bajo: ['inusual', 'atípico', 'primera vez', 'error', 'descuido', 'omisión', 'información faltante'],
};

export async function POST(request: NextRequest) {
  try {
    const { descripcion, contraparte_eventos_previos } = await request.json();
    if (!descripcion || descripcion.length < 10) {
      return NextResponse.json({ success: false, error: 'Descripción muy corta' }, { status: 400 });
    }

    const texto = descripcion.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    // Classification: inusual vs sospechosa
    const scoreSospechosa = SOSPECHOSA_KEYWORDS.filter(w => texto.includes(w.normalize('NFD').replace(/[̀-ͯ]/g, ''))).length;
    const scoreInusual = INUSUAL_KEYWORDS.filter(w => texto.includes(w.normalize('NFD').replace(/[̀-ͯ]/g, ''))).length;

    let clasificacion: 'inusual' | 'sospechosa' = 'inusual';
    if (scoreSospechosa > scoreInusual || scoreSospechosa >= 3) {
      clasificacion = 'sospechosa';
    }
    // If contraparte has many prior events, lean towards sospechosa
    if (contraparte_eventos_previos && contraparte_eventos_previos >= 2 && scoreSospechosa > 0) {
      clasificacion = 'sospechosa';
    }

    // Risk type
    const scoreLavado = LAVADO_KEYWORDS.filter(w => texto.includes(w.normalize('NFD').replace(/[̀-ͯ]/g, ''))).length;
    const scoreTerrorismo = TERRORISMO_KEYWORDS.filter(w => texto.includes(w.normalize('NFD').replace(/[̀-ͯ]/g, ''))).length;
    const scoreProliferacion = PROLIFERACION_KEYWORDS.filter(w => texto.includes(w.normalize('NFD').replace(/[̀-ͯ]/g, ''))).length;

    let tipo_riesgo = 'lavado';
    if (scoreTerrorismo > scoreLavado && scoreTerrorismo > scoreProliferacion) tipo_riesgo = 'terrorismo';
    else if (scoreProliferacion > scoreLavado && scoreProliferacion > scoreTerrorismo) tipo_riesgo = 'proliferacion';

    // Severity
    let nivel_riesgo = 'medio';
    for (const [nivel, words] of Object.entries(SEVERITY_INDICATORS)) {
      if (words.some(w => texto.includes(w.normalize('NFD').replace(/[̀-ͯ]/g, '')))) {
        nivel_riesgo = nivel;
        break;
      }
    }

    // Confidence
    const totalHits = scoreSospechosa + scoreInusual;
    const confianza = totalHits >= 5 ? 'alta' : totalHits >= 2 ? 'media' : 'baja';

    // Explanations
    const explicaciones: string[] = [];
    if (clasificacion === 'sospechosa') {
      explicaciones.push('El evento presenta indicadores de operación sospechosa que podría requerir reporte a la UIAF');
      if (scoreSospechosa >= 3) explicaciones.push(`Se detectaron ${scoreSospechosa} indicadores de actividad sospechosa`);
      if (contraparte_eventos_previos && contraparte_eventos_previos >= 2) {
        explicaciones.push(`La contraparte acumula ${contraparte_eventos_previos} eventos previos, lo cual refuerza la clasificación`);
      }
    } else {
      explicaciones.push('El evento se clasifica como operación inusual — requiere monitoreo interno');
      if (scoreInusual > 0) explicaciones.push('Se detectaron indicadores de actividad atípica pero sin evidencia de intencionalidad');
    }

    if (tipo_riesgo === 'terrorismo') explicaciones.push('Se detectaron indicadores relacionados con financiación del terrorismo');
    else if (tipo_riesgo === 'proliferacion') explicaciones.push('Se detectaron indicadores de financiación de proliferación de armas');

    // Recommended actions
    const acciones_recomendadas: string[] = [];
    if (clasificacion === 'sospechosa') {
      acciones_recomendadas.push('Reportar a la UIAF dentro de las 24 horas siguientes');
      acciones_recomendadas.push('No alertar a la contraparte sobre el reporte (deber de reserva)');
      acciones_recomendadas.push('Documentar toda la evidencia disponible');
      if (nivel_riesgo === 'critico' || nivel_riesgo === 'alto') {
        acciones_recomendadas.push('Considerar suspender la relación comercial');
      }
    } else {
      acciones_recomendadas.push('Registrar el evento en el sistema de monitoreo interno');
      acciones_recomendadas.push('Realizar seguimiento durante los próximos 90 días');
      if (contraparte_eventos_previos && contraparte_eventos_previos >= 1) {
        acciones_recomendadas.push('Revisar el historial completo de la contraparte');
      }
      acciones_recomendadas.push('Si se detectan nuevos indicadores, reclasificar como sospechosa');
    }

    return NextResponse.json({
      success: true,
      clasificacion,
      tipo_riesgo,
      nivel_riesgo,
      confianza,
      explicaciones,
      acciones_recomendadas,
      scores: { sospechosa: scoreSospechosa, inusual: scoreInusual, lavado: scoreLavado, terrorismo: scoreTerrorismo, proliferacion: scoreProliferacion },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
