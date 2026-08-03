import { songAnalysisById, type SongAnalysis } from "./song-analysis";
import type { SongComparison, SongMatchCatalog, SongMatchMember } from "./types";

type Vector = Map<string, number>;

export type TasteProfile = {
  vector: Vector;
  tempo: number | null;
  songCount: number;
};

export type TasteSimilarity = {
  score: number;
  tagScore: number;
  tempoScore: number | null;
  sharedTraits: string[];
};

export type ExplicitNetworkMatch = TasteSimilarity & {
  member: SongMatchMember;
};

const FEATURE_GROUPS: Array<{
  key: "moods" | "styles" | "themes" | "settings" | "seasons";
  prefix: string;
  weight: number;
}> = [
  { key: "moods", prefix: "mood", weight: 1 },
  { key: "styles", prefix: "style", weight: 0.7 },
  { key: "themes", prefix: "theme", weight: 1.25 },
  { key: "settings", prefix: "setting", weight: 0.6 },
  { key: "seasons", prefix: "season", weight: 0.5 },
];

const MEMBER_RANK_WEIGHTS = [1, 0.72, 0.5];
const MINIMUM_MEMBER_RESULTS = 5;
const MAXIMUM_MEMBER_RESULTS = 7;
const CLOSE_RESULT_MARGIN = 0.01;

export function selectCloseResults<T extends { score: number }>(ranked: T[]) {
  const minimumCount = Math.min(MINIMUM_MEMBER_RESULTS, ranked.length);
  const fifthPlaceScore = ranked[minimumCount - 1]?.score;
  if (fifthPlaceScore === undefined) return [];

  let resultCount = minimumCount;
  while (
    resultCount < Math.min(MAXIMUM_MEMBER_RESULTS, ranked.length) &&
    fifthPlaceScore - ranked[resultCount].score < CLOSE_RESULT_MARGIN
  ) {
    resultCount += 1;
  }
  return ranked.slice(0, resultCount);
}

function analysisTokens(analysis: SongAnalysis) {
  const tokens: Array<[string, number]> = [
    [`energy:${analysis.energy}`, 0.45],
    [`valence:${analysis.valence}`, 0.45],
  ];

  for (const group of FEATURE_GROUPS) {
    for (const value of analysis[group.key]) tokens.push([`${group.prefix}:${value}`, group.weight]);
  }
  return tokens;
}

function vectorMagnitude(vector: Vector) {
  let total = 0;
  for (const value of vector.values()) total += value * value;
  return Math.sqrt(total);
}

function normalizeVector(vector: Vector): Vector {
  const magnitude = vectorMagnitude(vector);
  if (magnitude === 0) return vector;
  return new Map([...vector].map(([key, value]) => [key, value / magnitude]));
}

function cosineSimilarity(a: Vector, b: Vector) {
  if (a.size === 0 || b.size === 0) return 0.5;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [key, value] of small) dot += value * (large.get(key) ?? 0);
  const denominator = vectorMagnitude(a) * vectorMagnitude(b);
  return denominator > 0 ? Math.max(0, Math.min(1, dot / denominator)) : 0.5;
}

function createSongVectors(catalog: SongMatchCatalog) {
  const analyses = catalog.songs.flatMap((song) => {
    const analysis = songAnalysisById.get(song.id);
    return analysis ? [{ id: song.id, analysis }] : [];
  });
  const documentFrequency = new Map<string, number>();

  for (const { analysis } of analyses) {
    const uniqueTokens = new Set(analysisTokens(analysis).map(([token]) => token));
    for (const token of uniqueTokens) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
  }

  const documentCount = Math.max(1, analyses.length);
  return new Map(analyses.map(({ id, analysis }) => {
    const vector = new Map<string, number>();
    for (const [token, groupWeight] of analysisTokens(analysis)) {
      const idf = Math.log((documentCount + 1) / ((documentFrequency.get(token) ?? 0) + 1)) + 1;
      vector.set(token, groupWeight * idf);
    }
    return [id, normalizeVector(vector)] as const;
  }));
}

function createProfile(
  catalog: SongMatchCatalog,
  weightedSongs: Array<{ songId: string; weight: number }>,
): TasteProfile {
  const songVectors = createSongVectors(catalog);
  const vector = new Map<string, number>();
  let vectorWeight = 0;
  let tempoTotal = 0;
  let tempoWeight = 0;

  for (const { songId, weight } of weightedSongs) {
    if (weight <= 0) continue;
    const songVector = songVectors.get(songId);
    if (songVector) {
      vectorWeight += weight;
      for (const [token, value] of songVector) vector.set(token, (vector.get(token) ?? 0) + value * weight);
    }
    const tempo = songAnalysisById.get(songId)?.tempo;
    if (typeof tempo === "number") {
      tempoTotal += tempo * weight;
      tempoWeight += weight;
    }
  }

  if (vectorWeight > 0) {
    for (const [token, value] of vector) vector.set(token, value / vectorWeight);
  }

  return {
    vector: normalizeVector(vector),
    tempo: tempoWeight > 0 ? tempoTotal / tempoWeight : null,
    songCount: weightedSongs.filter(({ weight }) => weight > 0).length,
  };
}

function comparisonWeights(comparisons: SongComparison[]) {
  const points = new Map<string, number>();
  const appearances = new Map<string, number>();

  for (const comparison of comparisons) {
    appearances.set(comparison.songA, (appearances.get(comparison.songA) ?? 0) + 1);
    appearances.set(comparison.songB, (appearances.get(comparison.songB) ?? 0) + 1);
    const outcome = comparison.outcome ?? "pick";
    if (outcome === "tie") {
      points.set(comparison.songA, (points.get(comparison.songA) ?? 0) + 0.5);
      points.set(comparison.songB, (points.get(comparison.songB) ?? 0) + 0.5);
    } else if (outcome === "pick" && comparison.winner) {
      points.set(comparison.winner, (points.get(comparison.winner) ?? 0) + 1);
    }
  }

  return [...appearances].flatMap(([songId, count]) => {
    const preference = (points.get(songId) ?? 0) / count;
    return preference > 0 ? [{ songId, weight: preference * preference }] : [];
  });
}

function sharedTraits(a: Vector, b: Vector) {
  return [...a]
    .flatMap(([token, value]) => {
      const overlap = value * (b.get(token) ?? 0);
      return overlap > 0 ? [{ token, overlap }] : [];
    })
    .sort((left, right) => right.overlap - left.overlap)
    .slice(0, 4)
    .map(({ token }) => token.replace(/^[^:]+:/, ""));
}

export function compareTasteProfiles(a: TasteProfile, b: TasteProfile): TasteSimilarity {
  const tagScore = cosineSimilarity(a.vector, b.vector);
  const tempoScore = a.tempo !== null && b.tempo !== null
    ? Math.max(0, 1 - Math.abs(a.tempo - b.tempo) / 80)
    : null;
  const score = tempoScore === null ? tagScore : tagScore * 0.9 + tempoScore * 0.1;
  return {
    score,
    tagScore,
    tempoScore,
    sharedTraits: sharedTraits(a.vector, b.vector),
  };
}

export function memberTasteProfile(catalog: SongMatchCatalog, member: SongMatchMember) {
  return createProfile(catalog, member.picks.map((songId, index) => ({
    songId,
    weight: MEMBER_RANK_WEIGHTS[index] ?? 0.35,
  })));
}

export function comparisonTasteProfile(catalog: SongMatchCatalog, comparisons: SongComparison[]) {
  return createProfile(catalog, comparisonWeights(comparisons));
}

export function memberContentAgreement(
  catalog: SongMatchCatalog,
  member: SongMatchMember,
  comparisons: SongComparison[],
) {
  return compareTasteProfiles(comparisonTasteProfile(catalog, comparisons), memberTasteProfile(catalog, member));
}

export function explicitTasteNetwork(
  catalog: SongMatchCatalog,
  rankedSongIds: string[],
): ExplicitNetworkMatch[] {
  const userProfile = createProfile(catalog, rankedSongIds.map((songId, index) => ({
    songId,
    weight: MEMBER_RANK_WEIGHTS[index] ?? 0.35,
  })));
  return catalog.members
    .map((member) => ({ member, ...compareTasteProfiles(userProfile, memberTasteProfile(catalog, member)) }))
    .sort((a, b) => b.score - a.score || a.member.displayOrder - b.member.displayOrder);
}

export function memberPairSimilarity(catalog: SongMatchCatalog, a: SongMatchMember, b: SongMatchMember) {
  return compareTasteProfiles(memberTasteProfile(catalog, a), memberTasteProfile(catalog, b)).score;
}
