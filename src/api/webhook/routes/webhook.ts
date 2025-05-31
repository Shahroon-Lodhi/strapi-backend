export default {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/webhook/order',
      handler: 'webhook.handle',
      config: {
        auth: false,
      },
    },
  ],
};
