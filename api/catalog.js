/**
 * API Route: /api/catalog
 * 
 * Consulta o catálogo do Cardápio Web (módulo Catálogo).
 * Útil para sincronizar produtos entre o Cardápio Web e o site.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  const API_TOKEN = process.env.CARDAPIO_WEB_TOKEN;
  const STORE_ID = process.env.CARDAPIO_WEB_STORE_ID;
  const API_URL = process.env.CARDAPIO_WEB_API_URL || 'https://api.cardapioweb.com';

  if (!API_TOKEN || !STORE_ID) {
    return res.status(500).json({ error: 'Credenciais não configuradas' });
  }

  try {
    const response = await fetch(`${API_URL}/v1/stores/${STORE_ID}/catalog`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erro ao consultar catálogo' });
    }

    const catalog = await response.json();
    return res.status(200).json({ success: true, catalog });

  } catch (error) {
    console.error('❌ Erro ao buscar catálogo:', error);
    return res.status(500).json({ error: error.message });
  }
}
