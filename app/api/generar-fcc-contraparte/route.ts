import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const d = await request.json();
    const empresa = d.empresa || {};
    const contraparte = d.contraparte || {};
    const errors: string[] = [];

    // If contraparte has a certificate, extract data using Claude
    if (d.certificadoContraparteBase64) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        errors.push('ANTHROPIC_API_KEY no configurada en el servidor');
      } else {
        try {
          const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
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
                  text: `Extrae los siguientes datos de este Certificado de Existencia y Representacion Legal (Camara de Comercio colombiana). Responde UNICAMENTE con un JSON valido, sin explicaciones, sin markdown, sin backticks. El JSON debe tener esta estructura exacta: {"razon_social": "nombre completo", "nit": "numero-digito", "tipo_sociedad": "SAS/LTDA/SA", "representante_legal": "nombre completo", "cedula_rep_legal": "numero", "ciudad": "ciudad", "direccion": "direccion completa", "objeto_social": "descripcion breve del objeto social", "fecha_constitucion": "fecha", "codigo_ciiu": "codigo principal", "socios": [{"nombre": "nombre", "identificacion": "numero", "porcentaje": "porcentaje"}]}`
                }]
              }]
            })
          });

          if (!claudeResponse.ok) {
            const errText = await claudeResponse.text();
            errors.push(`Claude API error ${claudeResponse.status}: ${errText.substring(0, 200)}`);
          } else {
            const claudeData = await claudeResponse.json();
            const text = claudeData.content?.[0]?.text || '';
            
            try {
              // Clean the response - remove markdown, backticks, etc
              const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              const extracted = JSON.parse(cleanText);
              
              // Merge extracted data
              Object.assign(contraparte, {
                razon_social: extracted.razon_social || contraparte.razon_social || '',
                nit: extracted.nit || '',
                nit_cc: extracted.nit || '',
                tipo_sociedad: extracted.tipo_sociedad || '',
                representante_legal: extracted.representante_legal || '',
                cedula_rep_legal: extracted.cedula_rep_legal || '',
                ciudad: extracted.ciudad || '',
                direccion: extracted.direccion || '',
                objeto_social: extracted.objeto_social || '',
                fecha_constitucion: extracted.fecha_constitucion || '',
                codigo_ciiu: extracted.codigo_ciiu || '',
                socios: extracted.socios || [],
                datos_extraidos: true,
              });
            } catch (parseErr) {
              errors.push(`Error parseando respuesta de Claude: ${(parseErr as Error).message}. Texto: ${text.substring(0, 200)}`);
            }
          }
        } catch (fetchErr) {
          errors.push(`Error llamando a Claude: ${(fetchErr as Error).message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      contraparte: contraparte,
      datosExtraidos: contraparte.datos_extraidos || false,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Error in FCC contraparte:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
