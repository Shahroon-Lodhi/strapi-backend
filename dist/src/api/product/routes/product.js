"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'GET',
            path: '/products',
            handler: 'product.find',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/products',
            handler: 'product.create',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/products/:id',
            handler: 'product.delete',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/products/:id',
            handler: 'product.update',
            config: {
                policies: [],
            },
        },
        {
            method: 'PATCH',
            path: '/products/:id',
            handler: 'product.update',
            config: {
                policies: [],
            },
        },
    ],
};
