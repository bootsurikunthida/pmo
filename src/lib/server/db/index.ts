/**
 * DB connection (local SQLite via better-sqlite3).
 *
 * ภายหลังย้ายไป Cloudflare D1: เปลี่ยนเป็น
 *   import { drizzle } from 'drizzle-orm/d1';
 *   export const getDb = (platform) => drizzle(platform.env.DB, { schema });
 * โดย schema.ts และ query ทั้งหมดใช้ต่อได้โดยไม่ต้องแก้
 */
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as env from '$app/env/private';
import * as schema from './schema';

const url = (env as Record<string, string | undefined>).DATABASE_URL || 'local.db';
const client = new Database(url);
client.pragma('journal_mode = WAL');
client.pragma('foreign_keys = ON');

export const db = drizzle(client, { schema });
export type Db = typeof db;
export { schema };
