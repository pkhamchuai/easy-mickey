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

export function createSongPairs(songIds: string[], limit = 25): SongPair[] {
  const songCount = new Set(songIds).size;
  if (songCount < 2 || limit < 1) return [];

  const rotation: Array<string | null> = shuffle([...new Set(songIds)]);
  if (rotation.length % 2 !== 0) rotation.push(null);

  const maximumPairs = songCount * (songCount - 1) / 2;
  const target = Math.min(limit, maximumPairs);
  const pairs: SongPair[] = [];

  // Round-robin ทำให้แต่ละเพลงปรากฏครั้งหนึ่งต่อรอบ ก่อนเริ่มรอบถัดไป
  for (let round = 0; round < rotation.length - 1 && pairs.length < target; round += 1) {
    for (let index = 0; index < rotation.length / 2 && pairs.length < target; index += 1) {
      const songA = rotation[index];
      const songB = rotation[rotation.length - 1 - index];
      if (songA && songB) {
        pairs.push(Math.random() < 0.5 ? [songA, songB] : [songB, songA]);
      }
    }

    const last = rotation.pop();
    if (last !== undefined) rotation.splice(1, 0, last);
  }

  return pairs;
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
    .slice(0, 5);
}
