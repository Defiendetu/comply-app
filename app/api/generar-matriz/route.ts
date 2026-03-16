import { NextRequest, NextResponse } from 'next/server';
imporimport { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export const maxDuration = 30;

// === COLOR PALETTE ===
const C = {
  AZUL_OSCURO: 'FF1B2A4A',
  AZUL_MEDIO: 'FF2E5090',
  AZUL_CLARO: 'FF4472C4',
  AZUL_SUAVE: 'FFD6E4F0',
  AZUL_FONDO: 'FFEDF2F9',
  GRIS_OSCURO: 'FF404040',
  GRIS_CLARO: 'FFF2F2F2',
  BLANCO: 'FFFFFFFF',
  ROJO: 'FFC00000',
  ROJO_FONDO: 'FFFDE8E8',
  ROJO_INTENSO: 'FF8B0000',
  ROJO_INTENSO_FONDO: 'FFFCD5D5',
  NARANJA: 'FFED7D31',
  NARANJA_FONDO: 'FFFFF2E5',
  VERDE: 'FF548235',
  VERDE_FONDO: 'FFE8F5E8',
  AMARILLO_FONDO: 'FFFFF8E1',
  ORO: 'FFBF8F00',
};

const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFB4C6E7' } };
const BORDER_MED: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: C.AZUL_MEDIO } };
const BORDERS: Partial<ExcelJS.Borders> = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };
const BORDERS_HEADER: Partial<ExcelJS.Borders> = { top: BORDER_MED, bottom: BORDER_MED, left: BORDER_THIN, right: BORDER_THIN };

function nivelStyle(nivel: string): { font: Partial<ExcelJS.Font>; fill: ExcelJS.Fill } {
  const n = (nivel || '').toUpperCase();
  if (n.includes('CRITICO') || n.includes('CRÍTICO'))
    return { font: { name: 'Arial', size: 10, bold: true, color: { argb: C.BLANCO } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.ROJO_INTENSO } } };
  if (n.includes('ALTO') || n.includes('ALTA'))
    return { font: { name: 'Arial', size: 10, bold: true, color: { argb: C.ROJO } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.ROJO_FONDO } } };
  if (n.includes('MEDIO') || n.includes('MEDIA'))
    return { font: { name: 'Arial', size: 10, bold: true, color: { argb: C.ORO } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.NARANJA_FONDO } } };
  if (n.includes('BAJO') || n.includes('BAJA'))
    return { font: { name: 'Arial', size: 10, bold: true, color: { argb: C.VERDE } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.VERDE_FONDO } } };
  return { font: { name: 'Arial', size: 10, color: { argb: C.GRIS_OSCURO } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.BLANCO } } };
}

function addTitle(ws: ExcelJS.Worksheet, title: string, subtitle: string, maxCol: number) {
  ws.mergeCells(1, 1, 1, maxCol);
  const c1 = ws.getCell(1, 1);
  c1.value = title;
  c1.font = { name: 'Arial', size: 18, bold: true, color: { argb: C.BLANCO } };
  c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_OSCURO } };
  c1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 45;

  ws.mergeCells(2, 1, 2, maxCol);
  const c2 = ws.getCell(2, 1);
  c2.value = subtitle;
  c2.font = { name: 'Arial', size: 10, italic: true, color: { argb: C.AZUL_MEDIO } };
  c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_SUAVE } };
  c2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 25;
}

function addHeaderRow(ws: ExcelJS.Worksheet, row: number, values: string[]) {
  const r = ws.getRow(row);
  values.forEach((v, i) => {
    const cell = r.getCell(i + 1);
    cell.value = v;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: C.BLANCO } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_MEDIO } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDERS_HEADER;
  });
  r.height = 32;
}

function addDataRow(ws: ExcelJS.Worksheet, rowNum: number, values: (string | number)[], isEven: boolean, height = 36) {
  const r = ws.getRow(rowNum);
  const fill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? C.AZUL_FONDO : C.BLANCO } };
  values.forEach((v, i) => {
    const cell = r.getCell(i + 1);
    cell.value = v;
    cell.font = { name: 'Arial', size: 10, color: { argb: C.GRIS_OSCURO } };
    cell.fill = fill;
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cell.border = BORDERS;
  });
  r.height = height;
}

export async function POST(request: NextRequest) {
  try {
    const d = await request.json();

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Comply SAGRILAFT';
    wb.created = new Date();

    const empresa = d.RAZON_SOCIAL || 'Empresa';

    // ================================================================
    // HOJA 1: PORTADA
    // ================================================================
    const ws1 = wb.addWorksheet('PORTADA', { properties: { tabColor: { argb: C.AZUL_OSCURO.slice(2) } }, views: [{ showGridLines: false }] });
    ws1.columns = [{ width: 5 }, { width: 28 }, { width: 55 }];

    ws1.mergeCells('A1:C3');
    const titleCell = ws1.getCell('A1');
    titleCell.value = 'MATRIZ DE RIESGO LA/FT/FPADM';
    titleCell.font = { name: 'Arial', size: 22, bold: true, color: { argb: C.BLANCO } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_OSCURO } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(1).height = 30; ws1.getRow(2).height = 30; ws1.getRow(3).height = 30;

    ws1.mergeCells('A4:C4');
    const subCell = ws1.getCell('A4');
    subCell.value = 'Régimen de Medidas Mínimas — Superintendencia de Sociedades de Colombia';
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: C.BLANCO } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_MEDIO } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(4).height = 28;

    const info = [
      ['Razón Social', empresa],
      ['NIT', d.NIT || ''],
      ['Representante Legal', d.REPRESENTANTE_LEGAL || ''],
      ['Ciudad', d.CIUDAD || ''],
      ['Código CIIU', d.CODIGO_CIIU || ''],
      ['Sector', d.SECTOR_NOMBRE || ''],
    ];
    info.forEach(([label, val], i) => {
      const r = 6 + i;
      const cL = ws1.getCell(r, 2); cL.value = label;
      cL.font = { name: 'Arial', size: 10, bold: true, color: { argb: C.GRIS_OSCURO } };
      cL.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.GRIS_CLARO } };
      cL.border = BORDERS; cL.alignment = { vertical: 'middle' };
      const cV = ws1.getCell(r, 3); cV.value = val;
      cV.font = { name: 'Arial', size: 10, color: { argb: C.GRIS_OSCURO } };
      cV.border = BORDERS; cV.alignment = { vertical: 'middle' };
      ws1.getRow(r).height = 24;
    });

    ws1.mergeCells('B14:C14');
    const perfHeader = ws1.getCell('B14');
    perfHeader.value = 'PERFIL DE RIESGO GENERAL';
    perfHeader.font = { name: 'Arial', size: 12, bold: true, color: { argb: C.BLANCO } };
    perfHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_MEDIO } };
    perfHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    perfHeader.border = BORDERS_HEADER;
    ws1.getRow(14).height = 32;

    const perfil = d.PERFIL_RIESGO || 'MEDIO';
    const { font: pFont, fill: pFill } = nivelStyle(perfil);
    ws1.mergeCells('B15:C15');
    const perfCell = ws1.getCell('B15');
    perfCell.value = perfil;
    perfCell.font = { ...pFont, size: 28 };
    perfCell.fill = pFill;
    perfCell.alignment = { horizontal: 'center', vertical: 'middle' };
    perfCell.border = { left: BORDER_MED, right: BORDER_MED, bottom: BORDER_MED };
    ws1.getRow(15).height = 55;

    ws1.mergeCells('B17:C17');
    const justCell = ws1.getCell('B17');
    justCell.value = d.JUSTIFICACION_PERFIL || '';
    justCell.font = { name: 'Arial', size: 9, color: { argb: 'FF808080' } };
    justCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    ws1.getRow(17).height = 60;

    const meta = [
      ['Fecha de elaboración', d.FECHA_MANUAL || ''],
      ['Versión', d.VERSION || ''],
      ['Código', d.CODIGO_MANUAL || ''],
    ];
    meta.forEach(([label, val], i) => {
      const r = 19 + i;
      ws1.getCell(r, 2).value = label;
      ws1.getCell(r, 2).font = { name: 'Arial', size: 9, color: { argb: 'FF808080' } };
      ws1.getCell(r, 3).value = val;
      ws1.getCell(r, 3).font = { name: 'Arial', size: 9, bold: true, color: { argb: C.AZUL_MEDIO } };
    });

    // ================================================================
    // HOJA 2: FACTORES DE RIESGO
    // ================================================================
    const ws2 = wb.addWorksheet('FACTORES DE RIESGO', { properties: { tabColor: { argb: C.AZUL_MEDIO.slice(2) } }, views: [{ showGridLines: false }] });
    ws2.columns = [
      { width: 5 }, { width: 14 }, { width: 22 }, { width: 35 }, { width: 7 }, { width: 7 },
      { width: 7 }, { width: 10 }, { width: 35 }, { width: 8 }, { width: 7 }, { width: 10 },
    ];

    addTitle(ws2, 'FACTORES DE RIESGO LA/FT/FPADM', `${empresa} — Identificación y valoración de riesgos`, 12);

    addHeaderRow(ws2, 4, ['#', 'Categoría', 'Factor', 'Descripción', 'Prob', 'Imp', 'R.I.', 'Nivel RI', 'Control Sugerido', 'Efect %', 'R.R.', 'Nivel RR']);

    for (let i = 1; i <= 10; i++) {
      const r = 4 + i;
      const vals = [
        i, d[`FACTOR_${i}_CATEGORIA`] || '', d[`FACTOR_${i}_NOMBRE`] || '', d[`FACTOR_${i}_DESCRIPCION`] || '',
        d[`FACTOR_${i}_PROB`] || '', d[`FACTOR_${i}_IMP`] || '', d[`FACTOR_${i}_RI`] || '', d[`FACTOR_${i}_NIVEL_RI`] || '',
        d[`FACTOR_${i}_CONTROL`] || '', d[`FACTOR_${i}_EFECT`] || '', d[`FACTOR_${i}_RR`] || '', d[`FACTOR_${i}_NIVEL_RR`] || '',
      ];
      addDataRow(ws2, r, vals, i % 2 === 0, 38);

      // Center numeric columns
      [1, 5, 6, 7, 10, 11].forEach(col => { ws2.getCell(r, col).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; });

      // Color nivel columns
      [8, 12].forEach(col => {
        const nivel = String(vals[col - 1]);
        const { font, fill } = nivelStyle(nivel);
        const cell = ws2.getCell(r, col);
        cell.font = font; cell.fill = fill;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    }

    // Legend
    ws2.mergeCells(16, 1, 16, 12);
    ws2.mergeCells(17, 1, 17, 4);
    ws2.getCell(17, 1).value = 'Escala: Probabilidad/Impacto 1 (Muy bajo) a 5 (Muy alto)';
    ws2.getCell(17, 1).font = { name: 'Arial', size: 9, color: { argb: 'FF808080' } };

    const legend = [
      ['CRÍTICO', 'Riesgo ≥ 20 — Requiere intervención urgente', C.ROJO_INTENSO, C.ROJO_INTENSO_FONDO],
      ['ALTO', 'Riesgo 15-19 — Requiere acción inmediata', C.ROJO, C.ROJO_FONDO],
      ['MEDIO', 'Riesgo 6-14 — Requiere monitoreo continuo', C.ORO, C.NARANJA_FONDO],
      ['BAJO', 'Riesgo < 6 — Gestión rutinaria', C.VERDE, C.VERDE_FONDO],
    ];
    legend.forEach(([niv, desc, color, bg], j) => {
      const rr = 18 + j;
      ws2.mergeCells(rr, 1, rr, 2);
      const cN = ws2.getCell(rr, 1);
      cN.value = niv;
      const isCritico = (niv as string).includes('CRÍT');
      cN.font = { name: 'Arial', size: 9, bold: true, color: { argb: isCritico ? C.BLANCO : color as string } };
      cN.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isCritico ? C.ROJO_INTENSO : bg as string } };
      cN.alignment = { horizontal: 'center', vertical: 'middle' };
      ws2.mergeCells(rr, 3, rr, 7);
      ws2.getCell(rr, 3).value = desc;
      ws2.getCell(rr, 3).font = { name: 'Arial', size: 9, color: { argb: 'FF808080' } };
    });

    // ================================================================
    // HOJA 3: SEÑALES DE ALERTA
    // ================================================================
    const ws3 = wb.addWorksheet('SEÑALES DE ALERTA', { properties: { tabColor: { argb: 'FFED7D31' } }, views: [{ showGridLines: false }] });
    ws3.columns = [{ width: 5 }, { width: 50 }, { width: 10 }, { width: 50 }];

    addTitle(ws3, 'SEÑALES DE ALERTA LA/FT/FPADM', `${empresa} — Indicadores de operaciones sospechosas`, 4);
    addHeaderRow(ws3, 4, ['#', 'Señal de Alerta', 'Nivel', 'Acción Requerida']);

    for (let i = 1; i <= 8; i++) {
      const r = 4 + i;
      const nivel = d[`SENAL_${i}_NIVEL`] || '';
      addDataRow(ws3, r, [i, d[`SENAL_${i}_TEXTO`] || '', nivel, d[`SENAL_${i}_ACCION`] || ''], i % 2 === 0, 45);
      ws3.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'middle' };
      const { font, fill } = nivelStyle(nivel);
      const nCell = ws3.getCell(r, 3);
      nCell.font = font; nCell.fill = fill;
      nCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // ================================================================
    // HOJA 4: CONTROLES PRIORITARIOS
    // ================================================================
    const ws4 = wb.addWorksheet('CONTROLES', { properties: { tabColor: { argb: '548235' } }, views: [{ showGridLines: false }] });
    ws4.columns = [{ width: 5 }, { width: 30 }, { width: 45 }, { width: 12 }, { width: 25 }];

    addTitle(ws4, 'CONTROLES PRIORITARIOS', `${empresa} — Medidas de mitigación de riesgo LA/FT/FPADM`, 5);
    addHeaderRow(ws4, 4, ['#', 'Control', 'Descripción', 'Prioridad', 'Responsable']);

    for (let i = 1; i <= 5; i++) {
      const r = 4 + i;
      const prioridad = d[`CONTROL_${i}_PRIORIDAD`] || '';
      addDataRow(ws4, r, [i, d[`CONTROL_${i}_NOMBRE`] || '', d[`CONTROL_${i}_DESC`] || '', prioridad, d[`CONTROL_${i}_RESPONSABLE`] || ''], i % 2 === 0, 42);
      ws4.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'middle' };
      const { font, fill } = nivelStyle(prioridad);
      const pCell = ws4.getCell(r, 4);
      pCell.font = font; pCell.fill = fill;
      pCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // ================================================================
    // HOJA 5: RECOMENDACIONES
    // ================================================================
    const ws5 = wb.addWorksheet('RECOMENDACIONES', { properties: { tabColor: { argb: '4472C4' } }, views: [{ showGridLines: false }] });
    ws5.columns = [{ width: 5 }, { width: 8 }, { width: 85 }];

    addTitle(ws5, 'RECOMENDACIONES ESPECÍFICAS', `${empresa} — Acciones sugeridas para fortalecer el sistema de prevención`, 3);

    for (let i = 1; i <= 3; i++) {
      const r = 3 + i;
      const numCell = ws5.getCell(r, 2);
      numCell.value = `0${i}`;
      numCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: C.BLANCO } };
      numCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_MEDIO } };
      numCell.alignment = { horizontal: 'center', vertical: 'middle' };
      numCell.border = BORDERS;

      const recCell = ws5.getCell(r, 3);
      recCell.value = d[`RECOMENDACION_${i}`] || '';
      recCell.font = { name: 'Arial', size: 11, color: { argb: C.GRIS_OSCURO } };
      recCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      recCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? C.AZUL_FONDO : C.BLANCO } };
      recCell.border = BORDERS;
      ws5.getRow(r).height = 55;
    }

    // ================================================================
    // HOJA 6: CHECKLIST
    // ================================================================
    const ws6 = wb.addWorksheet('CHECKLIST', { properties: { tabColor: { argb: '548235' } }, views: [{ showGridLines: false }] });
    ws6.columns = [{ width: 5 }, { width: 45 }, { width: 16 }, { width: 35 }];

    addTitle(ws6, 'CHECKLIST DE CUMPLIMIENTO', `${empresa} — Obligaciones del Régimen de Medidas Mínimas (Res. 100-006322 de 2023)`, 4);
    addHeaderRow(ws6, 4, ['#', 'Obligación', 'Estado', 'Evidencia / Observación']);

    const obligaciones = [
      ['Adoptar política de prevención LA/FT/FPADM', 'Implementado', 'Manual de Medidas Mínimas adoptado'],
      ['Identificar y evaluar factores de riesgo', 'Implementado', '10 factores identificados en esta matriz'],
      ['Establecer señales de alerta sectoriales', 'Implementado', '8 señales en hoja SEÑALES DE ALERTA'],
      ['Implementar controles de prevención', 'Implementado', '5 controles en hoja CONTROLES'],
      ['Conocer al cliente (debida diligencia)',
        d.CHECK_DEBIDA_DILIGENCIA === 'Implementado' ? 'Implementado'
          : d.CHECK_DEBIDA_DILIGENCIA === 'En proceso' ? 'En proceso' : 'Pendiente',
        d.CHECK_DEBIDA_DILIGENCIA === 'Implementado' ? 'Procedimiento KYC implementado'
          : d.CHECK_DEBIDA_DILIGENCIA === 'En proceso' ? 'Procedimiento KYC en desarrollo' : 'Procedimiento KYC por implementar'],
      ['Reportar operaciones sospechosas a UIAF',
        d.CHECK_PROCEDIMIENTO_ROS === 'Implementado' ? 'Implementado'
          : d.CHECK_PROCEDIMIENTO_ROS === 'En proceso' ? 'En proceso' : 'Pendiente',
        d.CHECK_PROCEDIMIENTO_ROS === 'Implementado' ? 'Procedimiento de ROS implementado'
          : d.CHECK_PROCEDIMIENTO_ROS === 'En proceso' ? 'Procedimiento de ROS en desarrollo' : 'Procedimiento de ROS por implementar'],
      ['Conservar documentos mínimo 5 años', 'Por implementar', 'Política de retención documental por definir con el sistema'],
      ['Capacitar al personal periódicamente',
        d.CHECK_CAPACITACION === 'Implementado' ? 'Implementado'
          : d.CHECK_CAPACITACION === 'En proceso' ? 'En proceso' : 'Pendiente',
        d.CHECK_CAPACITACION === 'Implementado' ? 'Personal capacitado en prevención LA/FT'
          : d.CHECK_CAPACITACION === 'En proceso' ? 'Plan de capacitación en ejecución' : 'Plan de capacitación por implementar'],
      ['Designar oficial de cumplimiento',
        d.CHECK_OFICIAL_CUMPLIMIENTO === 'Implementado' ? 'Implementado'
          : d.CHECK_OFICIAL_CUMPLIMIENTO === 'En proceso' ? 'En proceso' : 'Pendiente',
        d.CHECK_OFICIAL_CUMPLIMIENTO === 'Implementado' ? 'Oficial de cumplimiento designado'
          : d.CHECK_OFICIAL_CUMPLIMIENTO === 'En proceso' ? 'Designación en proceso' : 'Por designar oficial de cumplimiento'],
      ['Actualizar matriz de riesgo anualmente', 'Implementado', 'Primera versión generada automáticamente'],
      ['Monitorear operaciones inusuales', 'Por implementar', 'Parámetros de monitoreo por definir con el sistema'],
      ['Consultar listas restrictivas (OFAC, ONU)',
        d.CHECK_LISTAS_RESTRICTIVAS === 'Implementado' ? 'Implementado'
          : d.CHECK_LISTAS_RESTRICTIVAS === 'En proceso' ? 'En proceso' : 'Pendiente',
        d.CHECK_LISTAS_RESTRICTIVAS === 'Implementado' ? 'Consulta periódica de listas implementada'
          : d.CHECK_LISTAS_RESTRICTIVAS === 'En proceso' ? 'Proceso de consulta en implementación' : 'Herramienta de consulta por implementar'],
    ];

    let totalImpl = 0, totalProc = 0, totalPend = 0;

    obligaciones.forEach(([obl, estado, obs], i) => {
      const r = 5 + i;
      addDataRow(ws6, r, [i + 1, obl, estado, obs], i % 2 !== 0, 32);
      ws6.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'middle' };

      const eCell = ws6.getCell(r, 3);
      eCell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (estado === 'Implementado') {
        eCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: C.VERDE } };
        eCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.VERDE_FONDO } };
        totalImpl++;
      } else if (estado === 'En proceso') {
        eCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: C.ORO } };
        eCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AMARILLO_FONDO } };
        totalProc++;
      } else {
        eCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: C.ROJO } };
        eCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.ROJO_FONDO } };
        totalPend++;
      }
    });

    const rF = 5 + obligaciones.length + 1;
    ws6.mergeCells(rF, 1, rF, 2);
    ws6.getCell(rF, 1).value = 'Resumen de cumplimiento:';
    ws6.getCell(rF, 1).font = { name: 'Arial', size: 10, bold: true, color: { argb: C.GRIS_OSCURO } };

    const pct = Math.round(totalImpl / 12 * 100);
    ws6.mergeCells(rF, 3, rF, 4);
    ws6.getCell(rF, 3).value = `Nivel de cumplimiento: ${pct}%`;
    ws6.getCell(rF, 3).font = { name: 'Arial', size: 14, bold: true, color: { argb: C.AZUL_OSCURO } };
    ws6.getCell(rF, 3).alignment = { horizontal: 'center', vertical: 'middle' };

    const resumenData = [
      [`Implementados: ${totalImpl}/12`, C.VERDE, C.VERDE_FONDO],
      [`En proceso: ${totalProc}/12`, C.ORO, C.NARANJA_FONDO],
      [`Pendientes: ${totalPend}/12`, C.ROJO, C.ROJO_FONDO],
    ];
    resumenData.forEach(([texto, color, bg], j) => {
      const rr = rF + 1 + j;
      ws6.mergeCells(rr, 1, rr, 2);
      const c = ws6.getCell(rr, 1);
      c.value = texto; c.font = { name: 'Arial', size: 10, bold: true, color: { argb: color } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = BORDERS;
    });

    // ================================================================
    // GENERATE & RETURN
    // ================================================================
    const buffer = await wb.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const filename = `Matriz_Riesgo_${empresa.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

    return NextResponse.json({
      success: true,
      filename,
      base64,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

  } catch (error: any) {
    console.error('Error generating Excel:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}t ExcelJS from 'exceljs';

export const maxDuration = 30;

// === COLOR PALETTE ===
const C = {
  AZUL_OSCURO: 'FF1B2A4A',
  AZUL_MEDIO: 'FF2E5090',
  AZUL_CLARO: 'FF4472C4',
  AZUL_SUAVE: 'FFD6E4F0',
  AZUL_FONDO: 'FFEDF2F9',
  GRIS_OSCURO: 'FF404040',
  GRIS_CLARO: 'FFF2F2F2',
  BLANCO: 'FFFFFFFF',
  ROJO: 'FFC00000',
  ROJO_FONDO: 'FFFDE8E8',
  NARANJA: 'FFED7D31',
  NARANJA_FONDO: 'FFFFF2E5',
  VERDE: 'FF548235',
  VERDE_FONDO: 'FFE8F5E8',
  AMARILLO_FONDO: 'FFFFF8E1',
  ORO: 'FFBF8F00',
};

const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFB4C6E7' } };
const BORDER_MED: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: C.AZUL_MEDIO } };
const BORDERS: Partial<ExcelJS.Borders> = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };
const BORDERS_HEADER: Partial<ExcelJS.Borders> = { top: BORDER_MED, bottom: BORDER_MED, left: BORDER_THIN, right: BORDER_THIN };

function nivelStyle(nivel: string): { font: Partial<ExcelJS.Font>; fill: ExcelJS.Fill } {
  const n = (nivel || '').toUpperCase();
  if (n.includes('ALTO') || n.includes('ALTA'))
    return { font: { name: 'Arial', size: 10, bold: true, color: { argb: C.ROJO } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.ROJO_FONDO } } };
  if (n.includes('MEDIO') || n.includes('MEDIA'))
    return { font: { name: 'Arial', size: 10, bold: true, color: { argb: C.ORO } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.NARANJA_FONDO } } };
  if (n.includes('BAJO') || n.includes('BAJA'))
    return { font: { name: 'Arial', size: 10, bold: true, color: { argb: C.VERDE } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.VERDE_FONDO } } };
  return { font: { name: 'Arial', size: 10, color: { argb: C.GRIS_OSCURO } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.BLANCO } } };
}

function addTitle(ws: ExcelJS.Worksheet, title: string, subtitle: string, maxCol: number) {
  ws.mergeCells(1, 1, 1, maxCol);
  const c1 = ws.getCell(1, 1);
  c1.value = title;
  c1.font = { name: 'Arial', size: 18, bold: true, color: { argb: C.BLANCO } };
  c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_OSCURO } };
  c1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 45;

  ws.mergeCells(2, 1, 2, maxCol);
  const c2 = ws.getCell(2, 1);
  c2.value = subtitle;
  c2.font = { name: 'Arial', size: 10, italic: true, color: { argb: C.AZUL_MEDIO } };
  c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_SUAVE } };
  c2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 25;
}

function addHeaderRow(ws: ExcelJS.Worksheet, row: number, values: string[]) {
  const r = ws.getRow(row);
  values.forEach((v, i) => {
    const cell = r.getCell(i + 1);
    cell.value = v;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: C.BLANCO } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_MEDIO } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDERS_HEADER;
  });
  r.height = 32;
}

function addDataRow(ws: ExcelJS.Worksheet, rowNum: number, values: (string | number)[], isEven: boolean, height = 36) {
  const r = ws.getRow(rowNum);
  const fill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? C.AZUL_FONDO : C.BLANCO } };
  values.forEach((v, i) => {
    const cell = r.getCell(i + 1);
    cell.value = v;
    cell.font = { name: 'Arial', size: 10, color: { argb: C.GRIS_OSCURO } };
    cell.fill = fill;
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cell.border = BORDERS;
  });
  r.height = height;
}

export async function POST(request: NextRequest) {
  try {
    const d = await request.json();

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Comply SAGRILAFT';
    wb.created = new Date();

    const empresa = d.RAZON_SOCIAL || 'Empresa';

    // ================================================================
    // HOJA 1: PORTADA
    // ================================================================
    const ws1 = wb.addWorksheet('PORTADA', { properties: { tabColor: { argb: C.AZUL_OSCURO.slice(2) } }, views: [{ showGridLines: false }] });
    ws1.columns = [{ width: 5 }, { width: 28 }, { width: 55 }];

    ws1.mergeCells('A1:C3');
    const titleCell = ws1.getCell('A1');
    titleCell.value = 'MATRIZ DE RIESGO LA/FT/FPADM';
    titleCell.font = { name: 'Arial', size: 22, bold: true, color: { argb: C.BLANCO } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_OSCURO } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(1).height = 30; ws1.getRow(2).height = 30; ws1.getRow(3).height = 30;

    ws1.mergeCells('A4:C4');
    const subCell = ws1.getCell('A4');
    subCell.value = 'Régimen de Medidas Mínimas — Superintendencia de Sociedades de Colombia';
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: C.BLANCO } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_MEDIO } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(4).height = 28;

    const info = [
      ['Razón Social', empresa],
      ['NIT', d.NIT || ''],
      ['Representante Legal', d.REPRESENTANTE_LEGAL || ''],
      ['Ciudad', d.CIUDAD || ''],
      ['Código CIIU', d.CODIGO_CIIU || ''],
      ['Sector', d.SECTOR_NOMBRE || ''],
    ];
    info.forEach(([label, val], i) => {
      const r = 6 + i;
      const cL = ws1.getCell(r, 2); cL.value = label;
      cL.font = { name: 'Arial', size: 10, bold: true, color: { argb: C.GRIS_OSCURO } };
      cL.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.GRIS_CLARO } };
      cL.border = BORDERS; cL.alignment = { vertical: 'middle' };
      const cV = ws1.getCell(r, 3); cV.value = val;
      cV.font = { name: 'Arial', size: 10, color: { argb: C.GRIS_OSCURO } };
      cV.border = BORDERS; cV.alignment = { vertical: 'middle' };
      ws1.getRow(r).height = 24;
    });

    ws1.mergeCells('B14:C14');
    const perfHeader = ws1.getCell('B14');
    perfHeader.value = 'PERFIL DE RIESGO GENERAL';
    perfHeader.font = { name: 'Arial', size: 12, bold: true, color: { argb: C.BLANCO } };
    perfHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_MEDIO } };
    perfHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    perfHeader.border = BORDERS_HEADER;
    ws1.getRow(14).height = 32;

    const perfil = d.PERFIL_RIESGO || 'MEDIO';
    const { font: pFont, fill: pFill } = nivelStyle(perfil);
    ws1.mergeCells('B15:C15');
    const perfCell = ws1.getCell('B15');
    perfCell.value = perfil;
    perfCell.font = { ...pFont, size: 28 };
    perfCell.fill = pFill;
    perfCell.alignment = { horizontal: 'center', vertical: 'middle' };
    perfCell.border = { left: BORDER_MED, right: BORDER_MED, bottom: BORDER_MED };
    ws1.getRow(15).height = 55;

    ws1.mergeCells('B17:C17');
    const justCell = ws1.getCell('B17');
    justCell.value = d.JUSTIFICACION_PERFIL || '';
    justCell.font = { name: 'Arial', size: 9, color: { argb: 'FF808080' } };
    justCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    ws1.getRow(17).height = 60;

    const meta = [
      ['Fecha de elaboración', d.FECHA_MANUAL || ''],
      ['Versión', d.VERSION || ''],
      ['Código', d.CODIGO_MANUAL || ''],
    ];
    meta.forEach(([label, val], i) => {
      const r = 19 + i;
      ws1.getCell(r, 2).value = label;
      ws1.getCell(r, 2).font = { name: 'Arial', size: 9, color: { argb: 'FF808080' } };
      ws1.getCell(r, 3).value = val;
      ws1.getCell(r, 3).font = { name: 'Arial', size: 9, bold: true, color: { argb: C.AZUL_MEDIO } };
    });

    // ================================================================
    // HOJA 2: FACTORES DE RIESGO
    // ================================================================
    const ws2 = wb.addWorksheet('FACTORES DE RIESGO', { properties: { tabColor: { argb: C.AZUL_MEDIO.slice(2) } }, views: [{ showGridLines: false }] });
    ws2.columns = [
      { width: 5 }, { width: 14 }, { width: 22 }, { width: 35 }, { width: 7 }, { width: 7 },
      { width: 7 }, { width: 10 }, { width: 35 }, { width: 8 }, { width: 7 }, { width: 10 },
    ];

    addTitle(ws2, 'FACTORES DE RIESGO LA/FT/FPADM', `${empresa} — Identificación y valoración de riesgos`, 12);

    addHeaderRow(ws2, 4, ['#', 'Categoría', 'Factor', 'Descripción', 'Prob', 'Imp', 'R.I.', 'Nivel RI', 'Control Sugerido', 'Efect %', 'R.R.', 'Nivel RR']);

    for (let i = 1; i <= 10; i++) {
      const r = 4 + i;
      const vals = [
        i, d[`FACTOR_${i}_CATEGORIA`] || '', d[`FACTOR_${i}_NOMBRE`] || '', d[`FACTOR_${i}_DESCRIPCION`] || '',
        d[`FACTOR_${i}_PROB`] || '', d[`FACTOR_${i}_IMP`] || '', d[`FACTOR_${i}_RI`] || '', d[`FACTOR_${i}_NIVEL_RI`] || '',
        d[`FACTOR_${i}_CONTROL`] || '', d[`FACTOR_${i}_EFECT`] || '', d[`FACTOR_${i}_RR`] || '', d[`FACTOR_${i}_NIVEL_RR`] || '',
      ];
      addDataRow(ws2, r, vals, i % 2 === 0, 38);

      // Center numeric columns
      [1, 5, 6, 7, 10, 11].forEach(col => { ws2.getCell(r, col).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; });

      // Color nivel columns
      [8, 12].forEach(col => {
        const nivel = String(vals[col - 1]);
        const { font, fill } = nivelStyle(nivel);
        const cell = ws2.getCell(r, col);
        cell.font = font; cell.fill = fill;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    }

    // Legend
    ws2.mergeCells(16, 1, 16, 12);
    ws2.mergeCells(17, 1, 17, 4);
    ws2.getCell(17, 1).value = 'Escala: Probabilidad/Impacto 1 (Muy bajo) a 5 (Muy alto)';
    ws2.getCell(17, 1).font = { name: 'Arial', size: 9, color: { argb: 'FF808080' } };

    const legend = [
      ['ALTO', 'Riesgo ≥ 15 — Requiere acción inmediata', C.ROJO, C.ROJO_FONDO],
      ['MEDIO', 'Riesgo 6-14 — Requiere monitoreo continuo', C.ORO, C.NARANJA_FONDO],
      ['BAJO', 'Riesgo < 6 — Gestión rutinaria', C.VERDE, C.VERDE_FONDO],
    ];
    legend.forEach(([niv, desc, color, bg], j) => {
      const rr = 18 + j;
      ws2.mergeCells(rr, 1, rr, 2);
      const cN = ws2.getCell(rr, 1);
      cN.value = niv; cN.font = { name: 'Arial', size: 9, bold: true, color: { argb: color } };
      cN.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cN.alignment = { horizontal: 'center', vertical: 'middle' };
      ws2.mergeCells(rr, 3, rr, 7);
      ws2.getCell(rr, 3).value = desc;
      ws2.getCell(rr, 3).font = { name: 'Arial', size: 9, color: { argb: 'FF808080' } };
    });

    // ================================================================
    // HOJA 3: SEÑALES DE ALERTA
    // ================================================================
    const ws3 = wb.addWorksheet('SEÑALES DE ALERTA', { properties: { tabColor: { argb: 'FFED7D31' } }, views: [{ showGridLines: false }] });
    ws3.columns = [{ width: 5 }, { width: 50 }, { width: 10 }, { width: 50 }];

    addTitle(ws3, 'SEÑALES DE ALERTA LA/FT/FPADM', `${empresa} — Indicadores de operaciones sospechosas`, 4);
    addHeaderRow(ws3, 4, ['#', 'Señal de Alerta', 'Nivel', 'Acción Requerida']);

    for (let i = 1; i <= 8; i++) {
      const r = 4 + i;
      const nivel = d[`SENAL_${i}_NIVEL`] || '';
      addDataRow(ws3, r, [i, d[`SENAL_${i}_TEXTO`] || '', nivel, d[`SENAL_${i}_ACCION`] || ''], i % 2 === 0, 45);
      ws3.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'middle' };
      const { font, fill } = nivelStyle(nivel);
      const nCell = ws3.getCell(r, 3);
      nCell.font = font; nCell.fill = fill;
      nCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // ================================================================
    // HOJA 4: CONTROLES PRIORITARIOS
    // ================================================================
    const ws4 = wb.addWorksheet('CONTROLES', { properties: { tabColor: { argb: '548235' } }, views: [{ showGridLines: false }] });
    ws4.columns = [{ width: 5 }, { width: 30 }, { width: 45 }, { width: 12 }, { width: 25 }];

    addTitle(ws4, 'CONTROLES PRIORITARIOS', `${empresa} — Medidas de mitigación de riesgo LA/FT/FPADM`, 5);
    addHeaderRow(ws4, 4, ['#', 'Control', 'Descripción', 'Prioridad', 'Responsable']);

    for (let i = 1; i <= 5; i++) {
      const r = 4 + i;
      const prioridad = d[`CONTROL_${i}_PRIORIDAD`] || '';
      addDataRow(ws4, r, [i, d[`CONTROL_${i}_NOMBRE`] || '', d[`CONTROL_${i}_DESC`] || '', prioridad, d[`CONTROL_${i}_RESPONSABLE`] || ''], i % 2 === 0, 42);
      ws4.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'middle' };
      const { font, fill } = nivelStyle(prioridad);
      const pCell = ws4.getCell(r, 4);
      pCell.font = font; pCell.fill = fill;
      pCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // ================================================================
    // HOJA 5: RECOMENDACIONES
    // ================================================================
    const ws5 = wb.addWorksheet('RECOMENDACIONES', { properties: { tabColor: { argb: '4472C4' } }, views: [{ showGridLines: false }] });
    ws5.columns = [{ width: 5 }, { width: 8 }, { width: 85 }];

    addTitle(ws5, 'RECOMENDACIONES ESPECÍFICAS', `${empresa} — Acciones sugeridas para fortalecer el sistema de prevención`, 3);

    for (let i = 1; i <= 3; i++) {
      const r = 3 + i;
      const numCell = ws5.getCell(r, 2);
      numCell.value = `0${i}`;
      numCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: C.BLANCO } };
      numCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AZUL_MEDIO } };
      numCell.alignment = { horizontal: 'center', vertical: 'middle' };
      numCell.border = BORDERS;

      const recCell = ws5.getCell(r, 3);
      recCell.value = d[`RECOMENDACION_${i}`] || '';
      recCell.font = { name: 'Arial', size: 11, color: { argb: C.GRIS_OSCURO } };
      recCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      recCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? C.AZUL_FONDO : C.BLANCO } };
      recCell.border = BORDERS;
      ws5.getRow(r).height = 55;
    }

    // ================================================================
    // HOJA 6: CHECKLIST
    // ================================================================
    const ws6 = wb.addWorksheet('CHECKLIST', { properties: { tabColor: { argb: '548235' } }, views: [{ showGridLines: false }] });
    ws6.columns = [{ width: 5 }, { width: 45 }, { width: 16 }, { width: 35 }];

    addTitle(ws6, 'CHECKLIST DE CUMPLIMIENTO', `${empresa} — Obligaciones del Régimen de Medidas Mínimas (Res. 100-006322 de 2023)`, 4);
    addHeaderRow(ws6, 4, ['#', 'Obligación', 'Estado', 'Evidencia / Observación']);

    const obligaciones = [
      ['Adoptar política de prevención LA/FT/FPADM', 'Implementado', 'Manual de Medidas Mínimas adoptado'],
      ['Identificar y evaluar factores de riesgo', 'Implementado', '10 factores identificados en esta matriz'],
      ['Establecer señales de alerta sectoriales', 'Implementado', '8 señales en hoja SEÑALES DE ALERTA'],
      ['Implementar controles de prevención', 'Implementado', '5 controles en hoja CONTROLES'],
      ['Conocer al cliente (debida diligencia)',
        d.CHECK_DEBIDA_DILIGENCIA === 'Implementado' ? 'Implementado'
          : d.CHECK_DEBIDA_DILIGENCIA === 'En proceso' ? 'En proceso' : 'Pendiente',
        d.CHECK_DEBIDA_DILIGENCIA === 'Implementado' ? 'Procedimiento KYC implementado'
          : d.CHECK_DEBIDA_DILIGENCIA === 'En proceso' ? 'Procedimiento KYC en desarrollo' : 'Procedimiento KYC por implementar'],
      ['Reportar operaciones sospechosas a UIAF',
        d.CHECK_PROCEDIMIENTO_ROS === 'Implementado' ? 'Implementado'
          : d.CHECK_PROCEDIMIENTO_ROS === 'En proceso' ? 'En proceso' : 'Pendiente',
        d.CHECK_PROCEDIMIENTO_ROS === 'Implementado' ? 'Procedimiento de ROS implementado'
          : d.CHECK_PROCEDIMIENTO_ROS === 'En proceso' ? 'Procedimiento de ROS en desarrollo' : 'Procedimiento de ROS por implementar'],
      ['Conservar documentos mínimo 5 años', 'Por implementar', 'Política de retención documental por definir con el sistema'],
      ['Capacitar al personal periódicamente',
        d.CHECK_CAPACITACION === 'Implementado' ? 'Implementado'
          : d.CHECK_CAPACITACION === 'En proceso' ? 'En proceso' : 'Pendiente',
        d.CHECK_CAPACITACION === 'Implementado' ? 'Personal capacitado en prevención LA/FT'
          : d.CHECK_CAPACITACION === 'En proceso' ? 'Plan de capacitación en ejecución' : 'Plan de capacitación por implementar'],
      ['Designar oficial de cumplimiento',
        d.CHECK_OFICIAL_CUMPLIMIENTO === 'Implementado' ? 'Implementado'
          : d.CHECK_OFICIAL_CUMPLIMIENTO === 'En proceso' ? 'En proceso' : 'Pendiente',
        d.CHECK_OFICIAL_CUMPLIMIENTO === 'Implementado' ? 'Oficial de cumplimiento designado'
          : d.CHECK_OFICIAL_CUMPLIMIENTO === 'En proceso' ? 'Designación en proceso' : 'Por designar oficial de cumplimiento'],
      ['Actualizar matriz de riesgo anualmente', 'Implementado', 'Primera versión generada automáticamente'],
      ['Monitorear operaciones inusuales', 'Por implementar', 'Parámetros de monitoreo por definir con el sistema'],
      ['Consultar listas restrictivas (OFAC, ONU)',
        d.CHECK_LISTAS_RESTRICTIVAS === 'Implementado' ? 'Implementado'
          : d.CHECK_LISTAS_RESTRICTIVAS === 'En proceso' ? 'En proceso' : 'Pendiente',
        d.CHECK_LISTAS_RESTRICTIVAS === 'Implementado' ? 'Consulta periódica de listas implementada'
          : d.CHECK_LISTAS_RESTRICTIVAS === 'En proceso' ? 'Proceso de consulta en implementación' : 'Herramienta de consulta por implementar'],
    ];

    let totalImpl = 0, totalProc = 0, totalPend = 0;

    obligaciones.forEach(([obl, estado, obs], i) => {
      const r = 5 + i;
      addDataRow(ws6, r, [i + 1, obl, estado, obs], i % 2 !== 0, 32);
      ws6.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'middle' };

      const eCell = ws6.getCell(r, 3);
      eCell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (estado === 'Implementado') {
        eCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: C.VERDE } };
        eCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.VERDE_FONDO } };
        totalImpl++;
      } else if (estado === 'En proceso') {
        eCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: C.ORO } };
        eCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AMARILLO_FONDO } };
        totalProc++;
      } else {
        eCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: C.ROJO } };
        eCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.ROJO_FONDO } };
        totalPend++;
      }
    });

    const rF = 5 + obligaciones.length + 1;
    ws6.mergeCells(rF, 1, rF, 2);
    ws6.getCell(rF, 1).value = 'Resumen de cumplimiento:';
    ws6.getCell(rF, 1).font = { name: 'Arial', size: 10, bold: true, color: { argb: C.GRIS_OSCURO } };

    const pct = Math.round(totalImpl / 12 * 100);
    ws6.mergeCells(rF, 3, rF, 4);
    ws6.getCell(rF, 3).value = `Nivel de cumplimiento: ${pct}%`;
    ws6.getCell(rF, 3).font = { name: 'Arial', size: 14, bold: true, color: { argb: C.AZUL_OSCURO } };
    ws6.getCell(rF, 3).alignment = { horizontal: 'center', vertical: 'middle' };

    const resumenData = [
      [`Implementados: ${totalImpl}/12`, C.VERDE, C.VERDE_FONDO],
      [`En proceso: ${totalProc}/12`, C.ORO, C.NARANJA_FONDO],
      [`Pendientes: ${totalPend}/12`, C.ROJO, C.ROJO_FONDO],
    ];
    resumenData.forEach(([texto, color, bg], j) => {
      const rr = rF + 1 + j;
      ws6.mergeCells(rr, 1, rr, 2);
      const c = ws6.getCell(rr, 1);
      c.value = texto; c.font = { name: 'Arial', size: 10, bold: true, color: { argb: color } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = BORDERS;
    });

    // ================================================================
    // GENERATE & RETURN
    // ================================================================
    const buffer = await wb.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const filename = `Matriz_Riesgo_${empresa.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

    return NextResponse.json({
      success: true,
      filename,
      base64,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

  } catch (error: any) {
    console.error('Error generating Excel:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
