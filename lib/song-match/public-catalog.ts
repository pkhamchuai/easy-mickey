import { publicCatalog } from "./catalog";
import { fallbackCatalog, readSongMatchCatalog } from "./db";

export async function readPublicSongMatchCatalog() {
  try {
    return publicCatalog((await readSongMatchCatalog()) ?? fallbackCatalog);
  } catch {
    return publicCatalog(fallbackCatalog);
  }
}
