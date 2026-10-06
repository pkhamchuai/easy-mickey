import { NextRequest, NextResponse } from "next/server";
import { fetchCgm48Profile } from "@/lib/cgm48-profile";

const SINGLES: Record<string, { folder: string; label: string }> = {
  album3: { folder: "cgm48-10th-single", label: "Album3" },
  single10: { folder: "cgm48-11th-single", label: "Single10" },
  single11: { folder: "cgm48-let-me-know-single", label: "Single11" },
};

const MEMBERS: Record<string, string> = {
  Chifa: "Chifa",
  Else: "Else",
  Emma: "Emma",
  Ginna: "Ginna",
  Hongyok: "Hongyok",
  Jingjing: "Jingjing",
  Kwan: "Kwan",
  Lewlew: "Lewlew",
  Lingling: "Lingling",
  Lookked: "Lookked",
  Namphet: "Namphet",
  Nana: "Nana",
  Nisha: "Nisha",
  Ploen: "Ploen",
  Prae: "Prae",
  Praifa: "Praifa",
  Punpon: "Punpon",
  Satangpound: "Satangpound",
  Shanae: "Shenae",
  Tara: "Tara",
  Valentine: "Valentine",
};

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const singleId = searchParams.get("single") ?? "";
  const single = SINGLES[singleId];
  const cdnName = MEMBERS[searchParams.get("member") ?? ""];

  if ((!single && singleId !== "latest") || !cdnName)
    return NextResponse.json({ error: "Invalid single or member" }, { status: 400 });

  try {
    const url = singleId === "latest"
      ? (await fetchCgm48Profile(new URL(`https://cgm48official.com/members/${cdnName.toLowerCase()}`))).imageUrl
      : `https://img.bnk48cdn.net/others/${single.folder}/half/H_${cdnName}.png`;
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; bot)" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok)
      return NextResponse.json({ error: "Fetch failed" }, { status: 502 });

    const buffer = await res.arrayBuffer();
    const ext = new URL(url).pathname.split(".").pop();
    const filename = `${searchParams.get("member")}_${singleId === "latest" ? "Latest" : single.label}.${ext}`;

    return new NextResponse(buffer, {
      headers: {
        "content-type": res.headers.get("content-type") ?? "image/png",
        "content-disposition": `${searchParams.get("preview") === "1" ? "inline" : "attachment"}; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "โหลดภาพไม่สำเร็จ กรุณาลองใหม่" }, { status: 502 });
  }
}
