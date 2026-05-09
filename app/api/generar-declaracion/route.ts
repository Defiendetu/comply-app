import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export const maxDuration = 30;

const C = {
  AZUL_OSCURO: 'FF1B2A4A',
  AZUL_MEDIO: 'FF2E5090',
  AZUL_CLARO: 'FF4472C4',
  AZUL_SUAVE: 'FFD6E4F0',
  AZUL_FONDO: 'FFEDF2F9',
  GRIS_OSCURO: 'FF404040',
  GRIS_MEDIO: 'FF808080',
  GRIS_CLARO: 'FFF2F2F2',
  BLANCO: 'FFFFFFFF',
  NEGRO: 'FF1A1A1A',
};

function headerFont(size = 11): Partial<ExcelJS.Font> {
  return { name: 'Arial', size, bold: true, color: { argb: C.BLANCO } };
}
function labelFont(size = 9): Partial<ExcelJS.Font> {
  return { name: 'Arial', size, bold: true, color: { argb: C.NEGRO } };
}
function normalFont(size = 9): Partial<ExcelJS.Font> {
  return { name: 'Arial', size, color: { argb: C.GRIS_OSCURO } };
}
function smallFont(size = 8): Partial<ExcelJS.Font> {
  return { name: 'Arial', size, color: { argb: C.GRIS_MEDIO } };
}
function prefilledFont(size = 9): Partial<ExcelJS.Font> {
  return { name: 'Arial', size, color: { argb: C.AZUL_MEDIO }, italic: true };
}
function bodyFont(size = 10): Partial<ExcelJS.Font> {
  return { name: 'Arial', size, color: { argb: C.NEGRO } };
}

const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_MEDIO } };
const lightFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_FONDO } };
const grayFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.GRIS_CLARO } };
const whiteFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.BLANCO } };

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: C.AZUL_SUAVE } },
  bottom: { style: 'thin', color: { argb: C.AZUL_SUAVE } },
  left: { style: 'thin', color: { argb: C.AZUL_SUAVE } },
  right: { style: 'thin', color: { argb: C.AZUL_SUAVE } },
};

function setCell(ws: ExcelJS.Worksheet, row: number, col: number, value: string, font: Partial<ExcelJS.Font>, opts: any = {}) {
  const cell = ws.getCell(row, col);
  cell.value = value;
  cell.font = font;
  if (opts.fill) cell.fill = opts.fill;
  if (opts.alignment) cell.alignment = opts.alignment;
  else cell.alignment = { vertical: 'middle', wrapText: true };
  cell.border = thinBorder;
  return cell;
}

function mergeAndSet(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number, value: string, font: Partial<ExcelJS.Font>, opts: any = {}) {
  ws.mergeCells(r1, c1, r2, c2);
  return setCell(ws, r1, c1, value, font, opts);
}

export async function POST(request: NextRequest) {
  try {
    const d = await request.json();

    // Company data
    const empresa = d.RAZON_SOCIAL || 'EMPRESA S.A.S.';
    const nit = d.NIT || 'N/A';
    const repLegal = d.REPRESENTANTE_LEGAL || '';
    const ciudad = d.CIUDAD || '';
    const siglas = d.SIGLAS || empresa.split(' ').filter((p: string) => p.length > 1).map((p: string) => p[0]).join('').substring(0, 4).toUpperCase();

    // Worker data
    const trabajador = d.TRABAJADOR || {};
    const tNombre = trabajador.nombre || '';
    const tCedula = trabajador.cedula || '';
    const tCargo = trabajador.cargo || '';
    const tArea = trabajador.area || '';
    const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

    const COLS = 8;
    const wb = new ExcelJS.Workbook();
    wb.creator = empresa;
    const ws = wb.addWorksheet('Declaración', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, margins: { left: 0.6, right: 0.6, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } }
    });

    ws.getColumn(1).width = 14;
    ws.getColumn(2).width = 14;
    ws.getColumn(3).width = 14;
    ws.getColumn(4).width = 14;
    ws.getColumn(5).width = 14;
    ws.getColumn(6).width = 14;
    ws.getColumn(7).width = 12;
    ws.getColumn(8).width = 12;

    let r = 1;

    // === TITLE ===
    mergeAndSet(ws, r, 1, r, COLS, 'FORMATO DE DECLARACIÓN DE LOS TRABAJADORES', headerFont(14), {
      fill: headerFill, alignment: { horizontal: 'center', vertical: 'middle' }
    });
    ws.getRow(r).height = 36;
    r++;

    mergeAndSet(ws, r, 1, r, COLS, 'RÉGIMEN DE MEDIDAS MÍNIMAS LA/FT/FPADM', headerFont(10), {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_CLARO } },
      alignment: { horizontal: 'center', vertical: 'middle' }
    });
    ws.getRow(r).height = 24;
    r++;

    // Info bar
    const codigoDoc = `DT_${siglas}_${new Date().getFullYear()}`;
    mergeAndSet(ws, r, 1, r, 3, `Código: ${codigoDoc}`, smallFont(8), { fill: grayFill });
    mergeAndSet(ws, r, 4, r, 6, `Empresa: ${empresa}`, smallFont(8), { fill: grayFill });
    mergeAndSet(ws, r, 7, r, COLS, `NIT: ${nit}`, smallFont(8), { fill: grayFill });
    ws.getRow(r).height = 22;
    r++;
    r++;

    // === WORKER DATA SECTION ===
    mergeAndSet(ws, r, 1, r, COLS, 'DATOS DEL TRABAJADOR', headerFont(10), {
      fill: headerFill, alignment: { horizontal: 'center', vertical: 'middle' }
    });
    ws.getRow(r).height = 26;
    r++;

    // Fecha
    mergeAndSet(ws, r, 1, r, 2, 'Fecha:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r, 3, r, COLS, tNombre ? fecha : '', tNombre ? prefilledFont(9) : normalFont(9), { fill: whiteFill });
    ws.getRow(r).height = 28;
    r++;

    // Nombre
    mergeAndSet(ws, r, 1, r, 2, 'Nombre completo:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r, 3, r, COLS, tNombre, tNombre ? prefilledFont(9) : normalFont(9), { fill: whiteFill });
    ws.getRow(r).height = 28;
    r++;

    // Cedula
    mergeAndSet(ws, r, 1, r, 2, 'No. Identificación:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r, 3, r, 4, tCedula, tCedula ? prefilledFont(9) : normalFont(9), { fill: whiteFill });
    setCell(ws, r, 5, 'Tipo:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r, 6, r, COLS, 'C.C.', normalFont(9), { fill: whiteFill });
    ws.getRow(r).height = 28;
    r++;

    // Cargo
    mergeAndSet(ws, r, 1, r, 2, 'Cargo:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r, 3, r, COLS, tCargo, tCargo ? prefilledFont(9) : normalFont(9), { fill: whiteFill });
    ws.getRow(r).height = 28;
    r++;

    // Área
    mergeAndSet(ws, r, 1, r, 2, 'Área:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r, 3, r, COLS, tArea, tArea ? prefilledFont(9) : normalFont(9), { fill: whiteFill });
    ws.getRow(r).height = 28;
    r++;
    r++;

    // === DECLARATION ===
    mergeAndSet(ws, r, 1, r, COLS, 'DECLARACIÓN', headerFont(10), {
      fill: headerFill, alignment: { horizontal: 'center', vertical: 'middle' }
    });
    ws.getRow(r).height = 26;
    r++;

    // Intro
    mergeAndSet(ws, r, 1, r + 1, COLS,
      `Declaro lo siguiente en relación con las políticas de ${empresa}:`,
      bodyFont(10), { alignment: { vertical: 'middle', wrapText: true } }
    );
    ws.getRow(r).height = 22;
    ws.getRow(r + 1).height = 12;
    r += 2;

    // Declaration items
    const declaraciones = [
      `1. Reconozco que he leído y comprendido el Sistema de Autocontrol y Gestión de Riesgos Integral de Lavado de Activos y Financiación del Terrorismo y el Financiamiento de la Proliferación de Armas de Destrucción Masiva ("SAGRILAFT") de la empresa ${empresa}. Me comprometo explícitamente a cumplir con este sistema y a seguir todas sus disposiciones.`,
      `2. Certifico que he recibido capacitación sobre el SAGRILAFT y entiendo las responsabilidades que esto implica para mí.`,
      `3. Declaro que no tengo vínculos con actividades ilícitas como el Lavado de Activos, el Financiamiento del Terrorismo o el Financiamiento de la Proliferación de Armas de Destrucción Masiva. Además, ni yo ni mis familiares hasta tercer grado estamos siendo investigados o hemos sido condenados judicialmente por estas actividades.`,
      `4. Afirmo que mis fondos y bienes tienen un origen lícito y no provienen de actividades relacionadas con el Lavado de Activos, el Financiamiento del Terrorismo o el Financiamiento de la Proliferación de Armas de Destrucción Masiva.`,
      `5. Me comprometo a informar a la empresa de inmediato si en algún momento durante mi empleo surgiera cualquier situación que pudiera relacionarse con actividades ilícitas mencionadas anteriormente.`,
    ];

    for (const decl of declaraciones) {
      const lines = Math.ceil(decl.length / 100);
      const rowSpan = Math.max(2, lines);
      mergeAndSet(ws, r, 1, r + rowSpan - 1, COLS, decl, bodyFont(9.5), {
        alignment: { vertical: 'top', wrapText: true, indent: 1 }
      });
      for (let i = 0; i < rowSpan; i++) {
        ws.getRow(r + i).height = 22;
      }
      r += rowSpan;
      ws.getRow(r).height = 8;
      r++;
    }

    r++;

    // === SIGNATURE ===
    mergeAndSet(ws, r, 1, r, COLS, 'FIRMA', headerFont(10), {
      fill: headerFill, alignment: { horizontal: 'center', vertical: 'middle' }
    });
    ws.getRow(r).height = 26;
    r++;
    r++;

    mergeAndSet(ws, r, 1, r, COLS,
      'Como constancia de haber leído, entendido y aceptado lo anterior, firmo la presente declaración de manera libre y voluntaria.',
      normalFont(9), { alignment: { horizontal: 'center', vertical: 'middle' } }
    );
    ws.getRow(r).height = 28;
    r += 3;

    // Signature line - worker
    mergeAndSet(ws, r, 1, r, 4, '___________________________________', normalFont(9), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, '___________________________________', normalFont(9), { alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 30;
    r++;

    mergeAndSet(ws, r, 1, r, 4, 'Firma del Trabajador', labelFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, 'Firma del Representante Legal', labelFont(8), { alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 20;
    r++;

    mergeAndSet(ws, r, 1, r, 4, tNombre ? `Nombre: ${tNombre}` : 'Nombre: ____________________________',
      tNombre ? prefilledFont(8) : normalFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, repLegal ? `Nombre: ${repLegal}` : 'Nombre: ____________________________',
      repLegal ? prefilledFont(8) : normalFont(8), { alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 24;
    r++;

    mergeAndSet(ws, r, 1, r, 4, tCedula ? `C.C.: ${tCedula}` : 'C.C.: _____________________________',
      tCedula ? prefilledFont(8) : normalFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, `NIT: ${nit}`, prefilledFont(8), { alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 24;
    r++;

    mergeAndSet(ws, r, 1, r, 4, tCargo ? `Cargo: ${tCargo}` : 'Cargo: ____________________________',
      tCargo ? prefilledFont(8) : normalFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, ciudad ? `Ciudad: ${ciudad}` : 'Ciudad: _________________________',
      ciudad ? prefilledFont(8) : normalFont(8), { alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 24;
    r++;

    mergeAndSet(ws, r, 1, r, 4, `Fecha: ${fecha}`, prefilledFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, '', normalFont(8));
    ws.getRow(r).height = 24;
    r += 2;

    // Footer notice
    mergeAndSet(ws, r, 1, r + 1, COLS,
      'AVISO: Esta declaración tiene vigencia de un (1) año a partir de la fecha de firma. Es responsabilidad de la empresa gestionar la renovación oportuna. Este documento tiene carácter CONFIDENCIAL y hace parte integral del expediente del trabajador dentro del Régimen de Medidas Mínimas LA/FT/FPADM.',
      smallFont(7), { fill: grayFill, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } }
    );
    ws.getRow(r).height = 22;
    ws.getRow(r + 1).height = 22;

    // Page footer
    ws.headerFooter.oddFooter = `&L${codigoDoc}&C${empresa} — NIT: ${nit}&RPágina &P de &N`;

    const buffer = await wb.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer as ArrayBuffer).toString('base64');
    const workerSlug = tNombre ? tNombre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) : 'BLANCO';
    const filename = `Declaracion_${workerSlug}_${new Date().getFullYear()}.xlsx`;

    return NextResponse.json({ success: true, filename, base64, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error: any) {
    console.error('Error generating declaration:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
