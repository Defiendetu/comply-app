import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { runId } = await request.json();
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

    if (runStatus === 'SUCCEEDED') {
      const datasetId = statusData.data?.defaultDatasetId;
      const itemsResp = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const items = await itemsResp.json();

      const resultado: any = {
        lista: 'Responsables fiscales - Contraloría',
        fuente: 'Contraloría General de la República',
        tipo: 'nacional',
        resultado: 'sin_coincidencia',
        coincidencias: [],
        url: 'https://cfiscal.contraloria.gov.co/certificados/certificadopersonanatural.aspx',
      };

      if (items.length > 0) {
        for (const item of items) {
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
      } else {
        resultado.detalles = 'Consulta completada sin resultados';
      }

      return NextResponse.json({ status: 'completed', resultado });
    }

    if (runStatus === 'FAILED' || runStatus === 'ABORTED') {
      return NextResponse.json({
        status: 'completed',
        resultado: {
          lista: 'Responsables fiscales - Contraloría',
          fuente: 'Contraloría General de la República',
          tipo: 'nacional',
          resultado: 'no_consultado',
          coincidencias: [],
          url: 'https://cfiscal.contraloria.gov.co/certificados/certificadopersonanatural.aspx',
          detalles: `Scraper terminó con estado: ${runStatus}`,
        },
      });
    }

    return NextResponse.json({ status: 'running' });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
