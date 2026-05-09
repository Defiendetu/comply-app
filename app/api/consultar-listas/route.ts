import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

interface ResultadoLista {
  lista: string;
  fuente: string;
  tipo: 'internacional' | 'nacional';
  resultado: 'sin_coincidencia' | 'coincidencia_parcial' | 'coincidencia_positiva' | 'no_consultado';
  coincidencias: string[];
  detalles?: string;
  url?: string;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function similitud(a: string, b: string): number {
  const na = normalizar(a);
  const nb = normalizar(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;

  const wordsA = na.split(/\s+/).filter(w => w.length > 2);
  const wordsB = nb.split(/\s+/).filter(w => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  let matches = 0;
  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wa === wb || wa.includes(wb) || wb.includes(wa)) {
        matches++;
        break;
      }
    }
  }
  return matches / Math.max(wordsA.length, wordsB.length);
}

// ==========================================
// OFAC SDN - US Treasury sanctions list
// ==========================================
async function consultarOFAC(nombre: string, identificacion?: string): Promise<ResultadoLista> {
  const resultado: ResultadoLista = {
    lista: 'Lista OFAC (SDN)',
    fuente: 'Departamento del Tesoro de EE.UU.',
    tipo: 'internacional',
    resultado: 'sin_coincidencia',
    coincidencias: [],
    url: 'https://sanctionssearch.ofac.treas.gov/',
  };

  try {
    const resp = await fetch('https://www.treasury.gov/ofac/downloads/sdn.csv', {
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      resultado.resultado = 'no_consultado';
      resultado.detalles = 'No se pudo acceder a la lista OFAC';
      return resultado;
    }

    const csv = await resp.text();
    const lines = csv.split('\n');
    const nombreNorm = normalizar(nombre);

    for (const line of lines) {
      const cols = line.split('","').map(c => c.replace(/^"|"$/g, ''));
      if (cols.length < 2) continue;

      const sdnName = cols[1] || '';
      const sdnType = cols[2] || '';
      const sdnProgram = cols[3] || '';
      const sdnRemarks = cols[11] || '';

      const sim = similitud(nombre, sdnName);

      if (sim >= 0.8) {
        resultado.resultado = sim >= 0.95 ? 'coincidencia_positiva' : 'coincidencia_parcial';
        resultado.coincidencias.push(
          `${sdnName} | Tipo: ${sdnType} | Programa: ${sdnProgram}${sdnRemarks ? ' | ' + sdnRemarks.substring(0, 200) : ''}`
        );
      }

      if (identificacion && sdnRemarks) {
        const idNorm = normalizar(identificacion);
        if (normalizar(sdnRemarks).includes(idNorm)) {
          resultado.resultado = 'coincidencia_positiva';
          if (!resultado.coincidencias.some(c => c.includes(sdnName))) {
            resultado.coincidencias.push(
              `${sdnName} (ID match: ${identificacion}) | Tipo: ${sdnType} | Programa: ${sdnProgram}`
            );
          }
        }
      }

      if (resultado.coincidencias.length >= 5) break;
    }
  } catch (err: any) {
    resultado.resultado = 'no_consultado';
    resultado.detalles = `Error consultando OFAC: ${err.message}`;
  }

  return resultado;
}

// ==========================================
// OpenSanctions - ONU, UE, and 85+ sources
// ==========================================
async function consultarOpenSanctions(nombre: string): Promise<ResultadoLista> {
  const resultado: ResultadoLista = {
    lista: 'Listas consolidadas (ONU, UE, Interpol y otras)',
    fuente: 'OpenSanctions.org',
    tipo: 'internacional',
    resultado: 'sin_coincidencia',
    coincidencias: [],
    url: 'https://www.opensanctions.org/',
  };

  try {
    const query = encodeURIComponent(nombre);
    const resp = await fetch(
      `https://api.opensanctions.org/search/default?q=${query}&limit=5`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!resp.ok) {
      resultado.resultado = 'no_consultado';
      resultado.detalles = 'No se pudo acceder a OpenSanctions API';
      return resultado;
    }

    const data = await resp.json();
    const results = data.results || [];

    for (const r of results) {
      const score = r.score || 0;
      const entityName = r.caption || r.name || '';
      const datasets = (r.datasets || []).join(', ');
      const countries = (r.properties?.country || []).join(', ');

      if (score > 0.7) {
        resultado.resultado = score > 0.9 ? 'coincidencia_positiva' : 'coincidencia_parcial';
        resultado.coincidencias.push(
          `${entityName} (score: ${(score * 100).toFixed(0)}%) | Fuentes: ${datasets} | País: ${countries || 'N/A'}`
        );
      }
    }
  } catch (err: any) {
    resultado.resultado = 'no_consultado';
    resultado.detalles = `Error consultando OpenSanctions: ${err.message}`;
  }

  return resultado;
}

// ==========================================
// PEPs Colombia - datos.gov.co
// ==========================================
async function consultarPEPs(nombre: string, identificacion?: string): Promise<ResultadoLista> {
  const resultado: ResultadoLista = {
    lista: 'Personas Expuestas Políticamente (PEPs)',
    fuente: 'Función Pública - datos.gov.co',
    tipo: 'nacional',
    resultado: 'sin_coincidencia',
    coincidencias: [],
    url: 'https://www.datos.gov.co/Funci-n-p-blica/Personas-Expuestas-Pol-ticamente-PEP-/3qxn-uc22',
  };

  try {
    let url: string;
    if (identificacion) {
      url = `https://www.datos.gov.co/resource/3qxn-uc22.json?$where=numero_de_identificacion='${identificacion}'&$limit=10`;
    } else {
      const query = encodeURIComponent(nombre);
      url = `https://www.datos.gov.co/resource/3qxn-uc22.json?$where=upper(nombre_completo) like upper('%25${query}%25')&$limit=10`;
    }

    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) {
      resultado.resultado = 'no_consultado';
      resultado.detalles = 'No se pudo acceder a la base de datos de PEPs';
      return resultado;
    }

    const data = await resp.json();

    for (const pep of data) {
      const pepNombre = pep.nombre_completo || pep.primer_nombre || '';
      const cargo = pep.cargo || pep.denominacion_del_cargo || '';
      const entidad = pep.entidad || pep.nombre_entidad || '';
      const fechaVinculacion = pep.fecha_de_vinculacion || pep.fecha_vinculacion || '';

      const sim = identificacion ? 1 : similitud(nombre, pepNombre);
      if (sim >= 0.7) {
        resultado.resultado = sim >= 0.95 || identificacion ? 'coincidencia_positiva' : 'coincidencia_parcial';
        resultado.coincidencias.push(
          `${pepNombre} | Cargo: ${cargo} | Entidad: ${entidad}${fechaVinculacion ? ' | Desde: ' + fechaVinculacion : ''}`
        );
      }
    }
  } catch (err: any) {
    resultado.resultado = 'no_consultado';
    resultado.detalles = `Error consultando PEPs: ${err.message}`;
  }

  return resultado;
}

// ==========================================
// Procuraduría - Apify actor
// ==========================================
async function consultarProcuraduria(identificacion: string, apifyToken?: string): Promise<ResultadoLista> {
  const resultado: ResultadoLista = {
    lista: 'Antecedentes disciplinarios - Procuraduría',
    fuente: 'Procuraduría General de la Nación',
    tipo: 'nacional',
    resultado: 'sin_coincidencia',
    coincidencias: [],
    url: 'https://www.procuraduria.gov.co/Pages/Consulta-de-Antecedentes.aspx',
  };

  if (!apifyToken || !identificacion) {
    resultado.resultado = 'no_consultado';
    resultado.detalles = 'Consulta manual requerida (sin token Apify o sin identificación)';
    return resultado;
  }

  try {
    const runResp = await fetch(
      `https://api.apify.com/v2/acts/comply~procuraduria-scraper/runs?token=${apifyToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: identificacion }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!runResp.ok) {
      resultado.detalles = 'Error iniciando scraper de Procuraduría';
      return resultado;
    }

    const runData = await runResp.json();
    const runId = runData.data?.id;
    if (!runId) {
      resultado.detalles = 'No se pudo obtener ID del run';
      return resultado;
    }

    let attempts = 0;
    while (attempts < 12) {
      await new Promise(r => setTimeout(r, 5000));
      const statusResp = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`
      );
      const statusData = await statusResp.json();
      const status = statusData.data?.status;

      if (status === 'SUCCEEDED') {
        const datasetId = statusData.data?.defaultDatasetId;
        const itemsResp = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
        );
        const items = await itemsResp.json();

        if (items.length > 0) {
          for (const item of items) {
            if (item.tiene_antecedentes || item.registros?.length > 0) {
              resultado.resultado = 'coincidencia_positiva';
              const registros = item.registros || [];
              for (const reg of registros.slice(0, 3)) {
                resultado.coincidencias.push(
                  `Sanción: ${reg.tipo_sancion || 'N/A'} | Estado: ${reg.estado || 'N/A'} | Entidad: ${reg.entidad || 'N/A'}`
                );
              }
            } else {
              resultado.detalles = 'Sin antecedentes disciplinarios registrados';
            }
          }
        } else {
          resultado.detalles = 'Consulta completada sin resultados';
        }
        break;
      } else if (status === 'FAILED' || status === 'ABORTED') {
        resultado.detalles = `Scraper terminó con estado: ${status}`;
        break;
      }
      attempts++;
    }

    if (attempts >= 12) {
      resultado.detalles = 'Timeout esperando respuesta del scraper';
    }
  } catch (err: any) {
    resultado.detalles = `Error: ${err.message}`;
  }

  return resultado;
}

// ==========================================
// Contraloría - Apify actor
// ==========================================
async function consultarContraloria(identificacion: string, apifyToken?: string): Promise<ResultadoLista> {
  const resultado: ResultadoLista = {
    lista: 'Responsables fiscales - Contraloría',
    fuente: 'Contraloría General de la República',
    tipo: 'nacional',
    resultado: 'sin_coincidencia',
    coincidencias: [],
    url: 'https://www.contraloria.gov.co/web/guest/persona-natural',
  };

  if (!apifyToken || !identificacion) {
    resultado.resultado = 'no_consultado';
    resultado.detalles = 'Consulta manual requerida (sin token Apify o sin identificación)';
    return resultado;
  }

  try {
    const runResp = await fetch(
      `https://api.apify.com/v2/acts/comply~contraloria-scraper/runs?token=${apifyToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: identificacion }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!runResp.ok) {
      resultado.detalles = 'Error iniciando scraper de Contraloría';
      return resultado;
    }

    const runData = await runResp.json();
    const runId = runData.data?.id;
    if (!runId) {
      resultado.detalles = 'No se pudo obtener ID del run';
      return resultado;
    }

    let attempts = 0;
    while (attempts < 12) {
      await new Promise(r => setTimeout(r, 5000));
      const statusResp = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`
      );
      const statusData = await statusResp.json();
      const status = statusData.data?.status;

      if (status === 'SUCCEEDED') {
        const datasetId = statusData.data?.defaultDatasetId;
        const itemsResp = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
        );
        const items = await itemsResp.json();

        if (items.length > 0) {
          for (const item of items) {
            if (item.es_responsable_fiscal || item.registros?.length > 0) {
              resultado.resultado = 'coincidencia_positiva';
              const registros = item.registros || [];
              for (const reg of registros.slice(0, 3)) {
                resultado.coincidencias.push(
                  `Proceso: ${reg.proceso || 'N/A'} | Monto: ${reg.monto || 'N/A'} | Estado: ${reg.estado || 'N/A'}`
                );
              }
            } else {
              resultado.detalles = 'No aparece como responsable fiscal';
            }
          }
        } else {
          resultado.detalles = 'Consulta completada sin resultados';
        }
        break;
      } else if (status === 'FAILED' || status === 'ABORTED') {
        resultado.detalles = `Scraper terminó con estado: ${status}`;
        break;
      }
      attempts++;
    }

    if (attempts >= 12) {
      resultado.detalles = 'Timeout esperando respuesta del scraper';
    }
  } catch (err: any) {
    resultado.detalles = `Error: ${err.message}`;
  }

  return resultado;
}

// ==========================================
// MAIN ENDPOINT
// ==========================================
export async function POST(request: NextRequest) {
  try {
    const { nombre, identificacion, apify_token } = await request.json();

    if (!nombre || nombre.length < 2) {
      return NextResponse.json({ success: false, error: 'Nombre requerido' }, { status: 400 });
    }

    const resultados: ResultadoLista[] = await Promise.all([
      consultarOFAC(nombre, identificacion),
      consultarOpenSanctions(nombre),
      consultarPEPs(nombre, identificacion),
      consultarProcuraduria(identificacion, apify_token),
      consultarContraloria(identificacion, apify_token),
    ]);

    const totalCoincidencias = resultados.reduce((sum, r) => sum + r.coincidencias.length, 0);
    const hayPositiva = resultados.some(r => r.resultado === 'coincidencia_positiva');
    const hayParcial = resultados.some(r => r.resultado === 'coincidencia_parcial');
    const noConsultadas = resultados.filter(r => r.resultado === 'no_consultado').length;
    const consultadas = resultados.filter(r => r.resultado !== 'no_consultado').length;

    let conclusion: 'sin_coincidencia' | 'coincidencia_parcial' | 'coincidencia_positiva' | 'no_consultado' = 'sin_coincidencia';
    if (hayPositiva) conclusion = 'coincidencia_positiva';
    else if (hayParcial) conclusion = 'coincidencia_parcial';
    else if (consultadas === 0) conclusion = 'no_consultado';

    let recomendacion = '';
    if (conclusion === 'coincidencia_positiva') {
      recomendacion = 'Se encontraron coincidencias positivas. Se recomienda escalar inmediatamente al Oficial de Cumplimiento y considerar un Reporte de Operación Sospechosa (ROS) a la UIAF.';
    } else if (conclusion === 'coincidencia_parcial') {
      recomendacion = 'Se encontraron coincidencias parciales (posible homonimia). Se recomienda realizar verificación adicional antes de continuar la relación comercial.';
    } else if (conclusion === 'no_consultado') {
      recomendacion = 'No se pudo consultar ninguna lista. Verifique la conexión e intente nuevamente, o realice la consulta manualmente.';
    } else {
      recomendacion = `No se encontraron coincidencias en ${consultadas} de ${resultados.length} listas consultadas.${noConsultadas > 0 ? ` ${noConsultadas} lista(s) no pudieron ser consultadas — verifique manualmente.` : ''} Se recomienda mantener el monitoreo periódico.`;
    }

    return NextResponse.json({
      success: true,
      nombre,
      identificacion,
      fecha_consulta: new Date().toISOString(),
      conclusion,
      total_coincidencias: totalCoincidencias,
      listas_consultadas: consultadas,
      listas_no_consultadas: noConsultadas,
      recomendacion,
      resultados,
    });
  } catch (error: any) {
    console.error('Error consultando listas:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
