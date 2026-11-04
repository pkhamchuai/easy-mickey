import "server-only";
import { neon } from "@neondatabase/serverless";
import { kv } from "@vercel/kv";
import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { parsePrediction, type Prediction } from "./ge-prediction";

const key = "ge2026:prediction:v1";
const file = join(process.cwd(), "data", "ge-prediction.json");
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = connectionString ? neon(connectionString) : null;
let schemaPromise: Promise<void> | undefined;

function kvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function predictionStorage() {
  return sql ? "PostgreSQL" : kvConfigured() ? "Redis / KV" : "local";
}

async function ensureSchema() {
  if (!sql) return;
  schemaPromise ??= sql`
    CREATE TABLE IF NOT EXISTS ge2026_predictions (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.then(() => {}).catch(error => { schemaPromise = undefined; throw error; });
  await schemaPromise;
}

async function localPrediction(): Promise<Prediction | null> {
  try { return parsePrediction(JSON.parse(await readFile(file, "utf8"))); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function readPrediction(): Promise<Prediction | null> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT payload FROM ge2026_predictions WHERE id = 'latest'`;
    return rows.length ? parsePrediction(rows[0].payload) : null;
  }
  if (kvConfigured()) {
    const data = await kv.get(key);
    return data === null ? null : parsePrediction(data);
  }
  return localPrediction();
}

export async function savePrediction(prediction: Prediction) {
  const data = parsePrediction(prediction);
  if (sql) {
    await ensureSchema();
    await sql`
      INSERT INTO ge2026_predictions (id, payload) VALUES ('latest', ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `;
  } else if (kvConfigured()) {
    await kv.set(key, data);
  } else {
    if (process.env.VERCEL) throw new Error("กรุณาตั้งค่าฐานข้อมูลสำหรับเก็บผลคาดการณ์บนเว็บ");
    const temporary = `${file}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(data, null, 2) + "\n");
    await rename(temporary, file);
  }
}
