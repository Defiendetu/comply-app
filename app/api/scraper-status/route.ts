import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { runId, tipo } = await request.json();
    const apifyToken = process.env.APIFY_TOKEN || '';

    if (!runId || !apifyToken) {
      return NextResponse.json({ status: 'error', message: 'Faltan parámetros' }, { status: 400 });
    }

    const statusResp = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!statusResp.ok) {
      return NextResponse.json({ status: 'error', message: 'Error consultando estado del run' });
    }

    const statusData = await statusResp.json();
    const runStatus = statusData.data?.status;

    const metaPorTipo: Record<string, { lista: string; fuente: string; url: string }> = {
      procuraduria: {
        lista: 'Antecedentes disciplinarios - Procuraduría',
        fuente: 'Procuraduría General de la Nación',
        url: 'https://www.procuraduria.gov.co/Pages/Consulta-de-Antecedentes.aspx',
      },
      contraloria: {
        lista: 'Responsables fiscales - Contraloría',
        fuente: 'Contraloría General de la República',
        url: 'https://cfiscal.contraloria.gov.co/certificados/certificadopersonanatural.aspx',
      },
    };

    const meta = metaPorTipo[tipo] || metaPorTipo.procuraduria;

    if (runStatus === 'SUCCEEDED') {
      const datasetId = statusData.data?.defaultDatasetId;
      const itemsResp = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const items = await itemsResp.json();

      const resultado: any = {
        lista: meta.lista,
        fuente: meta.fuente,
        tipo: 'nacional',
        resultado: 'sin_coincidencia',
        coincidencias: [],
        url: meta.url,
      };

      if (items.length > 0) {
        for (const item of items) {
          if (tipo === 'procuraduria') {
            if (item.tiene_antecedentes || item.registros?.length > 0) {
              resultado.resultado = 'coincidencia_positiva';
              const registros = item.registros || [];
              for (const reg of registros.slice(0, 3)) {
                resultado.coincidencias.push(
                  `Sanción: ${reg.tipo_sancion || 'N/A'} | Estado: ${reg.estado || 'N/A'} | Entidad: ${reg.entidad || 'N/A'}`
                );
              }
            } else {
              resultado.detalles = item.texto_resultado || 'Sin antecedentes disciplinarios registrados';
            }
          } else {
            if (item.es_responsable_fiscal) {
              resultado.resultado = 'coincidencia_positiva';
              resultado.detalles = item.texto_resultado || 'Aparece como responsable fiscal';
              const registros = item.registros || [];
              for (const reg of registros.slice(0, 3)) {
                resultado.coincidencias.push(
                  `Proceso: ${reg.proceso || 'N/A'} | Monto: ${reg.monto || 'N/A'} | Estado: ${reg.estado || 'N/A'}`
                );
              }
            } else {
              const txt = item.texto_resultado || '';
              resultado.detalles = txt.includes('Resultado no determinado') || txt.includes('CDATA')
                ? 'Certificado consultado — sin coincidencias'
                : (txt || 'No aparece como responsable fiscal');
            }
          }
        }
      } else {
        resultado.detalles = 'Consulta completada sin resultados';
      }

      return NextResponse.json({ status: 'completed', resultado });
    }

    if (runStatus === 'FAILED' || runStatus === 'ABORTED') {
      return NextResponse.json({
        status: 'completed',
        resultado: {
          lista: meta.lista,
          fuente: meta.fuente,
          tipo: 'nacional',
          resultado: 'no_consultado',
          coincidencias: [],
          url: meta.url,
          detalles: `Scraper terminó con estado: ${runStatus}`,
        },
      });
    }

    return NextResponse.json({ status: 'running' });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
