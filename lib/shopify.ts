import '@shopify/shopify-api/adapters/web-api';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import { PrismaSessionStorage } from '@shopify/shopify-app-session-storage-prisma';
import { PrismaClient } from '@prisma/client';
import { FileSessionStorage } from './file-session-storage';

function normalizeEnv(name: string) {
  const v = process.env[name];
  if (!v) return;
  process.env[name] = v.trim().replace(/^"(.*)"$/, '$1');
}

normalizeEnv('DATABASE_URL');
normalizeEnv('DIRECT_URL');
normalizeEnv('SHOPIFY_API_KEY');
normalizeEnv('SHOPIFY_API_SECRET');
normalizeEnv('SHOPIFY_APP_URL');
normalizeEnv('SCOPES');
normalizeEnv('SHOPIFY_SCOPES');

const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production';
const appUrl = (process.env.VERCEL_URL && !isProduction) 
  ? `https://${process.env.VERCEL_URL}` 
  : (process.env.SHOPIFY_APP_URL || 'https://zenyaai.co');

if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
  throw new Error('Missing Shopify environment variables');
}

let sessionStorage;

const shouldUsePrisma = !!process.env.DATABASE_URL && process.env.ENABLE_PRISMA_SESSIONS !== 'false';

async function ensurePrismaSessionTable() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) return;

  const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });
  try {
    await prisma.session.count();
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : String(e);
    const looksLikeMissingTable =
      message.includes('Prisma session table does not exist') ||
      message.includes('relation "Session" does not exist') ||
      message.includes('The table `public.Session` does not exist') ||
      message.includes('P2021');

    if (!looksLikeMissingTable) throw e;

    await prisma.$executeRawUnsafe(`
      create table if not exists "Session" (
        "id" text primary key,
        "shop" text not null,
        "state" text not null,
        "isOnline" boolean not null default false,
        "scope" text,
        "expires" timestamp(3),
        "accessToken" text not null,
        "userId" bigint
      );
    `);
    await prisma.$executeRawUnsafe(`create index if not exists "Session_shop_idx" on "Session" ("shop");`);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

class LazySessionStorage {
  private delegatePromise: Promise<any> | null = null;
  private fallback: FileSessionStorage | null = null;

  private async getDelegate() {
    if (this.delegatePromise) return this.delegatePromise;
    this.delegatePromise = (async () => {
      if (!shouldUsePrisma) {
        console.warn('Using FileSessionStorage for sessions (set DATABASE_URL to enable Prisma storage)');
        return (this.fallback ??= new FileSessionStorage());
      }

      try {
        console.log('Using PrismaSessionStorage with PostgreSQL');
        await ensurePrismaSessionTable();
        const prisma = new PrismaClient();
        return new PrismaSessionStorage(prisma);
      } catch (e: any) {
        console.warn('Failed to initialize Prisma session storage, falling back to FileSessionStorage:', e?.message);
        return (this.fallback ??= new FileSessionStorage());
      }
    })();

    return this.delegatePromise;
  }

  async storeSession(session: any): Promise<boolean> {
    return (await this.getDelegate()).storeSession(session);
  }

  async loadSession(id: string): Promise<any> {
    return (await this.getDelegate()).loadSession(id);
  }

  async deleteSession(id: string): Promise<boolean> {
    return (await this.getDelegate()).deleteSession(id);
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    return (await this.getDelegate()).deleteSessions(ids);
  }

  async findSessionsByShop(shop: string): Promise<any[]> {
    return (await this.getDelegate()).findSessionsByShop(shop);
  }
}

sessionStorage = new LazySessionStorage();

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes:
    process.env.SHOPIFY_SCOPES?.split(',') ||
    process.env.SCOPES?.split(',') ||
    // write_themes powers the one-click theme publish from /build.
    ['read_products', 'write_products', 'read_themes', 'write_themes'],
  hostName: appUrl.replace(/^https:\/\//, ''),
  apiVersion: ApiVersion.October24,
  isEmbeddedApp: true,
  sessionStorage: sessionStorage,
});
