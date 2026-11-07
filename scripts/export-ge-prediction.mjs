#!/usr/bin/env node
// Node.js 24+ (native TypeScript support). The source repository is read only.
import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { predictionFromReport } from "../lib/ge-prediction.ts";

const { values } = parseArgs({ options: {
  repo: { type: "string", default: "../bnk48-ge4-repo" },
  url: { type: "string" },
  output: { type: "string", default: ".local/ge-prediction.json" },
  help: { type: "boolean" },
} });
if (values.help) {
  console.log(`Usage: npm run export:ge-prediction -- [--repo ../bnk48-ge4-repo] [--output file.json]
       npm run export:ge-prediction -- --url http://localhost:8000

Exports GA seed-11 predictions with exponential-decay redistribution, the latest vote timestamp,
all member totals and the unassigned total. No wallets are exported.
Requires Node.js 24+ and the source repository's Python dependencies.`);
  process.exit(0);
}

try {
  let report;
  if (values.url) {
    const response = await fetch(new URL("/api/reports/ge2026/prelim2", values.url), { signal: AbortSignal.timeout(300_000) });
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
    report = await response.json();
  } else {
    const repo = resolve(values.repo);
    process.env.SQLITE_DB ||= resolve(repo, "monitor_state.sqlite3");
    const { prelim2Summary } = await import(pathToFileURL(resolve(repo, "web/prelim-report.mjs")).href);
    const { closeProjectionSource } = await import(pathToFileURL(resolve(repo, "web/genetic-projection.mjs")).href);
    try { report = await prelim2Summary(); } finally { closeProjectionSource(); }
  }
  const prediction = predictionFromReport(report);
  const output = resolve(values.output);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(prediction, null, 2) + "\n");
  console.log(`Exported ${prediction.members.length} members, as of ${prediction.asOf}\n${output}`);
} catch (error) {
  console.error(`Export failed: ${error.message}`);
  process.exitCode = 1;
}
