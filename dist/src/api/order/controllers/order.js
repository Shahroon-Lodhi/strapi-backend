"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::order.order', ({ strapi }) => ({
    async find(ctx) {
        const { query } = ctx;
        const filters = query.filters || {};
        const orders = await strapi.entityService.findMany('api::order.order', {
            ...query,
            filters,
        });
        return { data: orders };
    },
    async findOne(ctx) {
        const { id } = ctx.params;
        const order = await strapi.entityService.findOne('api::order.order', id);
        return { data: order };
    },
    async delete(ctx) {
        const { id } = ctx.params;
        const order = await strapi.entityService.findOne('api::order.order', id);
        if (!order) {
            return ctx.notFound('Order not found');
        }
        // Soft delete (optional): set a deleted flag instead of removing
        // await strapi.entityService.update('api::order.order', id, {
        //   data: { deleted: true },
        // });
        // Hard delete
        await strapi.entityService.delete('api::order.order', id);
        return { message: 'Order deleted successfully' };
    },
}));
