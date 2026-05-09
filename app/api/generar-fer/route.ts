import { NextRequest, NextResponse } from 'next/server';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType,
  ShadingType, PageNumber
} from 'docx';

export const maxDuration = 30;

const C = {
  AZUL_OSCURO: '1B2A4A',
  AZUL_MEDIO: '2E5090',
  AZUL_CLARO: '4472C4',
  AZUL_SUAVE: 'D6E4F0',
  AZUL_FONDO: 'EDF2F9',
  GRIS_OSCURO: '404040',
  GRIS_MEDIO: '808080',
  GRIS_CLARO: 'F2F2F2',
  BLANCO: 'FFFFFF',
  VERDE: '059669',
  VERDE_FONDO: 'ECFDF5',
  ROJO: 'DC2626',
  ROJO_FONDO: 'FEF2F2',
  AMARILLO: 'D97706',
  AMARILLO_FONDO: 'FFFBEB',
};

const bdr = { style: BorderStyle.SINGLE, size: 1, color: C.AZUL_SUAVE };
const borders = { top: bdr, bottom: bdr, left: bdr, right: bdr };

function hdrCell(text: string, width: number, opts: { colspan?: number } = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: C.AZUL_MEDIO, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    columnSpan: opts.colspan,
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
    borders, width: { size: width, type: WidthType.DXA },
    columnSpan: opts.colspan,
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 50, bottom: 50, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: 'Arial', color: opts.color || '333333', bold: opts.bold })] })],
  });
}

function emptyP(size = 120) {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

function para(text: string, opts: { bold?: boolean; size?: number; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; italic?: boolean } = {}) {
  return new Paragraph({
    spacing: { after: 100, line: 276 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: opts.size || 20, font: 'Arial', bold: opts.bold, italics: opts.italic, color: opts.color || '333333' })],
  });
}

function checkMark(selected: boolean) {
  return selected ? '☑' : '☐';
}

function getRiesgoColor(nivel: string): string {
  if (nivel === 'alto') return C.ROJO;
  if (nivel === 'moderado') return C.AMARILLO;
  return C.VERDE;
}

function getRiesgoFondo(nivel: string): string {
  if (nivel === 'alto') return C.ROJO_FONDO;
  if (nivel === 'moderado') return C.AMARILLO_FONDO;
  return C.VERDE_FONDO;
}

function getRiesgoLabel(nivel: string): string {
  if (nivel === 'alto') return 'ALTO';
  if (nivel === 'moderado') return 'MODERADO';
  return 'BAJO';
}

const MITIGACIONES: Record<string, string[]> = {
  fraude: [
    'Implementar controles duales de autorización para operaciones financieras.',
    'Fortalecer la verificación de identidad y documentación soporte.',
    'Establecer auditorías internas periódicas sobre los procesos involucrados.',
    'Reportar ante la UIAF si se configura operación sospechosa.',
  ],
  lavado: [
    'Intensificar la debida diligencia sobre la contraparte involucrada.',
    'Consultar listas restrictivas y vinculantes (OFAC, ONU, Procuraduría).',
    'Documentar detalladamente el origen y destino de los fondos.',
    'Evaluar la presentación de un ROS ante la UIAF.',
  ],
  terrorismo: [
    'Verificar inmediatamente en listas de sanciones internacionales (ONU, OFAC, UE).',
    'Congelar cualquier operación pendiente con la contraparte hasta completar la verificación.',
    'Reportar de manera inmediata a las autoridades competentes.',
    'Documentar todas las evidencias y comunicaciones relacionadas.',
  ],
  corrupcion: [
    'Revisar los controles internos de conflicto de interés.',
    'Verificar antecedentes disciplinarios en Procuraduría y Contraloría.',
    'Implementar canal de denuncia confidencial.',
    'Evaluar terminación de la relación contractual si se confirma.',
  ],
  operacion_inusual: [
    'Solicitar justificación documentada a la contraparte sobre la operación.',
    'Comparar la operación contra el perfil transaccional histórico.',
    'Escalar al representante legal para evaluación.',
    'Considerar la presentación de un ROS si no se obtiene justificación satisfactoria.',
  ],
  otro: [
    'Documentar detalladamente el evento y las circunstancias.',
    'Evaluar el impacto sobre la operación de la empresa.',
    'Implementar controles adicionales según la naturaleza del evento.',
    'Realizar seguimiento periódico hasta el cierre del caso.',
  ],
};

export async function POST(request: NextRequest) {
  try {
    const d = await request.json();

    const empresa = d.RAZON_SOCIAL || 'EMPRESA S.A.S.';
    const nit = d.NIT || 'N/A';
    const repLegal = d.REPRESENTANTE_LEGAL || 'N/A';
    const ciudad = d.CIUDAD || 'Colombia';

    const reportante = d.REPORTANTE || {};
    const repNombre = reportante.nombre || 'N/A';
    const repCargo = reportante.cargo || 'N/A';
    const repArea = reportante.area || 'N/A';
    const repSuperior = reportante.superior || repLegal;

    const evento = d.EVENTO || {};
    const evDescripcion = evento.descripcion || '';
    const evNaturaleza = evento.naturaleza || 'otro';
    const evNaturalezaLabel = ({ fraude: 'Fraude', lavado: 'Lavado de activos', terrorismo: 'Financiación del terrorismo', corrupcion: 'Corrupción', operacion_inusual: 'Operación inusual', otro: 'Otro' } as Record<string, string>)[evNaturaleza] || evNaturaleza;
    const evImpacto = evento.impacto || 'moderado';
    const evImpactoLabel = ({ alto: 'Alto — Pérdida financiera significativa o daño reputacional grave', moderado: 'Moderado — Impacto operacional o financiero controlable', bajo: 'Bajo — Impacto menor sin afectación significativa' } as Record<string, string>)[evImpacto] || evImpacto;
    const evProbabilidad = evento.probabilidad || 'moderada';
    const evProbabilidadLabel = ({ alta: 'Alta — Es probable que ocurra o se repita', moderada: 'Moderada — Podría ocurrir bajo ciertas circunstancias', baja: 'Baja — Poco probable que ocurra' } as Record<string, string>)[evProbabilidad] || evProbabilidad;

    // Calcular riesgo inherente
    const matrizRiesgo: Record<string, Record<string, string>> = {
      alta: { alto: 'alto', moderado: 'alto', bajo: 'moderado' },
      moderada: { alto: 'alto', moderado: 'moderado', bajo: 'bajo' },
      baja: { alto: 'moderado', moderado: 'bajo', bajo: 'bajo' },
    };
    const riesgoInherente = matrizRiesgo[evProbabilidad]?.[evImpacto] || 'moderado';

    const decision = d.DECISION || {};
    const continuar = decision.continuar !== false;
    const justificacion = decision.justificacion || '';

    const plan = d.PLAN || {};
    const planObjetivo = plan.objetivo || 'reducir';
    const planDescripcion = plan.descripcion || '';
    const planPrioridad = plan.prioridad || (riesgoInherente === 'alto' ? 'alta' : riesgoInherente === 'moderado' ? 'media' : 'baja');
    const planMonitoreo = plan.monitoreo || 'trimestral';

    // Riesgo residual: un nivel menos que inherente si hay plan
    const residualMap: Record<string, string> = { alto: 'moderado', moderado: 'bajo', bajo: 'bajo' };
    const riesgoResidual = continuar ? (residualMap[riesgoInherente] || 'bajo') : 'bajo';

    const mitigaciones = MITIGACIONES[evNaturaleza] || MITIGACIONES.otro;

    const fechaHoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

    const contraparteNombre = d.CONTRAPARTE_NOMBRE || '';

    const doc = new Document({
      styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
      sections: [{
        properties: {
          page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.AZUL_SUAVE, space: 4 } },
              children: [new TextRun({ text: `${empresa}  |  Formato de Evaluación de Riesgos (FER)`, size: 16, font: 'Arial', color: C.GRIS_MEDIO, italics: true })],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.AZUL_SUAVE, space: 4 } },
              children: [
                new TextRun({ text: 'Documento confidencial — Generado por Comply  —  ', size: 16, font: 'Arial', color: C.GRIS_MEDIO }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Arial', color: C.AZUL_MEDIO, bold: true }),
              ],
            })],
          }),
        },
        children: [
          // TÍTULO
          new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { after: 60 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.AZUL_MEDIO, space: 6 } },
            children: [new TextRun({ text: 'FORMATO DE EVALUACIÓN DE RIESGOS', size: 28, bold: true, font: 'Arial', color: C.AZUL_OSCURO })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { after: 200 },
            children: [new TextRun({ text: '(FER) LA/FT/FPADM', size: 24, bold: true, font: 'Arial', color: C.AZUL_MEDIO })],
          }),

          // DATOS GENERALES
          new Table({
            width: { size: 9840, type: WidthType.DXA },
            columnWidths: [2800, 2120, 2800, 2120],
            rows: [
              new TableRow({ children: [hdrCell('DATOS GENERALES', 9840, { colspan: 4 })] }),
              new TableRow({ children: [lblCell('Fecha', 2800), valCell(fechaHoy, 2120), lblCell('Empresa', 2800), valCell(empresa, 2120)] }),
              new TableRow({ children: [lblCell('NIT', 2800), valCell(nit, 2120), lblCell('Ciudad', 2800), valCell(ciudad, 2120)] }),
            ],
          }),
          emptyP(160),

          // DATOS DEL REPORTANTE
          new Table({
            width: { size: 9840, type: WidthType.DXA },
            columnWidths: [2800, 7040],
            rows: [
              new TableRow({ children: [hdrCell('DATOS DEL REPORTANTE', 9840, { colspan: 2 })] }),
              new TableRow({ children: [lblCell('Nombre del reportante', 2800), valCell(repNombre, 7040)] }),
              new TableRow({ children: [lblCell('Cargo', 2800), valCell(repCargo, 7040)] }),
              new TableRow({ children: [lblCell('Área', 2800), valCell(repArea, 7040)] }),
              new TableRow({ children: [lblCell('Superior jerárquico', 2800), valCell(repSuperior, 7040)] }),
            ],
          }),
          emptyP(160),

          // DESCRIPCIÓN DEL EVENTO
          new Table({
            width: { size: 9840, type: WidthType.DXA },
            columnWidths: [9840],
            rows: [
              new TableRow({ children: [hdrCell('DESCRIPCIÓN DEL EVENTO DE RIESGO', 9840)] }),
              new TableRow({ children: [new TableCell({
                borders, width: { size: 9840, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  ...(contraparteNombre ? [para(`Contraparte involucrada: ${contraparteNombre}`, { bold: true, size: 18, color: C.AZUL_OSCURO })] : []),
                  para(evDescripcion || '(Describir detalladamente el evento de riesgo identificado, incluyendo fechas, personas involucradas, montos si aplica, y circunstancias relevantes.)', { size: 18, color: evDescripcion ? '333333' : C.GRIS_MEDIO, italic: !evDescripcion }),
                ],
              })] }),
            ],
          }),
          emptyP(160),

          // IDENTIFICACIÓN DEL EVENTO
          new Table({
            width: { size: 9840, type: WidthType.DXA },
            columnWidths: [3200, 6640],
            rows: [
              new TableRow({ children: [hdrCell('IDENTIFICACIÓN DEL EVENTO DE RIESGO', 9840, { colspan: 2 })] }),
              new TableRow({ children: [lblCell('Naturaleza del evento', 3200), valCell(evNaturalezaLabel, 6640, { bold: true })] }),
              new TableRow({ children: [lblCell('Impacto potencial', 3200), valCell(evImpactoLabel, 6640)] }),
              new TableRow({ children: [lblCell('Probabilidad de ocurrencia', 3200), valCell(evProbabilidadLabel, 6640)] }),
            ],
          }),
          emptyP(160),

          // EVALUACIÓN DEL RIESGO
          new Table({
            width: { size: 9840, type: WidthType.DXA },
            columnWidths: [4920, 4920],
            rows: [
              new TableRow({ children: [hdrCell('EVALUACIÓN DEL RIESGO', 9840, { colspan: 2 })] }),
              new TableRow({ children: [
                new TableCell({
                  borders, width: { size: 4920, type: WidthType.DXA },
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                  children: [
                    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'RIESGO INHERENTE', bold: true, size: 18, font: 'Arial', color: C.AZUL_OSCURO })] }),
                    new Paragraph({ children: [
                      new TextRun({ text: `${checkMark(riesgoInherente === 'bajo')} Bajo    ${checkMark(riesgoInherente === 'moderado')} Moderado    ${checkMark(riesgoInherente === 'alto')} Alto`, size: 18, font: 'Arial', color: getRiesgoColor(riesgoInherente), bold: true }),
                    ] }),
                  ],
                }),
                new TableCell({
                  borders, width: { size: 4920, type: WidthType.DXA },
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                  children: [
                    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'RIESGO RESIDUAL', bold: true, size: 18, font: 'Arial', color: C.AZUL_OSCURO })] }),
                    new Paragraph({ children: [
                      new TextRun({ text: `${checkMark(riesgoResidual === 'bajo')} Bajo    ${checkMark(riesgoResidual === 'moderado')} Moderado    ${checkMark(riesgoResidual === 'alto')} Alto`, size: 18, font: 'Arial', color: getRiesgoColor(riesgoResidual), bold: true }),
                    ] }),
                  ],
                }),
              ] }),
            ],
          }),
          emptyP(160),

          // ESTRATEGIAS DE MITIGACIÓN
          new Table({
            width: { size: 9840, type: WidthType.DXA },
            columnWidths: [9840],
            rows: [
              new TableRow({ children: [hdrCell('ANÁLISIS Y PLAN DE TRATAMIENTO DEL RIESGO', 9840)] }),
              new TableRow({ children: [new TableCell({
                borders, width: { size: 9840, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Estrategias de mitigación recomendadas:', bold: true, size: 18, font: 'Arial', color: C.AZUL_OSCURO })] }),
                  ...mitigaciones.map((m, i) => new Paragraph({
                    spacing: { after: 60 },
                    children: [new TextRun({ text: `${i + 1}. ${m}`, size: 18, font: 'Arial', color: '333333' })],
                  })),
                  emptyP(80),
                  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Responsable de la implementación:', bold: true, size: 18, font: 'Arial', color: C.AZUL_OSCURO })] }),
                  new Paragraph({ children: [new TextRun({ text: repLegal, size: 18, font: 'Arial', color: '333333' })] }),
                ],
              })] }),
            ],
          }),
          emptyP(160),

          // DECISIONES Y SEGUIMIENTO
          new Table({
            width: { size: 9840, type: WidthType.DXA },
            columnWidths: [9840],
            rows: [
              new TableRow({ children: [hdrCell('DECISIONES Y SEGUIMIENTO', 9840)] }),
              new TableRow({ children: [new TableCell({
                borders, width: { size: 9840, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Decisión tomada frente al Evento de Riesgo:', bold: true, size: 18, font: 'Arial', color: C.AZUL_OSCURO })] }),
                  new Paragraph({ spacing: { after: 60 }, children: [
                    new TextRun({ text: `${checkMark(!continuar)} `, size: 20, font: 'Arial' }),
                    new TextRun({ text: 'No continuar con la situación o actividad que da lugar al Evento de Riesgo', size: 18, font: 'Arial', color: '333333' }),
                  ] }),
                  new Paragraph({ spacing: { after: 80 }, children: [
                    new TextRun({ text: `${checkMark(continuar)} `, size: 20, font: 'Arial' }),
                    new TextRun({ text: 'Continuar con la situación o actividad aplicando un Plan de Tratamiento', size: 18, font: 'Arial', color: '333333' }),
                  ] }),
                  ...(continuar && justificacion ? [
                    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Justificación para continuar:', bold: true, size: 18, font: 'Arial', color: C.AZUL_OSCURO })] }),
                    new Paragraph({ children: [new TextRun({ text: justificacion, size: 18, font: 'Arial', color: '333333' })] }),
                  ] : []),
                ],
              })] }),
            ],
          }),
          emptyP(160),

          // PLAN DE TRATAMIENTO
          ...(continuar ? [
            new Table({
              width: { size: 9840, type: WidthType.DXA },
              columnWidths: [3200, 6640],
              rows: [
                new TableRow({ children: [hdrCell('PLAN DE TRATAMIENTO', 9840, { colspan: 2 })] }),
                new TableRow({ children: [
                  lblCell('Objetivo del plan', 3200),
                  new TableCell({
                    borders, width: { size: 6640, type: WidthType.DXA },
                    margins: { top: 50, bottom: 50, left: 120, right: 120 },
                    children: [new Paragraph({ children: [
                      new TextRun({ text: `${checkMark(planObjetivo === 'evitar')} Evitar el riesgo    `, size: 16, font: 'Arial', color: '333333' }),
                      new TextRun({ text: `${checkMark(planObjetivo === 'reducir')} Reducir probabilidad/consecuencias    `, size: 16, font: 'Arial', color: '333333' }),
                      new TextRun({ text: `${checkMark(planObjetivo === 'transferir')} Transferir el riesgo`, size: 16, font: 'Arial', color: '333333' }),
                    ] })],
                  }),
                ] }),
                ...(planDescripcion ? [new TableRow({ children: [lblCell('Descripción del plan', 3200), valCell(planDescripcion, 6640)] })] : []),
                new TableRow({ children: [
                  lblCell('Prioridad', 3200),
                  valCell(
                    `${checkMark(planPrioridad === 'alta')} Alta (Riesgo intolerable)    ${checkMark(planPrioridad === 'media')} Media    ${checkMark(planPrioridad === 'baja')} Baja`,
                    6640, { color: planPrioridad === 'alta' ? C.ROJO : planPrioridad === 'media' ? C.AMARILLO : C.VERDE, bold: true }
                  ),
                ] }),
                new TableRow({ children: [
                  lblCell('Periodicidad del monitoreo', 3200),
                  valCell(
                    `${checkMark(planMonitoreo === 'mensual')} Mensual  ${checkMark(planMonitoreo === 'bimestral')} Bimestral  ${checkMark(planMonitoreo === 'trimestral')} Trimestral  ${checkMark(planMonitoreo === 'semestral')} Semestral  ${checkMark(planMonitoreo === 'anual')} Anual`,
                    6640
                  ),
                ] }),
              ],
            }),
            emptyP(200),
          ] : []),

          // FIRMA
          new Paragraph({
            spacing: { before: 200, after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.AZUL_SUAVE, space: 1 } },
            children: [],
          }),
          para(`Evaluación realizada el ${fechaHoy} en ${ciudad}.`, { align: AlignmentType.CENTER, size: 18, color: C.GRIS_MEDIO }),
          emptyP(300),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '___________________________', size: 20, font: 'Arial', color: '333333' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: repLegal, bold: true, size: 20, font: 'Arial', color: '1A1A1A' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'Representante Legal', size: 18, font: 'Arial', color: '333333' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: empresa, bold: true, size: 18, font: 'Arial', color: '1A1A1A' })] }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const base64 = Buffer.from(buffer).toString('base64');
    const filename = `FER_${evNaturalezaLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`;

    return NextResponse.json({ success: true, filename, base64 });
  } catch (error: any) {
    console.error('Error generating FER:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
