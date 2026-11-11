"use client";

import { useEffect, useRef, useState } from "react";
import type { TrackedPage } from "@/lib/page-views-store";

export function PageViewCounter({ page }: { page: TrackedPage }) {
  const [views, setViews] = useState<string | null>(null);
  const request = useRef<{ page: TrackedPage; result: Promise<string> } | null>(null);

  useEffect(() => {
    let active = true;
    // Reuse the request when React runs the effect twice in development.
    if (request.current?.page !== page) {
      request.current = {
        page,
        result: fetch(`/api/page-views?page=${page}`, { method: "POST", cache: "no-store" })
          .then(async response => {
            if (!response.ok) throw new Error("Page views unavailable");
            const data = await response.json();
            if (typeof data.views !== "string" || !/^\d+$/.test(data.views)) {
              throw new Error("Invalid page views response");
            }
            return data.views as string;
          }),
      };
    }
    request.current.result.then(count => {
      if (active) setViews(count);
    }).catch(() => {
      if (active) setViews(null);
    });
    return () => { active = false; };
  }, [page]);

  return (
    <p className="text-center text-xs text-[#9896b0]" aria-live="polite">
      ยอดเข้าชมหน้านี้ {views === null ? "—" : `${BigInt(views).toLocaleString("th-TH")} ครั้ง`}
    </p>
  );
}
