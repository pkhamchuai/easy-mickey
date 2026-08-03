const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function youtubeVideoId(value: string): string | null {
  const trimmed = value.trim();
  if (VIDEO_ID_PATTERN.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && VIDEO_ID_PATTERN.test(id) ? id : null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && VIDEO_ID_PATTERN.test(fromQuery)) return fromQuery;

      const segments = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(segments[0] ?? "")) {
        const id = segments[1];
        return id && VIDEO_ID_PATTERN.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function canonicalYoutubeUrl(value: string): string | null {
  const id = youtubeVideoId(value);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

