"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShopifyProduct = exports.deleteWooProduct = exports.createShopifyProduct = exports.createWooProduct = void 0;
const strapi_1 = require("@strapi/strapi");
const woocommerce_rest_api_1 = __importDefault(require("@woocommerce/woocommerce-rest-api"));
const axios_1 = __importDefault(require("axios"));
const shopifyStoreUrl = 'https://unify-fyp.myshopify.com/admin/api/2023-10';
const accessToken = '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';
const api = new woocommerce_rest_api_1.default({
    url: 'http://unify.local',
    consumerKey: 'ck_a5f7fb1a7c1d2a2fe6c9372d95aab31fa474ca9b',
    consumerSecret: 'cs_101f5befcb677339149e42659a7f707c857e4b59',
    version: 'wc/v3',
});
const createWooProduct = async (productData) => {
    var _a;
    try {
        const res = await api.post('products', {
            name: productData.title,
            type: 'simple',
            regular_price: productData.price.toString(),
            description: productData.description,
            stock_quantity: productData.stock_quantity,
            sku: productData.sku,
            manage_stock: true,
            status: 'publish',
            images: productData.imageUrl ? [{ src: productData.imageUrl }] : [],
            categories: productData.categoryName ? [{ name: productData.categoryName }] : [],
        });
        console.log('✅ Woo product synced:', res.data);
    }
    catch (err) {
        console.error('❌ Woo sync error:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
    }
};
exports.createWooProduct = createWooProduct;
const createShopifyProduct = async (productData) => {
    var _a;
    try {
        const response = await axios_1.default.post(`${shopifyStoreUrl}/products.json`, {
            product: {
                title: productData.title,
                body_html: productData.description,
                product_type: productData.categoryName || '',
                tags: productData.categoryName ? [productData.categoryName] : [],
                variants: [
                    {
                        price: productData.price.toString(),
                        sku: productData.sku,
                        inventory_management: 'shopify',
                        inventory_quantity: productData.stock_quantity,
                    },
                ],
                images: productData.imageUrl ? [{ src: productData.imageUrl }] : [],
            },
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            },
        });
        console.log('✅ Shopify product synced:', response.data);
    }
    catch (err) {
        console.error('❌ Shopify sync error:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
    }
};
exports.createShopifyProduct = createShopifyProduct;
const deleteWooProduct = async (sku) => {
    var _a;
    try {
        const { data } = await api.get('products', { search: sku });
        const product = data.find((p) => p.sku === sku);
        if (!product) {
            console.warn(`⚠️ Woo product with SKU "${sku}" not found`);
            return;
        }
        await api.delete(`products/${product.id}`, { force: true });
        console.log(`🗑️ Deleted Woo product ID ${product.id}`);
    }
    catch (err) {
        console.error('❌ Woo delete error:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
    }
};
exports.deleteWooProduct = deleteWooProduct;
const deleteShopifyProduct = async (sku) => {
    var _a;
    try {
        const response = await axios_1.default.get(`${shopifyStoreUrl}/products.json`, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
            },
        });
        const product = response.data.products.find((prod) => prod.variants.some((variant) => variant.sku === sku));
        if (!product) {
            console.warn(`⚠️ Shopify product with SKU "${sku}" not found`);
            return;
        }
        await axios_1.default.delete(`${shopifyStoreUrl}/products/${product.id}.json`, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
            },
        });
        console.log(`🗑️ Deleted Shopify product ID ${product.id}`);
    }
    catch (err) {
        console.error('❌ Shopify delete error:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
    }
};
exports.deleteShopifyProduct = deleteShopifyProduct;
exports.default = strapi_1.factories.createCoreService('api::product.product', ({ strapi }) => ({
    async syncStockToStores(sku, quantity) {
        var _a;
        try {
            const matching = await strapi.entityService.findMany('api::product.product', {
                filters: { Product_SKU: sku },
            });
            const localProduct = Array.isArray(matching) ? matching[0] : matching;
            if (!localProduct) {
                console.warn(`⚠️ Local product with SKU "${sku}" not found`);
                return;
            }
            const currentStock = localProduct.Stock_Quantity || 0;
            const newStock = Math.max(currentStock - quantity, 0);
            await strapi.entityService.update('api::product.product', localProduct.id, {
                data: { Stock_Quantity: newStock },
            });
            console.log(`✅ Local Strapi product stock updated: ${sku} → ${newStock}`);
            const { data } = await api.get('products', { search: sku });
            const wooProduct = data.find((p) => p.sku === sku);
            if (wooProduct) {
                await api.put(`products/${wooProduct.id}`, { stock_quantity: newStock });
                console.log(`✅ WooCommerce stock updated: ${sku} → ${newStock}`);
            }
            const res = await axios_1.default.get(`${shopifyStoreUrl}/products.json`, {
                headers: { 'X-Shopify-Access-Token': accessToken },
            });
            const shopifyProduct = res.data.products.find((p) => p.variants.some((v) => v.sku === sku));
            if (shopifyProduct) {
                const variant = shopifyProduct.variants.find((v) => v.sku === sku);
                await axios_1.default.put(`${shopifyStoreUrl}/variants/${variant.id}.json`, {
                    variant: {
                        id: variant.id,
                        inventory_quantity: newStock,
                        inventory_management: 'shopify',
                    },
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': accessToken,
                    },
                });
                console.log(`✅ Shopify stock updated: ${sku} → ${newStock}`);
            }
        }
        catch (err) {
            console.error('❌ Stock sync error:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
        }
    },
    updateWooProduct: async (sku, updatedData) => {
        var _a;
        try {
            const { data } = await api.get('products', { search: sku });
            const product = data.find((p) => p.sku === sku);
            if (!product)
                return;
            await api.put(`products/${product.id}`, {
                name: updatedData.name,
                regular_price: updatedData.price.toString(),
                description: updatedData.description,
                stock_quantity: updatedData.stock_quantity,
                images: updatedData.imageUrl ? [{ src: updatedData.imageUrl }] : [],
            });
            console.log(`✅ WooCommerce product updated: ${sku}`);
        }
        catch (err) {
            console.error('❌ Woo update error:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
        }
    },
    updateShopifyProduct: async (sku, updatedData) => {
        var _a;
        try {
            const res = await axios_1.default.get(`${shopifyStoreUrl}/products.json`, {
                headers: { 'X-Shopify-Access-Token': accessToken },
            });
            const product = res.data.products.find((p) => p.variants.some((v) => v.sku === sku));
            if (!product)
                return;
            const variant = product.variants.find((v) => v.sku === sku);
            await axios_1.default.put(`${shopifyStoreUrl}/products/${product.id}.json`, {
                product: {
                    id: product.id,
                    title: updatedData.title,
                    body_html: updatedData.description,
                    images: updatedData.imageUrl ? [{ src: updatedData.imageUrl }] : [],
                    variants: [
                        {
                            id: variant.id,
                            price: updatedData.price.toString(),
                            inventory_quantity: updatedData.stock_quantity,
                            inventory_management: 'shopify',
                        },
                    ],
                },
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken,
                },
            });
            console.log(`✅ Shopify product updated: ${sku}`);
        }
        catch (err) {
            console.error('❌ Shopify update error:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
        }
    },
}));
