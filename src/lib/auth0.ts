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

export const getAppBaseUrl = (): string => {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/+$/, '');
  if (process.env.AUTH0_BASE_URL) return process.env.AUTH0_BASE_URL.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') {
    return 'https://resume-tailor-tool21.vercel.app';
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/+$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
  return 'http://localhost:3000';
};

// Singleton Auth0 client for server-side operations, session retrieval, and middleware
export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN || 'dev-nu23ezauft0ix6uk.us.auth0.com',
  clientId: process.env.AUTH0_CLIENT_ID || 'x8QUPvwkJTRHuVlLJdgmAQmZRwOPzVqD',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || 'tL3Z7z-rfcvNQD7vcsDLGyOXXJ9vq38tz4-30eJcCLFYWtr5sod_p57Tamnc7Y6V',
  secret: process.env.AUTH0_SECRET || '269adab4acda30b6e66935916f9c164fbfcb6d35ccb0eb3c7fb8e42a4d968155',
  appBaseUrl: getAppBaseUrl(),
});
