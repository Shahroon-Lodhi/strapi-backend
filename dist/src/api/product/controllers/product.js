"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const product_1 = require("../services/product");
const NGROK_BASE_URL = 'https://5935-2400-adc5-17e-4f00-e433-2328-8ac9-5454.ngrok-free.app';
exports.default = strapi_1.factories.createCoreController('api::product.product', ({ strapi }) => ({
    async create(ctx) {
        var _a, _b, _c, _d, _e;
        const response = await super.create(ctx); // Create product in Strapi
        const productData = ctx.request.body.data;
        try {
            // Extract relative image URL from response
            const imageUrl = (_e = (_d = (_c = (_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.image) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.attributes) === null || _e === void 0 ? void 0 : _e.url;
            // Replace with your public Ngrok URL
            const baseUrl = 'https://5935-2400-adc5-17e-4f00-e433-2328-8ac9-5454.ngrok-free.app';
            const fullImageUrl = imageUrl ? `${baseUrl}${imageUrl}` : null;
            const wooPayload = {
                title: productData.Product_Name,
                price: productData.Selling_Price,
                description: `SKU: ${productData.Product_SKU}, HS_Code: ${productData.HS_Code}, Category: ${productData.categoryName}`,
                stock_quantity: productData.Stock_Quantity,
                sku: productData.Product_SKU,
                imageUrl: fullImageUrl,
                categoryName: productData.categoryName,
            };
            const shopifyPayload = {
                ...wooPayload, // same fields
            };
            // Sync to WooCommerce
            await (0, product_1.createWooProduct)(wooPayload);
            // Sync to Shopify
            await (0, product_1.createShopifyProduct)(shopifyPayload);
        }
        catch (err) {
            strapi.log.error('❌ WooCommerce/Shopify sync failed:', err);
        }
        return response;
    },
    async delete(ctx) {
        const id = ctx.params.id;
        const product = await strapi.entityService.findOne('api::product.product', id);
        if (!product)
            return ctx.notFound('Product not found');
        const sku = product.Product_SKU;
        try {
            await strapi.entityService.delete('api::product.product', id);
            await (0, product_1.deleteWooProduct)(sku);
            await (0, product_1.deleteShopifyProduct)(sku);
            return ctx.send({ message: 'Product deleted from Strapi, WooCommerce, and Shopify.' });
        }
        catch (err) {
            strapi.log.error('❌ Deletion failed:', err);
            return ctx.internalServerError('Deletion failed');
        }
    },
    async syncStock(ctx) {
        const { sku, quantity } = ctx.request.body;
        if (!sku || typeof quantity !== 'number') {
            return ctx.badRequest('Missing SKU or quantity');
        }
        try {
            await strapi.service('api::product.product').syncStockToStores(sku, quantity);
            return ctx.send({ message: 'Stock synced successfully' });
        }
        catch (err) {
            strapi.log.error('❌ Stock sync failed:', err);
            return ctx.internalServerError('Stock sync failed');
        }
    },
    async update(ctx) {
        var _a, _b, _c, _d;
        const updatedData = ctx.request.body.data;
        const sku = updatedData === null || updatedData === void 0 ? void 0 : updatedData.Product_SKU;
        if (!sku)
            return ctx.badRequest('Product_SKU is required');
        const matching = await strapi.entityService.findMany('api::product.product', {
            filters: { Product_SKU: sku },
        });
        if (!matching || matching.length === 0) {
            return ctx.notFound('Product with given SKU not found');
        }
        const productId = matching[0].id;
        const response = await strapi.entityService.update('api::product.product', productId, {
            data: updatedData,
        });
        try {
            const imageUrl = (_c = (_b = (_a = updatedData === null || updatedData === void 0 ? void 0 : updatedData.image) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.attributes) === null || _c === void 0 ? void 0 : _c.url;
            const fullImageUrl = imageUrl ? `${NGROK_BASE_URL}${imageUrl}` : null;
            const categoryName = ((_d = updatedData.Category) === null || _d === void 0 ? void 0 : _d.name) || 'Uncategorized';
            await strapi.service('api::product.product').updateWooProduct(sku, {
                name: updatedData.Product_Name,
                price: updatedData.Selling_Price,
                description: `SKU: ${sku}, HS_Code: ${updatedData.HS_Code}, Category: ${categoryName}`,
                stock_quantity: updatedData.Stock_Quantity,
                imageUrl: fullImageUrl,
                categoryName,
            });
            await strapi.service('api::product.product').updateShopifyProduct(sku, {
                title: updatedData.Product_Name,
                price: updatedData.Selling_Price,
                description: `SKU: ${sku}, HS_Code: ${updatedData.HS_Code}, Category: ${categoryName}`,
                stock_quantity: updatedData.Stock_Quantity,
                imageUrl: fullImageUrl,
                categoryName,
            });
        }
        catch (err) {
            strapi.log.error('❌ Update sync failed:', err);
        }
        return ctx.send({ message: 'Product updated in Strapi, WooCommerce, and Shopify', data: response });
    },
}));
