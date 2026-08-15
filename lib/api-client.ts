import { supabase } from './supabase';

/**
 * Llama a las rutas de `app/api/*` adjuntando el token de sesión de Supabase.
 *
 * Por qué existe: esos endpoints consumen créditos facturados (Anthropic,
 * Apify, 2captcha). Sin esta cabecera el middleware los rechaza con 401, así
 * que nadie de fuera puede dispararlos y quemar el saldo.
 *
 * Uso: idéntico a `fetch`, solo cambia el nombre.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
