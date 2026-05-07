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

const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_MEDIO } };
const subHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_SUAVE } };
const lightFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_FONDO } };
const grayFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.GRIS_CLARO } };

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
  ws.getRow(row).height = 24;
  return row + 1;
}

function fieldRow(ws: ExcelJS.Worksheet, row: number, label: string, c1: number, c2: number, inputC1: number, inputC2: number): number {
  mergeAndSet(ws, row, c1, row, c2, label, labelFont(9), { fill: lightFill });
  mergeAndSet(ws, row, inputC1, row, inputC2, '', normalFont(9), { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.BLANCO } } });
  ws.getRow(row).height = 22;
  return row + 1;
}

function checkboxRow(ws: ExcelJS.Worksheet, row: number, options: string[], cols: number): number {
  const perOption = Math.floor(cols / options.length);
  options.forEach((opt, i) => {
    const startCol = 1 + i * perOption;
    const endCol = startCol + perOption - 1;
    mergeAndSet(ws, row, startCol, row, endCol, `☐ ${opt}`, normalFont(9));
  });
  ws.getRow(row).height = 20;
  return row + 1;
}

export async function POST(request: NextRequest) {
  try {
    const d = await request.json();
    const empresa = d.RAZON_SOCIAL || 'EMPRESA S.A.S.';
    const empresaCorto = d.RAZON_SOCIAL_CORTO || empresa;
    const nit = d.NIT || 'N/A';
    const siglas = d.SIGLAS || empresaCorto.split(' ').map((p: string) => p[0]).join('').substring(0, 4).toUpperCase();
    const version = d.VERSION || 'V.1';
    const codigoFCC = `FCC_${siglas}_${version}`;
    const COLS = 8;

    const wb = new ExcelJS.Workbook();
    wb.creator = empresa;
    const ws = wb.addWorksheet('FCC', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 } }
    });

    // Column widths
    for (let i = 1; i <= COLS; i++) ws.getColumn(i).width = 14;

    let r = 1;

    // === TITLE ===
    mergeAndSet(ws, r, 1, r, COLS, 'FORMATO ÚNICO DE CONOCIMIENTO DE CONTRAPARTES', headerFont(13), {
      fill: headerFill,
      alignment: { horizontal: 'center', vertical: 'middle' }
    });
    ws.getRow(r).height = 32;
    r++;

    mergeAndSet(ws, r, 1, r, COLS, 'RÉGIMEN DE MEDIDAS MÍNIMAS LA/FT/FPADM', headerFont(10), {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_CLARO } },
      alignment: { horizontal: 'center', vertical: 'middle' }
    });
    ws.getRow(r).height = 22;
    r++;

    // Codigo y fecha
    mergeAndSet(ws, r, 1, r, 2, `Código: ${codigoFCC}`, smallFont(8), { fill: grayFill });
    mergeAndSet(ws, r, 3, r, 5, `Empresa: ${empresa}`, smallFont(8), { fill: grayFill });
    mergeAndSet(ws, r, 6, r, COLS, 'FECHA: ____/____/________', smallFont(8), { fill: grayFill });
    r++;

    // Justificación
    mergeAndSet(ws, r, 1, r + 2, COLS,
      `${empresa} cuenta con un Régimen de Medidas Mínimas para gestionar, prevenir y mitigar los riesgos asociados al Lavado de Activos, Financiación del Terrorismo y Financiación de la Proliferación de Armas de Destrucción Masiva (LA/FT/FPADM). Con el propósito de dar cumplimiento a la normativa vigente, solicitamos amablemente diligenciar el presente formulario de manera veraz y completa.`,
      normalFont(8), { alignment: { vertical: 'top', wrapText: true } }
    );
    ws.getRow(r).height = 18;
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
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));

    r = fieldRow(ws, r, 'Nombres:', 1, 2, 3, COLS);

    r = sectionHeader(ws, r, COLS, 'Tipo de Identificación');
    r = checkboxRow(ws, r, ['C.C.', 'C.E.', 'PASAPORTE', 'OTRO:______'], COLS);

    r = fieldRow(ws, r, 'No. Identificación:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Lugar Expedición:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));

    r = fieldRow(ws, r, 'Fecha Nacimiento:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Lugar Nacimiento:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));

    r = fieldRow(ws, r, 'País Residencia:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Departamento:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));

    r = fieldRow(ws, r, 'Ciudad:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Dirección:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));

    r = fieldRow(ws, r, 'Teléfono:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Correo Electrónico:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));

    r = fieldRow(ws, r, 'Ocupación/Profesión:', 1, 2, 3, COLS);
    r = checkboxRow(ws, r, ['DEPENDIENTE', 'INDEPENDIENTE'], COLS);
    r = fieldRow(ws, r, 'Empresa donde labora:', 1, 3, 4, COLS);
    r = fieldRow(ws, r, 'Cargo actual:', 1, 2, 3, COLS);
    r++;

    // ============================================
    // PEPs
    // ============================================
    r = sectionHeader(ws, r, COLS, 'PERSONA POLÍTICAMENTE EXPUESTA (PEP)');
    mergeAndSet(ws, r, 1, r + 1, COLS,
      'Se considerarán como Personas Expuestas Políticamente (PEP) los servidores públicos de cualquier sistema de nomenclatura, clasificación o nivel que, por su cargo, manejen recursos públicos, tomen o influyan en decisiones públicas, o gocen de reconocimiento público.',
      smallFont(7), { alignment: { vertical: 'top', wrapText: true } }
    );
    r += 2;
    r = checkboxRow(ws, r, ['SÍ, soy PEP', 'NO soy PEP'], COLS);
    r = fieldRow(ws, r, 'Si es PEP, indique cargo:', 1, 3, 4, COLS);
    r = fieldRow(ws, r, 'Entidad:', 1, 2, 3, COLS);

    mergeAndSet(ws, r, 1, r, COLS, 'Información Económica PEP', labelFont(9), { fill: subHeaderFill, alignment: { horizontal: 'center', vertical: 'middle' } });
    r++;
    r = fieldRow(ws, r, 'Ingresos mensuales (función pública):', 1, 4, 5, COLS);
    r = fieldRow(ws, r, 'Ingresos mensuales (otras actividades):', 1, 4, 5, COLS);

    mergeAndSet(ws, r, 1, r, COLS, 'Personas vinculadas al PEP (2° grado consanguinidad, afinidad y 1° civil)', labelFont(8), { fill: subHeaderFill, alignment: { horizontal: 'center', vertical: 'middle' } });
    r++;
    for (let i = 0; i < 3; i++) {
      r = fieldRow(ws, r, `Nombre vinculado ${i + 1}:`, 1, 2, 3, 5);
      setCell(ws, r - 1, 6, 'Parentesco:', labelFont(9), { fill: lightFill });
      mergeAndSet(ws, r - 1, 7, r - 1, COLS, '', normalFont(9));
    }
    r++;

    // ============================================
    // SECCIÓN II: PERSONA JURÍDICA
    // ============================================
    r = sectionHeader(ws, r, COLS, 'II. INFORMACIÓN GENERAL — PERSONA JURÍDICA');
    r = checkboxRow(ws, r, ['CLIENTE', 'PROVEEDOR', 'CONTRATISTA', 'OTRO'], COLS);
    r = fieldRow(ws, r, 'Razón Social:', 1, 2, 3, COLS);
    r = fieldRow(ws, r, 'NIT:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Dígito Verif.:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));

    r = fieldRow(ws, r, 'Dirección:', 1, 2, 3, COLS);
    r = fieldRow(ws, r, 'Ciudad:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Departamento:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));

    r = fieldRow(ws, r, 'Teléfono:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Correo:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));

    r = fieldRow(ws, r, 'Representante Legal:', 1, 3, 4, COLS);
    r = fieldRow(ws, r, 'C.C. Rep. Legal:', 1, 3, 4, COLS);
    r++;

    // Miembros Junta Directiva
    mergeAndSet(ws, r, 1, r, COLS, 'Miembros de Junta Directiva o Grupos Colegiados', labelFont(9), { fill: subHeaderFill, alignment: { horizontal: 'center', vertical: 'middle' } });
    r++;
    mergeAndSet(ws, r, 1, r, 4, 'Nombre y Apellido', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, 6, 'Identificación', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 7, r, COLS, 'Cargo', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    r++;
    for (let i = 0; i < 5; i++) {
      mergeAndSet(ws, r, 1, r, 4, '', normalFont(9));
      mergeAndSet(ws, r, 5, r, 6, '', normalFont(9));
      mergeAndSet(ws, r, 7, r, COLS, '', normalFont(9));
      ws.getRow(r).height = 18;
      r++;
    }
    r++;

    // Actividad económica
    r = sectionHeader(ws, r, COLS, 'ACTIVIDAD ECONÓMICA');
    r = fieldRow(ws, r, 'Código CIIU:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'Descripción:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));
    r = fieldRow(ws, r, 'Describa la actividad económica:', 1, 3, 4, COLS);

    // Info tributaria
    r = checkboxRow(ws, r, ['Declara Renta: SÍ ☐ NO ☐', 'Gran Contribuyente: SÍ ☐ NO ☐'], COLS);
    r++;

    // Beneficiarios finales
    r = sectionHeader(ws, r, COLS, 'BENEFICIARIOS FINALES');
    mergeAndSet(ws, r, 1, r, COLS,
      'De conformidad con el artículo 631-5 del Estatuto Tributario, identifique las personas naturales que directa o indirectamente posean el 5% o más del capital o derechos de voto.',
      smallFont(7), { alignment: { vertical: 'top', wrapText: true } }
    );
    r++;
    mergeAndSet(ws, r, 1, r, 3, 'Nombre Completo', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 4, r, 5, 'Identificación', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 6, r, 7, '% Participación', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    setCell(ws, r, COLS, 'País', labelFont(8), { fill: lightFill, alignment: { horizontal: 'center' } });
    r++;
    for (let i = 0; i < 4; i++) {
      mergeAndSet(ws, r, 1, r, 3, '', normalFont(9));
      mergeAndSet(ws, r, 4, r, 5, '', normalFont(9));
      mergeAndSet(ws, r, 6, r, 7, '', normalFont(9));
      setCell(ws, r, COLS, '', normalFont(9));
      ws.getRow(r).height = 18;
      r++;
    }
    r++;

    // Referencias
    r = sectionHeader(ws, r, COLS, 'REFERENCIAS COMERCIALES (2)');
    for (let i = 0; i < 2; i++) {
      r = fieldRow(ws, r, `Nombre/Razón Social ${i + 1}:`, 1, 3, 4, COLS);
      r = fieldRow(ws, r, 'Teléfono:', 1, 2, 3, 4);
      setCell(ws, r - 1, 5, 'Ciudad:', labelFont(9), { fill: lightFill });
      mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));
    }
    r++;

    r = sectionHeader(ws, r, COLS, 'REFERENCIAS FINANCIERAS');
    r = fieldRow(ws, r, 'Nombre Entidad:', 1, 2, 3, COLS);
    r = fieldRow(ws, r, 'Tipo de Cuenta:', 1, 2, 3, 4);
    setCell(ws, r - 1, 5, 'No. Cuenta:', labelFont(9), { fill: lightFill });
    mergeAndSet(ws, r - 1, 6, r - 1, COLS, '', normalFont(9));
    r = checkboxRow(ws, r, ['Opera en moneda extranjera: SÍ ☐ NO ☐'], COLS);
    r++;

    // ============================================
    // DECLARACIONES
    // ============================================
    r = sectionHeader(ws, r, COLS, 'DECLARACIONES Y RECONOCIMIENTOS');

    mergeAndSet(ws, r, 1, r + 3, COLS,
      'La Contraparte declara que:\n' +
      '1. La información consignada en este formato es veraz, verificable y no ha sido alterada.\n' +
      '2. Los recursos y bienes involucrados en la relación comercial provienen de actividades lícitas.\n' +
      '3. Autoriza la consulta y verificación de la información ante cualquier entidad pública o privada.',
      normalFont(8), { alignment: { vertical: 'top', wrapText: true } }
    );
    r += 4;

    r = sectionHeader(ws, r, COLS, 'DECLARACIÓN ORIGEN DE FONDOS');
    mergeAndSet(ws, r, 1, r + 2, COLS,
      'La Contraparte declara que los dineros y recursos generados por su actividad económica no provienen de actividades ilícitas contempladas en el Código Penal colombiano ni en ninguna otra norma que las prohíba, y que los mismos no serán destinados a la financiación del terrorismo ni a la proliferación de armas de destrucción masiva.',
      normalFont(8), { alignment: { vertical: 'top', wrapText: true } }
    );
    r += 3;

    r = sectionHeader(ws, r, COLS, 'DECLARACIÓN PREVENCIÓN LA/FT/FPADM');
    mergeAndSet(ws, r, 1, r + 3, COLS,
      'La Contraparte declara que:\n' +
      '1. No se encuentra en ninguna Lista Vinculante para Colombia (ONU, OFAC, UE) ni en listas nacionales de la Procuraduría, Contraloría o Policía Nacional.\n' +
      '2. No ha sido investigado(a) ni condenado(a) por delitos relacionados con Lavado de Activos, Financiación del Terrorismo o delitos fuente.\n' +
      '3. Se compromete a informar de inmediato cualquier situación que modifique las declaraciones aquí consignadas.',
      normalFont(8), { alignment: { vertical: 'top', wrapText: true } }
    );
    r += 4;

    r = sectionHeader(ws, r, COLS, 'AUTORIZACIÓN TRATAMIENTO DE DATOS PERSONALES');
    mergeAndSet(ws, r, 1, r + 2, COLS,
      `Por medio de la firma del presente documento, autorizo a ${empresa} (NIT: ${nit}) para recolectar, almacenar, usar y circular mis datos personales conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013, con la finalidad de dar cumplimiento al Régimen de Medidas Mínimas LA/FT/FPADM.`,
      normalFont(8), { alignment: { vertical: 'top', wrapText: true } }
    );
    r += 3;

    // Cláusula de incumplimiento
    r = sectionHeader(ws, r, COLS, 'CLÁUSULA DE INCUMPLIMIENTO');
    mergeAndSet(ws, r, 1, r + 1, COLS,
      `La Contraparte acepta que el suministro de información falsa, inexacta o incompleta faculta a ${empresa} para dar por terminada la relación comercial de manera inmediata, sin perjuicio de las acciones legales a que hubiere lugar.`,
      normalFont(8), { alignment: { vertical: 'top', wrapText: true } }
    );
    r += 2;
    r++;

    // ============================================
    // FIRMA
    // ============================================
    r = sectionHeader(ws, r, COLS, 'FIRMA DE LA CONTRAPARTE');

    mergeAndSet(ws, r, 1, r, COLS,
      'Como constancia de haber leído, entendido y aceptado lo anterior, declaro que la información proporcionada es veraz.',
      normalFont(8), { alignment: { horizontal: 'center', vertical: 'middle' } }
    );
    r += 2;

    mergeAndSet(ws, r, 1, r, 4, '___________________________________', normalFont(9), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, '___________________________________', normalFont(9), { alignment: { horizontal: 'center' } });
    r++;
    mergeAndSet(ws, r, 1, r, 4, 'Firma de la Contraparte', labelFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, 'Firma del Representante Legal', labelFont(8), { alignment: { horizontal: 'center' } });
    r++;
    mergeAndSet(ws, r, 1, r, 4, 'Nombre: ____________________________', normalFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, `Nombre: ____________________________`, normalFont(8), { alignment: { horizontal: 'center' } });
    r++;
    mergeAndSet(ws, r, 1, r, 4, 'C.C./NIT: __________________________', normalFont(8), { alignment: { horizontal: 'center' } });
    mergeAndSet(ws, r, 5, r, COLS, `NIT: ${nit}`, normalFont(8), { alignment: { horizontal: 'center' } });
    r += 2;

    // Aviso final
    mergeAndSet(ws, r, 1, r + 1, COLS,
      'AVISO: La información consignada en el presente documento se presume veraz, por lo que cualquier imprecisión o falsedad podrá ser puesta en conocimiento de las autoridades competentes. Este documento tiene carácter confidencial.',
      smallFont(7), { fill: grayFill, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } }
    );

    // Print setup
    ws.headerFooter.oddFooter = `&L${codigoFCC}&C${empresa}&RPágina &P de &N`;

    const buffer = await wb.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer as ArrayBuffer).toString('base64');
    const filename = `FCC_${empresaCorto.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

    return NextResponse.json({ success: true, filename, base64, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error: any) {
    console.error('Error generating FCC:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
