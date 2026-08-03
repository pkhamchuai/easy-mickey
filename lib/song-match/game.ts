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
  const points = Object.fromEntries(songIds.map((id) => [id, 0])) as Record<string, number>;
  const games = Object.fromEntries(songIds.map((id) => [id, 0])) as Record<string, number>;

  for (const comparison of comparisons) {
    games[comparison.songA] = (games[comparison.songA] ?? 0) + 1;
    games[comparison.songB] = (games[comparison.songB] ?? 0) + 1;
    const outcome = comparison.outcome ?? "pick";
    if (outcome === "tie") {
      points[comparison.songA] = (points[comparison.songA] ?? 0) + 0.5;
      points[comparison.songB] = (points[comparison.songB] ?? 0) + 0.5;
    } else if (outcome === "pick" && comparison.winner) {
      points[comparison.winner] = (points[comparison.winner] ?? 0) + 1;
    }
  }

  return Object.fromEntries(
    songIds.map((id) => [id, games[id] > 0 ? points[id] / games[id] : 0.5]),
  ) as Record<string, number>;
}

function memberAgreement(member: SongMatchMember, comparisons: SongComparison[]) {
  const rankWeights = [1, 0.7, 0.45];
  const preference = new Map(member.picks.map((songId, index) => [songId, rankWeights[index]]));
  let matchedWeight = 0;
  let relevantWeight = 0;

  for (const comparison of comparisons) {
    const songAWeight = preference.get(comparison.songA) ?? 0;
    const songBWeight = preference.get(comparison.songB) ?? 0;
    if (songAWeight === songBWeight) continue;

    const weight = Math.max(songAWeight, songBWeight);
    relevantWeight += weight;
    const outcome = comparison.outcome ?? "pick";
    if (outcome === "tie") {
      matchedWeight += weight * 0.5;
    } else if (outcome === "pick") {
      const predictedWinner = songAWeight > songBWeight ? comparison.songA : comparison.songB;
      if (comparison.winner === predictedWinner) matchedWeight += weight;
    }
  }

  return relevantWeight > 0 ? matchedWeight / relevantWeight : 0.5;
}

export function matchMembers(catalog: SongMatchCatalog, comparisons: SongComparison[]) {
  const scores = songPreferenceScores(catalog.songs.map((song) => song.id), comparisons);
  return catalog.members
    .map((member) => ({
      member,
      score: memberAgreement(member, comparisons),
      rankScores: member.picks.map((songId) => scores[songId] ?? 0.5),
    }))
    .sort((a, b) =>
      b.score - a.score ||
      b.rankScores[0] - a.rankScores[0] ||
      b.rankScores[1] - a.rankScores[1] ||
      b.rankScores[2] - a.rankScores[2] ||
      a.member.displayOrder - b.member.displayOrder
    )
    .slice(0, 5);
}
