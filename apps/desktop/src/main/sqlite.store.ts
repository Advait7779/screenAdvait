import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export interface IDbStore {
  prepare: (sql: string) => {
    get: (...args: any[]) => any;
    all: (...args: any[]) => any[];
    run: (...args: any[]) => any;
  };
  exec: (sql: string) => void;
}

let storeInstance: IDbStore | null = null;

class JsonFallbackStore implements IDbStore {
  private jsonPath: string;
  private data: {
    local_settings: Record<string, string>;
    upload_queue: any[];
    upload_logs: any[];
    local_cache: Record<string, { data: string; expires_at?: string }>;
  };

  constructor(jsonPath: string) {
    this.jsonPath = jsonPath;
    this.data = {
      local_settings: {
        screenshotInterval: '300',
        imageFormat: 'PNG',
        autoStart: 'true',
        silentMode: 'true',
        deleteAfterUpload: 'false',
        capturePaused: 'false',
      },
      upload_queue: [],
      upload_logs: [],
      local_cache: {},
    };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.jsonPath)) {
        const raw = fs.readFileSync(this.jsonPath, 'utf8');
        this.data = { ...this.data, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('[JsonStore] Failed loading cache file, reset to empty state', e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.jsonPath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('[JsonStore] Failed saving cache file', e);
    }
  }

  exec(_sql: string) {
    // No-op for CREATE TABLE queries
  }

  prepare(sql: string) {
    const s = sql.toLowerCase();

    return {
      get: (...args: any[]) => {
        if (s.includes('from local_settings')) {
          const key = args[0];
          const val = this.data.local_settings[key];
          return val ? { value: val } : undefined;
        }
        if (s.includes('from local_cache')) {
          const key = args[0];
          const item = this.data.local_cache[key];
          return item ? { data: item.data, expires_at: item.expires_at } : undefined;
        }
        if (s.includes('from upload_queue') && s.includes('where id = ?')) {
          const item = this.data.upload_queue.find((entry) => entry.id === args[0]);
          return item ? { file_path: item.file_path, mime_type: item.mime_type } : undefined;
        }
        if (s.includes('count(*) as count from upload_queue')) {
          if (s.includes('captured_at >= ?')) {
            const since = String(args[0]);
            return { count: this.data.upload_queue.filter((i) => i.captured_at >= since).length };
          }
          if (s.includes("status = 'pending'")) {
            const count = this.data.upload_queue.filter((i) => i.status === 'PENDING').length;
            return { count };
          }
          if (s.includes("status = 'completed'")) {
            const count = this.data.upload_queue.filter((i) => i.status === 'COMPLETED').length;
            return { count };
          }
          if (s.includes("status = 'failed'")) {
            const count = this.data.upload_queue.filter((i) => i.status === 'FAILED').length;
            return { count };
          }
        }
        if (s.includes('sum(file_size)')) {
          return { total: this.data.upload_queue.reduce((sum, item) => sum + Number(item.file_size || 0), 0) };
        }
        return undefined;
      },
      all: (...args: any[]) => {
        if (s.includes('from local_settings')) {
          return Object.entries(this.data.local_settings).map(([key, value]) => ({ key, value }));
        }
        if (s.includes('from upload_queue')) {
          if (s.includes('captured_at < ?')) {
            const cutoff = String(args[0]);
            return this.data.upload_queue
              .filter(
                (item) =>
                  String(item.captured_at) < cutoff &&
                  (!s.includes("status != 'uploading'") || item.status !== 'UPLOADING'),
              )
              .sort((a, b) => String(a.captured_at).localeCompare(String(b.captured_at)))
              .slice(0, 1000)
              .map((item) => ({ id: item.id, file_path: item.file_path }));
          }
          if (s.includes("status in ('pending', 'failed')")) {
            return this.data.upload_queue
              .filter((i) => (i.status === 'PENDING' || i.status === 'FAILED') && i.retry_count < 10)
              .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
              .slice(0, 5);
          }
          const limit = s.includes('limit 2000') ? 2000 : 20;
          return [...this.data.upload_queue].reverse().slice(0, limit);
        }
        return [];
      },
      run: (...args: any[]) => {
        if (s.includes('insert or replace into local_settings')) {
          const [key, value] = args;
          this.data.local_settings[key] = String(value);
          this.save();
        } else if (s.includes('insert into upload_queue')) {
          const [id, file_path, file_name, file_size, mime_type, captured_at, year, month, day, status, created_at] = args;
          this.data.upload_queue.push({
            id,
            file_path,
            file_name,
            file_size,
            mime_type,
            captured_at,
            year,
            month,
            day,
            status: status || 'PENDING',
            retry_count: 0,
            created_at,
          });
          this.save();
        } else if (s.includes('update upload_queue set status =')) {
          if (s.includes("where status = 'uploading'")) {
            for (const item of this.data.upload_queue.filter((i) => i.status === 'UPLOADING')) {
              item.status = 'FAILED';
              item.error_message = args[0];
            }
          } else if (s.includes("where status = 'failed'")) {
            for (const item of this.data.upload_queue.filter((i) => i.status === 'FAILED')) {
              item.status = String(args[0]);
              item.retry_count = 0;
              item.error_message = args[1];
            }
          } else {
            const id = args[args.length - 1];
            const item = this.data.upload_queue.find((i) => i.id === id);
            if (item) {
              item.status = String(args[0]);
              if (s.includes('retry_count = retry_count + 1')) {
                item.retry_count = (item.retry_count || 0) + 1;
                item.error_message = args[1];
              } else if (s.includes('error_message = ?')) {
                item.error_message = args[1];
              }
            }
          }
          this.save();
        } else if (s.includes('insert into upload_logs')) {
          const [id, queue_id, file_name, uploaded_at, drive_file_id, status] = args;
          this.data.upload_logs.push({ id, queue_id, file_name, uploaded_at, drive_file_id, status });
          this.save();
        } else if (s.includes('delete from upload_logs') && s.includes('where queue_id = ?')) {
          const queueId = args[0];
          this.data.upload_logs = this.data.upload_logs.filter((item) => item.queue_id !== queueId);
          this.save();
        } else if (s.includes('delete from upload_queue') && s.includes('where id = ?')) {
          const queueId = args[0];
          this.data.upload_queue = this.data.upload_queue.filter((item) => item.id !== queueId);
          this.save();
        } else if (s.includes('insert or replace into local_cache')) {
          const [key, data, expires_at] = args;
          this.data.local_cache[key] = { data, expires_at };
          this.save();
        } else if (s.includes('delete from local_cache')) {
          const key = args[0];
          delete this.data.local_cache[key];
          this.save();
        }
        return { changes: 1 };
      },
    };
  }
}

export function initSqliteDb(): IDbStore {
  if (storeInstance) return storeInstance;

  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Try Native SQLite first
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(dbDir, 'desktop_store.db');
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS local_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS upload_queue (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        captured_at TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        status TEXT DEFAULT 'PENDING',
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS upload_logs (
        id TEXT PRIMARY KEY,
        queue_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        drive_file_id TEXT,
        status TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_cache (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        expires_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_upload_queue_status_created ON upload_queue(status, created_at);
    `);

    const getSetting = db.prepare('SELECT value FROM local_settings WHERE key = ?');
    const setSetting = db.prepare('INSERT OR REPLACE INTO local_settings (key, value) VALUES (?, ?)');

    if (!getSetting.get('screenshotInterval')) {
      setSetting.run('screenshotInterval', '300');
    }
    if (!getSetting.get('imageFormat')) {
      setSetting.run('imageFormat', 'PNG');
    }
    if (!getSetting.get('autoStart')) {
      setSetting.run('autoStart', 'true');
    }
    if (!getSetting.get('silentMode')) setSetting.run('silentMode', 'true');
    if (!getSetting.get('deleteAfterUpload')) setSetting.run('deleteAfterUpload', 'false');
    if (!getSetting.get('capturePaused')) setSetting.run('capturePaused', 'false');

    storeInstance = db;
    console.log('[DbStore] Native SQLite initialized successfully.');
  } catch (err: any) {
    console.warn('[DbStore] Native SQLite binding unavailable, falling back to JSON storage engine:', err.message);
    const jsonPath = path.join(dbDir, 'desktop_store.json');
    storeInstance = new JsonFallbackStore(jsonPath);
  }

  return storeInstance!;
}

export function getDb(): IDbStore {
  return storeInstance || initSqliteDb();
}
