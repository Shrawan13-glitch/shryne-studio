import * as SQLite from 'expo-sqlite';
import type { AudioAsset, GenerationRun, Script } from '@/types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function db(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('shryne-studio.db').then(async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS scripts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS runs (
          id TEXT PRIMARY KEY,
          batch_id TEXT NOT NULL,
          script_id TEXT NOT NULL,
          title TEXT NOT NULL,
          repo TEXT NOT NULL,
          run_id INTEGER,
          state TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_runs_created ON runs(created_at DESC);
        CREATE TABLE IF NOT EXISTS assets (
          id TEXT PRIMARY KEY,
          batch_id TEXT NOT NULL,
          script_id TEXT NOT NULL,
          idx INTEGER NOT NULL,
          filename TEXT NOT NULL,
          text TEXT NOT NULL,
          voice TEXT NOT NULL,
          speed REAL NOT NULL,
          uri TEXT NOT NULL,
          size INTEGER NOT NULL,
          duration REAL,
          favorite INTEGER NOT NULL DEFAULT 0,
          tags TEXT NOT NULL DEFAULT '[]',
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_assets_batch ON assets(batch_id, idx);
        CREATE TABLE IF NOT EXISTS prefs (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
      return database;
    });
  }
  return dbPromise;
}

export async function saveScript(script: Script): Promise<void> {
  const database = await db();
  await database.runAsync(
    'INSERT INTO scripts (id, title, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, payload=excluded.payload, updated_at=excluded.updated_at',
    script.id, script.title, JSON.stringify(script), script.createdAt, script.updatedAt,
  );
}

export async function listScripts(): Promise<Script[]> {
  const database = await db();
  const rows = await database.getAllAsync<{ payload: string }>('SELECT payload FROM scripts ORDER BY updated_at DESC');
  return rows.map((row) => JSON.parse(row.payload) as Script);
}

export async function deleteScript(id: string): Promise<void> {
  const database = await db();
  await database.runAsync('DELETE FROM scripts WHERE id = ?', id);
}

export async function saveRun(run: GenerationRun): Promise<void> {
  const database = await db();
  await database.runAsync(
    `INSERT INTO runs (id, batch_id, script_id, title, repo, run_id, state, payload, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET run_id=excluded.run_id, state=excluded.state, payload=excluded.payload, updated_at=excluded.updated_at`,
    run.id, run.batchId, run.scriptId, run.scriptTitle, run.repo, run.runId, run.state,
    JSON.stringify(run), run.createdAt, run.updatedAt,
  );
}

export async function listRuns(limit = 100): Promise<GenerationRun[]> {
  const database = await db();
  const rows = await database.getAllAsync<{ payload: string }>('SELECT payload FROM runs ORDER BY created_at DESC LIMIT ?', limit);
  return rows.map((row) => JSON.parse(row.payload) as GenerationRun);
}

export async function getRun(id: string): Promise<GenerationRun | null> {
  const database = await db();
  const row = await database.getFirstAsync<{ payload: string }>('SELECT payload FROM runs WHERE id = ?', id);
  return row ? (JSON.parse(row.payload) as GenerationRun) : null;
}

export async function deleteRun(id: string): Promise<void> {
  const database = await db();
  await database.runAsync('DELETE FROM runs WHERE id = ?', id);
}

export interface AssetQuery {
  batchId?: string;
  scriptId?: string;
  favorite?: boolean;
  search?: string;
  limit?: number;
}

export async function listAssets(query: AssetQuery = {}): Promise<AudioAsset[]> {
  const database = await db();
  const clauses: string[] = [];
  const params: (string | number | null)[] = [];
  if (query.batchId) { clauses.push('batch_id = ?'); params.push(query.batchId); }
  if (query.scriptId) { clauses.push('script_id = ?'); params.push(query.scriptId); }
  if (query.favorite) { clauses.push('favorite = 1'); }
  if (query.search) { clauses.push('(text LIKE ? OR filename LIKE ?)'); params.push(`%${query.search}%`, `%${query.search}%`); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await database.getAllAsync<{ payload: string; idx: number; created_at: number }>(
    `SELECT payload, idx, created_at FROM assets ${where} ORDER BY created_at DESC, idx ASC LIMIT ?`,
    ...params, query.limit ?? 1000,
  );
  return rows.map((row) => JSON.parse(row.payload) as AudioAsset);
}

export async function saveAsset(asset: AudioAsset): Promise<void> {
  const database = await db();
  await database.runAsync(
    `INSERT INTO assets (id, batch_id, script_id, idx, filename, text, voice, speed, uri, size, duration, favorite, tags, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET favorite=excluded.favorite, tags=excluded.tags, uri=excluded.uri, duration=excluded.duration`,
    asset.id, asset.batchId, asset.scriptId, asset.index, asset.filename, asset.text, asset.voice,
    asset.speed, asset.uri, asset.size, asset.durationSeconds, asset.favorite ? 1 : 0,
    JSON.stringify(asset.tags), asset.createdAt,
  );
}

export async function deleteAsset(id: string): Promise<void> {
  const database = await db();
  await database.runAsync('DELETE FROM assets WHERE id = ?', id);
}

export async function deleteBatchAssets(batchId: string): Promise<void> {
  const database = await db();
  await database.runAsync('DELETE FROM assets WHERE batch_id = ?', batchId);
}

export async function setPref(key: string, value: string): Promise<void> {
  const database = await db();
  await database.runAsync('INSERT INTO prefs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, value);
}

export async function getPref(key: string): Promise<string | null> {
  const database = await db();
  const row = await database.getFirstAsync<{ value: string }>('SELECT value FROM prefs WHERE key = ?', key);
  return row?.value ?? null;
}

export async function totalAssetBytes(): Promise<number> {
  const database = await db();
  const row = await database.getFirstAsync<{ total: number }>('SELECT COALESCE(SUM(size), 0) AS total FROM assets');
  return row?.total ?? 0;
}
