/**
 * API Route: /api/webhook
 * 
 * Recebe notificações (webhooks) do Cardápio Web.
 * O Cardápio Web envia atualizações de status dos pedidos para esta URL.
 * 
 * Configure este webhook no Cardápio Web em:
 * Configurações > Integrações > API de Integração > Adicionar Webhook
 * URL: https://seu-dominio.vercel.app/api/webhook
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const event = req.body;

    console.log('🔔 Webhook recebido:', JSON.stringify(event, null, 2));

    // Processa diferentes tipos de eventos
    switch (event.type || event.event) {
      case 'order.confirmed':
        console.log(`✅ Pedido ${event.orderId} confirmado pelo restaurante`);
        break;

      case 'order.preparing':
        console.log(`🍕 Pedido ${event.orderId} em preparo`);
        break;

      case 'order.ready':
        console.log(`📦 Pedido ${event.orderId} pronto para entrega`);
        break;

      case 'order.delivering':
        console.log(`🛵 Pedido ${event.orderId} saiu para entrega`);
        break;

      case 'order.delivered':
        console.log(`🎉 Pedido ${event.orderId} entregue`);
        break;

      case 'order.cancelled':
        console.log(`❌ Pedido ${event.orderId} cancelado`);
        break;

      default:
        console.log(`📋 Evento desconhecido: ${event.type || 'sem tipo'}`);
    }

    // Responde 200 para confirmar recebimento
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}
