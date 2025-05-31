export default ({ env }) => ({
  shopify: {
    store: env('SHOPIFY_STORE'),
    token: env('SHOPIFY_TOKEN'),
  },
upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('dnvi0oure'),
        api_key: env('482846687733961'),
        api_secret: env('UudK8D4GwQUwV-3Hra60AkBToy8'),
      },
      actionOptions: {
        upload: {},
        delete: {},
      },
    },
  },
});
