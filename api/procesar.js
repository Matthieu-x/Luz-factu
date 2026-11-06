import { chat } from '@chirag127/keyless-ai';

const MODEL = process.env.KEYLESS_MODEL || 'kilo-auto/free';

function toAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  let s = String(value ?? '').replace(/^L\.?\s*/i, '').replace(/[^\d,.-]/g, '').trim();
  if (!s) return 0;
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
  else if (s.includes(',')) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function findAmount(lines, labels, excluded = []) {
  const labelRe = new RegExp(labels, 'i');
  const amountRe = /(?:L\.?\s*)?\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{2})|(?:L\.?\s*)?\d+(?:[,.]\d{2})/g;
  for (let i = 0; i < lines.length; i++) {
    if (!labelRe.test(lines[i]) || excluded.some(re => re.test(lines[i]))) continue;
    const values = [];
    for (let j = 0; j <= 2 && i + j < lines.length; j++) {
      if (j > 0 && /sub\s*total|subtotal|impuestos?|\biva\b|\bisv\b|\btax\b|\btotal\b/i.test(lines[i + j])) break;
      for (const m of lines[i + j].matchAll(amountRe)) {
        const n = toAmount(m[0]);
        if (n > 0 && n < 100000000) values.push(n);
      }
    }
    if (values.length) return values[values.length - 1];
  }
  return 0;
}

function extractReceipt(text) {
  const lines = String(text).split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const dateMatch = String(text).match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
  let date = '';
  if (dateMatch) date = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
  return {
    merchant: '',
    tax_id: (String(text).match(/(?:RTN|R\s*T\s*N)\s*[:#-]?\s*([0-9-]{8,})/i) || [])[1] || '',
    date,
    currency: 'HNL',
    subtotal: findAmount(lines, 'sub\\s*total|subtotal|sub-total'),
    tax: findAmount(lines, 'impuestos?|\\biva\\b|\\bisv\\b|\\btax\\b'),
    total: findAmount(lines, 'total(?:\\s+a\\s+pagar)?|monto\\s+total', [/sub\\s*total/i, /subtotal/i, /impuestos?/i, /\biva\b/i, /\bisv\b/i, /\btax\b/i])
  };
}

function mergeData(aiData, fallback) {
  const ai = aiData && typeof aiData === 'object' ? aiData : {};
  const result = { ...fallback, ...ai };
  for (const key of ['subtotal', 'tax', 'total']) {
    const value = toAmount(ai[key]);
    result[key] = value > 0 ? value : fallback[key];
  }
  for (const key of ['merchant', 'tax_id', 'date', 'currency']) {
    if (!result[key]) result[key] = fallback[key];
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const text = typeof req.body?.text === 'string' ? req.body.text.slice(0, 18000) : '';
  if (!text.trim()) return res.status(400).json({ error: 'Falta el texto del ticket' });
  const fallback = extractReceipt(text);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const prompt = `Extrae los datos del ticket. Responde únicamente JSON válido, sin markdown:\n{"merchant":"","tax_id":"","date":"YYYY-MM-DD o vacío","currency":"HNL","subtotal":0,"tax":0,"total":0}\nDistingue subtotal, IVA/ISV y total final. No confundas porcentajes con importes. Los importes deben ser números decimales. No inventes datos.\nTexto OCR:\n${text}`;
    const answer = await chat([{ role: 'user', content: prompt }], { model: MODEL, temperature: 0.1, signal: controller.signal });
    const clean = String(answer).replace(/```json|```/gi, '').trim();
    const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
    if (start < 0 || end < start) throw new Error('La IA no devolvió JSON válido');
    const aiData = JSON.parse(clean.slice(start, end + 1));
    return res.status(200).json({ data: mergeData(aiData, fallback), source: 'ai+ocr' });
  } catch (error) {
    console.error('FacturaIA provider error:', error);
    return res.status(200).json({ data: fallback, source: 'ocr-fallback', warning: 'La IA no estuvo disponible; se recuperaron los importes detectados por OCR.' });
  } finally {
    clearTimeout(timeout);
  }
}
