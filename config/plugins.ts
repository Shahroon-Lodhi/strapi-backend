export default ({ env }) => ({
  shopify: {
    store: env('SHOPIFY_STORE'),
    token: env('SHOPIFY_TOKEN'),
  },
  upload: {
    provider: 'local',
    providerOptions: {
      sizeLimit: 1000000,
      folder: './uploads',
      optimize: false,

    },
  },
});
