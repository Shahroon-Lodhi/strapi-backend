// Custom routes for soft delete and bulk delete

export default {
  routes: [
    {
      method: 'GET',
      path: '/orders',
      handler: 'order.find',
    },
    {
      method: 'GET',
      path: '/orders/:id',
      handler: 'order.findOne',
    },
    {
      method: 'DELETE',
      path: '/orders/:id',
      handler: 'order.delete',
    },

  ],
};
