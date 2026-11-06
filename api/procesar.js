
import { chat } from '@chirag127/keyless-ai';

const MODEL = process.env.KEYLESS_MODEL || 'kilo-auto/free';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const text = typeof req.body?.text === 'string' ? req.body.text.slice(0, 18000) : '';
  if (!text.trim()) return res.status(400).json({ error: 'Falta el texto del ticket' });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const prompt = `Extrae datos de este ticket. Responde únicamente JSON válido, sin markdown, con esta estructura:
{"merchant":"","tax_id":"","date":"YYYY-MM-DD o vacío","currency":"HNL","subtotal":0,"tax":0,"total":0}
No inventes datos: usa cadena vacía o 0 si no aparecen. Convierte importes a números decimales. Texto:
${text}`;
    const answer = await chat([{ role: 'user', content: prompt }], { model: MODEL, temperature: 0.1, signal: controller.signal });
    const clean = String(answer).replace(/```json|```/gi, '').trim();
    const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
    if (start < 0 || end < start) throw new Error('La IA no devolvió JSON válido');
    const data = JSON.parse(clean.slice(start, end + 1));
    return res.status(200).json({ data });
  } catch (error) {
    console.error('FacturaIA provider error:', error);
    return res.status(502).json({ error: 'No se pudo organizar el texto con IA. Podés completar los datos manualmente.' });
  } finally { clearTimeout(timeout); }
}