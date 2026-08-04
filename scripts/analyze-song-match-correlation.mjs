#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_FEEDBACK = "docs/song-match-analysis-2026-08-04.json";
const DEFAULT_ANALYSIS = "data/song-match-song-analysis.json";
const FEATURE_GROUPS = [
  { key: "moods", prefix: "mood", weight: 1 },
  { key: "styles", prefix: "style", weight: 0.7 },
  { key: "themes", prefix: "theme", weight: 1.25 },
  { key: "settings", prefix: "setting", weight: 0.6 },
  { key: "seasons", prefix: "season", weight: 0.5 },
];
const TARGET_RANK_WEIGHTS = [1, 0.72, 0.5];
const BEHAVIOR_RANK_WEIGHTS = [1, 0.7, 0.45];
const CURRENT_PARAMS = {
  behaviorWeight: 0.15,
  top3Blend: 0.75,
  tempoWeight: 0.1,
  rankWeights: TARGET_RANK_WEIGHTS,
  label: "current",
};

function optionValue(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const positional = args.find((value, index) => !value.startsWith("--") && (index === 0 || !args[index - 1].startsWith("--")));
  return {
    feedbackPath: resolve(positional ?? DEFAULT_FEEDBACK),
    analysisPath: resolve(optionValue(args, "--analysis", DEFAULT_ANALYSIS)),
    jsonPath: args.includes("--json") ? resolve(optionValue(args, "--json", "song-match-correlation.json")) : null,
    compact: args.includes("--compact"),
    noGrid: args.includes("--no-grid"),
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function memberSongIds(member) {
  return [...member.picks]
    .sort((a, b) => (typeof a === "string" ? 0 : a.rank) - (typeof b === "string" ? 0 : b.rank))
    .map((pick) => typeof pick === "string" ? pick : pick.songId);
}

function vectorMagnitude(vector) {
  let total = 0;
  for (const value of vector.values()) total += value * value;
  return Math.sqrt(total);
}

function normalizeVector(vector) {
  const magnitude = vectorMagnitude(vector);
  if (magnitude === 0) return vector;
  return new Map([...vector].map(([key, value]) => [key, value / magnitude]));
}

function cosineSimilarity(a, b) {
  if (a.size === 0 || b.size === 0) return 0.5;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [key, value] of small) dot += value * (large.get(key) ?? 0);
  const denominator = vectorMagnitude(a) * vectorMagnitude(b);
  return denominator > 0 ? Math.max(0, Math.min(1, dot / denominator)) : 0.5;
}

function analysisTokens(analysis) {
  const tokens = [
    [`energy:${analysis.energy}`, 0.45],
    [`valence:${analysis.valence}`, 0.45],
  ];
  for (const group of FEATURE_GROUPS) {
    for (const value of analysis[group.key]) tokens.push([`${group.prefix}:${value}`, group.weight]);
  }
  return tokens;
}

function createSongVectors(songIds, analysisById) {
  const analyses = songIds.flatMap((id) => {
    const analysis = analysisById.get(id);
    return analysis ? [{ id, analysis }] : [];
  });
  const documentFrequency = new Map();
  for (const { analysis } of analyses) {
    for (const token of new Set(analysisTokens(analysis).map(([value]) => value))) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }
  const documentCount = Math.max(1, analyses.length);
  return new Map(analyses.map(({ id, analysis }) => {
    const vector = new Map();
    for (const [token, groupWeight] of analysisTokens(analysis)) {
      const idf = Math.log((documentCount + 1) / ((documentFrequency.get(token) ?? 0) + 1)) + 1;
      vector.set(token, groupWeight * idf);
    }
    return [id, normalizeVector(vector)];
  }));
}

function createProfile(weightedSongs, songVectors, analysisById) {
  const vector = new Map();
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
    const tempo = analysisById.get(songId)?.tempo;
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
  };
}

function compareProfiles(a, b, tempoWeight) {
  const tagScore = cosineSimilarity(a.vector, b.vector);
  if (a.tempo === null || b.tempo === null || tempoWeight <= 0) return tagScore;
  const tempoScore = Math.max(0, 1 - Math.abs(a.tempo - b.tempo) / 80);
  return tagScore * (1 - tempoWeight) + tempoScore * tempoWeight;
}

function songResults(songIds, comparisons) {
  const points = Object.fromEntries(songIds.map((id) => [id, 0]));
  const games = Object.fromEntries(songIds.map((id) => [id, 0]));
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

function userTopSongs(songIds, comparisons, songById, count = 3) {
  const { points, games } = songResults(songIds, comparisons);
  return songIds
    .map((songId) => ({ songId, score: (points[songId] + 0.5) / (games[songId] + 1) }))
    .sort((a, b) => {
      const songA = songById.get(a.songId);
      const songB = songById.get(b.songId);
      return b.score - a.score ||
        (songA?.artist ?? "").localeCompare(songB?.artist ?? "") ||
        (songA?.title ?? a.songId).localeCompare(songB?.title ?? b.songId);
    })
    .slice(0, count)
    .map(({ songId }) => songId);
}

function comparisonWeights(comparisons) {
  const points = new Map();
  const appearances = new Map();
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

function memberAgreement(memberPicks, comparisons) {
  const preference = new Map(memberPicks.map((songId, index) => [songId, BEHAVIOR_RANK_WEIGHTS[index] ?? 0.35]));
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

function exactRankScore(userPicks, memberPicks) {
  const denominator = TARGET_RANK_WEIGHTS.reduce((sum, weight) => sum + weight * weight, 0);
  let score = 0;
  for (let userRank = 0; userRank < userPicks.length; userRank += 1) {
    const memberRank = memberPicks.indexOf(userPicks[userRank]);
    if (memberRank >= 0) score += TARGET_RANK_WEIGHTS[userRank] * TARGET_RANK_WEIGHTS[memberRank];
  }
  return score / denominator;
}

function exactOverlapCount(userPicks, memberPicks) {
  const memberSet = new Set(memberPicks);
  return userPicks.filter((songId) => memberSet.has(songId)).length;
}

function rankValues(values, descending = true) {
  const sorted = values.map((value, index) => ({ value, index })).sort((a, b) => descending ? b.value - a.value : a.value - b.value);
  const ranks = Array(values.length);
  for (let start = 0; start < sorted.length;) {
    let end = start + 1;
    while (end < sorted.length && Math.abs(sorted[end].value - sorted[start].value) < 1e-12) end += 1;
    const averageRank = (start + 1 + end) / 2;
    for (let index = start; index < end; index += 1) ranks[sorted[index].index] = averageRank;
    start = end;
  }
  return ranks;
}

function pearson(a, b) {
  if (a.length < 2 || b.length !== a.length) return 0;
  const meanA = a.reduce((sum, value) => sum + value, 0) / a.length;
  const meanB = b.reduce((sum, value) => sum + value, 0) / b.length;
  let numerator = 0;
  let sumA = 0;
  let sumB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const deltaA = a[index] - meanA;
    const deltaB = b[index] - meanB;
    numerator += deltaA * deltaB;
    sumA += deltaA * deltaA;
    sumB += deltaB * deltaB;
  }
  return sumA > 0 && sumB > 0 ? numerator / Math.sqrt(sumA * sumB) : 0;
}

function spearman(predictedScores, targetScores) {
  return pearson(rankValues(predictedScores), rankValues(targetScores));
}

function ndcgAt(rows, count = 5) {
  const dcg = (values) => values.slice(0, count).reduce((sum, relevance, index) =>
    sum + (2 ** relevance - 1) / Math.log2(index + 2), 0);
  const predicted = rows.map((row) => row.targetSimilarity);
  const ideal = [...predicted].sort((a, b) => b - a);
  const idealScore = dcg(ideal);
  return idealScore > 0 ? dcg(predicted) / idealScore : 0;
}

function mean(values) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function prepareRuns(feedback, analysisById) {
  const songById = new Map(feedback.songs.map((song) => [song.id, song]));
  const allMembers = feedback.members.filter((member) => member.isPublished).map((member, displayOrder) => ({
    id: member.id,
    name: member.name,
    displayOrder,
    picks: memberSongIds(member),
  }));

  return feedback.feedbackRuns.map((run) => {
    const runSongIds = [...new Set(run.comparisons.flatMap(({ songA, songB }) => [songA, songB]))];
    const runSongSet = new Set(runSongIds);
    const members = allMembers.filter((member) => member.picks.every((songId) => runSongSet.has(songId)));
    const baseCount = run.mode === "quick" ? Math.ceil(run.songCount / 2) : run.songCount;
    const baseComparisons = run.comparisons.slice(0, baseCount);
    const top3 = userTopSongs(runSongIds, run.comparisons, songById);
    const songVectors = createSongVectors(runSongIds, analysisById);
    const targetUserProfile = createProfile(top3.map((songId, index) => ({
      songId,
      weight: TARGET_RANK_WEIGHTS[index] ?? 0.35,
    })), songVectors, analysisById);
    const memberTargets = new Map(members.map((member) => {
      const targetMemberProfile = createProfile(member.picks.map((songId, index) => ({
        songId,
        weight: TARGET_RANK_WEIGHTS[index] ?? 0.35,
      })), songVectors, analysisById);
      return [member.id, {
        targetSimilarity: compareProfiles(targetUserProfile, targetMemberProfile, 0.1),
        exactRank: exactRankScore(top3, member.picks),
        exactOverlap: exactOverlapCount(top3, member.picks),
      }];
    }));
    return {
      run,
      songById,
      runSongIds,
      members,
      baseComparisons,
      top3,
      songVectors,
      memberTargets,
      fullUserProfile: createProfile(comparisonWeights(baseComparisons), songVectors, analysisById),
    };
  });
}

function scoreRun(context, params, analysisById) {
  const top3Profile = createProfile(context.top3.map((songId, index) => ({
    songId,
    weight: params.rankWeights[index] ?? 0.35,
  })), context.songVectors, analysisById);
  return context.members.map((member) => {
    const memberProfile = createProfile(member.picks.map((songId, index) => ({
      songId,
      weight: params.rankWeights[index] ?? 0.35,
    })), context.songVectors, analysisById);
    const fullContent = compareProfiles(context.fullUserProfile, memberProfile, params.tempoWeight);
    const top3Content = compareProfiles(top3Profile, memberProfile, params.tempoWeight);
    const content = fullContent * (1 - params.top3Blend) + top3Content * params.top3Blend;
    const behavior = memberAgreement(member.picks, context.baseComparisons);
    const score = behavior * params.behaviorWeight + content * (1 - params.behaviorWeight);
    return {
      member,
      score,
      behavior,
      fullContent,
      top3Content,
      ...context.memberTargets.get(member.id),
    };
  }).sort((a, b) => b.score - a.score || b.top3Content - a.top3Content || a.member.displayOrder - b.member.displayOrder);
}

function evaluate(contexts, params, analysisById) {
  const runReports = contexts.map((context) => {
    const rows = scoreRun(context, params, analysisById);
    const top5 = rows.slice(0, 5);
    return {
      sessionId: context.run.sessionId,
      mode: context.run.mode,
      rating: context.run.rating,
      top3: context.top3,
      rows,
      top5,
      top1Similarity: top5[0]?.targetSimilarity ?? 0,
      top5Similarity: mean(top5.map((row) => row.targetSimilarity)),
      top1ExactRank: top5[0]?.exactRank ?? 0,
      top5ExactRank: mean(top5.map((row) => row.exactRank)),
      top5ExactOverlap: mean(top5.map((row) => row.exactOverlap)),
      spearman: spearman(rows.map((row) => row.score), rows.map((row) => row.targetSimilarity)),
      ndcg5: ndcgAt(rows, 5),
    };
  });
  const metrics = {
    top1Similarity: mean(runReports.map((run) => run.top1Similarity)),
    top5Similarity: mean(runReports.map((run) => run.top5Similarity)),
    top1ExactRank: mean(runReports.map((run) => run.top1ExactRank)),
    top5ExactRank: mean(runReports.map((run) => run.top5ExactRank)),
    top5ExactOverlap: mean(runReports.map((run) => run.top5ExactOverlap)),
    spearman: mean(runReports.map((run) => run.spearman)),
    ndcg5: mean(runReports.map((run) => run.ndcg5)),
  };
  metrics.objective = metrics.top1Similarity * 0.45 +
    metrics.top5Similarity * 0.25 +
    metrics.ndcg5 * 0.2 +
    ((metrics.spearman + 1) / 2) * 0.1;
  return { params, metrics, runReports };
}

function parameterGrid() {
  const rankSets = [
    { label: "steep", values: [1, 0.55, 0.25] },
    { label: "current", values: [1, 0.72, 0.5] },
    { label: "flat", values: [1, 0.82, 0.65] },
  ];
  const candidates = [];
  for (const behaviorWeight of [0.15, 0.25, 0.35, 0.45]) {
    for (const top3Blend of [0, 0.25, 0.5, 0.75]) {
      for (const tempoWeight of [0, 0.05, 0.1]) {
        for (const rankSet of rankSets) {
          candidates.push({
            behaviorWeight,
            top3Blend,
            tempoWeight,
            rankWeights: rankSet.values,
            label: rankSet.label,
          });
        }
      }
    }
  }
  return candidates;
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function songLabel(songId, songById) {
  const song = songById.get(songId);
  return song ? `${song.title} — ${song.artist}` : songId;
}

function paramsLabel(params) {
  return `behavior=${params.behaviorWeight.toFixed(2)} top3Blend=${params.top3Blend.toFixed(2)} tempo=${params.tempoWeight.toFixed(2)} ranks=${params.label}[${params.rankWeights.join(",")}]`;
}

function printMetrics(label, evaluation) {
  const metric = evaluation.metrics;
  console.log(`\n${label}: ${paramsLabel(evaluation.params)}`);
  console.log(`  objective=${metric.objective.toFixed(4)} top1=${percent(metric.top1Similarity)} top5=${percent(metric.top5Similarity)} Spearman=${metric.spearman.toFixed(3)} NDCG@5=${metric.ndcg5.toFixed(3)}`);
  console.log(`  exact-rank top1=${percent(metric.top1ExactRank)} top5=${percent(metric.top5ExactRank)} exact-overlap/top5-member=${metric.top5ExactOverlap.toFixed(2)} songs`);
}

function serializableEvaluation(evaluation) {
  return {
    params: evaluation.params,
    metrics: evaluation.metrics,
    runs: evaluation.runReports.map((run) => ({
      sessionId: run.sessionId,
      mode: run.mode,
      rating: run.rating,
      top3: run.top3,
      top1Similarity: run.top1Similarity,
      top5Similarity: run.top5Similarity,
      top1ExactRank: run.top1ExactRank,
      top5ExactRank: run.top5ExactRank,
      top5ExactOverlap: run.top5ExactOverlap,
      spearman: run.spearman,
      ndcg5: run.ndcg5,
      top5: run.top5.map((row) => ({
        memberId: row.member.id,
        memberName: row.member.name,
        memberPicks: row.member.picks,
        score: row.score,
        targetSimilarity: row.targetSimilarity,
        exactRank: row.exactRank,
        exactOverlap: row.exactOverlap,
      })),
    })),
  };
}

function main() {
  const options = parseArgs();
  const feedback = readJson(options.feedbackPath);
  const analysisData = readJson(options.analysisPath);
  const analysisById = new Map(analysisData.songs.map((song) => [song.id, song.analysis]));
  const contexts = prepareRuns(feedback, analysisById);
  const current = evaluate(contexts, CURRENT_PARAMS, analysisById);

  console.log("Song Match Top-3 Correlation Analysis");
  console.log(`feedback=${options.feedbackPath}`);
  console.log(`analysis=${options.analysisPath}`);
  console.log(`runs=${contexts.length} songs-with-analysis=${analysisById.size}`);
  console.log("Target: rank-weighted similarity between the player's final Top 3 and each member's Top 3.");
  printMetrics("CURRENT", current);

  if (!options.compact) {
    for (const report of current.runReports) {
      const context = contexts.find((item) => item.run.sessionId === report.sessionId);
      console.log(`\nRUN ${report.sessionId.slice(0, 8)} mode=${report.mode} rating=${report.rating}`);
      console.log(`  USER 1–3: ${report.top3.map((songId, index) => `${index + 1}. ${songLabel(songId, context.songById)}`).join(" | ")}`);
      report.top5.forEach((row, index) => {
        const picks = row.member.picks.map((songId, rank) => `${rank + 1}.${songLabel(songId, context.songById)}`).join(" / ");
        console.log(`  #${index + 1} ${row.member.name}: game=${percent(row.score)} top3-sim=${percent(row.targetSimilarity)} exact=${row.exactOverlap}/3 rank-exact=${percent(row.exactRank)}`);
        console.log(`      ${picks}`);
      });
      console.log(`  run-correlation: Spearman=${report.spearman.toFixed(3)} NDCG@5=${report.ndcg5.toFixed(3)}`);
    }
  }

  let grid = [];
  if (!options.noGrid) {
    grid = parameterGrid()
      .map((params) => evaluate(contexts, params, analysisById))
      .sort((a, b) => b.metrics.objective - a.metrics.objective);
    console.log("\nTOP GRID CANDIDATES (diagnostic, not automatic truth)");
    grid.slice(0, 10).forEach((evaluation, index) => printMetrics(`#${index + 1}`, evaluation));
  }

  if (options.jsonPath) {
    writeFileSync(options.jsonPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      feedbackPath: options.feedbackPath,
      analysisPath: options.analysisPath,
      current: serializableEvaluation(current),
      grid: grid.slice(0, 25).map((evaluation) => ({ params: evaluation.params, metrics: evaluation.metrics })),
    }, null, 2) + "\n");
    console.log(`\nJSON written to ${options.jsonPath}`);
  }
}

main();
