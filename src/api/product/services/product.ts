import { factories } from '@strapi/strapi';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import axios from 'axios';

const shopifyStoreUrl = 'https://unify-fyp.myshopify.com/admin/api/2023-10';
const accessToken = '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';

const api = new WooCommerceRestApi({
  url: 'honorable-guitar.localsite.io',
  consumerKey: 'ck_a5f7fb1a7c1d2a2fe6c9372d95aab31fa474ca9b',
  consumerSecret: 'cs_101f5befcb677339149e42659a7f707c857e4b59',
  version: 'wc/v3',
});

export const createWooProduct = async (productData) => {
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
  } catch (err) {
    console.error('❌ Woo sync error:', err.response?.data || err.message);
  }
};

export const createShopifyProduct = async (productData) => {
  try {
    const response = await axios.post(
      `${shopifyStoreUrl}/products.json`,
      {
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
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );
    console.log('✅ Shopify product synced:', response.data);
  } catch (err) {
    console.error('❌ Shopify sync error:', err.response?.data || err.message);
  }
};

export const deleteWooProduct = async (sku: string) => {
  try {
    const { data } = await api.get('products', { search: sku });
    const product = data.find((p: any) => p.sku === sku);

    if (!product) {
      console.warn(`⚠️ Woo product with SKU "${sku}" not found`);
      return;
    }

    await api.delete(`products/${product.id}`, { force: true });
    console.log(`🗑️ Deleted Woo product ID ${product.id}`);
  } catch (err) {
    console.error('❌ Woo delete error:', err.response?.data || err.message);
  }
};

export const deleteShopifyProduct = async (sku: string) => {
  try {
    const response = await axios.get(`${shopifyStoreUrl}/products.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    const product = response.data.products.find(
      (prod: any) => prod.variants.some((variant: any) => variant.sku === sku)
    );

    if (!product) {
      console.warn(`⚠️ Shopify product with SKU "${sku}" not found`);
      return;
    }

    await axios.delete(`${shopifyStoreUrl}/products/${product.id}.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    console.log(`🗑️ Deleted Shopify product ID ${product.id}`);
  } catch (err) {
    console.error('❌ Shopify delete error:', err.response?.data || err.message);
  }
};

export default factories.createCoreService('api::product.product', ({ strapi }) => ({
  async syncStockToStores(sku: string, quantity: number) {
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
      const wooProduct = data.find((p: any) => p.sku === sku);
      if (wooProduct) {
        await api.put(`products/${wooProduct.id}`, { stock_quantity: newStock });
        console.log(`✅ WooCommerce stock updated: ${sku} → ${newStock}`);
      }

      const res = await axios.get(`${shopifyStoreUrl}/products.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken },
      });

      const shopifyProduct = res.data.products.find((p: any) =>
        p.variants.some((v: any) => v.sku === sku)
      );

      if (shopifyProduct) {
        const variant = shopifyProduct.variants.find((v: any) => v.sku === sku);
        await axios.put(
          `${shopifyStoreUrl}/variants/${variant.id}.json`,
          {
            variant: {
              id: variant.id,
              inventory_quantity: newStock,
              inventory_management: 'shopify',
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken,
            },
          }
        );
        console.log(`✅ Shopify stock updated: ${sku} → ${newStock}`);
      }
    } catch (err) {
      console.error('❌ Stock sync error:', err.response?.data || err.message);
    }
  },

  updateWooProduct: async (sku, updatedData) => {
    try {
      const { data } = await api.get('products', { search: sku });
      const product = data.find((p: any) => p.sku === sku);
      if (!product) return;

      await api.put(`products/${product.id}`, {
        name: updatedData.name,
        regular_price: updatedData.price.toString(),
        description: updatedData.description,
        stock_quantity: updatedData.stock_quantity,
        images: updatedData.imageUrl ? [{ src: updatedData.imageUrl }] : [],
      });

      console.log(`✅ WooCommerce product updated: ${sku}`);
    } catch (err) {
      console.error('❌ Woo update error:', err.response?.data || err.message);
    }
  },

  updateShopifyProduct: async (sku, updatedData) => {
    try {
      const res = await axios.get(`${shopifyStoreUrl}/products.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken },
      });

      const product = res.data.products.find((p: any) =>
        p.variants.some((v: any) => v.sku === sku)
      );
      if (!product) return;

      const variant = product.variants.find((v: any) => v.sku === sku);

      await axios.put(
        `${shopifyStoreUrl}/products/${product.id}.json`,
        {
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
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
          },
        }
      );

      console.log(`✅ Shopify product updated: ${sku}`);
    } catch (err) {
      console.error('❌ Shopify update error:', err.response?.data || err.message);
    }
  },
}));
