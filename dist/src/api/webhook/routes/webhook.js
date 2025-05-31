"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
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
