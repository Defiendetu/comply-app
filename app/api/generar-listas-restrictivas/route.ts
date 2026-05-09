import { NextRequest, NextResponse } from 'next/server';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType,
  ShadingType, PageNumber, ExternalHyperlink
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

const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: C.AZUL_SUAVE };
const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

function headerCell(text: string, width: number, opts: { colspan?: number } = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: C.AZUL_MEDIO, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    columnSpan: opts.colspan,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 18, font: 'Arial', color: C.BLANCO })] })],
  });
}

function labelCell(text: string, width: number, shading?: string) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: shading || C.AZUL_FONDO, type: ShadingType.CLEAR },
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, font: 'Arial', color: C.AZUL_OSCURO })] })],
  });
}

function valueCell(text: string, width: number, opts: { color?: string; bold?: boolean; italic?: boolean; shading?: string } = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: 'Arial', color: opts.color || '333333', bold: opts.bold, italics: opts.italic })] })],
  });
}

function linkCell(text: string, url: string, width: number) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: [new Paragraph({ children: [
      new ExternalHyperlink({ link: url, children: [new TextRun({ text, size: 16, font: 'Arial', color: C.AZUL_CLARO, underline: { type: 'single' } })] }),
    ] })],
  });
}

function statusCell(width: number) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '☐ Sin resultados   ☐ Alerta   ☐ Pendiente', size: 16, font: 'Arial', color: C.GRIS_MEDIO })] })],
  });
}

function emptyPara(size = 120) {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

function para(text: string, opts: { bold?: boolean; size?: number; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; italic?: boolean } = {}) {
  return new Paragraph({
    spacing: { after: 100, line: 276 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: opts.size || 20, font: 'Arial', bold: opts.bold, italics: opts.italic, color: opts.color || '333333' })],
  });
}

const LISTAS_INTERNACIONALES = [
  { nombre: 'Consejo de Seguridad de las Naciones Unidas / Comités de Sanciones', urls: [{ text: 'scsanctions.un.org', url: 'https://scsanctions.un.org' }] },
  { nombre: 'Listas de terroristas de los Estados Unidos', urls: [{ text: 'state.gov - Organizaciones Terroristas', url: 'https://www.state.gov/foreign-terrorist-organizations/' }] },
  { nombre: 'Lista UE de Organizaciones y Personas Terroristas', urls: [{ text: 'eur-lex.europa.eu', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L:2021:043:TOC' }] },
  { nombre: 'Lista OFAC (SDN)', urls: [{ text: 'sanctionssearch.ofac.treas.gov', url: 'https://sanctionssearch.ofac.treas.gov/' }, { text: 'Portal PACO', url: 'https://portal.paco.gov.co' }] },
  { nombre: 'INTERPOL - Notificaciones Rojas', urls: [{ text: 'interpol.int', url: 'https://www.interpol.int/How-we-work/Notices/Red-Notices' }] },
  { nombre: 'Sanciones BID y Banco Mundial', urls: [{ text: 'Portal PACO', url: 'https://portal.paco.gov.co' }] },
  { nombre: 'Listas GAFI / Jurisdicciones de alto riesgo', urls: [{ text: 'fatf-gafi.org', url: 'https://www.fatf-gafi.org/en/countries/black-and-grey-lists.html' }] },
];

const LISTAS_NACIONALES = [
  { nombre: 'Antecedentes judiciales - Policía Nacional', urls: [{ text: 'policia.gov.co', url: 'https://www.policia.gov.co/servicios/antecedentes' }] },
  { nombre: 'Antecedentes judiciales - Fiscalía', urls: [{ text: 'fiscalia.gov.co', url: 'https://www.fiscalia.gov.co' }] },
  { nombre: 'Antecedentes disciplinarios - Procuraduría', urls: [{ text: 'procuraduria.gov.co', url: 'https://www.procuraduria.gov.co/Pages/Consulta-de-Antecedentes.aspx' }] },
  { nombre: 'Antecedentes fiscales - Contraloría', urls: [{ text: 'contraloria.gov.co', url: 'https://www.contraloria.gov.co/web/guest/persona-natural' }] },
  { nombre: 'PEPs - Función Pública / SIDEAP', urls: [{ text: 'funcionpublica.gov.co', url: 'https://www.funcionpublica.gov.co/fdci/consultaCiudadana/consultaPEP' }, { text: 'sideap.serviciocivil.gov.co', url: 'https://sideap.serviciocivil.gov.co' }] },
  { nombre: 'Reporte de Transparencia', urls: [{ text: 'Portal PACO', url: 'https://portal.paco.gov.co' }] },
  { nombre: 'Registraduría Nacional del Estado Civil', urls: [{ text: 'registraduria.gov.co', url: 'https://www.registraduria.gov.co' }] },
  { nombre: 'Obras civiles inconclusas - Contraloría', urls: [{ text: 'obrasinconclusas.contraloria.gov.co', url: 'https://obrasinconclusas.contraloria.gov.co' }] },
  { nombre: 'Superintendencia Financiera / JCC', urls: [{ text: 'jcc.gov.co', url: 'https://www.jcc.gov.co' }] },
  { nombre: 'Estructura societaria, RUP y administradores - RUES', urls: [{ text: 'rues.org.co', url: 'https://www.rues.org.co' }] },
  { nombre: 'Portal PACO', urls: [{ text: 'portal.paco.gov.co', url: 'https://portal.paco.gov.co' }] },
  { nombre: 'Reportes Superintendencia de Sociedades', urls: [{ text: 'siis.ia.supersociedades.gov.co', url: 'https://siis.ia.supersociedades.gov.co' }] },
];

function buildListTable(title: string, listas: typeof LISTAS_INTERNACIONALES) {
  const rows: TableRow[] = [];

  rows.push(new TableRow({
    children: [
      headerCell('LISTA VINCULANTE O RESTRICTIVA', 3200),
      headerCell('ENLACE DE CONSULTA', 3800),
      headerCell('RESULTADO', 2360),
    ],
  }));

  listas.forEach((lista, i) => {
    const linkChildren = lista.urls.flatMap((u, j) => {
      const parts: (ExternalHyperlink | TextRun)[] = [];
      if (j > 0) parts.push(new TextRun({ text: '  |  ', size: 16, font: 'Arial', color: C.GRIS_MEDIO }));
      parts.push(new ExternalHyperlink({ link: u.url, children: [new TextRun({ text: u.text, size: 16, font: 'Arial', color: C.AZUL_CLARO, underline: { type: 'single' } })] }));
      return parts;
    });

    rows.push(new TableRow({
      children: [
        new TableCell({
          borders, width: { size: 3200, type: WidthType.DXA },
          shading: { fill: i % 2 === 0 ? C.BLANCO : C.GRIS_CLARO, type: ShadingType.CLEAR },
          margins: { top: 50, bottom: 50, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: lista.nombre, size: 18, font: 'Arial', color: '333333', bold: true })] })],
        }),
        new TableCell({
          borders, width: { size: 3800, type: WidthType.DXA },
          shading: { fill: i % 2 === 0 ? C.BLANCO : C.GRIS_CLARO, type: ShadingType.CLEAR },
          margins: { top: 50, bottom: 50, left: 100, right: 100 },
          children: [new Paragraph({ children: linkChildren })],
        }),
        new TableCell({
          borders, width: { size: 2360, type: WidthType.DXA },
          shading: { fill: i % 2 === 0 ? C.BLANCO : C.GRIS_CLARO, type: ShadingType.CLEAR },
          margins: { top: 50, bottom: 50, left: 100, right: 100 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '☐ Sin resultados  ☐ Alerta', size: 14, font: 'Arial', color: C.GRIS_MEDIO })] })],
        }),
      ],
    }));
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 3800, 2360],
    rows,
  });
}

export async function POST(request: NextRequest) {
  try {
    const d = await request.json();
    const empresa = d.RAZON_SOCIAL || 'EMPRESA S.A.S.';
    const nit = d.NIT || 'N/A';
    const repLegal = d.REPRESENTANTE_LEGAL || 'N/A';
    const ciudad = d.CIUDAD || 'Colombia';

    const contraparte = d.CONTRAPARTE || {};
    const cpNombre = contraparte.razon_social || contraparte.nombre || 'N/A';
    const cpNit = contraparte.nit_cc || contraparte.nit || contraparte.cedula || 'N/A';
    const cpTipo = contraparte.tipo_persona === 'natural' ? 'Persona Natural' : 'Persona Jurídica';
    const cpRelacion = contraparte.tipo_relacion || 'cliente';
    const cpRelacionLabel = ({ cliente: 'Cliente', proveedor: 'Proveedor', aliado: 'Aliado estratégico', empleado: 'Trabajador' } as Record<string, string>)[cpRelacion] || cpRelacion;
    const cpRepLegal = contraparte.representante_legal || '';
    const cpCiudad = contraparte.ciudad || '';
    const cpDireccion = contraparte.direccion || '';

    const screening = d.SCREENING || null;

    const fechaConsulta = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    const fechaVencimiento = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

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
              children: [new TextRun({ text: `${empresa}  |  Consulta Listas Restrictivas`, size: 16, font: 'Arial', color: C.GRIS_MEDIO, italics: true })],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.AZUL_SUAVE, space: 4 } },
              children: [
                new TextRun({ text: 'Documento generado por Comply  —  ', size: 16, font: 'Arial', color: C.GRIS_MEDIO }),
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
            children: [new TextRun({ text: 'FORMATO PARA CONSULTA DE LA CONTRAPARTE', size: 28, bold: true, font: 'Arial', color: C.AZUL_OSCURO })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { after: 200 },
            children: [new TextRun({ text: 'LISTAS RESTRICTIVAS Y VINCULANTES', size: 24, bold: true, font: 'Arial', color: C.AZUL_MEDIO })],
          }),

          // DATOS DE LA EMPRESA
          para('DATOS DE LA EMPRESA CONSULTANTE', { bold: true, size: 20, color: C.AZUL_OSCURO }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2800, 6560],
            rows: [
              new TableRow({ children: [labelCell('Razón Social', 2800), valueCell(empresa, 6560)] }),
              new TableRow({ children: [labelCell('NIT', 2800), valueCell(nit, 6560)] }),
              new TableRow({ children: [labelCell('Representante Legal', 2800), valueCell(repLegal, 6560)] }),
              new TableRow({ children: [labelCell('Ciudad', 2800), valueCell(ciudad, 6560)] }),
            ],
          }),
          emptyPara(160),

          // DATOS DE LA CONTRAPARTE
          para('DATOS DE LA CONTRAPARTE CONSULTADA', { bold: true, size: 20, color: C.AZUL_OSCURO }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2800, 6560],
            rows: [
              new TableRow({ children: [labelCell('Nombre / Razón Social', 2800), valueCell(cpNombre, 6560, { bold: true })] }),
              new TableRow({ children: [labelCell('NIT / Cédula', 2800), valueCell(cpNit, 6560)] }),
              new TableRow({ children: [labelCell('Tipo de Persona', 2800), valueCell(cpTipo, 6560)] }),
              new TableRow({ children: [labelCell('Tipo de Relación', 2800), valueCell(cpRelacionLabel, 6560)] }),
              ...(cpRepLegal ? [new TableRow({ children: [labelCell('Representante Legal', 2800), valueCell(cpRepLegal, 6560)] })] : []),
              ...(cpCiudad ? [new TableRow({ children: [labelCell('Ciudad', 2800), valueCell(cpCiudad, 6560)] })] : []),
            ],
          }),
          emptyPara(100),

          // CONTROL DE CONSULTA
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [3120, 3120, 3120],
            rows: [
              new TableRow({ children: [
                headerCell('FECHA DE CONSULTA', 3120),
                headerCell('PRÓXIMA REVISIÓN', 3120),
                headerCell('CONSULTADO POR', 3120),
              ] }),
              new TableRow({ children: [
                valueCell(fechaConsulta, 3120, { bold: true }),
                valueCell(fechaVencimiento, 3120, { color: C.AMARILLO, italic: true }),
                valueCell(repLegal, 3120),
              ] }),
            ],
          }),
          emptyPara(200),

          // LISTAS INTERNACIONALES
          new Paragraph({
            spacing: { after: 120 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.AZUL_MEDIO, space: 4 } },
            children: [new TextRun({ text: 'A. LISTAS A NIVEL INTERNACIONAL', size: 22, bold: true, font: 'Arial', color: C.AZUL_OSCURO })],
          }),
          para('Se recomienda que la entidad consulte las siguientes listas restrictivas y vinculantes internacionales para identificar posibles coincidencias con la contraparte:', { size: 18, color: C.GRIS_OSCURO, italic: true }),
          buildListTable('Internacional', LISTAS_INTERNACIONALES),
          emptyPara(200),

          // LISTAS NACIONALES
          new Paragraph({
            spacing: { after: 120 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.AZUL_MEDIO, space: 4 } },
            children: [new TextRun({ text: 'B. LISTAS A NIVEL NACIONAL', size: 22, bold: true, font: 'Arial', color: C.AZUL_OSCURO })],
          }),
          para('Consultas obligatorias en fuentes nacionales para verificar antecedentes judiciales, disciplinarios, fiscales y estatus de PEP:', { size: 18, color: C.GRIS_OSCURO, italic: true }),
          buildListTable('Nacional', LISTAS_NACIONALES),
          emptyPara(200),

          // RESULTADO GENERAL
          new Paragraph({
            spacing: { after: 120 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.AZUL_MEDIO, space: 4 } },
            children: [new TextRun({ text: 'C. RESULTADO DE LA VERIFICACIÓN AUTOMATIZADA', size: 22, bold: true, font: 'Arial', color: C.AZUL_OSCURO })],
          }),
          ...(screening && screening.resultados ? [
            // Screening results table
            new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: [3500, 2800, 3060],
              rows: [
                new TableRow({ children: [
                  headerCell('LISTA CONSULTADA', 3500),
                  headerCell('FUENTE', 2800),
                  headerCell('RESULTADO', 3060),
                ] }),
                ...(screening.resultados as any[]).map((r: any, i: number) => new TableRow({ children: [
                  new TableCell({
                    borders, width: { size: 3500, type: WidthType.DXA },
                    shading: { fill: i % 2 === 0 ? C.BLANCO : C.GRIS_CLARO, type: ShadingType.CLEAR },
                    margins: { top: 50, bottom: 50, left: 100, right: 100 },
                    children: [new Paragraph({ children: [new TextRun({ text: r.lista || '', size: 17, font: 'Arial', bold: true, color: '333333' })] })],
                  }),
                  new TableCell({
                    borders, width: { size: 2800, type: WidthType.DXA },
                    shading: { fill: i % 2 === 0 ? C.BLANCO : C.GRIS_CLARO, type: ShadingType.CLEAR },
                    margins: { top: 50, bottom: 50, left: 100, right: 100 },
                    children: [new Paragraph({ children: [new TextRun({ text: r.fuente || '', size: 16, font: 'Arial', color: C.GRIS_MEDIO })] })],
                  }),
                  new TableCell({
                    borders, width: { size: 3060, type: WidthType.DXA },
                    shading: { fill: r.resultado === 'coincidencia_positiva' ? C.ROJO_FONDO : r.resultado === 'coincidencia_parcial' ? C.AMARILLO_FONDO : r.resultado === 'no_consultado' ? C.AMARILLO_FONDO : C.VERDE_FONDO, type: ShadingType.CLEAR },
                    margins: { top: 50, bottom: 50, left: 100, right: 100 },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({
                        text: r.resultado === 'coincidencia_positiva' ? '⚠ COINCIDENCIA' : r.resultado === 'coincidencia_parcial' ? '~ PARCIAL' : r.resultado === 'no_consultado' ? '— No consultado' : '✓ Sin coincidencias',
                        size: 16, font: 'Arial', bold: true,
                        color: r.resultado === 'coincidencia_positiva' ? C.ROJO : r.resultado === 'coincidencia_parcial' ? C.AMARILLO : r.resultado === 'no_consultado' ? C.AMARILLO : C.VERDE,
                      })] }),
                      ...(r.detalles ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: r.detalles, size: 14, font: 'Arial', color: C.GRIS_MEDIO, italics: true })] })] : []),
                    ],
                  }),
                ] })),
              ],
            }),
            emptyPara(150),
            // Conclusion box
            new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: [9360],
              rows: [
                new TableRow({ children: [headerCell('CONCLUSIÓN', 9360)] }),
                new TableRow({ children: [new TableCell({
                  borders, width: { size: 9360, type: WidthType.DXA },
                  shading: { fill: screening.conclusion === 'coincidencia_positiva' ? C.ROJO_FONDO : screening.conclusion === 'coincidencia_parcial' ? C.AMARILLO_FONDO : C.VERDE_FONDO, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({
                      text: screening.conclusion === 'coincidencia_positiva' ? '⚠ COINCIDENCIA POSITIVA — Se debe escalar y reportar'
                        : screening.conclusion === 'coincidencia_parcial' ? '~ COINCIDENCIA PARCIAL — Requiere verificación adicional'
                        : '✓ SIN COINCIDENCIAS — La contraparte no aparece en las listas consultadas',
                      size: 20, font: 'Arial', bold: true,
                      color: screening.conclusion === 'coincidencia_positiva' ? C.ROJO : screening.conclusion === 'coincidencia_parcial' ? C.AMARILLO : C.VERDE,
                    })] }),
                    new Paragraph({ children: [new TextRun({ text: screening.recomendacion || '', size: 18, font: 'Arial', color: C.GRIS_OSCURO })] }),
                  ],
                })] }),
              ],
            }),
          ] : [
            // Fallback: manual checkboxes when no screening data
            new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: [9360],
              rows: [
                new TableRow({ children: [headerCell('CONCLUSIÓN DE LA CONSULTA', 9360)] }),
                new TableRow({ children: [new TableCell({
                  borders, width: { size: 9360, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [
                      new TextRun({ text: '☐  ', size: 20, font: 'Arial', color: C.VERDE }),
                      new TextRun({ text: 'SIN COINCIDENCIAS ', bold: true, size: 20, font: 'Arial', color: C.VERDE }),
                      new TextRun({ text: '— La contraparte NO aparece en ninguna lista restrictiva o vinculante consultada.', size: 18, font: 'Arial', color: '333333' }),
                    ] }),
                    new Paragraph({ spacing: { after: 80 }, children: [
                      new TextRun({ text: '☐  ', size: 20, font: 'Arial', color: C.AMARILLO }),
                      new TextRun({ text: 'COINCIDENCIA PARCIAL ', bold: true, size: 20, font: 'Arial', color: C.AMARILLO }),
                      new TextRun({ text: '— Se encontró coincidencia en homonimia. Requiere verificación adicional.', size: 18, font: 'Arial', color: '333333' }),
                    ] }),
                    new Paragraph({ spacing: { after: 80 }, children: [
                      new TextRun({ text: '☐  ', size: 20, font: 'Arial', color: C.ROJO }),
                      new TextRun({ text: 'COINCIDENCIA POSITIVA ', bold: true, size: 20, font: 'Arial', color: C.ROJO }),
                      new TextRun({ text: '— La contraparte aparece en lista(s) restrictiva(s). Se debe escalar y reportar.', size: 18, font: 'Arial', color: '333333' }),
                    ] }),
                  ],
                })] }),
              ],
            }),
          ]),
          emptyPara(100),

          // OBSERVACIONES
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [9360],
            rows: [
              new TableRow({ children: [headerCell('OBSERVACIONES', 9360)] }),
              new TableRow({ children: [new TableCell({
                borders, width: { size: 9360, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [
                  emptyPara(100), emptyPara(100), emptyPara(100),
                  new Paragraph({ children: [new TextRun({ text: '(Registre hallazgos, alertas u observaciones relevantes de la consulta)', size: 16, font: 'Arial', color: C.GRIS_MEDIO, italics: true })] }),
                ],
              })] }),
            ],
          }),
          emptyPara(300),

          // FIRMA
          new Paragraph({
            spacing: { before: 200, after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.AZUL_SUAVE, space: 1 } },
            children: [],
          }),
          para(`Consulta realizada el ${fechaConsulta} en ${ciudad}.`, { align: AlignmentType.CENTER, size: 18, color: C.GRIS_MEDIO }),
          emptyPara(300),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '___________________________', size: 20, font: 'Arial', color: '333333' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: repLegal, bold: true, size: 20, font: 'Arial', color: '1A1A1A' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'Responsable de la Consulta', size: 18, font: 'Arial', color: '333333' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: empresa, bold: true, size: 18, font: 'Arial', color: '1A1A1A' })] }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const base64 = Buffer.from(buffer).toString('base64');
    const cpClean = cpNombre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const filename = `Listas_Restrictivas_${cpClean}.docx`;

    return NextResponse.json({ success: true, filename, base64 });
  } catch (error: any) {
    console.error('Error generating listas restrictivas:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
