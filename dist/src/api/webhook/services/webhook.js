"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShopifyProductStock = exports.updateWooProductStock = void 0;
const woocommerce_rest_api_1 = __importDefault(require("@woocommerce/woocommerce-rest-api"));
const shopify_api_node_1 = __importDefault(require("shopify-api-node"));
const wooApi = new woocommerce_rest_api_1.default({
    url: 'http://unify.local',
    consumerKey: 'ck_a5f7fb1a7c1d2a2fe6c9372d95aab31fa474ca9b',
    consumerSecret: 'cs_101f5befcb677339149e42659a7f707c857e4b59',
    version: 'wc/v3',
});
const shopify = new shopify_api_node_1.default({
    shopName: 'unify-fyp.myshopify.com',
    accessToken: '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',
});
const updateWooProductStock = async (sku, quantity) => {
    const { data } = await wooApi.get('products', { search: sku });
    const product = data.find((p) => p.sku === sku);
    if (product) {
        await wooApi.put(`products/${product.id}`, {
            stock_quantity: quantity,
        });
    }
};
exports.updateWooProductStock = updateWooProductStock;
const updateShopifyProductStock = async (sku, quantity) => {
    // Add this to your webhook service temporarily:
    const products = await shopify.product.list({ limit: 250 });
    const locations = await shopify.location.list();
    console.log(locations);
    for (const product of products) {
        const variant = product.variants.find(v => v.sku === sku);
        if (variant) {
            await shopify.inventoryLevel.set({
                inventory_item_id: variant.inventory_item_id,
                location_id: '77167952055', // Replace this
                available: quantity,
            });
            break;
        }
    }
};
exports.updateShopifyProductStock = updateShopifyProductStock;
