const axios = require("axios");

module.exports = {
  async afterCreate(event) {
    const product = event.result;

    const wooClient = axios.create({
      baseURL: "http://woocommerce-test.local/wp-json/wc/v3",
      auth: {
        username: "ck_20a96783eb4758c88ede1586303ab88976eac6a9",
        password: "cs_759f7e6b6d7af5387d37a56607459095cc017a0e",
      },
    });

    try {
      await wooClient.post("/products", {
        name: product.Product_Name,
        sku: product.Product_SKU,
        regular_price: product.Selling_Price.toString(),
        stock_quantity: product.Stock_Quantity,
        manage_stock: true,
        type: "simple",
        description: `HS Code: ${product.HS_Code || "N/A"}`,
        meta_data: [
          { key: "hs_code", value: product.HS_Code },
          { key: "cost_price", value: product.Cost_Price }
        ],
        categories: product.Category ? [
          { name: product.Category }  // optional, only if mapped in WooCommerce
        ] : []
      });
    } catch (err) {
      console.error("Failed to sync with WooCommerce:", err.response?.data || err.message);
    }
  },
};
