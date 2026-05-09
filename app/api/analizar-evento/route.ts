import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const KEYWORDS: Record<string, string[]> = {
  fraude: ['fraude', 'falsificación', 'falsificar', 'suplantación', 'suplant', 'engaño', 'estafa', 'desfalco', 'malversación', 'apropiación indebida', 'documentos falsos', 'firma falsa', 'factura ficticia', 'sobrefacturación'],
  lavado: ['lavado', 'blanqueo', 'origen de fondos', 'dinero ilícito', 'recursos ilícitos', 'transferencia sospechosa', 'fraccionamiento', 'pitufeo', 'estructuración', 'cash', 'efectivo inusual', 'depósitos múltiples', 'giro internacional', 'paraíso fiscal', 'offshore'],
  terrorismo: ['terrorismo', 'financiación del terror', 'lista clinton', 'ofac', 'sanciones', 'grupo armado', 'insurgente', 'explosivo', 'arma', 'secuestro', 'extorsión'],
  corrupcion: ['corrupción', 'soborno', 'cohecho', 'dádiva', 'conflicto de interés', 'tráfico de influencias', 'contratación irregular', 'funcionario público', 'pago indebido', 'comisión oculta', 'regalo', 'favor político'],
  operacion_inusual: ['inusual', 'atípica', 'inconsistente', 'perfil transaccional', 'sin justificación', 'fuera de rango', 'monto inusual', 'frecuencia anormal', 'cambio repentino', 'cliente nuevo', 'operación no habitual', 'sin soporte'],
};

const HIGH_IMPACT_WORDS = ['millones', 'gran cantidad', 'significativo', 'grave', 'pérdida mayor', 'daño reputacional', 'sanción', 'multa', 'cárcel', 'penal', 'demanda', 'embargo', 'quiebra', 'insolvencia'];
const LOW_IMPACT_WORDS = ['menor', 'pequeño', 'insignificante', 'bajo monto', 'primera vez', 'error', 'descuido', 'involuntario'];
const HIGH_PROB_WORDS = ['recurrente', 'repetido', 'frecuente', 'ya ocurrió', 'varias veces', 'patrón', 'sistemático', 'continuo', 'habitual', 'reincidente'];
const LOW_PROB_WORDS = ['improbable', 'raro', 'excepcional', 'aislado', 'única vez', 'poco probable', 'caso puntual'];

export async function POST(request: NextRequest) {
  try {
    const { descripcion } = await request.json();
    if (!descripcion || descripcion.length < 10) {
      return NextResponse.json({ success: false, error: 'Descripción muy corta' }, { status: 400 });
    }

    const texto = descripcion.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    let naturaleza = 'operacion_inusual';
    let maxScore = 0;
    for (const [tipo, words] of Object.entries(KEYWORDS)) {
      const score = words.filter(w => texto.includes(w.normalize('NFD').replace(/[̀-ͯ]/g, ''))).length;
      if (score > maxScore) { maxScore = score; naturaleza = tipo; }
    }

    let impacto = 'moderado';
    const highImpact = HIGH_IMPACT_WORDS.filter(w => texto.includes(w)).length;
    const lowImpact = LOW_IMPACT_WORDS.filter(w => texto.includes(w)).length;
    if (highImpact > lowImpact) impacto = 'alto';
    else if (lowImpact > highImpact) impacto = 'bajo';

    let probabilidad = 'moderada';
    const highProb = HIGH_PROB_WORDS.filter(w => texto.includes(w)).length;
    const lowProb = LOW_PROB_WORDS.filter(w => texto.includes(w)).length;
    if (highProb > lowProb) probabilidad = 'alta';
    else if (lowProb > highProb) probabilidad = 'baja';

    const explicaciones: string[] = [];
    if (maxScore > 0) explicaciones.push(`Detectamos indicadores de ${naturaleza.replace('_', ' ')}`);
    if (highImpact > 0) explicaciones.push('El evento sugiere un impacto significativo');
    if (highProb > 0) explicaciones.push('Hay indicios de recurrencia o patrón');

    return NextResponse.json({
      success: true,
      sugerencia: { naturaleza, impacto, probabilidad },
      explicacion: explicaciones.length > 0 ? explicaciones.join('. ') + '.' : 'Clasificación basada en análisis del texto. Verifica y ajusta según tu criterio.',
      confianza: maxScore > 2 ? 'alta' : maxScore > 0 ? 'media' : 'baja',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
