"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    async handle(ctx) {
        var _a, _b, _c, _d, _e;
        const source = ctx.request.headers['x-shopify-topic'] ? 'shopify' : 'woocommerce';
        const payload = ctx.request.body;
        console.log("Webhook Source:", source);
        console.log("Payload:", JSON.stringify(payload, null, 2));
        // TEMP WooCommerce webhook test
        if (source === 'woocommerce' && !payload.line_items) {
            ctx.body = { message: 'Ping received from WooCommerce webhook creation' };
            return;
        }
        let sku = null;
        let quantity = null;
        const lineItem = (_a = payload === null || payload === void 0 ? void 0 : payload.line_items) === null || _a === void 0 ? void 0 : _a[0];
        if ((lineItem === null || lineItem === void 0 ? void 0 : lineItem.sku) && typeof lineItem.quantity === 'number') {
            sku = lineItem.sku;
            quantity = lineItem.quantity;
        }
        else {
            ctx.status = 400;
            ctx.body = { message: 'Invalid webhook payload' };
            return;
        }
        // Extract order details
        const order_id = source === 'shopify' ? (_b = payload.id) === null || _b === void 0 ? void 0 : _b.toString() : payload.id.toString();
        const customer_name = ((_c = payload === null || payload === void 0 ? void 0 : payload.customer) === null || _c === void 0 ? void 0 : _c.first_name) || ((_d = payload === null || payload === void 0 ? void 0 : payload.billing) === null || _d === void 0 ? void 0 : _d.first_name) || 'Unknown';
        const email = (payload === null || payload === void 0 ? void 0 : payload.email) || ((_e = payload === null || payload === void 0 ? void 0 : payload.billing) === null || _e === void 0 ? void 0 : _e.email) || 'unknown@example.com';
        const status = (payload === null || payload === void 0 ? void 0 : payload.financial_status) || (payload === null || payload === void 0 ? void 0 : payload.status) || 'unknown';
        const total_amount = parseFloat((payload === null || payload === void 0 ? void 0 : payload.total_price) || (payload === null || payload === void 0 ? void 0 : payload.total) || '0');
        const order_date = new Date((payload === null || payload === void 0 ? void 0 : payload.created_at) || (payload === null || payload === void 0 ? void 0 : payload.date_created) || Date.now());
        const line_items = (payload === null || payload === void 0 ? void 0 : payload.line_items) || [];
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
        }
        catch (error) {
            console.error('❌ Order save/sync error:', error);
            ctx.status = 500;
            ctx.body = { message: 'Order save or stock sync failed' };
        }
    },
};
