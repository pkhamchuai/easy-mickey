import type { SongMatchCatalog } from "./types";
import { canonicalYoutubeUrl } from "./youtube";

export function normalizeCatalog(input: unknown): SongMatchCatalog {
  if (!input || typeof input !== "object") throw new Error("Invalid catalog");
  const value = input as Partial<SongMatchCatalog>;
  if (!Array.isArray(value.songs) || !Array.isArray(value.members)) {
    throw new Error("Catalog must contain songs and members");
  }

  const songIds = new Set<string>();
  const songs = value.songs.map((song, index) => {
    if (!song || typeof song !== "object") throw new Error(`Invalid song ${index + 1}`);
    const id = String(song.id ?? "").trim();
    const title = String(song.title ?? "").trim();
    const artist = String(song.artist ?? "").trim();
    const youtubeUrl = canonicalYoutubeUrl(String(song.youtubeUrl ?? ""));
    if (!id || !title || !youtubeUrl) throw new Error(`Song ${index + 1} is incomplete`);
    if (songIds.has(id)) throw new Error(`Duplicate song id: ${id}`);
    songIds.add(id);
    return { id, title, artist, youtubeUrl };
  });

  const memberIds = new Set<string>();
  const members = value.members.map((member, index) => {
    if (!member || typeof member !== "object") throw new Error(`Invalid member ${index + 1}`);
    const id = String(member.id ?? "").trim();
    const name = String(member.name ?? "").trim();
    const imageUrl = String(member.imageUrl ?? "").trim();
    const imageBlobPathname = String(member.imageBlobPathname ?? "").trim() || undefined;
    const picks = Array.isArray(member.picks)
      ? member.picks.map((pick) => String(pick).trim()).filter(Boolean)
      : [];
    const isPublished = Boolean(member.isPublished);

    if (!id || !name) throw new Error(`Member ${index + 1} is incomplete`);
    if (memberIds.has(id)) throw new Error(`Duplicate member id: ${id}`);
    if (picks.length > 3 || new Set(picks).size !== picks.length) {
      throw new Error(`${name} has invalid song picks`);
    }
    if (picks.some((pick) => !songIds.has(pick))) {
      throw new Error(`${name} refers to a missing song`);
    }
    if (isPublished && (!imageUrl || picks.length !== 3)) {
      throw new Error(`${name} needs an image and exactly three songs before publishing`);
    }

    memberIds.add(id);
    return {
      id,
      name,
      imageUrl,
      imageBlobPathname,
      isPublished,
      displayOrder: Number.isFinite(Number(member.displayOrder)) ? Number(member.displayOrder) : index,
      picks,
    };
  });

  return {
    version: Number.isFinite(Number(value.version)) ? Number(value.version) : 1,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date(0).toISOString(),
    songs,
    members,
  };
}

export function publicCatalog(catalog: SongMatchCatalog): SongMatchCatalog {
  const members = catalog.members
    .filter((member) => member.isPublished && member.picks.length === 3)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "th"));
  const usedSongIds = new Set(members.flatMap((member) => member.picks));

  return {
    ...catalog,
    members,
    songs: catalog.songs.filter((song) => usedSongIds.has(song.id)),
  };
}

