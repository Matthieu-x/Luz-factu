// Preparación futura: Supabase NO se conecta en esta versión.
// Cuando el propietario proporcione URL y clave de servidor, crear la integración
// únicamente desde funciones serverless. Nunca exponer SERVICE_ROLE_KEY al navegador.
export const supabaseConfigured = false;
export function getSupabaseStatus() {
  return { configured: false, message: 'Supabase pendiente de configuración del propietario.' };
}