import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_PATH = path.join(DATA_DIR, 'adk_sessions.json');

/**
 * Persistent Session Service - build stub
 * Full implementation requires @google/adk which is excluded from build.
 */
export class PersistentSessionService {
  private sessions: Map<string, any> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(SESSIONS_PATH)) {
        const content = fs.readFileSync(SESSIONS_PATH, 'utf-8');
        const data = JSON.parse(content);
        for (const [key, value] of Object.entries(data)) {
          this.sessions.set(key, value);
        }
      }
    } catch (error) {
      console.error('[PersistentSessionService] Disk load failed:', error);
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = Object.fromEntries(this.sessions);
      fs.writeFileSync(SESSIONS_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[PersistentSessionService] Disk save failed:', error);
    }
  }

  async appendEvent(request: any): Promise<any> {
    this.saveToDisk();
    return request;
  }
}
