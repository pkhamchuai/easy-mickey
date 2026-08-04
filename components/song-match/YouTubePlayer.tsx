"use client";

import { useEffect, useId, useState } from "react";

const PLAY_EVENT = "easy-mickey:youtube-play";

type YouTubePlayerProps = {
  videoId: string;
  title: string;
  className?: string;
};

export function YouTubePlayer({ videoId, title, className = "" }: YouTubePlayerProps) {
  const instanceId = useId();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    function stopWhenAnotherVideoStarts(event: Event) {
      const detail = (event as CustomEvent<{ instanceId?: string }>).detail;
      if (detail?.instanceId !== instanceId) setPlaying(false);
    }

    window.addEventListener(PLAY_EVENT, stopWhenAnotherVideoStarts);
    return () => window.removeEventListener(PLAY_EVENT, stopWhenAnotherVideoStarts);
  }, [instanceId]);

  function play() {
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { instanceId } }));
    setPlaying(true);
  }

  return (
    <div className={`relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#13131e] ${className}`}>
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={play}
          className="group relative h-full w-full overflow-hidden"
          aria-label={`เล่น ${title}`}
        >
          {/* YouTube มี thumbnail ตาม Video ID อยู่แล้ว จึงไม่ต้องจัดเก็บรูปเพิ่ม */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-200 group-hover:scale-[1.02] group-hover:brightness-110"
          />
          <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" />
          <span className="absolute left-1/2 top-1/2 flex h-12 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-red-600/95 text-2xl text-white shadow-lg transition group-hover:scale-105 group-hover:bg-red-500" aria-hidden="true">
            ▶
          </span>
        </button>
      )}
    </div>
  );
}
