import { NextRequest, NextResponse } from "next/server";

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
  const single = SINGLES[searchParams.get("single") ?? ""];
  const cdnName = MEMBERS[searchParams.get("member") ?? ""];

  if (!single || !cdnName)
    return NextResponse.json({ error: "Invalid single or member" }, { status: 400 });

  const url = `https://img.bnk48cdn.net/others/${single.folder}/half/H_${cdnName}.png`;
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; bot)" },
  });

  if (!res.ok)
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });

  const buffer = await res.arrayBuffer();
  const filename = `${searchParams.get("member")}_${single.label}.png`;

  return new NextResponse(buffer, {
    headers: {
      "content-type": "image/png",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
