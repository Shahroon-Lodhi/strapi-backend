export default {
  async handle(ctx) {
    const source = ctx.request.headers['x-shopify-topic'] ? 'shopify' : 'woocommerce';
    const payload = ctx.request.body;

    console.log("Webhook Source:", source);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // TEMP WooCommerce webhook test
    if (source === 'woocommerce' && !payload.line_items) {
      ctx.body = { message: 'Ping received from WooCommerce webhook creation' };
      return;
    }

    let sku: string | null = null;
    let quantity: number | null = null;
    const lineItem = payload?.line_items?.[0];

    if (lineItem?.sku && typeof lineItem.quantity === 'number') {
      sku = lineItem.sku;
      quantity = lineItem.quantity;
    } else {
      ctx.status = 400;
      ctx.body = { message: 'Invalid webhook payload' };
      return;
    }

    // Extract order details
    const order_id = source === 'shopify' ? payload.id?.toString() : payload.id.toString();
    const customer_name =
      payload?.customer?.first_name || payload?.billing?.first_name || 'Unknown';
    const email =
      payload?.email || payload?.billing?.email || 'unknown@example.com';
    const status = payload?.financial_status || payload?.status || 'unknown';
    const total_amount = parseFloat(payload?.total_price || payload?.total || '0');
    const order_date = new Date(payload?.created_at || payload?.date_created || Date.now());
    const line_items = payload?.line_items || [];

    try {
      // Save order in Strapi
      await strapi.entityService.create('api::order.order', {
        data: {
          order_id,
          source,
          customer_name,
          email,
          order_status: status,
          total_amount,
          placed_at: order_date,
          line_items,
        },
      });

      // Sync stock (existing logic)
      await strapi.service('api::product.product').syncStockToStores(sku, quantity);

      ctx.body = { message: 'Order saved and stock synced' };
    } catch (error) {
      console.error('❌ Order save/sync error:', error);
      ctx.status = 500;
      ctx.body = { message: 'Order save or stock sync failed' };
    }
  },
};
