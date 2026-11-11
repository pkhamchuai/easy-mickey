import "server-only";
import { neon } from "@neondatabase/serverless";
import { kv } from "@vercel/kv";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export type TrackedPage = "home" | "prediction";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = connectionString ? neon(connectionString) : null;
const directory = join(process.cwd(), "data");
const file = join(directory, "page-views.json");
let schemaPromise: Promise<void> | undefined;
let localQueue: Promise<unknown> = Promise.resolve();

async function incrementLocal(page: TrackedPage): Promise<string> {
  if (process.env.VERCEL) throw new Error("Page views storage is not configured");
  let counts: Partial<Record<TrackedPage, string>> = {};
  try {
    counts = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const count = (BigInt(counts[page] ?? "0") + BigInt(1)).toString();
  counts[page] = count;
  await mkdir(directory, { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(counts) + "\n");
  await rename(temporary, file);
  return count;
}

export async function incrementPageViews(page: TrackedPage): Promise<string> {
  if (sql) {
    schemaPromise ??= sql`
      CREATE TABLE IF NOT EXISTS page_views (
        page TEXT PRIMARY KEY,
        views BIGINT NOT NULL DEFAULT 0 CHECK (views >= 0)
      )
    `.then(() => {}).catch(error => { schemaPromise = undefined; throw error; });
    await schemaPromise;
    const rows = await sql`
      INSERT INTO page_views (page, views) VALUES (${page}, 1)
      ON CONFLICT (page) DO UPDATE SET views = page_views.views + 1
      RETURNING views::text AS views
    `;
    return rows[0].views;
  }
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return String(await kv.incr(`page-views:v1:${page}`));
  }
  // Serialize local writes so simultaneous requests do not overwrite each other.
  const pending = localQueue.then(() => incrementLocal(page));
  localQueue = pending.catch(() => {});
  return pending;
}
