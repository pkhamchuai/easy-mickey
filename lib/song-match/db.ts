import { neon } from "@neondatabase/serverless";
import fallbackData from "@/data/song-match-catalog.json";
import { normalizeCatalog } from "./catalog";
import type { SongMatchCatalog, SongMatchMember, SongMatchSong } from "./types";
import { youtubeVideoId } from "./youtube";

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
const sql = connectionString ? neon(connectionString) : null;
let schemaPromise: Promise<void> | null = null;

export const fallbackCatalog = normalizeCatalog(fallbackData);

export function songMatchDatabaseConfigured() {
  return Boolean(sql);
}

async function ensureSchema() {
  if (!sql) throw new Error("Song Match database is not configured");
  schemaPromise ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS song_match_songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT NOT NULL DEFAULT '',
        youtube_video_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS song_match_members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL DEFAULT '',
        image_blob_pathname TEXT,
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS song_match_picks (
        member_id TEXT NOT NULL REFERENCES song_match_members(id) ON DELETE CASCADE,
        song_id TEXT NOT NULL REFERENCES song_match_songs(id) ON DELETE RESTRICT,
        rank SMALLINT NOT NULL CHECK (rank BETWEEN 1 AND 3),
        PRIMARY KEY (member_id, rank),
        UNIQUE (member_id, song_id)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS song_match_meta (
        singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
        version BIGINT NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`INSERT INTO song_match_meta (singleton) VALUES (TRUE) ON CONFLICT DO NOTHING`;
  })();
  return schemaPromise;
}

type SongRow = {
  id: string;
  title: string;
  artist: string;
  youtube_video_id: string;
};

type MemberRow = {
  id: string;
  name: string;
  image_url: string;
  image_blob_pathname: string | null;
  is_published: boolean;
  display_order: number;
};

type PickRow = { member_id: string; song_id: string; rank: number };
type MetaRow = { version: string | number; updated_at: string | Date };

export async function readSongMatchCatalog(): Promise<SongMatchCatalog | null> {
  if (!sql) return null;
  await ensureSchema();

  const [songRows, memberRows, pickRows, metaRows] = await Promise.all([
    sql`SELECT id, title, artist, youtube_video_id FROM song_match_songs ORDER BY title`,
    sql`SELECT id, name, image_url, image_blob_pathname, is_published, display_order FROM song_match_members ORDER BY display_order, name`,
    sql`SELECT member_id, song_id, rank FROM song_match_picks ORDER BY member_id, rank`,
    sql`SELECT version, updated_at FROM song_match_meta WHERE singleton = TRUE`,
  ]);

  if (songRows.length === 0 && memberRows.length === 0) return null;

  const songs: SongMatchSong[] = (songRows as SongRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    youtubeUrl: `https://www.youtube.com/watch?v=${row.youtube_video_id}`,
  }));
  const picksByMember = new Map<string, string[]>();
  for (const row of pickRows as PickRow[]) {
    const picks = picksByMember.get(row.member_id) ?? [];
    picks[row.rank - 1] = row.song_id;
    picksByMember.set(row.member_id, picks);
  }
  const members: SongMatchMember[] = (memberRows as MemberRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    imageBlobPathname: row.image_blob_pathname ?? undefined,
    isPublished: row.is_published,
    displayOrder: row.display_order,
    picks: (picksByMember.get(row.id) ?? []).filter(Boolean),
  }));
  const meta = (metaRows as MetaRow[])[0];

  return {
    version: Number(meta?.version ?? 1),
    updatedAt: meta?.updated_at ? new Date(meta.updated_at).toISOString() : new Date().toISOString(),
    songs,
    members,
  };
}

export async function writeSongMatchCatalog(catalog: SongMatchCatalog): Promise<SongMatchCatalog> {
  if (!sql) throw new Error("Song Match database is not configured");
  await ensureSchema();

  const version = Date.now();
  const queries = [
    sql`DELETE FROM song_match_picks`,
    sql`DELETE FROM song_match_members`,
    sql`DELETE FROM song_match_songs`,
    ...catalog.songs.map((song) => sql`
      INSERT INTO song_match_songs (id, title, artist, youtube_video_id)
      VALUES (${song.id}, ${song.title}, ${song.artist}, ${youtubeVideoId(song.youtubeUrl)})
    `),
    ...catalog.members.map((member) => sql`
      INSERT INTO song_match_members (id, name, image_url, image_blob_pathname, is_published, display_order)
      VALUES (${member.id}, ${member.name}, ${member.imageUrl}, ${member.imageBlobPathname ?? null}, ${member.isPublished}, ${member.displayOrder})
    `),
    ...catalog.members.flatMap((member) =>
      member.picks.map((songId, index) => sql`
        INSERT INTO song_match_picks (member_id, song_id, rank)
        VALUES (${member.id}, ${songId}, ${index + 1})
      `),
    ),
    sql`UPDATE song_match_meta SET version = ${version}, updated_at = NOW() WHERE singleton = TRUE`,
  ];

  await sql.transaction(queries);
  return { ...catalog, version, updatedAt: new Date().toISOString() };
}

