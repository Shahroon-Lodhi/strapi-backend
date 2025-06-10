import { factories } from '@strapi/strapi';
import {
  createWooProduct,
  deleteWooProduct,
  createShopifyProduct,
  deleteShopifyProduct,
} from '../services/product';

// Use your deployed Strapi URL
const NGROK_BASE_URL = 'https://strapi-backend-production-63b5.up.railway.app';

export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx); // Create product in Strapi
    console.log('🧾 Full create response:', JSON.stringify(response, null, 2));


    const productData = ctx.request.body.data;

    try {
      // Extract relative image URL from response
const imageData = response?.data?.attributes?.image?.data;
const imageUrl = Array.isArray(imageData)
  ? imageData[0]?.attributes?.url
  : imageData?.attributes?.url;

const fullImageUrl = imageUrl ? `${NGROK_BASE_URL}${imageUrl}` : null;
console.log('🔗 Final fullImageUrl:', fullImageUrl);


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
        ...wooPayload,
      };

      await createWooProduct(wooPayload);
      await createShopifyProduct(shopifyPayload);
    } catch (err) {
      strapi.log.error('❌ WooCommerce/Shopify sync failed:', err);
    }

    return response;
  },

  async delete(ctx) {
    const id = ctx.params.id;
    const product = await strapi.entityService.findOne('api::product.product', id);
    if (!product) return ctx.notFound('Product not found');

    const sku = product.Product_SKU;

    try {
      await strapi.entityService.delete('api::product.product', id);
      await deleteWooProduct(sku);
      await deleteShopifyProduct(sku);

      return ctx.send({ message: 'Product deleted from Strapi, WooCommerce, and Shopify.' });
    } catch (err) {
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
    } catch (err) {
      strapi.log.error('❌ Stock sync failed:', err);
      return ctx.internalServerError('Stock sync failed');
    }
  },

  async update(ctx) {
    const updatedData = ctx.request.body.data;
    const sku = updatedData?.Product_SKU;
    if (!sku) return ctx.badRequest('Product_SKU is required');

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
      const imageField = updatedData?.image?.data;
      const imageUrl = Array.isArray(imageField)
        ? imageField[0]?.attributes?.url
        : imageField?.attributes?.url;

      const fullImageUrl = imageUrl ? `${NGROK_BASE_URL}${imageUrl}` : null;
      const categoryName = updatedData.Category?.name || 'Uncategorized';

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
    } catch (err) {
      strapi.log.error('❌ Update sync failed:', err);
    }

    return ctx.send({ message: 'Product updated in Strapi, WooCommerce, and Shopify', data: response });
  },
}));
