import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const isAuth0Configured = (): boolean => {
  return Boolean(
    process.env.AUTH0_DOMAIN &&
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET &&
    process.env.AUTH0_SECRET &&
    !process.env.AUTH0_DOMAIN.includes('your-tenant')
  );
};

// Singleton Auth0 client for server-side operations, session retrieval, and middleware
export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN || 'resumecraft-demo.us.auth0.com',
  clientId: process.env.AUTH0_CLIENT_ID || 'build_time_auth0_client_id',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || 'build_time_auth0_client_secret',
  secret: process.env.AUTH0_SECRET || 'a-secure-default-development-secret-that-is-at-least-32-bytes-long',
  appBaseUrl: process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || 'http://localhost:3000',
});
