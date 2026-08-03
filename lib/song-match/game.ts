import type { SongComparison, SongMatchCatalog, SongMatchMember } from "./types";

export type SongPair = [string, string];

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

export function createSongPairs(songIds: string[], limit = 25): SongPair[] {
  const shuffledSongs = shuffle([...new Set(songIds)]);
  const coverage: SongPair[] = [];
  const seen = new Set<string>();

  for (let index = 0; index + 1 < shuffledSongs.length && coverage.length < limit; index += 2) {
    const pair: SongPair = [shuffledSongs[index], shuffledSongs[index + 1]];
    coverage.push(pair);
    seen.add(pairKey(...pair));
  }

  const candidates: SongPair[] = [];
  for (let a = 0; a < shuffledSongs.length; a += 1) {
    for (let b = a + 1; b < shuffledSongs.length; b += 1) {
      const pair: SongPair = [shuffledSongs[a], shuffledSongs[b]];
      if (!seen.has(pairKey(...pair))) candidates.push(pair);
    }
  }

  return [...coverage, ...shuffle(candidates)].slice(0, limit);
}

export function songPreferenceScores(songIds: string[], comparisons: SongComparison[]) {
  const wins = Object.fromEntries(songIds.map((id) => [id, 0])) as Record<string, number>;
  const games = Object.fromEntries(songIds.map((id) => [id, 0])) as Record<string, number>;

  for (const comparison of comparisons) {
    games[comparison.songA] = (games[comparison.songA] ?? 0) + 1;
    games[comparison.songB] = (games[comparison.songB] ?? 0) + 1;
    wins[comparison.winner] = (wins[comparison.winner] ?? 0) + 1;
  }

  return Object.fromEntries(
    songIds.map((id) => [id, games[id] > 0 ? (wins[id] + 1) / (games[id] + 2) : 0.5]),
  ) as Record<string, number>;
}

function memberScore(member: SongMatchMember, scores: Record<string, number>) {
  const weights = [1, 0.65, 0.4];
  const taste = member.picks.reduce((total, songId, index) => total + (scores[songId] ?? 0.5) * weights[index], 0) /
    weights.reduce((total, weight) => total + weight, 0);
  const orderPairs: Array<[number, number]> = [[0, 1], [0, 2], [1, 2]];
  const order = orderPairs.reduce((total, [higher, lower]) => {
    const higherScore = scores[member.picks[higher]] ?? 0.5;
    const lowerScore = scores[member.picks[lower]] ?? 0.5;
    return total + (higherScore > lowerScore ? 1 : higherScore === lowerScore ? 0.5 : 0);
  }, 0) / orderPairs.length;
  return 0.8 * taste + 0.2 * order;
}

export function matchMembers(catalog: SongMatchCatalog, comparisons: SongComparison[]) {
  const scores = songPreferenceScores(catalog.songs.map((song) => song.id), comparisons);
  return catalog.members
    .map((member) => ({ member, score: memberScore(member, scores) }))
    .sort((a, b) => b.score - a.score || a.member.displayOrder - b.member.displayOrder)
    .slice(0, 3);
}

