import test from "node:test";
import assert from "node:assert/strict";
import { parsePrediction, predictionFromReport, rankedMembers, formatTokens, formatPredictionTime } from "../lib/ge-prediction.ts";

function fixture() {
  return {
    schemaVersion: 1, method: "genetic_latest", asOf: "2026-11-04T12:00:00Z", exportedAt: "2026-11-04T13:00:00Z",
    totalTokens: "37", unassignedTokens: "1",
    members: Array.from({ length: 36 }, (_, i) => ({ slug: `member-${i}`, name: `Member ${i}`, group: i % 2 ? "BNK48" : "CGM48", tokens: "1" })),
  };
}

test("validates all members and conserves the unassigned bucket", () => {
  const parsed = parsePrediction(fixture());
  assert.equal(parsed.members.length, 36);
  assert.equal(parsed.totalTokens, "37");
  assert.equal(parsed.unassignedTokens, "1");
  assert.equal(parsed.asOf, "2026-11-04T12:00:00.000Z");
});

test("ranking preserves exact 18 decimal precision and does not mutate input", () => {
  const members = [
    { slug: "a", tokens: "100.000000000000000001" },
    { slug: "b", tokens: "100.000000000000000002" },
  ];
  assert.equal(rankedMembers(members)[0].slug, "b");
  assert.equal(members[0].slug, "a");
});

test("rejects malformed, incomplete or inconsistent imports", () => {
  for (const mutate of [
    data => { data.members.pop(); },
    data => { data.members[0].tokens = "-1"; },
    data => { data.members[0].tokens = "1e5"; },
    data => { data.members[0].tokens = "1.0000000000000000001"; },
    data => { data.members[0].tokens = 1; },
    data => { data.members[0].group = "unknown"; },
    data => { data.members[0].slug = "__unassigned__"; },
    data => { data.members[0].slug = data.members[1].slug; },
    data => { data.totalTokens = "32"; },
    data => { data.unassignedTokens = "34"; },
    data => { data.asOf = "2026-11-04 12:00:00"; },
    data => { data.method = "custom"; },
  ]) {
    const data = fixture(); mutate(data);
    assert.throws(() => parsePrediction(data));
  }
});

test("export uses latest GA results, excludes unknown from rankings and strips private fields", () => {
  const data = fixture();
  const report = {
    genetic: { available: true }, totals: { genetic_latest: "37", genetic: "5" },
    method_metadata: { genetic_latest: { latest_timestamp: data.asOf, loaded_at: data.exportedAt } },
    members: [...data.members.map(member => ({ ...member, wallet: "private", amounts: { genetic_latest: member.tokens, genetic: "0" } })),
      { slug: "__unassigned__", amounts: { genetic_latest: "1" } }],
    wallets: ["private"],
  };
  const exported = predictionFromReport(report);
  assert.equal(exported.members.length, 36);
  assert.equal(exported.totalTokens, "37");
  assert.equal(exported.asOf, "2026-11-04T12:00:00.000Z");
  assert.ok(!JSON.stringify(exported).includes("private"));
  report.genetic.available = false;
  assert.throws(() => predictionFromReport(report));
});

test("formats tokens precisely and displays Bangkok time", () => {
  assert.equal(formatTokens("999.999999999999999999"), "1,000.00");
  assert.equal(formatTokens("1.234"), "1.23");
  assert.equal(formatTokens("100000000000000000000000.01"), "100,000,000,000,000,000,000,000.01");
  assert.match(formatPredictionTime("2026-11-04T12:00:00Z"), /19:00:00/);
});
