"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { analyzeAnswerPattern } from "@/lib/song-match/answer-quality";
import { createSongPairs, matchMembers, type SongPair } from "@/lib/song-match/game";
import type { SongComparison, SongMatchCatalog, SongMatchGameMode } from "@/lib/song-match/types";
import { youtubeVideoId } from "@/lib/song-match/youtube";

const STORAGE_KEY = "easy-mickey:song-match:v5";

type GameMode = SongMatchGameMode;

const GAME_MODES: Record<GameMode, { label: string; description: string }> = {
  quick: {
    label: "โหมดเร็ว",
    description: "ทุกเพลงปรากฏอย่างน้อย 1 ครั้ง",
  },
  detailed: {
    label: "โหมดละเอียด",
    description: "ทุกเพลงปรากฏอย่างน้อย 2 ครั้ง",
  },
};

function questionCountForMode(mode: GameMode, songCount: number) {
  const coverageCount = mode === "quick" ? Math.ceil(songCount / 2) : songCount;
  const maximumPairs = songCount * (songCount - 1) / 2;
  return Math.min(coverageCount, maximumPairs);
}

type SavedGame = {
  catalogVersion: number;
  sessionId: string;
  mode: GameMode;
  pairs: SongPair[];
  comparisons: SongComparison[];
};

function isGameMode(value: unknown): value is GameMode {
  return value === "quick" || value === "detailed";
}

function formatCatalogUpdatedAt(value: string) {
  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) return null;

  const date = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(updatedAt);
  const time = new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Bangkok",
  }).format(updatedAt);

  return { date, time };
}

function readSavedGame(catalogVersion: number): SavedGame | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as SavedGame | null;
    return parsed?.catalogVersion === catalogVersion && typeof parsed.sessionId === "string" && isGameMode(parsed.mode) && Array.isArray(parsed.pairs) && Array.isArray(parsed.comparisons)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function TasteMatchGame() {
  const [catalog, setCatalog] = useState<SongMatchCatalog | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [screen, setScreen] = useState<"intro" | "playing" | "result">("intro");
  const [pairs, setPairs] = useState<SongPair[]>([]);
  const [comparisons, setComparisons] = useState<SongComparison[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>("quick");
  const [canResume, setCanResume] = useState(false);
  const [resumeMode, setResumeMode] = useState<GameMode | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetch("/api/song-match/catalog", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("โหลดข้อมูลเกมไม่สำเร็จ");
        return response.json() as Promise<SongMatchCatalog>;
      })
      .then((data) => {
        setCatalog(data);
        const saved = readSavedGame(data.version);
        setCanResume(Boolean(saved && saved.comparisons.length < saved.pairs.length));
        setResumeMode(saved?.mode ?? null);
      })
      .catch((error) => setLoadingError(error instanceof Error ? error.message : "โหลดข้อมูลเกมไม่สำเร็จ"));
  }, []);

  const songById = useMemo(() => new Map(catalog?.songs.map((song) => [song.id, song]) ?? []), [catalog]);
  const currentPair = pairs[comparisons.length];

  const answer = useCallback((winner: string) => {
    if (!catalog || !currentPair || !sessionId) return;
    const next = [...comparisons, { songA: currentPair[0], songB: currentPair[1], winner }];
    const isFinished = next.length >= pairs.length;
    setComparisons(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ catalogVersion: catalog.version, sessionId, mode: gameMode, pairs, comparisons: next } satisfies SavedGame));
    if (isFinished) setScreen("result");
  }, [catalog, comparisons, currentPair, gameMode, pairs, sessionId]);

  useEffect(() => {
    if (screen !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "a" && currentPair) answer(currentPair[0]);
      if (event.key.toLowerCase() === "b" && currentPair) answer(currentPair[1]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer, currentPair, screen]);

  function startNewGame(mode: GameMode) {
    if (!catalog) return;
    const nextSessionId = crypto.randomUUID();
    const nextPairs = createSongPairs(
      catalog.songs.map((song) => song.id),
      questionCountForMode(mode, catalog.songs.length),
    );
    setGameMode(mode);
    setPairs(nextPairs);
    setComparisons([]);
    setSessionId(nextSessionId);
    setFeedbackRating(null);
    setFeedbackStatus(null);
    setCanResume(false);
    setResumeMode(null);
    localStorage.removeItem(STORAGE_KEY);
    setScreen("playing");
  }

  function resumeGame() {
    if (!catalog) return;
    const saved = readSavedGame(catalog.version);
    if (!saved) return startNewGame(gameMode);
    setGameMode(saved.mode);
    setPairs(saved.pairs);
    setComparisons(saved.comparisons);
    setSessionId(saved.sessionId);
    setFeedbackRating(null);
    setFeedbackStatus(null);
    setScreen(saved.comparisons.length >= saved.pairs.length ? "result" : "playing");
  }

  async function submitFeedback(rating: number) {
    if (!catalog || !sessionId || comparisons.length !== pairs.length) return;
    setSubmittingFeedback(true);
    setFeedbackStatus(null);
    try {
      const results = matchMembers(catalog, comparisons);
      const response = await fetch("/api/song-match/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          catalogVersion: catalog.version,
          mode: gameMode,
          questionCount: comparisons.length,
          rating,
          songCount: catalog.songs.length,
          memberCount: catalog.members.length,
          comparisons,
          results: results.map(({ member, score }) => ({ memberId: member.id, score })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "ส่ง Feedback ไม่สำเร็จ");
      setFeedbackRating(rating);
      setFeedbackStatus("ขอบคุณสำหรับ Feedback ✓");
    } catch (error) {
      setFeedbackStatus(error instanceof Error ? error.message : "ส่ง Feedback ไม่สำเร็จ");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  if (loadingError) return <StateMessage>{loadingError}</StateMessage>;
  if (!catalog) return <StateMessage>กำลังโหลดเกม…</StateMessage>;
  if (catalog.songs.length < 2 || catalog.members.length === 0) {
    return <StateMessage>ข้อมูลเกมยังไม่พร้อม กรุณาเพิ่มอย่างน้อย 1 เมมและ 2 เพลง</StateMessage>;
  }

  if (screen === "intro") {
    const catalogUpdatedAt = formatCatalogUpdatedAt(catalog.updatedAt);
    return (
      <main className="flex min-h-screen items-center bg-[#0a0a12] px-4 py-12">
        <section className="mx-auto w-full max-w-lg text-center">
          <Link href="/" className="mb-8 inline-flex text-sm text-[#9896b0] transition hover:text-white">‹ กลับหน้าแรก</Link>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-pink-400/70">Easy Mickey Game</p>
          <h1 className="mt-3 text-4xl font-bold text-white">คุณเป็นใครใน GE 2026</h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-[#aaa8bc]">กด A หรือ B เพื่อเลือกเพลงที่ชอบ จากนั้นมาดูกันว่ารสนิยมของคุณตรงกับเมมเบอร์คนไหน</p>
          <div className="mx-auto mt-6 rounded-2xl border border-pink-400/20 bg-[#1b101d] px-4 py-3 text-sm leading-relaxed text-[#c8c6d6]">
            {catalogUpdatedAt && (
              <p>ข้อมูลการลงสมัครในวันที่ <span className="text-pink-200">{catalogUpdatedAt.date}</span> เวลา <span className="text-pink-200">{catalogUpdatedAt.time} น.</span></p>
            )}
            <p className={catalogUpdatedAt ? "mt-1" : undefined}>มีเมมเบอร์ <span className="font-semibold text-white">{catalog.members.length} คน</span> · เพลง <span className="font-semibold text-white">{catalog.songs.length} เพลง</span></p>
          </div>
          <div className="mx-auto mt-4 grid grid-cols-2 gap-3 text-left">
            {(Object.entries(GAME_MODES) as Array<[GameMode, typeof GAME_MODES[GameMode]]>).map(([mode, details]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setGameMode(mode)}
                aria-pressed={gameMode === mode}
                className={`rounded-2xl border p-4 transition ${gameMode === mode ? "border-cyan-400/60 bg-[#0d1a1f] ring-1 ring-cyan-400/20" : "border-white/10 bg-[#13131e] hover:border-white/20"}`}
              >
                <span className={`block font-semibold ${gameMode === mode ? "text-cyan-200" : "text-white"}`}>{details.label}</span>
                <span className="mt-1 block text-2xl font-bold text-white">{questionCountForMode(mode, catalog.songs.length)} ข้อ</span>
                <span className="mt-2 block text-xs leading-relaxed text-[#9896b0]">{details.description}</span>
              </button>
            ))}
          </div>
          <div className="mx-auto mt-3 rounded-2xl border border-cyan-500/20 bg-[#0d1620] px-5 py-4 text-xs leading-relaxed text-[#7f7d92]">
            เมื่อส่ง Feedback ระบบจะเก็บคำตอบ และผลลัพธ์ของรอบนั้นแบบไม่ระบุตัวตน เพื่อวิเคราะห์และปรับปรุงการคำนวณผล จะไม่เก็บข้อมูลหากไม่ส่ง Feedback
          </div>
          <div className="mt-6 space-y-3">
            {canResume && <button type="button" onClick={resumeGame} className="w-full rounded-2xl border border-pink-400/40 bg-pink-400/10 py-4 text-lg font-semibold text-pink-100 transition hover:bg-pink-400/20">เล่นต่อ{resumeMode ? ` · ${GAME_MODES[resumeMode].label}` : ""}</button>}
            <button type="button" onClick={() => startNewGame(gameMode)} className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 py-4 text-lg font-bold text-[#071014] shadow-[0_0_28px_rgba(34,211,238,0.18)] transition hover:brightness-110">{canResume ? `เริ่มใหม่ · ${GAME_MODES[gameMode].label}` : "เริ่มเล่น"}</button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "result") {
    const results = matchMembers(catalog, comparisons);
    const answerPattern = analyzeAnswerPattern(comparisons);
    return (
      <main className="min-h-screen bg-[#0a0a12] px-4 py-10">
        <section className="mx-auto max-w-lg">
          <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-pink-400/70">Your Result</p>
          <h1 className="mt-2 text-center text-3xl font-bold text-white">คุณเหมือนใครใน GE 2026</h1>
          {answerPattern.lowConfidence && (
            <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-center text-sm leading-relaxed text-amber-100">
              คำตอบรอบนี้เลือกฝั่งเดิมต่อเนื่องหรือเอนเอียงไปด้านเดียวมาก ผลลัพธ์จึงอาจแม่นยำน้อยลง
            </div>
          )}
          <div className="mt-8 space-y-4">
            {results.map(({ member, score }, index) => (
              <article key={member.id} className={`overflow-hidden rounded-2xl border ${index === 0 ? "border-cyan-400/40 bg-[#0d1620]" : "border-white/10 bg-[#13131e]"}`}>
                <div className="grid grid-cols-[110px_1fr] gap-4 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={member.imageUrl} alt={member.name} className="aspect-[3/4] w-full rounded-xl object-cover object-top" />
                  <div className="flex flex-col justify-center">
                    <p className="text-xs text-[#9896b0]">อันดับ {index + 1}</p>
                    <h2 className="mt-1 text-xl font-bold text-white">{member.name}</h2>
                    <p className="mt-2 text-3xl font-bold text-cyan-300">{(score * 100).toFixed(1)}%</p>
                    <p className="mt-1 text-xs text-[#6a6880]">คำตอบที่ตรงกับเพลงและลำดับที่เมมเลือก</p>
                  </div>
                </div>
                <ol className="border-t border-white/5 px-4 py-3 text-sm text-[#aaa8bc]">
                  {member.picks.map((songId, rank) => <li key={songId}>{rank + 1}. {songById.get(songId)?.title ?? songId}</li>)}
                </ol>
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-pink-400/20 bg-[#1b101d] p-5 text-center">
            <h2 className="text-lg font-semibold text-white">ผลที่ได้ตรงกับใจคุณแค่ไหน?</h2>
            <p className="mt-1 text-xs text-[#9896b0]">1 = ไม่ตรงเลย · 5 = ตรงมาก</p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => void submitFeedback(rating)}
                  disabled={submittingFeedback}
                  aria-label={`ให้คะแนน ${rating} จาก 5`}
                  aria-pressed={feedbackRating === rating}
                  className={`rounded-xl border py-3 text-lg font-bold transition disabled:opacity-50 ${feedbackRating === rating ? "border-pink-300 bg-pink-400/25 text-pink-100" : "border-white/10 bg-white/5 text-[#c8c6d6] hover:border-pink-400/40 hover:text-pink-200"}`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <p className={`mt-3 text-xs ${feedbackStatus?.includes("✓") ? "text-emerald-300" : "text-[#6a6880]"}`}>
              {feedbackStatus ?? "เมื่อส่ง Feedback ระบบจะเก็บคำตอบ และผลลัพธ์ของรอบนั้นแบบไม่ระบุตัวตน เพื่อวิเคราะห์และปรับปรุงการคำนวณผล จะไม่เก็บข้อมูลหากไม่ส่ง Feedback"}
            </p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => startNewGame(gameMode)} className="rounded-xl border border-cyan-500/30 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10">เล่นอีกครั้ง</button>
            <Link href="/" className="rounded-xl border border-white/10 py-3 text-center text-sm font-semibold text-[#c8c6d6] hover:bg-white/5">กลับหน้าแรก</Link>
          </div>
        </section>
      </main>
    );
  }

  if (!currentPair) return <StateMessage>ไม่พบคู่เพลงสำหรับคำถามนี้</StateMessage>;
  const songA = songById.get(currentPair[0]);
  const songB = songById.get(currentPair[1]);
  if (!songA || !songB) return <StateMessage>ข้อมูลเพลงไม่ครบ</StateMessage>;
  const videoA = youtubeVideoId(songA.youtubeUrl);
  const videoB = youtubeVideoId(songB.youtubeUrl);

  return (
    <main className="min-h-screen bg-[#0a0a12] px-3 py-6 sm:px-4 sm:py-10">
      <section className="mx-auto max-w-3xl">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.18em] text-pink-400/60">คุณเป็นใครใน GE 2026</p><h1 className="mt-1 text-xl font-bold text-white">เลือกเพลงที่คุณชอบมากกว่า</h1></div>
          <p className="shrink-0 text-sm tabular-nums text-[#9896b0]">{comparisons.length + 1} / {pairs.length}</p>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 transition-all" style={{ width: `${((comparisons.length + 1) / pairs.length) * 100}%` }} /></div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5">
          <SongButton label="A" title={songA.title} artist={songA.artist} onClick={() => answer(songA.id)} />
          <SongButton label="B" title={songB.title} artist={songB.artist} onClick={() => answer(songB.id)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-5">
          <VideoEmbed videoId={videoA} title={`${songA.title} YouTube video`} />
          <VideoEmbed videoId={videoB} title={`${songB.title} YouTube video`} />
        </div>
        <p className="mt-5 text-center text-xs text-[#6a6880]">ฟังก่อนแล้วกดปุ่ม A หรือ B · ใช้แป้นพิมพ์ A/B ได้</p>
      </section>
    </main>
  );
}

function SongButton({ label, title, artist, onClick }: { label: "A" | "B"; title: string; artist: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={`เลือกเพลง ${title}`} className="min-h-28 rounded-2xl border border-cyan-500/30 bg-[#0d1a1f] p-3 text-left transition hover:border-cyan-300 hover:bg-[#10232a] active:scale-[0.98] sm:p-5"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 font-bold text-cyan-300">{label}</span><span className="mt-3 block text-base font-bold leading-snug text-white sm:text-xl">{title}</span>{artist && <span className="mt-1 block text-xs text-[#9896b0] sm:text-sm">{artist}</span>}</button>;
}

function VideoEmbed({ videoId, title }: { videoId: string | null; title: string }) {
  return videoId ? <iframe key={videoId} className="aspect-video w-full rounded-xl border border-white/10" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> : <div className="flex aspect-video items-center justify-center rounded-xl border border-white/10 bg-[#13131e] px-2 text-center text-xs text-[#6a6880]">ไม่มีวิดีโอ</div>;
}

function StateMessage({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#0a0a12] px-4"><p className="text-center text-sm text-[#9896b0]">{children}</p></main>;
}
