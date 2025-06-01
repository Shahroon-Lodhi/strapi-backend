import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  // Helper to only include SSL config if DATABASE_SSL is true
  const getSSLConfig = () => {
    if (!env.bool('DATABASE_SSL', false)) return false;
    return {
      key: env('DATABASE_SSL_KEY', undefined),
      cert: env('DATABASE_SSL_CERT', undefined),
      ca: env('DATABASE_SSL_CA', undefined),
      capath: env('DATABASE_SSL_CAPATH', undefined),
      cipher: env('DATABASE_SSL_CIPHER', undefined),
      rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
    };
  };

  const connections = {
    mysql: {
      connection: {
        host: env('DATABASE_HOST', 'localhost') || 'localhost',
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'strapi') || 'strapi',
        user: env('DATABASE_USERNAME', 'strapi') || 'strapi',
        password: env('DATABASE_PASSWORD', 'strapi') || 'strapi',
        ssl: getSSLConfig(),
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },

    postgres: {
      connection: (() => {
        const connectionString = env('DATABASE_URL', '');
        if (connectionString) {
          // Use connection string if provided
          return { connectionString };
        }
        // Otherwise build connection config piece by piece
        return {
          host: env('DATABASE_HOST', 'localhost') || 'localhost',
          port: env.int('DATABASE_PORT', 5432),
          database: env('DATABASE_NAME', 'strapi') || 'strapi',
          user: env('DATABASE_USERNAME', 'strapi') || 'strapi',
          password: env('DATABASE_PASSWORD', 'strapi') || 'strapi',
          ssl: getSSLConfig(),
          schema: env('DATABASE_SCHEMA', 'public'),
        };
      })(),
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },

    sqlite: {
      connection: {
        filename: path.join(
          __dirname,
          '..',
          '..',
          env('DATABASE_FILENAME', '.tmp/data.db') || '.tmp/data.db'
        ),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
