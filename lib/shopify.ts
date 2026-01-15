import '@shopify/shopify-api/adapters/web-api';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import { PrismaSessionStorage } from '@shopify/shopify-app-session-storage-prisma';
import { PrismaClient } from '@prisma/client';
import { FileSessionStorage } from './file-session-storage';

const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production';
const appUrl = (process.env.VERCEL_URL && !isProduction) 
  ? `https://${process.env.VERCEL_URL}` 
  : (process.env.SHOPIFY_APP_URL || 'https://zenyaai.co');

if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
  throw new Error('Missing Shopify environment variables');
}

let sessionStorage;

if (process.env.DATABASE_URL) {
  console.log('Using PrismaSessionStorage with PostgreSQL');
  const prisma = new PrismaClient();
  sessionStorage = new PrismaSessionStorage(prisma);
} else {
  console.warn('DATABASE_URL not found, using FileSessionStorage (NOT FOR PRODUCTION)');
  sessionStorage = new FileSessionStorage();
}

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['write_themes', 'read_themes', 'read_products'],
  hostName: appUrl.replace(/^https:\/\//, ''),
  apiVersion: ApiVersion.October24,
  isEmbeddedApp: true,
  sessionStorage: sessionStorage,
});
