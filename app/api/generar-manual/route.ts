import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, LevelFormat } from 'docx';

export const maxDuration = 30;

// ================================================================
// COLOR PALETTE
// ================================================================
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
};

// ================================================================
// HELPERS
// ================================================================
function heading1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 28, font: 'Arial', color: C.AZUL_OSCURO })]
  });
}

function heading2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 24, font: 'Arial', color: C.AZUL_MEDIO })]
  });
}

function heading3(text: string) {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Arial', color: C.AZUL_CLARO })]
  });
}

function para(text: string, opts: any = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 120, before: opts.before || 0, line: 276 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({
      text, size: opts.size || 22, font: opts.font || 'Arial',
      bold: opts.bold || false, italics: opts.italics || false,
      color: opts.color || C.GRIS_OSCURO
    })]
  });
}

function paraMulti(runs: any[], opts: any = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 120, before: opts.before || 0, line: 276 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: runs.map(r => new TextRun({
      text: r.text, size: r.size || 22, font: r.font || 'Arial',
      bold: r.bold || false, italics: r.italics || false,
      color: r.color || C.GRIS_OSCURO
    }))
  });
}

function emptyPara(size = 120) {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

function bulletItem(text: string, numbRef: string) {
  return new Paragraph({
    numbering: { reference: numbRef, level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, size: 22, font: 'Arial', color: C.GRIS_OSCURO })]
  });
}

function numberedItem(text: string, numbRef: string) {
  return new Paragraph({
    numbering: { reference: numbRef, level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, size: 22, font: 'Arial', color: C.GRIS_OSCURO })]
  });
}

function letterItem(text: string, numbRef: string) {
  return new Paragraph({
    numbering: { reference: numbRef, level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, size: 22, font: 'Arial', color: C.GRIS_OSCURO })]
  });
}

function infoTable(rows: string[][]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: C.AZUL_SUAVE };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 6160],
    rows: rows.map((row, i) => new TableRow({
      children: [
        new TableCell({
          borders, width: { size: 3200, type: WidthType.DXA },
          shading: { fill: C.AZUL_FONDO, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: row[0], bold: true, size: 20, font: 'Arial', color: C.AZUL_OSCURO })] })]
        }),
        new TableCell({
          borders, width: { size: 6160, type: WidthType.DXA },
          shading: { fill: i % 2 === 0 ? C.BLANCO : C.GRIS_CLARO, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: row[1], size: 20, font: 'Arial', color: C.GRIS_OSCURO })] })]
        })
      ]
    }))
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.AZUL_SUAVE, space: 1 } },
    children: []
  });
}

// ================================================================
// SECTOR DATA
// ================================================================
const SECTORES: Record<string, any> = {
  inmobiliario: {
    nombre: 'Agentes Inmobiliarios',
    descripcion_sector: 'El sector inmobiliario es uno de los sectores identificados como de mayor riesgo frente al lavado de activos debido a la naturaleza de las transacciones, los altos valores involucrados y la posibilidad de que los inmuebles sean utilizados como vehículos para legalizar recursos de origen ilícito.',
    normas_especificas: [
      'Resolución No. 100-006322 del 22 de agosto de 2023 expedida por la Superintendencia de Sociedades, que establece el Régimen de Medidas Mínimas para APNFD.',
      'Capítulo X de la Circular Básica Jurídica (Circular Externa 100-000005 de 2017), numeral 4.2.1 literal b) - Agentes Inmobiliarios.',
      'Oficio 220-138053 de la Superintendencia de Sociedades sobre ingresos de intermediación inmobiliaria.',
    ],
    senales_clientes: [
      'Clientes que buscan adquirir inmuebles por valores significativamente superiores al avalúo comercial sin justificación.',
      'Clientes que insisten en realizar pagos en efectivo por montos que superan las políticas de la empresa.',
      'Compradores que muestran desinterés por las características del inmueble y solo se enfocan en cerrar la operación rápidamente.',
      'Clientes que solicitan que la escrituración se realice a nombre de terceros sin relación aparente.',
      'Arrendatarios que ofrecen pagar varios meses o años de arriendo por anticipado sin justificación económica.',
      'Personas que compran múltiples propiedades en cortos periodos de tiempo sin fuente de ingresos visible.',
      'Clientes que solicitan que el valor en la escritura sea diferente al valor real de la transacción.',
      'Compradores extranjeros que no pueden demostrar el origen lícito de los fondos.',
    ],
    senales_proveedores: [
      'Avaluadores que emiten avalúos significativamente por encima o por debajo del valor de mercado sin justificación técnica.',
      'Intermediarios que ofrecen comisiones inusualmente altas por facilitar transacciones.',
      'Contratistas de obra que no pueden demostrar la procedencia de los materiales o mano de obra.',
      'Empresas de administración de propiedad horizontal con estructuras societarias poco transparentes.',
    ],
    controles_especificos: [
      'Verificar la coherencia entre el valor de la transacción inmobiliaria y la capacidad financiera demostrada del cliente.',
      'Consultar el certificado de tradición y libertad del inmueble para identificar transferencias frecuentes o irregulares.',
      'Exigir declaración juramentada sobre el origen de los fondos para transacciones que superen los umbrales establecidos.',
      'Implementar control reforzado para operaciones con PEPs en el sector inmobiliario.',
    ],
    riesgos_particulares: 'La actividad inmobiliaria presenta riesgos específicos derivados de la posibilidad de utilizar inmuebles como reserva de valor para ocultar activos de origen ilícito, la complejidad de las cadenas de intermediación, y los altos volúmenes de capital involucrados en cada transacción.',
  },
  juridico: {
    nombre: 'Servicios Jurídicos',
    descripcion_sector: 'Los profesionales del derecho, por la naturaleza de su actividad, pueden verse expuestos a ser utilizados como intermediarios para dar apariencia de legalidad a operaciones relacionadas con el lavado de activos.',
    normas_especificas: [
      'Resolución No. 100-006322 del 22 de agosto de 2023 expedida por la Superintendencia de Sociedades.',
      'Capítulo X de la Circular Básica Jurídica - Servicios profesionales del sector jurídico.',
      'Recomendación 22 del GAFI sobre Profesiones y Actividades No Financieras Designadas.',
    ],
    senales_clientes: [
      'Clientes que solicitan la constitución de múltiples sociedades sin un propósito comercial claro.',
      'Clientes que solicitan servicios de representación legal y ofrecen honorarios desproporcionados.',
      'Personas que buscan asesoría para estructurar operaciones que eviten umbrales de reporte.',
      'Clientes que muestran interés excesivo en la confidencialidad más allá del secreto profesional normal.',
      'Personas que solicitan la creación de estructuras jurídicas complejas sin justificación comercial.',
      'Clientes que pagan honorarios desde cuentas en jurisdicciones de alto riesgo.',
      'Personas que solicitan actuar como testaferros o interpuestas personas.',
      'Clientes con antecedentes penales que buscan reestructurar sus activos.',
    ],
    senales_proveedores: [
      'Firmas de abogados que ofrecen constitución de sociedades a precios inusualmente bajos.',
      'Asesores legales que ofrecen estructurar operaciones para evadir controles.',
      'Notarías con volumen inusual de operaciones con determinados clientes.',
    ],
    controles_especificos: [
      'Implementar procedimientos reforzados de conocimiento del cliente antes de aceptar cualquier mandato.',
      'Documentar el propósito económico de las estructuras jurídicas constituidas para clientes.',
      'Verificar la identidad del beneficiario final en toda constitución de sociedad.',
      'Mantener registros detallados del origen de los fondos recibidos como honorarios o en custodia.',
    ],
    riesgos_particulares: 'El sector jurídico enfrenta riesgos relacionados con el posible uso de servicios profesionales para la constitución de vehículos societarios opacos, el manejo de fondos de terceros, y la prestación de servicios de testaferrato involuntario.',
  },
  contable: {
    nombre: 'Servicios Contables',
    descripcion_sector: 'Los profesionales contables, por su acceso a información financiera privilegiada y su rol en la preparación de estados financieros, pueden ser utilizados para dar apariencia de legalidad a transacciones relacionadas con el lavado de activos.',
    normas_especificas: [
      'Resolución No. 100-006322 del 22 de agosto de 2023 expedida por la Superintendencia de Sociedades.',
      'Capítulo X de la Circular Básica Jurídica - Servicios profesionales del sector contable.',
      'Ley 43 de 1990 sobre la profesión de Contador Público.',
    ],
    senales_clientes: [
      'Clientes que solicitan registrar transacciones sin el debido soporte documental.',
      'Empresas con ingresos que no guardan proporción con su capacidad operativa.',
      'Clientes que insisten en utilizar esquemas contables agresivos para reducir ingresos reportados.',
      'Empresas con número inusual de transacciones con partes relacionadas sin justificación.',
      'Clientes que solicitan la emisión de facturas por servicios no prestados.',
      'Empresas que manejan grandes volúmenes de efectivo sin justificación.',
      'Clientes que cambian frecuentemente de contador sin razón aparente.',
      'Empresas cuyos estados financieros muestran inconsistencias significativas.',
    ],
    senales_proveedores: [
      'Proveedores de software contable que no cumplen estándares de seguridad.',
      'Asesores tributarios que promueven esquemas de evasión.',
      'Empresas de outsourcing contable desde jurisdicciones de alto riesgo.',
    ],
    controles_especificos: [
      'Verificar coherencia entre transacciones registradas y soportes documentales.',
      'Implementar alertas automáticas para transacciones que superen umbrales.',
      'Documentar y escalar solicitudes de registro contable sin soporte adecuado.',
      'Realizar conciliaciones periódicas entre registros contables y movimientos bancarios.',
    ],
    riesgos_particulares: 'El sector contable enfrenta riesgos derivados de la posibilidad de que los servicios profesionales sean utilizados para manipular registros financieros o crear documentación falsa que respalde transacciones ilícitas.',
  },
  tecnologia: {
    nombre: 'Tecnología y Software',
    descripcion_sector: 'Las empresas de tecnología enfrentan riesgos de LA/FT/FPADM derivados de la naturaleza digital de sus operaciones, la globalidad de sus servicios y la posibilidad de que sus plataformas sean utilizadas para canalizar recursos ilícitos.',
    normas_especificas: [
      'Resolución No. 100-006322 del 22 de agosto de 2023 expedida por la Superintendencia de Sociedades.',
      'Capítulo X de la Circular Básica Jurídica - Empresas del sector real.',
      'Ley 1581 de 2012 sobre Protección de Datos Personales.',
    ],
    senales_clientes: [
      'Clientes que contratan servicios de alto valor y pagan desde jurisdicciones de alto riesgo.',
      'Contratación de servicios sin especificaciones claras o con requerimientos que cambian constantemente.',
      'Clientes que solicitan facturación a nombre de terceros o entidades offshore.',
      'Pagos anticipados de alto valor por servicios no definidos formalmente.',
      'Clientes que insisten en utilizar criptomonedas o medios de pago no convencionales.',
      'Empresas que contratan servicios tecnológicos sin operación visible que los justifique.',
      'Clientes que solicitan acceso a datos sin relación con el servicio contratado.',
      'Contratación de licencias en cantidades desproporcionadas con el tamaño del cliente.',
    ],
    senales_proveedores: [
      'Proveedores de servicios en la nube desde jurisdicciones con débiles controles anti-lavado.',
      'Freelancers que no pueden verificar su identidad o ubicación real.',
      'Empresas de outsourcing tecnológico con estructuras corporativas opacas.',
    ],
    controles_especificos: [
      'Implementar verificación de identidad digital (KYC digital) para clientes remotos.',
      'Monitorear fuentes y destinos de pagos electrónicos recibidos.',
      'Documentar el propósito comercial de cada contratación de alto valor.',
      'Verificar coherencia entre servicios contratados y actividad económica del cliente.',
    ],
    riesgos_particulares: 'El sector tecnológico enfrenta riesgos derivados de la virtualidad de las transacciones, la globalidad de los clientes y la facilidad de las transferencias electrónicas transfronterizas.',
  },
  comercio: {
    nombre: 'Comercio General',
    descripcion_sector: 'Las empresas del sector comercial, por la naturaleza de sus operaciones de compraventa y el volumen de transacciones, pueden verse expuestas a ser utilizadas como canal para la introducción de recursos ilícitos en la economía formal.',
    normas_especificas: [
      'Resolución No. 100-006322 del 22 de agosto de 2023 expedida por la Superintendencia de Sociedades.',
      'Capítulo X de la Circular Básica Jurídica - Empresas del sector real.',
      'Estatuto Tributario - Obligaciones de facturación y reporte.',
    ],
    senales_clientes: [
      'Clientes que realizan compras frecuentes de alto valor y pagan exclusivamente en efectivo.',
      'Compradores que devuelven mercancía solicitando reembolso por medio diferente al pago original.',
      'Clientes que compran productos en cantidades que exceden cualquier uso comercial razonable.',
      'Personas que no muestran interés en calidad, precio o garantía de los productos adquiridos.',
      'Clientes que solicitan facturas a nombre de diferentes razones sociales para las mismas compras.',
      'Compradores que pagan con múltiples instrumentos a nombre de diferentes personas.',
      'Clientes recurrentes que nunca negocian precios ni solicitan descuentos.',
      'Personas que solicitan envío de mercancía a zonas de frontera sin justificación comercial.',
    ],
    senales_proveedores: [
      'Proveedores que ofrecen mercancía a precios significativamente por debajo del mercado.',
      'Proveedores que no pueden demostrar el origen legal de la mercancía.',
      'Empresas proveedoras recientes que manejan volúmenes desproporcionados.',
      'Proveedores que solicitan pagos a terceros o cuentas en el exterior.',
    ],
    controles_especificos: [
      'Establecer políticas claras sobre montos máximos de transacciones en efectivo.',
      'Implementar facturación electrónica con verificación de datos del comprador.',
      'Monitorear patrones de compra inusuales, especialmente de alto valor.',
      'Verificar identidad del comprador en transacciones que superen umbrales.',
    ],
    riesgos_particulares: 'El sector comercial enfrenta riesgos derivados del alto volumen de transacciones y la posibilidad de que los productos sean utilizados como vehículos de valor para el movimiento de recursos ilícitos.',
  },
  otro: {
    nombre: 'Sector Empresarial General',
    descripcion_sector: 'Toda empresa del sector real colombiana puede verse expuesta a riesgos de lavado de activos, financiación del terrorismo y financiación de la proliferación de armas de destrucción masiva.',
    normas_especificas: [
      'Resolución No. 100-006322 del 22 de agosto de 2023 expedida por la Superintendencia de Sociedades.',
      'Capítulo X de la Circular Básica Jurídica (Circular Externa 100-000005 de 2017).',
    ],
    senales_clientes: [
      'Clientes que cuestionan insistentemente los procedimientos de verificación de identidad.',
      'Clientes que presentan cambios repentinos en el comportamiento transaccional.',
      'Personas que aparecen como propietarios de negocios no congruentes con su perfil económico.',
      'Clientes sobre los cuales no es posible confirmar los datos proporcionados.',
      'Clientes que realizan movimientos no proporcionales con su perfil financiero.',
      'Clientes que se rehúsan a proporcionar información sobre el origen de fondos.',
      'Clientes renuentes a actualizar su información periódicamente.',
      'Clientes con familiares mencionados en medios en relación con delitos graves.',
    ],
    senales_proveedores: [
      'Proveedores sin adecuada experiencia ni infraestructura para respaldar sus servicios.',
      'Proveedores que intentan influir en la contratación mediante regalos desproporcionados.',
      'Proveedores que ofrecen productos a precios significativamente más bajos que el mercado.',
      'Proveedores que solicitan que los pagos sean dirigidos a terceros.',
    ],
    controles_especificos: [
      'Implementar formularios KYC para todas las contrapartes comerciales.',
      'Consultar listas restrictivas (OFAC, ONU, UE) antes de formalizar relaciones contractuales.',
      'Establecer umbrales de alerta para transacciones en efectivo.',
      'Realizar monitoreo anual de todas las contrapartes activas.',
    ],
    riesgos_particulares: 'La empresa enfrenta los riesgos generales inherentes a la actividad comercial en Colombia, incluyendo el riesgo de ser utilizada como canal para la introducción de recursos ilícitos y el riesgo reputacional asociado.',
  }
};

// ================================================================
// MAIN HANDLER
// ================================================================
export async function POST(request: NextRequest) {
  try {
    const d = await request.json();
    const empresa = d.RAZON_SOCIAL || 'EMPRESA S.A.S.';
    const empresaCorto = d.RAZON_SOCIAL_CORTO || empresa.replace(/\s*(S\.?A\.?S\.?|S\.?A\.?|LTDA\.?|E\.?U\.?)\s*/gi, '').trim();
    const nit = d.NIT || 'N/A';
    const repLegal = d.REPRESENTANTE_LEGAL || 'N/A';
    const cedulaRep = d.CEDULA_REP_LEGAL || 'N/A';
    const ciudad = d.CIUDAD || 'Colombia';
    const ciiu = d.CODIGO_CIIU || 'N/A';
    const sectorKey = (d.SECTOR_APNFD || 'otro').toLowerCase();
    const sectorNombre = d.SECTOR_NOMBRE || 'Sector empresarial';
    const objetoSocial = d.OBJETO_SOCIAL || 'Actividad comercial general.';
    const fechaConst = d.FECHA_CONSTITUCION || 'fecha no disponible';
    const fechaManual = d.FECHA_MANUAL || new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    const anio = d.AÑO || d.ANIO || new Date().getFullYear().toString();
    const version = d.VERSION || 'V.1';
    const siglas = d.SIGLAS || empresaCorto.split(' ').map((p: string) => p[0]).join('').substring(0, 4).toUpperCase();
    const codigoManual = d.CODIGO_MANUAL || `RMM_${siglas}_${anio}_${version}`;
    const perfil = d.PERFIL_RIESGO || 'MEDIO';
    const esAPNFD = ['inmobiliario', 'juridico', 'contable'].includes(sectorKey);
    const sector = SECTORES[sectorKey] || SECTORES.otro;
    const tieneRevisorFiscal = (d.TIENE_REVISOR_FISCAL || 'no').toLowerCase() === 'si';
    const revisorFiscalNombre = d.REVISOR_FISCAL_NOMBRE || '';
    const tieneJuntaDirectiva = (d.TIENE_JUNTA_DIRECTIVA || 'no').toLowerCase() === 'si';
    const tipoSociedad = (d.TIPO_SOCIEDAD || 'SAS').toUpperCase();
    const organoAprobador = tieneJuntaDirectiva ? 'Junta Directiva' : (tipoSociedad.includes('LTDA') || tipoSociedad.includes('LIMITADA')) ? 'Junta de Socios' : 'Asamblea de Accionistas';

    const senalesCliente = sector.senales_clientes;
    const senalesProveedor = sector.senales_proveedores;
    const controlesEspecificos = sector.controles_especificos;

    const doc = new Document({
      styles: {
        default: { document: { run: { font: 'Arial', size: 22 } } },
        paragraphStyles: [
          { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 28, bold: true, font: 'Arial', color: C.AZUL_OSCURO },
            paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
          { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 24, bold: true, font: 'Arial', color: C.AZUL_MEDIO },
            paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
        ]
      },
      numbering: {
        config: [
          ...['bullets', 'bullets2', 'bullets3', 'bullets4'].map(ref => ({
            reference: ref,
            levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
          })),
          ...['numbers', 'numbers2', 'numbers3', 'numbers4', 'numbers5'].map(ref => ({
            reference: ref,
            levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
          })),
          ...['letters', 'letters2', 'letters3', 'letters4'].map(ref => ({
            reference: ref,
            levels: [{ level: 0, format: LevelFormat.LOWER_LETTER, text: '%1.', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }]
          })),
        ]
      },
      sections: [
        // PORTADA
        {
          properties: {
            page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
          },
          children: [
            emptyPara(600), emptyPara(600),
            new Paragraph({ spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.AZUL_MEDIO, space: 1 } }, children: [] }),
            ...[
              'MANUAL PARA EL RÉGIMEN DE',
              'MEDIDAS MÍNIMAS FRENTE AL',
              'RÉGIMEN DE AUTOCONTROL Y GESTIÓN',
              'DEL RIESGO INTEGRAL LA/FT/FPADM'
            ].map(t => new Paragraph({
              alignment: AlignmentType.CENTER, spacing: { after: 120 },
              children: [new TextRun({ text: t, size: 36, bold: true, font: 'Arial', color: C.AZUL_OSCURO })]
            })),
            new Paragraph({ spacing: { after: 300 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.AZUL_CLARO, space: 1 } }, children: [] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: empresa, size: 32, bold: true, font: 'Arial', color: C.AZUL_MEDIO })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `NIT: ${nit}`, size: 24, font: 'Arial', color: C.GRIS_MEDIO })] }),
            emptyPara(400),
            infoTable([
              ['Código del documento', codigoManual], ['Versión', version],
              ['Fecha de elaboración', fechaManual], ['Ciudad', ciudad],
              ['Perfil de riesgo', perfil], ['Sector', sectorNombre], ['Código CIIU', ciiu],
            ]),
            emptyPara(300),
            new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.AZUL_MEDIO, space: 1 } }, children: [] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: 'DOCUMENTO CONFIDENCIAL', size: 18, bold: true, font: 'Arial', color: C.GRIS_MEDIO })] }),
          ]
        },
        // TOC
        {
          properties: {
            page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
          },
          headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.AZUL_SUAVE, space: 4 } }, children: [new TextRun({ text: `${codigoManual}  |  ${empresa}`, size: 16, font: 'Arial', color: C.GRIS_MEDIO, italics: true })] })] }) },
          footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.AZUL_SUAVE, space: 4 } }, children: [new TextRun({ text: 'Manual de Medidas Mínimas LA/FT/FPADM  —  ', size: 16, font: 'Arial', color: C.GRIS_MEDIO }), new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Arial', color: C.AZUL_MEDIO, bold: true })] })] }) },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'TABLA DE CONTENIDO', size: 32, bold: true, font: 'Arial', color: C.AZUL_OSCURO })] }),
            divider(),
            ...['INTRODUCCIÓN', 'I. OBJETIVO', 'II. OBJETIVOS ESPECÍFICOS', 'III. ALCANCE Y RESPONSABLES', 'IV. DEFINICIONES', 'V. MARCO NORMATIVO', 'VI. FUNCIONES Y RESPONSABILIDADES', 'VII. POLÍTICA LA/FT/FPADM', 'VIII. MECANISMO DE DIVULGACIÓN Y CAPACITACIÓN', 'IX. ETAPAS PARA LA ADMINISTRACIÓN DEL RIESGO', 'X. MECANISMO DE DEBIDA DILIGENCIA', 'XI. SEÑALES DE ALERTA', 'XII. RÉGIMEN SANCIONATORIO', 'FIRMA Y APROBACIÓN'].map(t => para(t, { bold: true, color: C.AZUL_OSCURO })),
            divider(),
          ]
        },
        // CONTENT
        {
          properties: {
            page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
          },
          headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.AZUL_SUAVE, space: 4 } }, children: [new TextRun({ text: `${codigoManual}  |  ${empresa}`, size: 16, font: 'Arial', color: C.GRIS_MEDIO, italics: true })] })] }) },
          footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.AZUL_SUAVE, space: 4 } }, children: [new TextRun({ text: 'Manual de Medidas Mínimas LA/FT/FPADM  —  ', size: 16, font: 'Arial', color: C.GRIS_MEDIO }), new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Arial', color: C.AZUL_MEDIO, bold: true })] })] }) },
          children: [
            // INTRODUCCIÓN
            heading1('Introducción'),
            para('De conformidad con lo establecido en el Capítulo X de la Circular Básica Jurídica emitida por la Superintendencia de Sociedades, "el lavado de activos, el financiamiento del terrorismo y el financiamiento de la proliferación de armas de destrucción masiva son fenómenos delictivos que generan consecuencias negativas para la economía del país y para las empresas del sector real. Pueden traducirse en el acaecimiento de riesgos operacionales, legales, reputacionales y de contagio, entre otros. Esta situación, puede afectar su buen nombre, competitividad, productividad y perdurabilidad".'),
            para(`Con lo anterior, el compromiso constante por garantizar la integridad en todas nuestras operaciones, y en cumplimiento de la normativa vigente en Colombia, presentamos el presente Manual de Medidas Mínimas para el Autocontrol y Gestión del Riesgo Integral de Lavado de Activos, Financiación del Terrorismo y Financiación de la Proliferación de Armas de Destrucción Masiva (LA/FT/FPADM) como documento que refleja el esfuerzo de ${empresa} por implementar prácticas empresariales responsables y seguras.`),
            para(sector.descripcion_sector),
            paraMulti([
              { text: empresa, bold: true, color: C.AZUL_OSCURO },
              { text: ` (en adelante "${empresaCorto}"), constituida ${fechaConst}, identificada con NIT ${nit}, con domicilio en ${ciudad}, tiene por objeto social: ` },
              { text: objetoSocial, italics: true },
            ]),
            ...(esAPNFD ? [
              para(`Dado que ${empresaCorto} se encuentra dentro del ámbito de aplicación del Capítulo X de la Circular Básica Jurídica como empresa del sector de ${sector.nombre}, se encuentra obligada a implementar un Régimen de Autocontrol y Gestión del Riesgo Integral LA/FT/FPADM. Atendiendo sus niveles de ingresos actuales, la sociedad adopta el presente Régimen de Medidas Mínimas como mecanismo de cumplimiento normativo.`),
            ] : [
              para(`Si bien ${empresaCorto} no se encuentra actualmente dentro del listado de Actividades y Profesiones No Financieras Designadas (APNFD) obligadas por la Superintendencia de Sociedades, la alta dirección ha decidido adoptar el presente Régimen de Medidas Mínimas de forma voluntaria, reconociendo la importancia de contar con mecanismos de prevención y detección de operaciones relacionadas con el lavado de activos, la financiación del terrorismo y la financiación de la proliferación de armas de destrucción masiva.`),
            ]),
            para(`${empresaCorto} crea el presente Manual de Medidas Mínimas con el propósito de brindar guía y asegurar el cumplimiento a todas las contrapartes, dentro de los cuales podemos encontrar los trabajadores, administradores, colaboradores, contratistas, proveedores, partes vinculadas y otras relacionadas con la sociedad.`),

            // I. OBJETIVO
            heading1('I. Objetivo'),
            para(`El propósito del Manual de Medidas Mínimas de ${empresaCorto} es fijar directrices, políticas, procedimientos, normativas y reglas con el fin de prevenir y reducir el riesgo de actividades como el lavado de dinero, financiamiento del terrorismo y la financiación de la proliferación de armas de destrucción masiva.`),
            para(`Una parte crucial de este objetivo es la participación de todas las partes interesadas de ${empresaCorto}. A través del conocimiento de estas partes, su vínculo legal y sus relaciones comerciales, se pretende establecer un control efectivo de las operaciones para evitar que la sociedad sea utilizada o instrumentalizada con fondos o bienes de origen ilícito.`),

            // II. OBJETIVOS ESPECÍFICOS
            heading1('II. Objetivos Específicos'),
            para(`${empresaCorto} adopta los siguientes objetivos específicos:`),
            numberedItem('Fomentar una cultura de prevención y autocontrol dentro de la empresa, promoviendo la colaboración con las autoridades competentes que investigan delitos LA/FT/FPADM.', 'numbers'),
            numberedItem(`Impedir que ${empresaCorto} se vea involucrada en actividades LA/FT/FPADM por parte de individuos pertenecientes a los grupos de interés de la empresa.`, 'numbers'),
            numberedItem('Colaborar con las instituciones y empresas tanto públicas como privadas, para lograr una cooperación efectiva en la prevención de actividades LA/FT/FPADM.', 'numbers'),
            numberedItem(`Identificar, prevenir, gestionar y monitorear los riesgos asociados con actividades delictivas para el sector de ${sector.nombre}, que puedan tener un impacto negativo en la reputación y estabilidad de ${empresaCorto}.`, 'numbers'),

            // III. ALCANCE
            heading1('III. Alcance y Responsables'),
            para(`Este documento es de aplicación tanto para los trabajadores directos como para colaboradores, contratistas, clientes, proveedores y otras personas relacionadas con ${empresaCorto}.`),
            heading2('Responsables'),
            paraMulti([{ text: `1. ${organoAprobador}: `, bold: true }, { text: `Órgano máximo de ${empresa}. Responsable de la puesta en marcha y efectividad de las Medidas Mínimas.` }]),
            paraMulti([{ text: '2. Representante Legal: ', bold: true }, { text: `${repLegal}, identificado(a) con C.C. ${cedulaRep}. Encargado de gestionar el Régimen de Medidas Mínimas.` }]),
            paraMulti([{ text: '3. Proveedores y/o Colaboradores: ', bold: true }, { text: 'Personas naturales o jurídicas que participan en actividades mediante contratos o acuerdos comerciales.' }]),
            paraMulti([{ text: '4. Trabajadores: ', bold: true }, { text: `Personas naturales vinculadas a ${empresaCorto} mediante contrato de trabajo.` }]),
            ...(tieneRevisorFiscal ? [
              paraMulti([{ text: `5. Revisor Fiscal${revisorFiscalNombre ? ': ' : ''}`, bold: true }, { text: revisorFiscalNombre ? `${revisorFiscalNombre}. Su función principal es verificar que las operaciones de la sociedad se ajusten a la ley, los estatutos y las decisiones de la asamblea.` : 'Su función principal es verificar que las operaciones de la sociedad se ajusten a la ley, los estatutos y las decisiones de la asamblea.' }]),
              paraMulti([{ text: `6. Partes Interesadas: `, bold: true }, { text: 'Personas naturales o jurídicas con vínculos contractuales, comerciales o legales vigentes.' }]),
            ] : [
              paraMulti([{ text: '5. Partes Interesadas: ', bold: true }, { text: 'Personas naturales o jurídicas con vínculos contractuales, comerciales o legales vigentes.' }]),
            ]),

            // IV. DEFINICIONES
            heading1('IV. Definiciones'),
            para('Para los efectos del presente manual, se adoptan las siguientes definiciones conforme al Capítulo X de la Circular Básica Jurídica:'),
            ...([
              ['Activos', 'Recurso económico presente controlado por la Empresa como resultado de sucesos pasados.'],
              ['APNFD', 'Actividades y Profesiones No Financieras Designadas obligadas al cumplimiento del Capítulo X.'],
              ['Beneficiario Final', 'Persona(s) natural(es) que finalmente posee(n) o controla(n) a un cliente o la persona en cuyo nombre se realiza una transacción.'],
              ['Contraparte', 'Cualquier persona natural o jurídica con la que la Empresa tenga vínculos comerciales, de negocios, contractuales o jurídicos.'],
              ['Debida Diligencia', 'Proceso mediante el cual la Empresa adopta medidas para el conocimiento de la Contraparte.'],
              ['Financiamiento del Terrorismo (FT)', 'Delito regulado en el artículo 345 del Código Penal colombiano.'],
              ['FPADM', 'Financiamiento de la Proliferación de Armas de Destrucción Masiva.'],
              ['GAFI', 'Grupo de Acción Financiera Internacional, creado en 1989 para expedir estándares contra el LA/FT/FPADM.'],
              ['LA/FT/FPADM', 'Lavado de Activos, Financiamiento del Terrorismo y Financiamiento de la Proliferación de Armas de Destrucción Masiva.'],
              ['Lavado de Activos (LA)', 'Delito tipificado en el artículo 323 del Código Penal colombiano.'],
              ['Listas Vinculantes', 'Listas de personas y entidades asociadas con organizaciones terroristas vinculantes para Colombia.'],
              ['Matriz de Riesgo', 'Instrumento para identificar, evaluar y controlar los Riesgos LA/FT/FPADM.'],
              ['Operación Inusual', 'Operación cuya cuantía o características no guardan relación con la actividad económica ordinaria.'],
              ['Operación Sospechosa', 'Operación Inusual que no ha podido ser razonablemente justificada.'],
              ['PEP', 'Personas Expuestas Políticamente.'],
              ['Riesgo Inherente', 'Nivel de riesgo propio de la actividad, sin controles.'],
              ['Riesgo Residual', 'Nivel resultante del riesgo después de aplicar los controles.'],
              ['ROS', 'Reporte de Operaciones Sospechosas ante la UIAF.'],
              ['UIAF', 'Unidad de Información y Análisis Financiero de Colombia.'],
            ] as string[][]).map(([term, def]) => paraMulti([{ text: `${term}: `, bold: true, color: C.AZUL_OSCURO }, { text: def }])),

            // V. MARCO NORMATIVO
            heading1('V. Marco Normativo'),
            heading2('1. Normas Internacionales'),
            bulletItem('Convención de Viena de 1988 (Ley 67 de 1993).', 'bullets'),
            bulletItem('Convenio para la Represión de la Financiación del Terrorismo de 1999 (Ley 808 de 2003).', 'bullets'),
            bulletItem('Convención de Palermo de 2000 (Ley 800 de 2003).', 'bullets'),
            bulletItem('Convención de Mérida de 2003 (Ley 970 de 2005).', 'bullets'),
            bulletItem(`Recomendaciones del GAFI aplicables al sector de ${sector.nombre}.`, 'bullets'),
            heading2('2. Normas Nacionales'),
            bulletItem('Constitución Política, artículos 6, 22, 123, 333 y 335.', 'bullets2'),
            bulletItem('Circular Externa No.100-000016 del 24/12/2020 - Superintendencia de Sociedades.', 'bullets2'),
            bulletItem('Circular Externa No.100-000004 del 09/04/2021 - Superintendencia de Sociedades.', 'bullets2'),
            bulletItem('Leyes 365/1997, 526/1999, 795/2003, 1121/2006, 1778/2016.', 'bullets2'),
            bulletItem('Decreto 663 de 1993, Artículos 102 al 107.', 'bullets2'),
            ...(sector.normas_especificas.length > 0 ? [
              heading2(`3. Normas Específicas - ${sector.nombre}`),
              ...sector.normas_especificas.map((n: string) => bulletItem(n, 'bullets3')),
            ] : []),

            // VI. FUNCIONES
            heading1('VI. Funciones y Responsabilidades'),
            heading2(`1. De la ${organoAprobador}`),
            para(`Órgano responsable de la puesta en marcha y efectividad de las Medidas Mínimas:`),
            letterItem('Establecer y aprobar la Política LA/FT/FPADM.', 'letters'),
            letterItem('Aprobar las Medidas Mínimas y sus actualizaciones.', 'letters'),
            letterItem('Analizar informes sobre el funcionamiento de las Medidas Mínimas.', 'letters'),
            letterItem('Ordenar y garantizar los recursos necesarios para implementar las Medidas Mínimas.', 'letters'),
            letterItem('Establecer criterios para aprobar vinculación de Contrapartes PEP.', 'letters'),
            letterItem('Verificar que el Representante Legal cuente con disponibilidad y capacidad necesaria.', 'letters'),
            heading2('2. Del Representante Legal'),
            paraMulti([{ text: `${repLegal}`, bold: true }, { text: ' tiene las siguientes funciones:' }]),
            letterItem('Presentar la propuesta del Manual y sus actualizaciones.', 'letters2'),
            letterItem('Estudiar resultados de la evaluación del Riesgo LA/FT/FPADM.', 'letters2'),
            letterItem('Asignar eficientemente los recursos técnicos y humanos.', 'letters2'),
            letterItem('Presentar al máximo órgano social reportes y alertas.', 'letters2'),
            letterItem('Asegurarse de que las actividades estén debidamente documentadas.', 'letters2'),
            letterItem('Certificar ante la Superintendencia el cumplimiento del Capítulo X.', 'letters2'),
            ...(tieneRevisorFiscal ? [
              heading2('3. Del Revisor Fiscal'),
              para(`El Revisor Fiscal de ${empresaCorto}${revisorFiscalNombre ? ', ' + revisorFiscalNombre + ',' : ''} tiene, además de las funciones contempladas en el ordenamiento jurídico colombiano, la obligación de denunciar ante las autoridades penales, disciplinarias y administrativas los actos de corrupción así como la presunta realización de delitos contra la administración pública, financiación del terrorismo y delincuencia organizada. También deberá poner estos hechos en conocimiento de los órganos sociales y de la administración de la sociedad.`),
              heading2('4. Trabajadores y Colaboradores'),
            ] : [
              heading2('3. Trabajadores y Colaboradores'),
            ]),
            para(`Los trabajadores de ${empresaCorto} deben:`),
            bulletItem('Reportar al representante legal cualquier operación inusual o señales de alerta.', 'bullets4'),
            bulletItem('Cumplir con las disposiciones del Manual de Medidas Mínimas.', 'bullets4'),
            bulletItem('Asistir a las capacitaciones sobre prevención de riesgos LA/FT/FPADM.', 'bullets4'),

            // VII. POLÍTICA
            heading1('VII. Política LA/FT/FPADM'),
            para(`Para cumplir con el objeto social de ${empresa}, se implementan medidas para identificar, prevenir, mitigar y controlar los riesgos asociados con el lavado de activos, financiamiento del terrorismo y financiación de la proliferación de armas de destrucción masiva.`),
            para(sector.riesgos_particulares),
            para(`${empresaCorto} se compromete al cumplimiento de las siguientes directrices:`),
            bulletItem(`${empresaCorto} dará prioridad a los resultados del monitoreo por encima de cualquier objetivo comercial.`, 'bullets'),
            bulletItem('La empresa se compromete a no tener relación con personas incluidas en listas vinculantes para Colombia, listas OFAC u otras listas de criminales y terroristas.', 'bullets'),
            bulletItem('En caso de identificarse activos pertenecientes a personas en listas vinculantes, el Representante Legal reportará de inmediato a la UIAF.', 'bullets'),
            bulletItem(`${empresaCorto} llevará a cabo monitoreo anual de todos sus accionistas, trabajadores, clientes, proveedores y terceros.`, 'bullets'),
            bulletItem('Todos los pagos deben efectuarse mediante transferencias electrónicas o a través de entidades bancarias.', 'bullets'),
            bulletItem('Queda prohibida la realización de actividades sin el correspondiente respaldo documental.', 'bullets'),
            bulletItem('La sociedad conservará los documentos transaccionales por un período mínimo de cinco (5) años.', 'bullets'),
            heading2(`Controles Específicos - ${sector.nombre}`),
            para(`Dada la actividad económica de ${empresaCorto}, se implementan los siguientes controles:`),
            ...controlesEspecificos.map((c: string) => numberedItem(c, 'numbers2')),

            // VIII. CAPACITACIÓN
            heading1('VIII. Mecanismo de Divulgación y Capacitación'),
            para(`Se realizarán capacitaciones sobre prevención de riesgos LA/FT/FPADM al menos una vez al año. Los mecanismos incluyen:`),
            letterItem('Capacitación electrónica: documentos, guías e instructivos.', 'letters3'),
            letterItem('Capacitación virtual: medios tecnológicos con jornadas específicas.', 'letters3'),
            letterItem('Capacitaciones presenciales: en la sede que determine la empresa.', 'letters3'),

            // IX. ETAPAS
            heading1('IX. Etapas para la Administración del Riesgo'),
            heading2('1. Identificación'),
            para('Proceso de determinar los riesgos a los que está expuesta la organización, incluyendo actividades y factores que pueden aumentar la probabilidad o el impacto.'),
            heading2('2. Medición'),
            para('Proceso de estimar la magnitud del riesgo mediante la evaluación de probabilidad y consecuencia, según la matriz de riesgo establecida.'),
            heading2('3. Control'),
            para('Proceso de tomar medidas para mitigar los riesgos:'),
            bulletItem('Controles preventivos: evitar que ocurra un riesgo.', 'bullets'),
            bulletItem('Controles detectivos: detectar un riesgo que ya ha ocurrido.', 'bullets'),
            bulletItem('Controles correctivos: corregir un riesgo que ya ha ocurrido.', 'bullets'),
            heading2('4. Monitoreo'),
            para('Proceso de supervisar y evaluar la eficacia de los controles implementados.'),
            para(`La metodología estará dispuesta en el formato "MR_${siglas}_${version}" (Matriz de Riesgo).`),

            // X. DEBIDA DILIGENCIA
            heading1('X. Mecanismo de Debida Diligencia'),
            heading3('Identificación de riesgos'),
            para('El representante legal puede designar encargados para identificar riesgos LA/FT/FPADM con respaldo documental.'),
            heading3('Conocimiento de la contraparte'),
            para('La empresa debe conocer a la contraparte: origen de recursos, identidad, actividad económica.'),
            heading3('Conocimiento de PEPs'),
            para(`${empresaCorto} establece control sobre PEPs, verificando identidad y origen de recursos.`),
            heading3('Verificación de listas restrictivas'),
            para('Se consultarán listas ONU, OFAC, UE y demás listas vinculantes para Colombia.'),
            heading3('Informe de gestión'),
            para('El representante legal debe realizar un informe anual de gestión sobre el sistema.'),
            para('El procedimiento de Debida Diligencia se lleva a cabo antes de cualquier relación contractual y se actualiza anualmente.'),

            // XI. SEÑALES DE ALERTA
            heading1('XI. Señales de Alerta'),
            para(`Señales de alerta específicas para ${empresaCorto} en el sector de ${sector.nombre}:`),
            heading2('1. Señales relacionadas con clientes'),
            ...senalesCliente.map((s: string) => bulletItem(s, 'bullets')),
            heading2('2. Señales relacionadas con proveedores'),
            ...senalesProveedor.map((s: string) => bulletItem(s, 'bullets2')),
            heading2('3. Señales relacionadas con trabajadores'),
            bulletItem('Oposición a la debida identificación y documentación de vinculación.', 'bullets3'),
            bulletItem('Trabajadores incluidos en listas nacionales e internacionales.', 'bullets3'),
            bulletItem('Objeciones en antecedentes judiciales, disciplinarios y fiscales.', 'bullets3'),
            bulletItem('Ausencias frecuentes sin explicación justificada.', 'bullets3'),
            bulletItem('Cambios repentinos en comportamiento emocional o profesional.', 'bullets3'),
            bulletItem('Estilo de vida no concordante con ingresos conocidos.', 'bullets3'),
            bulletItem('Omisión de verificación de identidad de clientes.', 'bullets3'),
            bulletItem('Alteración o destrucción de documentos sin motivo justificado.', 'bullets3'),

            // XII. RÉGIMEN SANCIONATORIO
            heading1('XII. Régimen Sancionatorio'),
            para(`El incumplimiento del régimen de Medidas Mínimas de ${empresaCorto} conlleva sanciones, sin perjuicio de las acciones ante las autoridades correspondientes.`),
            paraMulti([{ text: 'Trabajadores y colaboradores: ', bold: true }, { text: 'sanciones desde llamado de atención hasta terminación del contrato por justa causa, siguiendo el debido proceso (art. 29 Constitución Política).' }]),
            paraMulti([{ text: 'Proveedores, contratistas y contrapartes: ', bold: true }, { text: 'terminación unilateral con justa causa de cualquier relación contractual o comercial.' }]),
            para('Se podrán tomar acciones legales y realizar reportes ante las autoridades jurisdiccionales pertinentes.'),

            // FIRMA
            divider(), emptyPara(200),
            para(`Se elabora el presente Manual, a los ${fechaManual} para aprobación de la ${organoAprobador}.`, { align: AlignmentType.CENTER }),
            emptyPara(400),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '___________________________', size: 22, font: 'Arial', color: C.GRIS_OSCURO })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: repLegal, bold: true, size: 22, font: 'Arial', color: C.AZUL_OSCURO })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: `C.C. No. ${cedulaRep}`, size: 20, font: 'Arial', color: C.GRIS_OSCURO })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'Representante Legal', size: 20, font: 'Arial', color: C.GRIS_OSCURO })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: empresa, bold: true, size: 20, font: 'Arial', color: C.AZUL_OSCURO })] }),
          ]
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);
    const base64 = Buffer.from(buffer).toString('base64');
    const filename = `Manual_Medidas_Minimas_${empresaCorto.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;

    return NextResponse.json({
      success: true,
      filename,
      base64,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

  } catch (error: any) {
    console.error('Error generating manual:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
