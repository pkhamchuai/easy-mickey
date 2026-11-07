export type PredictionMember = {
  slug: string;
  name: string;
  group: "BNK48" | "CGM48";
  tokens: string;
};

export type Prediction = {
  schemaVersion: 1;
  method: "genetic_latest" | "prediction";
  seed?: number;
  decay?: number;
  asOf: string;
  exportedAt: string;
  totalTokens: string;
  unassignedTokens: string;
  members: PredictionMember[];
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("รูปแบบข้อมูลไม่ถูกต้อง");
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim() || value.length > 120) throw new Error(`${field} ไม่ถูกต้อง`);
  return value.trim();
}

function timestamp(value: unknown, field: string): string {
  const result = text(value, field);
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(result) || !Number.isFinite(Date.parse(result))) throw new Error(`${field} ต้องเป็นเวลา ISO พร้อมเขตเวลา`);
  return new Date(result).toISOString();
}

function tokens(value: unknown): string {
  if (typeof value !== "string" || !/^\d{1,24}(\.\d{1,18})?$/.test(value)) throw new Error("จำนวน tokens ต้องเป็นข้อความตัวเลขที่ไม่ติดลบ และมีทศนิยมไม่เกิน 18 ตำแหน่ง");
  return value;
}

export function tokenUnits(value: string): bigint {
  const [whole, fraction = ""] = tokens(value).split(".");
  return BigInt(whole) * BigInt("1000000000000000000") + BigInt(fraction.padEnd(18, "0"));
}

export function rankedMembers(members: PredictionMember[]): PredictionMember[] {
  return [...members].sort((a, b) => {
    const left = tokenUnits(a.tokens), right = tokenUnits(b.tokens);
    return left === right ? a.slug.localeCompare(b.slug) : left > right ? -1 : 1;
  });
}

export function parsePrediction(value: unknown): Prediction {
  const data = record(value);
  if (data.schemaVersion !== 1 || (data.method !== "genetic_latest" && data.method !== "prediction")) throw new Error("ไฟล์ต้องเป็นผลคาดการณ์ prediction หรือ genetic_latest เวอร์ชัน 1");
  if (data.method === "prediction" && (data.seed !== 11 || typeof data.decay !== "number" || !Number.isFinite(data.decay) || data.decay <= 0 || data.decay > 1)) {
    throw new Error("ผล prediction ต้องใช้ GA seed 11 และค่า exponential decay ที่ถูกต้อง");
  }
  if (!Array.isArray(data.members) || data.members.length < 36 || data.members.length > 128) throw new Error("ต้องมีเมมเบอร์ 36–128 คน");
  const slugs = new Set<string>();
  const names = new Set<string>();
  const members = data.members.map((value): PredictionMember => {
    const row = record(value);
    const slug = text(row.slug, "slug"), name = text(row.name, "ชื่อเมมเบอร์");
    if (row.group !== "BNK48" && row.group !== "CGM48") throw new Error(`วงของ ${name} ต้องเป็น BNK48 หรือ CGM48`);
    const key = `${row.group}:${name.toLowerCase()}`;
    if (slug === "__unassigned__" || slugs.has(slug) || names.has(key)) throw new Error("รายชื่อเมมเบอร์ซ้ำหรือมีรายการยังไม่ระบุปนอยู่");
    slugs.add(slug); names.add(key);
    return { slug, name, group: row.group, tokens: tokens(row.tokens) };
  });
  const totalTokens = tokens(data.totalTokens), unassignedTokens = tokens(data.unassignedTokens);
  if (data.method === "prediction" && tokenUnits(unassignedTokens) !== BigInt(0)) throw new Error("ผล prediction ต้องแบ่งโหวตที่ยังไม่ระบุครบแล้ว");
  const sum = members.reduce((total, member) => total + tokenUnits(member.tokens), tokenUnits(unassignedTokens));
  if (sum !== tokenUnits(totalTokens)) throw new Error("ยอดโหวตรวมไม่ตรงกับยอดของเมมเบอร์ทั้งหมดบวกยอดยังไม่ระบุ");
  return {
    schemaVersion: 1, method: data.method,
    ...(data.method === "prediction" ? { seed: 11, decay: data.decay as number } : {}),
    asOf: timestamp(data.asOf, "เวลาอ้างอิง"), exportedAt: timestamp(data.exportedAt, "เวลา export"),
    totalTokens, unassignedTokens, members: rankedMembers(members),
  };
}

// Export only aggregate results; wallet-level data never enters the public file.
export function predictionFromReport(value: unknown): Prediction {
  const report = record(value);
  if (record(report.genetic).available !== true) throw new Error("ยังไม่มีผล GA ที่พร้อมใช้งาน");
  const metadata = record(record(report.method_metadata).prediction);
  const model = record(metadata.prediction);
  if (record(report.genetic).seed !== 11 || model.seed !== 11) throw new Error("ต้องใช้ผล GA seed 11 + exponential decay");
  if (!metadata.latest_timestamp) throw new Error("ไม่พบเวลาโหวตล่าสุดในข้อมูลต้นทาง");
  if (!Array.isArray(report.members)) throw new Error("ไม่พบรายชื่อเมมเบอร์");
  const members = report.members.map(record);
  const unknown = members.filter(member => member.slug === "__unassigned__");
  if (unknown.length !== 1) throw new Error("ต้องมีรายการยังไม่ระบุหนึ่งรายการ");
  return parsePrediction({
    schemaVersion: 1, method: "prediction", seed: 11, decay: model.decay, asOf: metadata.latest_timestamp,
    exportedAt: new Date().toISOString(), totalTokens: record(report.totals).prediction,
    unassignedTokens: record(unknown[0].amounts).prediction,
    members: members.filter(member => member.slug !== "__unassigned__").map(member => ({
      slug: member.slug, name: member.name, group: member.group,
      tokens: record(member.amounts).prediction,
    })),
  });
}

export function formatTokens(value: string): string {
  // Round at two decimal places without converting an 18-decimal amount to float.
  const rounded = (tokenUnits(value) + BigInt("5000000000000000")) / BigInt("10000000000000000");
  return `${(rounded / BigInt(100)).toLocaleString("en-US")}.${(rounded % BigInt(100)).toString().padStart(2, "0")}`;
}

export function formatMaskedTokens(value: string): string {
  const hundreds = tokenUnits(value) / BigInt("100000000000000000000");
  if (hundreds === BigInt(0)) return "XX.XX";
  const visible = (hundreds * BigInt(100)).toLocaleString("en-US");
  return `${visible.slice(0, -2)}XX.XX`;
}

export function formatPredictionTime(value: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long", timeStyle: "medium", timeZone: "Asia/Bangkok",
  }).format(new Date(value)) + " น. (เวลาไทย)";
}
