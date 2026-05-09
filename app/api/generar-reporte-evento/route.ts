import { NextRequest, NextResponse } from 'next/server';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType,
  ShadingType, PageNumber
} from 'docx';

export const maxDuration = 30;

const C = {
  AZUL_OSCURO: '1B2A4A', AZUL_MEDIO: '2E5090', AZUL_CLARO: '4472C4',
  AZUL_SUAVE: 'D6E4F0', AZUL_FONDO: 'EDF2F9',
  GRIS_OSCURO: '404040', GRIS_MEDIO: '808080', GRIS_CLARO: 'F2F2F2', BLANCO: 'FFFFFF',
  VERDE: '059669', VERDE_FONDO: 'ECFDF5',
  ROJO: 'DC2626', ROJO_FONDO: 'FEF2F2',
  AMARILLO: 'D97706', AMARILLO_FONDO: 'FFFBEB',
};

const bdr = { style: BorderStyle.SINGLE, size: 1, color: C.AZUL_SUAVE };
const borders = { top: bdr, bottom: bdr, left: bdr, right: bdr };

function hdrCell(text: string, width: number, opts: { colspan?: number } = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, columnSpan: opts.colspan,
    shading: { fill: C.AZUL_MEDIO, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 20, font: 'Arial', color: C.BLANCO })] })],
  });
}

function lblCell(text: string, width: number) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: C.AZUL_FONDO, type: ShadingType.CLEAR },
    margins: { top: 50, bottom: 50, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, font: 'Arial', color: C.AZUL_OSCURO })] })],
  });
}

function valCell(text: string, width: number, opts: { bold?: boolean; color?: string; colspan?: number; shading?: string } = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, columnSpan: opts.colspan,
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 50, bottom: 50, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: text || '—', size: 18, font: 'Arial', bold: opts.bold, color: opts.color || C.GRIS_OSCURO })] })],
  });
}

function wideCell(text: string, opts: { bold?: boolean; color?: string; shading?: string } = {}) {
  return new TableCell({
    borders, width: { size: 9600, type: WidthType.DXA }, columnSpan: 2,
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ spacing: { line: 300 }, children: [new TextRun({ text: text || '—', size: 18, font: 'Arial', bold: opts.bold, color: opts.color || C.GRIS_OSCURO })] })],
  });
}

const TIPO_RIESGO_LABELS: Record<string, string> = {
  lavado: 'Lavado de Activos',
  terrorismo: 'Financiamiento del Terrorismo',
  proliferacion: 'Financiamiento de la Proliferación de Armas de Destrucción Masiva',
};

const CLASIFICACION_LABELS: Record<string, string> = {
  inusual: 'Operación Inusual',
  sospechosa: 'Operación Sospechosa',
};

const NIVEL_LABELS: Record<string, string> = {
  bajo: 'Bajo', medio: 'Medio', alto: 'Alto', critico: 'Crítico',
};

function getNivelColor(nivel: string) {
  switch (nivel) {
    case 'critico': return { color: C.ROJO, bg: C.ROJO_FONDO };
    case 'alto': return { color: C.ROJO, bg: C.ROJO_FONDO };
    case 'medio': return { color: C.AMARILLO, bg: C.AMARILLO_FONDO };
    default: return { color: C.VERDE, bg: C.VERDE_FONDO };
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      RAZON_SOCIAL, NIT, REPRESENTANTE_LEGAL, CIUDAD,
      EVENTO, REPORTANTE, ANALISIS, HISTORIAL_CONTRAPARTE,
    } = await request.json();

    const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    const mesReporte = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const nivelC = getNivelColor(ANALISIS?.nivel_riesgo || 'medio');
    const clasificacionLabel = CLASIFICACION_LABELS[EVENTO.clasificacion] || 'Operación Inusual';
    const tipoRiesgoLabel = TIPO_RIESGO_LABELS[EVENTO.tipo_riesgo] || 'Lavado de Activos';

    const sections: Paragraph[] = [];

    // Title
    sections.push(
      new Paragraph({ spacing: { after: 100 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: RAZON_SOCIAL || 'EMPRESA', bold: true, size: 28, font: 'Arial', color: C.AZUL_OSCURO })] }),
      new Paragraph({ spacing: { after: 50 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `NIT: ${NIT || '—'}`, size: 18, font: 'Arial', color: C.GRIS_MEDIO })] }),
      new Paragraph({ spacing: { after: 300 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'FORMATO DE REPORTE DE EVENTOS DE RIESGO', bold: true, size: 24, font: 'Arial', color: C.AZUL_MEDIO })] }),
    );

    // Intro paragraph
    sections.push(new Paragraph({
      spacing: { after: 300 }, children: [
        new TextRun({ text: `Por favor, complete este formulario si en el mes de `, size: 18, font: 'Arial', color: C.GRIS_OSCURO }),
        new TextRun({ text: mesReporte, bold: true, size: 18, font: 'Arial', color: C.AZUL_OSCURO }),
        new TextRun({ text: `, presenció o tiene conocimiento de algún evento relacionado con actividades ilícitas como Lavado de Activos, Financiamiento del Terrorismo, Financiamiento de la Proliferación de Armas de Destrucción Masiva.`, size: 18, font: 'Arial', color: C.GRIS_OSCURO }),
      ],
    }));

    // Info table
    const infoTable = new Table({
      width: { size: 9600, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [hdrCell('INFORMACIÓN DEL REPORTE', 9600, { colspan: 2 })] }),
        new TableRow({ children: [lblCell('Fecha', 3200), valCell(fecha, 6400)] }),
        new TableRow({ children: [lblCell('Ciudad', 3200), valCell(CIUDAD || '', 6400)] }),
      ],
    });
    sections.push(infoTable);
    sections.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

    // Classification table
    const clasifTable = new Table({
      width: { size: 9600, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [hdrCell('CLASIFICACIÓN DEL EVENTO', 9600, { colspan: 2 })] }),
        new TableRow({ children: [
          lblCell('Situación o evento a reportar', 3200),
          valCell(clasificacionLabel, 6400, {
            bold: true,
            color: EVENTO.clasificacion === 'sospechosa' ? C.ROJO : C.AMARILLO,
            shading: EVENTO.clasificacion === 'sospechosa' ? C.ROJO_FONDO : C.AMARILLO_FONDO,
          }),
        ] }),
        new TableRow({ children: [
          lblCell('Tipo de Riesgo', 3200),
          valCell(tipoRiesgoLabel, 6400),
        ] }),
        new TableRow({ children: [
          lblCell('Nivel de Riesgo', 3200),
          valCell(NIVEL_LABELS[ANALISIS?.nivel_riesgo] || 'Medio', 6400, { bold: true, color: nivelC.color, shading: nivelC.bg }),
        ] }),
      ],
    });
    sections.push(clasifTable);
    sections.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

    // Event description table
    const descTable = new Table({
      width: { size: 9600, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [hdrCell('DESCRIPCIÓN DEL EVENTO', 9600, { colspan: 2 })] }),
        new TableRow({ children: [wideCell(EVENTO.descripcion || '')] }),
      ],
    });
    sections.push(descTable);
    sections.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

    // Impact table
    const impactoTable = new Table({
      width: { size: 9600, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [hdrCell('IMPACTO POTENCIAL', 9600, { colspan: 2 })] }),
        new TableRow({ children: [wideCell(EVENTO.impacto_potencial || 'No especificado')] }),
      ],
    });
    sections.push(impactoTable);
    sections.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

    // Actions taken
    const accionesTable = new Table({
      width: { size: 9600, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [hdrCell('ACCIONES TOMADAS', 9600, { colspan: 2 })] }),
        new TableRow({ children: [wideCell(EVENTO.acciones_tomadas || 'Ninguna hasta el momento')] }),
      ],
    });
    sections.push(accionesTable);
    sections.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

    // AI Analysis section (value-add)
    if (ANALISIS) {
      const analisisRows = [
        new TableRow({ children: [hdrCell('ANÁLISIS AUTOMATIZADO — COMPLY IA', 9600, { colspan: 2 })] }),
        new TableRow({ children: [
          lblCell('Clasificación sugerida', 3200),
          valCell(`${clasificacionLabel} (confianza: ${ANALISIS.confianza || 'media'})`, 6400),
        ] }),
      ];
      if (ANALISIS.explicaciones && ANALISIS.explicaciones.length > 0) {
        analisisRows.push(new TableRow({ children: [
          lblCell('Justificación', 3200),
          valCell(ANALISIS.explicaciones.join('. '), 6400),
        ] }));
      }
      if (ANALISIS.acciones_recomendadas && ANALISIS.acciones_recomendadas.length > 0) {
        analisisRows.push(new TableRow({ children: [
          lblCell('Acciones recomendadas', 3200),
          valCell(ANALISIS.acciones_recomendadas.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n'), 6400),
        ] }));
      }
      sections.push(new Table({ width: { size: 9600, type: WidthType.DXA }, rows: analisisRows }));
      sections.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    }

    // Contraparte history (value-add)
    if (HISTORIAL_CONTRAPARTE && HISTORIAL_CONTRAPARTE.nombre) {
      const histRows = [
        new TableRow({ children: [hdrCell(`HISTORIAL DE CONTRAPARTE: ${HISTORIAL_CONTRAPARTE.nombre}`, 9600, { colspan: 2 })] }),
        new TableRow({ children: [lblCell('Eventos previos', 3200), valCell(`${HISTORIAL_CONTRAPARTE.eventos_previos || 0} evento(s) registrado(s)`, 6400)] }),
        new TableRow({ children: [lblCell('Última consulta de listas', 3200), valCell(HISTORIAL_CONTRAPARTE.ultima_consulta_listas || 'Sin consulta registrada', 6400)] }),
        new TableRow({ children: [lblCell('FER generados', 3200), valCell(`${HISTORIAL_CONTRAPARTE.fer_count || 0}`, 6400)] }),
      ];
      if (HISTORIAL_CONTRAPARTE.eventos_previos >= 2) {
        histRows.push(new TableRow({ children: [wideCell(
          `⚠ ALERTA: Esta contraparte acumula ${HISTORIAL_CONTRAPARTE.eventos_previos} eventos de riesgo. Se recomienda evaluar la continuidad de la relación comercial.`,
          { bold: true, color: C.ROJO, shading: C.ROJO_FONDO }
        )] }));
      }
      sections.push(new Table({ width: { size: 9600, type: WidthType.DXA }, rows: histRows }));
      sections.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    }

    // Comments
    if (EVENTO.comentarios) {
      sections.push(new Table({
        width: { size: 9600, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [hdrCell('COMENTARIOS ADICIONALES', 9600, { colspan: 2 })] }),
          new TableRow({ children: [wideCell(EVENTO.comentarios)] }),
        ],
      }));
      sections.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    }

    // UIAF alert for sospechosa
    if (EVENTO.clasificacion === 'sospechosa') {
      sections.push(new Table({
        width: { size: 9600, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [hdrCell('⚠ OBLIGACIÓN DE REPORTE — UIAF', 9600, { colspan: 2 })] }),
          new TableRow({ children: [wideCell(
            'Esta operación ha sido clasificada como SOSPECHOSA. De acuerdo con la normativa vigente, debe ser reportada a la Unidad de Información y Análisis Financiero (UIAF) dentro de las 24 horas siguientes a su detección. El incumplimiento de esta obligación puede acarrear sanciones administrativas y penales. Recuerde mantener el deber de reserva: no informar a la contraparte sobre este reporte.',
            { bold: true, color: C.ROJO, shading: C.ROJO_FONDO }
          )] }),
        ],
      }));
      sections.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    }

    // Reporter
    sections.push(new Table({
      width: { size: 9600, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [hdrCell('REPORTANTE', 9600, { colspan: 2 })] }),
        new TableRow({ children: [lblCell('Nombre', 3200), valCell(REPORTANTE?.nombre || '', 6400)] }),
        new TableRow({ children: [lblCell('Identificación', 3200), valCell(REPORTANTE?.identificacion || '', 6400)] }),
      ],
    }));
    sections.push(new Paragraph({ spacing: { after: 300 }, children: [] }));

    // Signature
    sections.push(
      new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: '________________________________', size: 18, font: 'Arial', color: C.GRIS_MEDIO })] }),
      new Paragraph({ children: [new TextRun({ text: REPRESENTANTE_LEGAL || 'Representante Legal', bold: true, size: 18, font: 'Arial', color: C.AZUL_OSCURO })] }),
      new Paragraph({ children: [new TextRun({ text: 'Representante Legal', size: 16, font: 'Arial', color: C.GRIS_MEDIO })] }),
    );

    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 1000, bottom: 800, left: 1200, right: 1200 } } },
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${RAZON_SOCIAL || 'EMPRESA'} — Reporte de Eventos de Riesgo`, italics: true, size: 14, font: 'Arial', color: C.GRIS_MEDIO })] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Generado por Comply — Plataforma SAGRILAFT | Página ', size: 14, font: 'Arial', color: C.GRIS_MEDIO }), new TextRun({ children: [PageNumber.CURRENT], size: 14, font: 'Arial', color: C.GRIS_MEDIO })] })] }) },
        children: sections,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const base64 = Buffer.from(buffer).toString('base64');
    const filename = `Reporte_Evento_${EVENTO.clasificacion === 'sospechosa' ? 'Sospechosa' : 'Inusual'}_${new Date().toISOString().slice(0, 10)}.docx`;

    return NextResponse.json({ success: true, base64, filename });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
