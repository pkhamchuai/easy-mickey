import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { toolsAuthorized } from "@/lib/tools-auth";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  if (!toolsAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob is not configured. Connect a public Vercel Blob store first." },
      { status: 503 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }
    if (!IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Use a JPEG, PNG, or WebP image up to 3 MB" }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
    const blob = await put(`song-match/members/${crypto.randomUUID()}.${extension}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

