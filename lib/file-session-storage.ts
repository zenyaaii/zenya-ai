import { Session } from '@shopify/shopify-api';
import fs from 'fs';
import path from 'path';

const SESSION_DIR = path.join(process.cwd(), '.shopify_sessions');

if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR);
}

export class FileSessionStorage {
  async storeSession(session: Session): Promise<boolean> {
    try {
      fs.writeFileSync(
        path.join(SESSION_DIR, `${session.id}.json`),
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
      const filePath = path.join(SESSION_DIR, `${id}.json`);
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
      const filePath = path.join(SESSION_DIR, `${id}.json`);
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
      const files = fs.readdirSync(SESSION_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(SESSION_DIR, file), 'utf8');
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
