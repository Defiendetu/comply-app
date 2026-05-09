import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { contratoBase64 } = await request.json();
    if (!contratoBase64) {
      return NextResponse.json({ success: false, error: 'No se recibió el contrato' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key no configurada' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: contratoBase64,
                },
              },
              {
                type: 'text',
                text: `Analiza este contrato laboral o documento de vinculación y extrae los datos del TRABAJADOR (no del empleador/empresa). Busca:
- nombre: Nombre completo del trabajador/empleado
- cedula: Número de cédula o documento de identidad del trabajador
- cargo: Cargo o posición para la que es contratado
- area: Área o departamento (si aparece, si no deja vacío)
- fecha_ingreso: Fecha de inicio del contrato o vinculación (formato YYYY-MM-DD si la encuentras)

Responde ÚNICAMENTE con JSON válido, sin explicaciones, sin markdown:
{"nombre": "", "cedula": "", "cargo": "", "area": "", "fecha_ingreso": ""}

Si algún dato no aparece en el documento, deja el campo como string vacío.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ success: false, error: `Claude API error: ${response.status} - ${errorText.substring(0, 200)}` }, { status: 500 });
    }

    const claudeResponse = await response.json();
    const text = claudeResponse.content?.[0]?.text || '';

    try {
      const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const datos = JSON.parse(clean);
      return NextResponse.json({ success: true, trabajador: datos });
    } catch {
      return NextResponse.json({ success: false, error: 'No se pudo parsear la respuesta: ' + text.substring(0, 200) }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error extracting worker data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
