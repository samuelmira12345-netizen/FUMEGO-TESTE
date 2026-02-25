/**
 * API Route: /api/send-order
 * 
 * Recebe o pedido do frontend Fumêgo e envia para o Cardápio Web.
 * A comunicação com o Cardápio Web usa a API aberta (módulo Pedidos).
 * 
 * Documentação: https://cardapioweb.stoplight.io/docs/api
 */

export default async function handler(req, res) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Variáveis de ambiente
  const API_TOKEN = process.env.CARDAPIO_WEB_TOKEN;
  const STORE_ID = process.env.CARDAPIO_WEB_STORE_ID;
  const API_URL = process.env.CARDAPIO_WEB_API_URL || 'https://api.cardapioweb.com';

  if (!API_TOKEN || !STORE_ID) {
    console.error('❌ Variáveis de ambiente não configuradas');
    return res.status(500).json({
      error: 'Servidor não configurado',
      message: 'As credenciais da API do Cardápio Web não foram configuradas.'
    });
  }

  try {
    const orderData = req.body;

    // Validações básicas
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Pedido vazio. Adicione pelo menos um item.' });
    }

    if (!orderData.customer || !orderData.customer.name || !orderData.customer.phone) {
      return res.status(400).json({ error: 'Dados do cliente incompletos.' });
    }

    if (!orderData.address || !orderData.address.street || !orderData.address.number) {
      return res.status(400).json({ error: 'Endereço de entrega incompleto.' });
    }

    // ─── Monta o pedido no formato do Cardápio Web ───
    const cardapioWebOrder = {
      // Dados do cliente
      customer: {
        name: orderData.customer.name,
        phone: orderData.customer.phone,
        document: orderData.customer.cpf || '',
      },

      // Endereço de entrega
      deliveryAddress: {
        street: orderData.address.street,
        number: orderData.address.number,
        complement: orderData.address.complement || '',
        neighborhood: orderData.address.neighborhood,
        city: orderData.address.city,
        zipCode: orderData.address.zipCode || '',
        reference: orderData.address.reference || '',
      },

      // Itens do pedido
      items: orderData.items.map(item => ({
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price,
        observation: item.observations || '',
        // Sub-itens (bebidas/complementos)
        subItems: (item.drinks || []).map(drink => ({
          name: drink.name,
          quantity: drink.qty,
          price: drink.price,
        })),
      })),

      // Forma de pagamento
      payment: {
        method: mapPaymentMethod(orderData.paymentMethod),
        change: orderData.change || 0,
      },

      // Taxas
      deliveryFee: orderData.deliveryFee || 10.0,

      // Desconto (cupom)
      discount: orderData.discount || 0,

      // Observações gerais
      observations: orderData.observations || '',

      // Origem do pedido
      origin: 'site_fumego',

      // Timestamp
      createdAt: new Date().toISOString(),
    };

    console.log('📦 Enviando pedido para Cardápio Web:', JSON.stringify(cardapioWebOrder, null, 2));

    // ─── Envia para a API do Cardápio Web ───
    const response = await fetch(`${API_URL}/v1/stores/${STORE_ID}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(cardapioWebOrder),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('❌ Erro da API Cardápio Web:', response.status, responseData);

      // Se a API retornar erro, ainda salva o pedido como fallback
      return res.status(response.status).json({
        error: 'Erro ao enviar pedido para o sistema',
        details: responseData,
        fallback: true,
        order: cardapioWebOrder,
      });
    }

    console.log('✅ Pedido criado com sucesso:', responseData);

    return res.status(201).json({
      success: true,
      message: 'Pedido enviado com sucesso!',
      orderId: responseData.id || responseData.orderId || `FMG-${Date.now()}`,
      data: responseData,
    });

  } catch (error) {
    console.error('❌ Erro interno:', error);

    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
    });
  }
}

/**
 * Mapeia os métodos de pagamento do app para o formato do Cardápio Web
 */
function mapPaymentMethod(method) {
  const map = {
    'pix': 'PIX',
    'credito': 'CREDIT_CARD',
    'debito': 'DEBIT_CARD',
    'dinheiro': 'CASH',
  };
  return map[method] || 'CASH';
}
