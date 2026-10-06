export function isCgm48MemberUrl(url: URL) {
  return url.protocol === "https:" && url.hostname === "cgm48official.com" &&
    /^\/members\/[a-z0-9-]+\/?$/.test(url.pathname);
}

export function parseCgm48Profile(html: string) {
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((value) => /\bproperty\s*=\s*["']og:image["']/i.test(value));
  const image = tag?.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1]
    .replace(/&amp;/g, "&");
  if (!image) throw new Error("ไม่พบภาพโปรไฟล์ในหน้า CGM48");

  const imageUrl = new URL(image);
  if (imageUrl.protocol !== "https:" || imageUrl.hostname !== "img.bnk48cdn.net" ||
      !/\.(png|jpe?g|webp)$/i.test(imageUrl.pathname)) {
    throw new Error("ลิงก์ภาพโปรไฟล์ CGM48 ไม่ถูกต้อง");
  }

  const member = html.match(/class\s*=\s*["']nickname["'][^>]*>\s*([^<]+)/i)?.[1].trim() ?? "Unknown";
  return { imageUrl: imageUrl.href, member };
}

export async function fetchCgm48Profile(url: URL) {
  if (!isCgm48MemberUrl(url)) throw new Error("ลิงก์โปรไฟล์ CGM48 ไม่ถูกต้อง");
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; bot)" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error("โหลดหน้าโปรไฟล์ CGM48 ไม่สำเร็จ");
  return parseCgm48Profile(await res.text());
}
