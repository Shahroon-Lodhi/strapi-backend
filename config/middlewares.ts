export default [
  'strapi::logger',
  'strapi::errors',
  
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'http://localhost:1337', 'http://localhost:3000'],
          'img-src': ["'self'", 'data:', 'blob:', 'http://localhost:1337'],
          'media-src': ["'self'", 'data:', 'blob:', 'http://localhost:1337'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  
    {
      name: 'strapi::cors',
      config: {
        origin: ['http://localhost:3000', 'http://localhost:1337'], // Add both
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'], // Explicitly list all needed
        headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        keepHeaderOnError: true // Important for error responses
      }
    },
    'strapi::errors',
    'strapi::security', // Keep your security config
    'strapi::cors', // Keep your CORS config
    'strapi::poweredBy',
    'strapi::logger',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public'
];
