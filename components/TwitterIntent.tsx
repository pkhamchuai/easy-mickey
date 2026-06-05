function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

const tweetText =
  "\n#HongyokCGM48 🐭🍀";
const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

export function TwitterIntent() {
  return (
    <section className="pb-2">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
        แชร์บน X / Twitter
      </h2>

      <div className="space-y-2">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0d1a20] to-[#0a0f1a] py-4 text-base font-semibold text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.1)] transition-all hover:border-cyan-400/60 hover:text-cyan-200 hover:shadow-[0_0_32px_rgba(34,211,238,0.2)] active:scale-95"
        >
          <XIcon />
          โพสต์เชียร์หงษ์หยก
        </a>

        <a
          href="/tweets"
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#2a2a3d] bg-[#13131e] py-3 text-sm font-medium text-[#9896b0] transition-all hover:border-cyan-500/30 hover:text-[#f0eff8] active:scale-95"
        >
          โพสต์ X ด้วยข้อความอื่นๆ
        </a>
      </div>

      <p className="mt-2 text-center text-xs text-[#6a6880]">
        คลิกเพื่อโพสต์บน X พร้อม #HongyokCGM48
      </p>
    </section>
  );
}
