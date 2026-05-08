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

const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_MEDIO } };
const subHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_SUAVE } };
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

function sectionHeader(ws: ExcelJS.Worksheet, row: number, cols: number, title: string): number {
  mergeAndSet(ws, row, 1, row, cols, title, headerFont(10), {
    fill: headerFill,
    alignment: { horizontal: 'center', vertical: 'middle' }
  });
  ws.getRow(row).height = 26;
  return row + 1;
}

function fieldRow(ws: ExcelJS.Worksheet, row: number, label: string, c1: number, c2: number, inputC1: number, inputC2: number, prefill = ''): number {
  mergeAndSet(ws, row, c1, row, c2, label, labelFont(9), { fill: lightFill });
  mergeAndSet(ws, row, inputC1, row, inputC2, prefill, prefill ? prefilledFont(9) : normalFont(9), { fill: whiteFill });
  ws.getRow(row).height = 28;
  return row + 1;
}

function checkboxRow(ws: ExcelJS.Worksheet, row: number, options: string[], cols: number): number {
  const perOption = Math.floor(cols / options.length);
  options.forEach((opt, i) => {
    const startCol = 1 + i * perOption;
    const endCol = Math.min(startCol + perOption - 1, cols);
    mergeAndSet(ws, row, startCol, row, endCol, `☐ ${opt}`, normalFont(9));
  });
  ws.getRow(row).height = 26;
  return row + 1;
}

export async function POST(request: NextRequest) {
  try {
    const d = await request.json();
    const empresa = d.RAZON_SOCIAL || 'EMPRESA S.A.S.';
    const empresaCorto = d.RAZON_SOCIAL_CORTO || empresa;
    const nit = d.NIT || 'N/A';
    const repLegal = d.REPRESENTANTE_LEGAL || '';
    const cedulaRep = d.CEDULA_REP_LEGAL || '';
    const ciudad = d.CIUDAD || '';
    const direccion = d.DIRECCION || '';
    const codigoCIIU = d.CODIGO_CIIU || '';
    const sectorNombre = d.SECTOR_NOMBRE || '';
    const siglas = d.SIGLAS || empresaCorto.split(' ').map((p: string) => p[0]).join('').substring(0, 4).toUpperCase();
    const version = d.VERSION || 'V.1';
    const codigoFCC = `FCC_${siglas}_${version}`;
    const COLS = 8;

    // Contraparte data (if provided, pre-fill the FCC)
    const cp = d.CONTRAPARTE || {};
    const cpNombre = cp.razon_social || '';
    const cpNit = cp.nit_cc || cp.nit || '';
    const cpRepLegal = cp.representante_legal || '';
    const cpCedula = cp.cedula_rep_legal || '';
    const cpCiudad = cp.ciudad || '';
    const cpDireccion = cp.direccion || '';
    const cpObjeto = cp.objeto_social || '';
    const cpTipo = cp.tipo_persona || 'juridica';
    const cpRelacion = cp.tipo_relacion || 'cliente';
    const hasCp = cpNombre.length > 0;

    const wb = new ExcelJS.Workbook();
    wb.creator = empresa;
    const ws = wb.addWorksheet('FCC', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } }
    });

    // Column widths — labels wider, inputs flexible
    ws.getColumn(1).width = 16;
    ws.getColumn(2).width = 14;
    ws.getColumn(3).width = 14;
    ws.getColumn(4).width = 14;
    ws.getColumn(5).width = 16;
    ws.getColumn(6).width = 14;
    ws.getColumn(7).width = 12;
    ws.getColumn(8).width = 12;

    let r = 1;

    // === TITLE ===
    mergeAndSet(ws, r, 1, r, COLS, 'FORMATO ÚNICO DE CONOCIMIENTO DE CONTRAPARTES', headerFont(14), {
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
    mergeAndSet(ws, r, 1, r, 2, `Código: ${codigoFCC}`, smallFont(8), { fill: grayFill });
    mergeAndSet(ws, r, 3, r, 5, `Empresa: ${empresa}`, smallFont(8), { fill: grayFill });
    mergeAndSet(ws, r, 6, r, COLS, 'FECHA: ____/____/________', smallFont(8), { fill: grayFill });
    ws.getRow(r).height = 22;
    r++;

    // Justificación
    mergeAndSet(ws, r, 1, r + 2, COLS,
      `${empresa} (NIT: ${nit}) cuenta con un Régimen de Medidas Mínimas para gestionar, prevenir y mitigar los riesgos asociados al Lavado de Activos, Financiación del Terrorismo y Financiación de la Proliferación de Armas de Destrucción Masiva (LA/FT/FPADM). Con el propósito de dar cumplimiento a la normativa vigente, solicitamos amablemente diligenciar el presente formulario de manera veraz y completa.`,
      normalFont(8), { alignment: { vertical: 'top', wrapText: true } }
    );
    ws.getRow(r).height = 22;
    ws.getRow(r + 1).height = 22;
    ws.getRow(r + 2).height = 22;
    r += 3;

    // Tipo de relacionamiento
    r = sectionHeader(ws, r, COLS, 'TIPO DE RELACIONAMIENTO');
    r = checkboxRow(ws, r, ['VINCULACIÓN', 'ACTUALIZACIÓN', 'REACTIVACIÓN'], COLS);
    r = checkboxRow(ws, r, ['CLIENTE', 'PROVEEDOR', 'EMPLEADO', 'OTRO'], COLS);
    r++;

    // ============================================
    // SECCIÓN I: PERSONA NATURAL
    // ============================================
    r = sectionHeader(ws, r, COLS, 'I. INFORMACIÓN GENERAL — PERSONA NATURAL');

    r = fieldRow(ws, r, 'Primer Apellido:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Segundo Apellido:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });

    r = fieldRow(ws, r, 'Nombres:', 1, 2, 3, COLS);

    r = sectionHeader(ws, r, COLS, 'Tipo de Identificación');
    r = checkboxRow(ws, r, ['C.C.', 'C.E.', 'PASAPORTE', 'OTRO:______'], COLS);

    r = fieldRow(ws, r, 'No. Identificación:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Lugar Expedición:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;

    r = fieldRow(ws, r, 'Fecha Nacimiento:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Lugar Nacimiento:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;

    r = fieldRow(ws, r, 'País de Residencia:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Departamento:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;

    r = fieldRow(ws, r, 'Ciudad:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Dirección:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;

    r = fieldRow(ws, r, 'Teléfono:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Correo Electrónico:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;

    r = fieldRow(ws, r, 'Ocupación / Profesión:', 1, 3, 4, COLS);
    r = checkboxRow(ws, r, ['DEPENDIENTE', 'INDEPENDIENTE'], COLS);
    r = fieldRow(ws, r, 'Empresa donde labora:', 1, 3, 4, COLS);
    r = fieldRow(ws, r, 'Cargo actual:', 1, 2, 3, COLS);
    r++;

    // ============================================
    // PEPs
    // ============================================
    r = sectionHeader(ws, r, COLS, 'PERSONA POLÍTICAMENTE EXPUESTA (PEP)');
    mergeAndSet(ws, r, 1, r + 1, COLS,
      'Se considerarán PEP los servidores públicos de cualquier nivel que manejen recursos públicos, tomen o influyan en decisiones públicas, o gocen de reconocimiento público. También sus familiares hasta el 2° grado de consanguinidad, 2° de afinidad y 1° civil.',
      smallFont(8), { alignment: { vertical: 'top', wrapText: true } }
    );
    ws.getRow(r).height = 24;
    ws.getRow(r + 1).height = 24;
    r += 2;
    r = checkboxRow(ws, r, ['SÍ, soy PEP', 'NO soy PEP'], COLS);
    r = fieldRow(ws, r, 'Si es PEP, indique cargo:', 1, 3, 4, COLS);
    r = fieldRow(ws, r, 'Entidad:', 1, 2, 3, COLS);
    r = fieldRow(ws, r, 'Fecha de desvinculación (si aplica):', 1, 4, 5, COLS);

    mergeAndSet(ws, r, 1, r, COLS, 'Información Económica PEP', labelFont(9), { fill: subHeaderFill, alignment: { horizontal: 'center', vertical: 'middle' } });
    ws.getRow(r).height = 24;
    r++;
    r = fieldRow(ws, r, 'Ingresos mensuales (función pública):', 1, 4, 5, COLS);
    r = fieldRow(ws, r, 'Ingresos mensuales (otras actividades):', 1, 4, 5, COLS);
    r = fieldRow(ws, r, 'Total egresos mensuales:', 1, 4, 5, COLS);
    r = fieldRow(ws, r, 'Total activos:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Total pasivos:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;

    mergeAndSet(ws, r, 1, r, COLS, 'Personas vinculadas al PEP (2° grado consanguinidad, 2° afinidad y 1° civil)', labelFont(8), { fill: subHeaderFill, alignment: { horizontal: 'center', vertical: 'middle' } });
    ws.getRow(r).height = 24;
    r++;
    // Table header
    mergeAndSet(ws, r, 1, r, 3, 'Nombre Completo', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 4, r, 5, 'Identificación', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 6, r, 7, 'Parentesco', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    setCell(ws, r, 8, 'PEP?', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 24;
    r++;
    for (let i = 0; i < 3; i++) {
      mergeAndSet(ws, r, 1, r, 3, '', normalFont(9), { fill: whiteFill });
      mergeAndSet(ws, r, 4, r, 5, '', normalFont(9), { fill: whiteFill });
      mergeAndSet(ws, r, 6, r, 7, '', normalFont(9), { fill: whiteFill });
      setCell(ws, r, 8, '☐ Sí  ☐ No', smallFont(7), { fill: whiteFill, alignment: { horizontal: 'center', vertical: 'middle' } });
      ws.getRow(r).height = 26;
      r++;
    }
    r++;

    // ============================================
    // SECCIÓN II: PERSONA JURÍDICA
    // ============================================
    r = sectionHeader(ws, r, COLS, 'II. INFORMACIÓN GENERAL — PERSONA JURÍDICA');
    r = checkboxRow(ws, r, ['CLIENTE', 'PROVEEDOR', 'CONTRATISTA', 'OTRO'], COLS);
    r = fieldRow(ws, r, 'Razón Social:', 1, 2, 3, COLS, hasCp ? cpNombre : '');
    r = fieldRow(ws, r, 'NIT:', 1, 2, 3, 4, hasCp ? cpNit : '');
    setCell(ws, r - 1, 5, 'Dígito Verificación:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;

    r = fieldRow(ws, r, 'Fecha Constitución:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'País:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;

    r = fieldRow(ws, r, 'Dirección:', 1, 2, 3, COLS, hasCp ? cpDireccion : '');
    r = fieldRow(ws, r, 'Ciudad:', 1, 2, 3, 4, hasCp ? cpCiudad : '');
    setCell(ws, r - 1, 5, 'Departamento:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;

    r = fieldRow(ws, r, 'Teléfono:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Correo:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;

    r = fieldRow(ws, r, 'Representante Legal:', 1, 3, 4, COLS, hasCp ? cpRepLegal : '');
    r = fieldRow(ws, r, 'C.C. Rep. Legal:', 1, 3, 4, COLS, hasCp ? cpCedula : '');
    r = fieldRow(ws, r, 'Objeto Social (resumen):', 1, 3, 4, COLS, hasCp ? cpObjeto : '');
    r++;

    // Miembros Junta Directiva
    mergeAndSet(ws, r, 1, r, COLS, 'Miembros de Junta Directiva o Socios Principales', labelFont(9), { fill: subHeaderFill, alignment: { horizontal: 'center', vertical: 'middle' } });
    ws.getRow(r).height = 24;
    r++;
    mergeAndSet(ws, r, 1, r, 3, 'Nombre y Apellido', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 4, r, 5, 'Identificación', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 6, r, 7, 'Cargo / % Particip.', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    setCell(ws, r, 8, 'PEP?', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 24;
    r++;
    for (let i = 0; i < 5; i++) {
      mergeAndSet(ws, r, 1, r, 3, '', normalFont(9), { fill: whiteFill });
      mergeAndSet(ws, r, 4, r, 5, '', normalFont(9), { fill: whiteFill });
      mergeAndSet(ws, r, 6, r, 7, '', normalFont(9), { fill: whiteFill });
      setCell(ws, r, 8, '☐ Sí  ☐ No', smallFont(7), { fill: whiteFill, alignment: { horizontal: 'center', vertical: 'middle' } });
      ws.getRow(r).height = 24;
      r++;
    }
    r++;

    // Actividad económica
    r = sectionHeader(ws, r, COLS, 'ACTIVIDAD ECONÓMICA');
    r = fieldRow(ws, r, 'Código CIIU:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Descripción:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;
    r = fieldRow(ws, r, 'Ingresos mensuales aprox.:', 1, 3, 4, COLS);
    r = fieldRow(ws, r, 'Total activos:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Total pasivos:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;
    r = checkboxRow(ws, r, ['Declara Renta: SÍ ☐  NO ☐', 'Gran Contribuyente: SÍ ☐  NO ☐'], COLS);
    r = checkboxRow(ws, r, ['Opera en moneda extranjera: SÍ ☐  NO ☐', 'Maneja efectivo: SÍ ☐  NO ☐'], COLS);
    r++;

    // Beneficiarios finales
    r = sectionHeader(ws, r, COLS, 'BENEFICIARIOS FINALES');
    mergeAndSet(ws, r, 1, r, COLS,
      'Identifique las personas naturales que directa o indirectamente posean el 5% o más del capital, derechos de voto o beneficios de la entidad (Art. 631-5 E.T.).',
      smallFont(8), { alignment: { vertical: 'middle', wrapText: true } }
    );
    ws.getRow(r).height = 28;
    r++;
    mergeAndSet(ws, r, 1, r, 3, 'Nombre Completo', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 4, r, 5, 'Identificación', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    setCell(ws, r, 6, '% Particip.', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    setCell(ws, r, 7, 'País', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    setCell(ws, r, 8, 'PEP?', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 24;
    r++;
    for (let i = 0; i < 4; i++) {
      mergeAndSet(ws, r, 1, r, 3, '', normalFont(9), { fill: whiteFill });
      mergeAndSet(ws, r, 4, r, 5, '', normalFont(9), { fill: whiteFill });
      setCell(ws, r, 6, '', normalFont(9), { fill: whiteFill });
      setCell(ws, r, 7, '', normalFont(9), { fill: whiteFill });
      setCell(ws, r, 8, '☐ Sí  ☐ No', smallFont(7), { fill: whiteFill, alignment: { horizontal: 'center', vertical: 'middle' } });
      ws.getRow(r).height = 24;
      r++;
    }
    r++;

    // Referencias
    r = sectionHeader(ws, r, COLS, 'REFERENCIAS COMERCIALES (mínimo 2)');
    for (let i = 0; i < 2; i++) {
      r = fieldRow(ws, r, `Nombre / Razón Social ${i + 1}:`, 1, 3, 4, COLS);
      r = fieldRow(ws, r, 'Teléfono:', 1, 2, 3, 4);
      setCell(ws, r - 1, 5, 'Ciudad:', labelFont(9), { fill: lightFill });
      mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
      ws.getRow(r - 1).height = 28;
      if (i === 0) { ws.getRow(r).height = 6; r++; }
    }
    r++;

    r = sectionHeader(ws, r, COLS, 'REFERENCIAS FINANCIERAS');
    r = fieldRow(ws, r, 'Entidad Bancaria:', 1, 2, 3, COLS);
    r = fieldRow(ws, r, 'Tipo de Cuenta:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'No. Cuenta:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9), { fill: whiteFill });
    ws.getRow(r - 1).height = 28;
    r++;

    // ============================================
    // DECLARACIONES
    // ============================================
    r = sectionHeader(ws, r, COLS, 'DECLARACIÓN DE ORIGEN LÍCITO DE FONDOS');
    mergeAndSet(ws, r, 1, r + 3, COLS,
      'La Contraparte declara bajo la gravedad de juramento que:\n\n' +
      '1. La información consignada en este formato es veraz, verificable y no ha sido alterada.\n' +
      '2. Los recursos y bienes involucrados en la relación comercial provienen de actividades lícitas y no están relacionados con lavado de activos, financiación del terrorismo ni proliferación de armas de destrucción masiva.\n' +
      '3. No se encuentra incluido(a) en ninguna Lista Vinculante para Colombia (ONU, OFAC, UE) ni en listas nacionales de la Procuraduría, Contraloría o Policía Nacional.\n' +
      '4. No ha sido investigado(a) ni condenado(a) por delitos relacionados con LA/FT/FPADM ni delitos fuente.\n' +
      '5. Se compromete a informar de inmediato cualquier situación que modifique las declaraciones aquí consignadas.',
      normalFont(8), { alignment: { vertical: 'top', wrapText: true } }
    );
    ws.getRow(r).height = 20; ws.getRow(r + 1).height = 20;
    ws.getRow(r + 2).height = 20; ws.getRow(r + 3).height = 20;
    r += 4;
    r++;

    r = sectionHeader(ws, r, COLS, 'AUTORIZACIÓN TRATAMIENTO DE DATOS PERSONALES');
    mergeAndSet(ws, r, 1, r + 2, COLS,
      `Por medio de la firma del presente documento, autorizo de manera libre, expresa y voluntaria a ${empresa} (NIT: ${nit}), con domicilio en ${ciudad || '[Ciudad]'}${direccion ? ', ' + direccion : ''}, para recolectar, almacenar, usar, circular y suprimir mis datos personales conforme a la Ley Estatutaria 1581 de 2012 y el Decreto Reglamentario 1377 de 2013, con la finalidad de dar cumplimiento al Régimen de Medidas Mínimas LA/FT/FPADM y para las gestiones propias de la relación comercial.`,
      normalFont(8), { alignment: { vertical: 'top', wrapText: true } }
    );
    ws.getRow(r).height = 22; ws.getRow(r + 1).height = 22; ws.getRow(r + 2).height = 22;
    r += 3;

    // Cláusula de incumplimiento
    r = sectionHeader(ws, r, COLS, 'CLÁUSULA DE INCUMPLIMIENTO');
    mergeAndSet(ws, r, 1, r + 1, COLS,
      `La Contraparte acepta que el suministro de información falsa, inexacta o incompleta faculta a ${empresa} para dar por terminada la relación comercial de manera inmediata, sin perjuicio de las acciones legales y reportes ante las autoridades competentes a que hubiere lugar.`,
      normalFont(8), { alignment: { vertical: 'top', wrapText: true } }
    );
    ws.getRow(r).height = 22; ws.getRow(r + 1).height = 22;
    r += 2;
    r++;

    // Documentos requeridos
    r = sectionHeader(ws, r, COLS, 'DOCUMENTOS REQUERIDOS SEGÚN CORRESPONDA');
    mergeAndSet(ws, r, 1, r, 4, 'PERSONA NATURAL', labelFont(8), { fill: subHeaderFill, alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, 'PERSONA JURÍDICA', labelFont(8), { fill: subHeaderFill, alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 22;
    r++;
    const docsPN = ['Copia documento de identidad', 'RUT (si aplica)', 'Declaración de Renta (si aplica)', 'Certificado laboral o ingresos'];
    const docsPJ = ['Certificado Cámara de Comercio (< 30 días)', 'RUT actualizado', 'Copia C.C. Representante Legal', 'Estados Financieros (si aplica)'];
    for (let i = 0; i < 4; i++) {
      mergeAndSet(ws, r, 1, r, 4, `☐ ${docsPN[i]}`, smallFont(8));
      mergeAndSet(ws, r, 5, r, COLS, `☐ ${docsPJ[i]}`, smallFont(8));
      ws.getRow(r).height = 22;
      r++;
    }
    r++;

    // ============================================
    // FIRMA
    // ============================================
    r = sectionHeader(ws, r, COLS, 'FIRMA');

    mergeAndSet(ws, r, 1, r, COLS,
      'Como constancia de haber leído, entendido y aceptado lo anterior, declaro que la información proporcionada es veraz y completa.',
      normalFont(9), { alignment: { horizontal: 'center', vertical: 'middle' } }
    );
    ws.getRow(r).height = 28;
    r += 2;

    // Contraparte firma
    mergeAndSet(ws, r, 1, r, 4, '___________________________________', normalFont(9), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, '___________________________________', normalFont(9), { alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 30;
    r++;
    mergeAndSet(ws, r, 1, r, 4, 'Firma de la Contraparte', labelFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, 'Firma del Representante Legal', labelFont(8), { alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 20;
    r++;
    mergeAndSet(ws, r, 1, r, 4, 'Nombre: ____________________________', normalFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, repLegal ? `Nombre: ${repLegal}` : 'Nombre: ____________________________', repLegal ? prefilledFont(8) : normalFont(8), { alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 24;
    r++;
    mergeAndSet(ws, r, 1, r, 4, 'C.C./NIT: __________________________', normalFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, `NIT: ${nit}`, prefilledFont(8), { alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 24;
    r++;
    mergeAndSet(ws, r, 1, r, 4, 'Fecha: ____/____/________', normalFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, ciudad ? `Ciudad: ${ciudad}` : 'Ciudad: _________________________', ciudad ? prefilledFont(8) : normalFont(8), { alignment: { horizontal: 'center' } });
    ws.getRow(r).height = 24;
    r += 2;

    // Aviso final
    mergeAndSet(ws, r, 1, r + 1, COLS,
      'AVISO: La información consignada en el presente documento se presume veraz, por lo que cualquier imprecisión o falsedad podrá ser puesta en conocimiento de las autoridades competentes. Este documento tiene carácter CONFIDENCIAL.',
      smallFont(7), { fill: grayFill, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } }
    );
    ws.getRow(r).height = 20; ws.getRow(r + 1).height = 20;

    // Footer
    ws.headerFooter.oddFooter = `&L${codigoFCC}&C${empresa} — NIT: ${nit}&RPágina &P de &N`;

    const buffer = await wb.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer as ArrayBuffer).toString('base64');
    const filename = `FCC_${empresaCorto.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

    return NextResponse.json({ success: true, filename, base64, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error: any) {
    console.error('Error generating FCC:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
