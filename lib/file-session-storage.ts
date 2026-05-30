import { Session } from '@shopify/shopify-api';
import fs from 'fs';
import path from 'path';

function getSessionDir() {
  if (process.env.SHOPIFY_SESSION_DIR) return process.env.SHOPIFY_SESSION_DIR;
  if (process.env.VERCEL) return path.join('/tmp', '.shopify_sessions');
  return path.join(process.cwd(), '.shopify_sessions');
}

function ensureSessionDir(sessionDir: string) {
  try {
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

export class FileSessionStorage {
  async storeSession(session: Session): Promise<boolean> {
    try {
      const sessionDir = getSessionDir();
      if (!ensureSessionDir(sessionDir)) return false;
      fs.writeFileSync(
        path.join(sessionDir, `${session.id}.json`),
        JSON.stringify(session.toObject(), null, 2),
        'utf8'
      );
      return true;
    } catch (error) {
      console.error('Failed to store session:', error);
      return false;
    }
  }

  async loadSession(id: string): Promise<Session | undefined> {
    try {
      const sessionDir = getSessionDir();
      if (!ensureSessionDir(sessionDir)) return undefined;
      const filePath = path.join(sessionDir, `${id}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const sessionObj = JSON.parse(content);
        return new Session(sessionObj);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
    return undefined;
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      const sessionDir = getSessionDir();
      if (!ensureSessionDir(sessionDir)) return false;
      const filePath = path.join(sessionDir, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
    return false;
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    let allDeleted = true;
    for (const id of ids) {
      if (!(await this.deleteSession(id))) {
        allDeleted = false;
      }
    }
    return allDeleted;
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    const sessions: Session[] = [];
    try {
      const sessionDir = getSessionDir();
      if (!ensureSessionDir(sessionDir)) return sessions;
      const files = fs.readdirSync(sessionDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(sessionDir, file), 'utf8');
          const sessionObj = JSON.parse(content);
          if (sessionObj.shop === shop) {
            sessions.push(new Session(sessionObj));
          }
        }
      }
    } catch (error) {
      console.error('Failed to find sessions by shop:', error);
    }
    return sessions;
  }
}
