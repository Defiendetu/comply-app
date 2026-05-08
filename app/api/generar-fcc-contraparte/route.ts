import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const d = await request.json();

    // Empresa data (from saved empresa)
    const empresa = d.empresa || {};

    // Contraparte data - can come from manual input or extracted from certificate
    const contraparte = d.contraparte || {};

    // If contraparte has a certificate, extract data using Claude
    if (d.certificadoContraparteBase64) {
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: [{
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: d.certificadoContraparteBase64 }
            }, {
              type: 'text',
              text: 'Extrae los siguientes datos de este Certificado de Cámara de Comercio. Responde SOLO con JSON válido sin explicaciones: {razon_social, razon_social_corto, nit, tipo_sociedad, representante_legal, cedula_rep_legal, ciudad, direccion, objeto_social, fecha_constitucion, codigo_ciiu, tiene_revisor_fiscal (si/no), tiene_junta_directiva (si/no), socios: [{nombre, identificacion, porcentaje}]}'
            }]
          }]
        })
      });

      if (claudeResponse.ok) {
        const claudeData = await claudeResponse.json();
        const text = claudeData.content?.[0]?.text || '';
        try {
          const extracted = JSON.parse(text.replace(/```json|```/g, '').trim());
          // Merge extracted data with any manual overrides
          Object.assign(contraparte, {
            razon_social: extracted.razon_social || contraparte.razon_social,
            nit: extracted.nit || contraparte.nit,
            tipo_sociedad: extracted.tipo_sociedad || contraparte.tipo_sociedad,
            representante_legal: extracted.representante_legal || contraparte.representante_legal,
            cedula_rep_legal: extracted.cedula_rep_legal || contraparte.cedula_rep_legal,
            ciudad: extracted.ciudad || contraparte.ciudad,
            direccion: extracted.direccion || contraparte.direccion,
            objeto_social: extracted.objeto_social || contraparte.objeto_social,
            fecha_constitucion: extracted.fecha_constitucion || contraparte.fecha_constitucion,
            codigo_ciiu: extracted.codigo_ciiu || contraparte.codigo_ciiu,
            tiene_revisor_fiscal: extracted.tiene_revisor_fiscal || 'no',
            tiene_junta_directiva: extracted.tiene_junta_directiva || 'no',
            socios: extracted.socios || [],
            datos_extraidos: true,
          });
        } catch (parseErr) {
          console.error('Error parsing Claude response:', parseErr);
        }
      }
    }

    // Now generate the FCC with the combined data
    // Call the existing FCC generator endpoint with merged data
    const fccData = {
      // Empresa data
      RAZON_SOCIAL: empresa.razon_social || empresa.RAZON_SOCIAL || '',
      NIT: empresa.nit || empresa.NIT || '',
      REPRESENTANTE_LEGAL: empresa.representante_legal || empresa.REPRESENTANTE_LEGAL || '',
      CIUDAD: empresa.ciudad || empresa.CIUDAD || '',
      DIRECCION: empresa.direccion || empresa.DIRECCION || '',
      // Contraparte data to pre-fill
      CONTRAPARTE: contraparte,
    };

    // Generate FCC calling the existing endpoint internally
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://comply-app-pink.vercel.app';

    const fccResponse = await fetch(`${baseUrl}/api/generar-fcc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fccData),
    });

    const fccResult = await fccResponse.json();

    return NextResponse.json({
      success: true,
      fcc: fccResult,
      contraparte: contraparte,
      datosExtraidos: contraparte.datos_extraidos || false,
    });

  } catch (error: any) {
    console.error('Error generating FCC contraparte:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
