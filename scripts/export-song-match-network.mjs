#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const DEFAULT_CATALOG_URL = "https://easy-mickey.vercel.app/api/song-match/catalog";
const DEFAULT_ANALYSIS_PATH = "data/song-match-song-analysis.json";
const WIDTH = 3600;
const HEIGHT = 2600;
const NODE_RADIUS = 68;
const RANK_WEIGHTS = [1, 0.72, 0.5];
const MEMBER_GROUP_OVERRIDES = new Map([
  ["member-1975750f-2578-4a2c-ab44-a1b46ecb9f2a", "BNK48"], // Khaimook
  ["member-a8510240-2e34-4bbb-8c4f-1fe1fdfd3591", "CGM48"], // Nisha
]);
const FEATURE_GROUPS = [
  { key: "moods", prefix: "mood", weight: 1 },
  { key: "styles", prefix: "style", weight: 0.7 },
  { key: "themes", prefix: "theme", weight: 1.25 },
  { key: "settings", prefix: "setting", weight: 0.6 },
  { key: "seasons", prefix: "season", weight: 0.5 },
];

function optionValue(args, name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(`Usage: npm run export:song-match-network -- [options]

Options:
  --neighbors <count>    Closest taste-neighbors per member (default: 3)
  --perplexity <number>  t-SNE neighborhood size (default: 6)
  --catalog-url <url>    Public Song Match catalog endpoint
  --analysis <path>      Song analysis JSON path
  --output <path>        Output path without extension
  --help                 Show this help`);
    return null;
  }
  const neighbors = Number(optionValue(args, "--neighbors", "3"));
  const perplexity = Number(optionValue(args, "--perplexity", "6"));
  if (!Number.isInteger(neighbors) || neighbors < 1) {
    throw new Error("--neighbors must be a positive integer");
  }
  if (!Number.isFinite(perplexity) || perplexity <= 1) {
    throw new Error("--perplexity must be greater than 1");
  }
  return {
    catalogUrl: optionValue(args, "--catalog-url", DEFAULT_CATALOG_URL),
    analysisPath: resolve(optionValue(args, "--analysis", DEFAULT_ANALYSIS_PATH)),
    outputBase: optionValue(args, "--output"),
    neighbors,
    perplexity,
  };
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function dateInTimeZone(value, timeZone) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}`;
}

function magnitude(vector) {
  return Math.sqrt([...vector.values()].reduce((sum, value) => sum + value * value, 0));
}

function normalize(vector) {
  const size = magnitude(vector);
  return size > 0 ? new Map([...vector].map(([key, value]) => [key, value / size])) : vector;
}

function cosine(a, b) {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [key, value] of small) dot += value * (large.get(key) ?? 0);
  const denominator = magnitude(a) * magnitude(b);
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

function createSongVectors(catalog, analysisById) {
  const analyses = catalog.songs.flatMap((song) => {
    const analysis = analysisById.get(song.id);
    return analysis ? [{ id: song.id, analysis }] : [];
  });
  const documentFrequency = new Map();
  for (const { analysis } of analyses) {
    for (const token of new Set(analysisTokens(analysis).map(([value]) => value))) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }
  return new Map(analyses.map(({ id, analysis }) => {
    const vector = new Map();
    for (const [token, groupWeight] of analysisTokens(analysis)) {
      const idf = Math.log((analyses.length + 1) / ((documentFrequency.get(token) ?? 0) + 1)) + 1;
      vector.set(token, groupWeight * idf);
    }
    return [id, normalize(vector)];
  }));
}

function memberProfile(member, songVectors, analysisById) {
  const vector = new Map();
  let vectorWeight = 0;
  let tempoTotal = 0;
  let tempoWeight = 0;
  member.picks.forEach((songId, index) => {
    const weight = RANK_WEIGHTS[index] ?? 0.35;
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
  });
  if (vectorWeight > 0) {
    for (const [token, value] of vector) vector.set(token, value / vectorWeight);
  }
  return { vector: normalize(vector), tempo: tempoWeight > 0 ? tempoTotal / tempoWeight : null };
}

function similarity(a, b) {
  const tagScore = cosine(a.vector, b.vector);
  if (a.tempo === null || b.tempo === null) return tagScore;
  const tempoScore = Math.max(0, 1 - Math.abs(a.tempo - b.tempo) / 80);
  return tagScore * 0.9 + tempoScore * 0.1;
}

function pairSimilarities(members, profiles) {
  const pairs = [];
  const matrix = Array.from({ length: members.length }, (_, index) =>
    Array.from({ length: members.length }, (__, other) => index === other ? 1 : 0));
  for (let a = 0; a < members.length; a += 1) {
    for (let b = a + 1; b < members.length; b += 1) {
      const score = similarity(profiles[a], profiles[b]);
      pairs.push({ a, b, score });
      matrix[a][b] = score;
      matrix[b][a] = score;
    }
  }
  return { pairs, matrix };
}

function networkEdges(members, pairs, neighborCount) {
  const selected = new Map();
  members.forEach((_, index) => {
    pairs
      .filter(({ a, b }) => a === index || b === index)
      .sort((left, right) => right.score - left.score)
      .slice(0, neighborCount)
      .forEach((edge) => selected.set(`${edge.a}:${edge.b}`, edge));
  });
  return [...selected.values()].sort((a, b) => a.score - b.score);
}

function hash(value) {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return result >>> 0;
}

function jointProbabilities(similarityMatrix, perplexity) {
  const count = similarityMatrix.length;
  const targetEntropy = Math.log(Math.min(perplexity, count - 1));
  const conditional = Array.from({ length: count }, () => Array(count).fill(0));

  for (let row = 0; row < count; row += 1) {
    const distances = similarityMatrix[row].map((score, column) =>
      row === column ? 0 : (1 - score) ** 2);
    let beta = 1;
    let lower = -Infinity;
    let upper = Infinity;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const weights = distances.map((distance, column) =>
        row === column ? 0 : Math.exp(-distance * beta));
      const total = Math.max(1e-12, weights.reduce((sum, value) => sum + value, 0));
      const weightedDistance = weights.reduce((sum, value, column) => sum + value * distances[column], 0);
      const entropy = Math.log(total) + beta * weightedDistance / total;
      if (Math.abs(entropy - targetEntropy) < 1e-6) {
        conditional[row] = weights.map((value) => value / total);
        break;
      }
      if (entropy > targetEntropy) {
        lower = beta;
        beta = Number.isFinite(upper) ? (beta + upper) / 2 : beta * 2;
      } else {
        upper = beta;
        beta = Number.isFinite(lower) ? (beta + lower) / 2 : beta / 2;
      }
      conditional[row] = weights.map((value) => value / total);
    }
  }

  return conditional.map((values, row) => values.map((value, column) =>
    row === column ? 0 : Math.max(1e-12, (value + conditional[column][row]) / (2 * count))));
}

function tsneLayout(members, similarityMatrix, perplexity) {
  const count = members.length;
  const probabilities = jointProbabilities(similarityMatrix, perplexity);
  const coordinates = members.map((member) => [
    ((hash(`${member.id}:x`) / 0xffffffff) - 0.5) * 0.02,
    ((hash(`${member.id}:y`) / 0xffffffff) - 0.5) * 0.02,
  ]);
  const velocity = members.map(() => [0, 0]);

  for (let iteration = 0; iteration < 1200; iteration += 1) {
    const numerators = Array.from({ length: count }, () => Array(count).fill(0));
    let denominator = 0;
    for (let a = 0; a < count; a += 1) {
      for (let b = a + 1; b < count; b += 1) {
        const dx = coordinates[a][0] - coordinates[b][0];
        const dy = coordinates[a][1] - coordinates[b][1];
        const value = 1 / (1 + dx * dx + dy * dy);
        numerators[a][b] = value;
        numerators[b][a] = value;
        denominator += value * 2;
      }
    }

    const gradients = members.map(() => [0, 0]);
    const exaggeration = iteration < 250 ? 4 : 1;
    for (let a = 0; a < count; a += 1) {
      for (let b = 0; b < count; b += 1) {
        if (a === b) continue;
        const q = numerators[a][b] / Math.max(1e-12, denominator);
        const force = 4 * (probabilities[a][b] * exaggeration - q) * numerators[a][b];
        gradients[a][0] += force * (coordinates[a][0] - coordinates[b][0]);
        gradients[a][1] += force * (coordinates[a][1] - coordinates[b][1]);
      }
    }

    const momentum = iteration < 250 ? 0.5 : 0.82;
    const learningRate = 110;
    for (let index = 0; index < count; index += 1) {
      velocity[index][0] = momentum * velocity[index][0] - learningRate * gradients[index][0];
      velocity[index][1] = momentum * velocity[index][1] - learningRate * gradients[index][1];
      coordinates[index][0] += velocity[index][0];
      coordinates[index][1] += velocity[index][1];
    }
    const meanX = coordinates.reduce((sum, point) => sum + point[0], 0) / count;
    const meanY = coordinates.reduce((sum, point) => sum + point[1], 0) / count;
    for (const point of coordinates) {
      point[0] -= meanX;
      point[1] -= meanY;
    }
  }

  const minX = Math.min(...coordinates.map(([x]) => x));
  const maxX = Math.max(...coordinates.map(([x]) => x));
  const minY = Math.min(...coordinates.map(([, y]) => y));
  const maxY = Math.max(...coordinates.map(([, y]) => y));
  const targets = coordinates.map(([x, y]) => ({
    x: 260 + (x - minX) / Math.max(1e-9, maxX - minX) * (WIDTH - 520),
    y: 340 + (y - minY) / Math.max(1e-9, maxY - minY) * (HEIGHT - 650),
  }));
  const positions = targets.map((point) => ({ ...point }));
  const halfWidths = members.map((member) => Math.max(NODE_RADIUS + 10, member.name.length * 8.5));
  const labelCenterOffsetY = 31;
  const halfHeight = 108;

  for (let iteration = 0; iteration < 340; iteration += 1) {
    for (let a = 0; a < count; a += 1) {
      for (let b = a + 1; b < count; b += 1) {
        const dx = positions[b].x - positions[a].x;
        const dy = (positions[b].y + labelCenterOffsetY) - (positions[a].y + labelCenterOffsetY);
        const overlapX = halfWidths[a] + halfWidths[b] + 24 - Math.abs(dx);
        const overlapY = halfHeight * 2 + 20 - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        if (overlapX < overlapY) {
          const direction = dx === 0
            ? (hash(`${members[a].id}:${members[b].id}:x`) % 2 ? 1 : -1)
            : Math.sign(dx);
          const push = overlapX * 0.52 * direction;
          positions[a].x -= push;
          positions[b].x += push;
        } else {
          const direction = dy === 0
            ? (hash(`${members[a].id}:${members[b].id}:y`) % 2 ? 1 : -1)
            : Math.sign(dy);
          const push = overlapY * 0.52 * direction;
          positions[a].y -= push;
          positions[b].y += push;
        }
      }
    }
    positions.forEach((point, index) => {
      point.x += (targets[index].x - point.x) * 0.012;
      point.y += (targets[index].y - point.y) * 0.012;
      point.x = Math.max(halfWidths[index] + 30, Math.min(WIDTH - halfWidths[index] - 30, point.x));
      point.y = Math.max(300, Math.min(HEIGHT - 320, point.y));
    });
  }
  return positions;
}

function memberGroup(member) {
  if (member.name.includes("CGM48")) return "CGM48";
  if (member.name.includes("BNK48")) return "BNK48";
  const override = MEMBER_GROUP_OVERRIDES.get(member.id);
  if (override) return override;
  throw new Error(`Unknown member group: ${member.name} (${member.id})`);
}

function groupColor(member) {
  return memberGroup(member) === "CGM48" ? "#7fbf75" : "#8a77c8";
}

async function imageDataUrl(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const normalized = await sharp(buffer)
      .autoOrient()
      .resize(320, 320, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${normalized.toString("base64")}`;
  } catch {
    return null;
  }
}

async function main() {
  const options = parseArgs();
  if (!options) return;
  const [catalogResponse, analysisText] = await Promise.all([
    fetch(options.catalogUrl),
    readFile(options.analysisPath, "utf8"),
  ]);
  if (!catalogResponse.ok) throw new Error(`Catalog request failed: ${catalogResponse.status}`);
  const catalog = await catalogResponse.json();
  catalog.members.forEach(memberGroup);
  const analysisData = JSON.parse(analysisText);
  const analysisById = new Map(analysisData.songs.map((song) => [song.id, song.analysis]));
  const songVectors = createSongVectors(catalog, analysisById);
  const profiles = catalog.members.map((member) => memberProfile(member, songVectors, analysisById));
  const { pairs, matrix } = pairSimilarities(catalog.members, profiles);
  const edges = networkEdges(catalog.members, pairs, options.neighbors);
  const positions = tsneLayout(catalog.members, matrix, options.perplexity);
  const images = await Promise.all(catalog.members.map((member) => imageDataUrl(member.imageUrl)));
  const strongest = Math.max(...edges.map(({ score }) => score));
  const weakest = Math.min(...edges.map(({ score }) => score));
  const catalogDate = dateInTimeZone(catalog.updatedAt, "Asia/Bangkok");
  const outputBase = resolve(
    options.outputBase ?? `.local/song-match/network/song-match-member-network-${catalogDate}`,
  );

  const edgeSvg = edges.map((edge) => {
    const from = positions[edge.a];
    const to = positions[edge.b];
    const strength = (edge.score - weakest) / Math.max(0.001, strongest - weakest);
    const width = 2 + strength * 8;
    const opacity = 0.18 + strength * 0.52;
    return `<line x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" stroke="#b77aa3" stroke-width="${width.toFixed(1)}" stroke-opacity="${opacity.toFixed(2)}"><title>${escapeXml(catalog.members[edge.a].name)} ↔ ${escapeXml(catalog.members[edge.b].name)}: ${(edge.score * 100).toFixed(1)}%</title></line>`;
  }).join("\n");

  const definitions = catalog.members.map((member, index) => {
    const point = positions[index];
    return `<clipPath id="clip-${index}"><circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${NODE_RADIUS - 6}"/></clipPath>`;
  }).join("\n");

  const nodeSvg = catalog.members.map((member, index) => {
    const point = positions[index];
    const color = groupColor(member);
    const image = images[index]
      ? `<image href="${images[index]}" x="${(point.x - NODE_RADIUS).toFixed(1)}" y="${(point.y - NODE_RADIUS).toFixed(1)}" width="${NODE_RADIUS * 2}" height="${NODE_RADIUS * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-${index})"/>`
      : `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${NODE_RADIUS - 6}" fill="${color}"/><text x="${point.x.toFixed(1)}" y="${(point.y + 15).toFixed(1)}" text-anchor="middle" font-size="42" font-weight="700" fill="white">${escapeXml(member.name.slice(0, 1))}</text>`;
    const labelWidth = Math.max(180, member.name.length * 17);
    return `<g>
      <circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${NODE_RADIUS + 5}" fill="white" stroke="${color}" stroke-width="11"/>
      ${image}
      <rect x="${(point.x - labelWidth / 2).toFixed(1)}" y="${(point.y + NODE_RADIUS + 13).toFixed(1)}" width="${labelWidth}" height="48" rx="24" fill="#fffafc" stroke="${color}" stroke-width="3"/>
      <text x="${point.x.toFixed(1)}" y="${(point.y + NODE_RADIUS + 46).toFixed(1)}" text-anchor="middle" font-size="28" font-weight="650" fill="#3d2736">${escapeXml(member.name)}</text>
    </g>`;
  }).join("\n");

  const updated = new Date(catalog.updatedAt).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>${definitions}</defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#fff8fb"/>
  <circle cx="${WIDTH / 2}" cy="${HEIGHT / 2 + 100}" r="1120" fill="#ffffff" stroke="#f1dce8" stroke-width="4"/>
  <text x="180" y="120" font-family="Arial, sans-serif" font-size="62" font-weight="800" fill="#3d2736">Song Match Member Taste Network</text>
  <text x="180" y="180" font-family="Arial, sans-serif" font-size="30" fill="#76586c">${catalog.members.length} members · ${catalog.songs.length} songs · t-SNE-style layout (perplexity ${options.perplexity}) · top ${options.neighbors} neighbors · updated ${escapeXml(updated)} ICT</text>
  <g font-family="Arial, sans-serif">${edgeSvg}</g>
  <g font-family="Arial, sans-serif">${nodeSvg}</g>
  <g transform="translate(180,2450)" font-family="Arial, sans-serif">
    <circle cx="0" cy="0" r="15" fill="#7fbf75"/><text x="28" y="10" font-size="28" fill="#654b5c">CGM48</text>
    <circle cx="165" cy="0" r="15" fill="#8a77c8"/><text x="193" y="10" font-size="28" fill="#654b5c">BNK48</text>
    <line x1="330" y1="0" x2="430" y2="0" stroke="#b77aa3" stroke-width="3" stroke-opacity="0.3"/><text x="450" y="10" font-size="28" fill="#654b5c">thicker line = closer taste</text>
  </g>
</svg>`;

  await mkdir(dirname(outputBase), { recursive: true });
  await writeFile(`${outputBase}.svg`, svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(`${outputBase}.png`);
  console.log(JSON.stringify({
    svg: `${outputBase}.svg`,
    png: `${outputBase}.png`,
    members: catalog.members.length,
    songs: catalog.songs.length,
    neighbors: options.neighbors,
    perplexity: options.perplexity,
    edges: edges.length,
    similarity: { minimum: weakest, maximum: strongest },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
