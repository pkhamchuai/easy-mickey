import { memberContentAgreement, memberRankedContentAgreement, selectCloseResults } from "./network";
import type { SongComparison, SongMatchCatalog, SongMatchMember } from "./types";

export type SongPair = [string, string];

const SONG_SCORE_PRIOR_GAMES = 1;
const SONG_SCORE_PRIOR_POINTS = 0.5;
const BEHAVIOR_SCORE_WEIGHT = 0.15;
const CONTENT_SCORE_WEIGHT = 1 - BEHAVIOR_SCORE_WEIGHT;

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

function songResults(songIds: string[], comparisons: SongComparison[]) {
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

  return { points, games };
}

export function songPreferenceScores(songIds: string[], comparisons: SongComparison[]) {
  const { points, games } = songResults(songIds, comparisons);
  return Object.fromEntries(
    songIds.map((id) => [id, (points[id] + SONG_SCORE_PRIOR_POINTS) / (games[id] + SONG_SCORE_PRIOR_GAMES)]),
  ) as Record<string, number>;
}

function comparisonPairKey(songA: string, songB: string) {
  return songA < songB ? `${songA}\u0000${songB}` : `${songB}\u0000${songA}`;
}

export function createAdaptiveSongPairs(songIds: string[], comparisons: SongComparison[]): SongPair[] {
  const uniqueSongIds = [...new Set(songIds)];
  const { points, games } = songResults(uniqueSongIds, comparisons);
  const comparedPairs = new Set(comparisons.map(({ songA, songB }) => comparisonPairKey(songA, songB)));
  const perfectSongs = shuffle(uniqueSongIds.filter((songId) => games[songId] > 0 && points[songId] === games[songId]));
  const pairs: SongPair[] = [];

  while (perfectSongs.length > 1) {
    const songA = perfectSongs.shift()!;
    const opponentIndex = perfectSongs.findIndex((songB) => !comparedPairs.has(comparisonPairKey(songA, songB)));
    if (opponentIndex < 0) continue;
    const [songB] = perfectSongs.splice(opponentIndex, 1);
    comparedPairs.add(comparisonPairKey(songA, songB));
    pairs.push(Math.random() < 0.5 ? [songA, songB] : [songB, songA]);
  }

  return pairs;
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

export function matchMembers(
  catalog: SongMatchCatalog,
  comparisons: SongComparison[],
  rankedSongIds: string[] = [],
) {
  const scores = songPreferenceScores(catalog.songs.map((song) => song.id), comparisons);
  const ranked = catalog.members
    .map((member) => {
      const behaviorScore = memberAgreement(member, comparisons);
      const fullContent = memberContentAgreement(catalog, member, comparisons);
      const topThreeContent = rankedSongIds.length > 0
        ? memberRankedContentAgreement(catalog, member, rankedSongIds.slice(0, 3))
        : fullContent;
      const contentScore = fullContent.score * 0.25 + topThreeContent.score * 0.75;
      return {
        member,
        // Final Top 3 carries most weight, while base answers still stabilize sparse direct matches.
        score: Math.min(0.95, behaviorScore * BEHAVIOR_SCORE_WEIGHT + contentScore * CONTENT_SCORE_WEIGHT),
        behaviorScore,
        contentScore,
        tempoScore: topThreeContent.tempoScore,
        sharedTraits: topThreeContent.sharedTraits,
        rankScores: member.picks.map((songId) => scores[songId] ?? 0.5),
      };
    })
    .sort((a, b) =>
      b.score - a.score ||
      b.contentScore - a.contentScore ||
      b.rankScores[0] - a.rankScores[0] ||
      b.rankScores[1] - a.rankScores[1] ||
      b.rankScores[2] - a.rankScores[2] ||
      a.member.displayOrder - b.member.displayOrder
    );

  return selectCloseResults(ranked);
}
