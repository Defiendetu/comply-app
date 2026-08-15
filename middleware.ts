import { NextResponse, type NextRequest } from 'next/server';

/**
 * Exige sesión válida de Supabase en todas las rutas de `app/api/*`.
 *
 * Antes este middleware era un no-op (`matcher: []`) y los 13 endpoints
 * quedaban abiertos a internet. Como varios llaman a Anthropic, Apify y
 * 2captcha —todos facturados— cualquiera podía quemar el saldo de la cuenta
 * sin tener siquiera un usuario.
 *
 * El cliente adjunta el token con `apiFetch()` (lib/api-client.ts). Aquí se
 * valida contra Supabase antes de dejar pasar la petición.
 */

const SUPABASE_URL = 'https://uabstzfqplwcjxtrpixt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CW6BWISbeAGybX7tixHq2Q_rLSAvTRO';

function noAutorizado(motivo: string) {
  return NextResponse.json({ error: 'No autorizado', motivo }, { status: 401 });
}

export async function middleware(request: NextRequest) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return noAutorizado('Falta el token de sesión.');

  try {
    // Verificación contra Supabase: si el token es válido devuelve el usuario.
    // Es una llamada de red, pero estos endpoints ya tardan segundos y cuestan
    // dinero, así que el costo relativo es despreciable frente al abuso que evita.
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return noAutorizado('Sesión inválida o expirada.');
    return NextResponse.next();
  } catch {
    // Falla cerrado: si no podemos verificar, no dejamos pasar.
    return noAutorizado('No se pudo verificar la sesión.');
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
