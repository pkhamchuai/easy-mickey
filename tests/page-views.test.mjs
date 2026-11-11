import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = await readFile(new URL("../lib/page-views-store.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

function loadStore(directory) {
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require: name => name === "server-only" ? {} : require(name),
    process: { cwd: () => directory, env: {} },
  });
  return exports;
}

test("concurrent visits remain separate by page and persist across store reloads", async () => {
  const directory = await mkdtemp(join(tmpdir(), "easy-mickey-views-"));
  try {
    const store = loadStore(directory);
    const counts = await Promise.all([
      ...Array.from({ length: 40 }, () => store.incrementPageViews("home")),
      ...Array.from({ length: 20 }, () => store.incrementPageViews("prediction")),
    ]);
    assert.equal(new Set(counts.slice(0, 40)).size, 40);
    assert.equal(new Set(counts.slice(40)).size, 20);
    assert.deepEqual(JSON.parse(await readFile(join(directory, "data/page-views.json"), "utf8")), {
      home: "40", prediction: "20",
    });
    const reloaded = loadStore(directory);
    assert.equal(await reloaded.incrementPageViews("home"), "41");
    assert.equal(await reloaded.incrementPageViews("prediction"), "21");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a failed local write does not prevent later visits from being counted", async () => {
  const directory = await mkdtemp(join(tmpdir(), "easy-mickey-views-"));
  try {
    const store = loadStore(directory);
    await store.incrementPageViews("home");
    const file = join(directory, "data/page-views.json");
    await writeFile(file, "broken JSON");
    await assert.rejects(store.incrementPageViews("home"));
    await writeFile(file, JSON.stringify({ home: "9007199254740992" }));
    assert.equal(await store.incrementPageViews("home"), "9007199254740993");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
