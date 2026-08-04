"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { analyzeAnswerPattern } from "@/lib/song-match/answer-quality";
import { createAdaptiveSongPairs, createSongPairs, matchMembers, songPreferenceScores, type SongPair } from "@/lib/song-match/game";
import type { SongComparison, SongMatchCatalog, SongMatchFeedbackFocus, SongMatchGameMode } from "@/lib/song-match/types";
import { youtubeVideoId } from "@/lib/song-match/youtube";
import { YouTubePlayer } from "./YouTubePlayer";

const STORAGE_KEY = "easy-mickey:song-match:v5";
const FEEDBACK_OPTIONS: Array<{ value: SongMatchFeedbackFocus; label: string }> = [
  { value: "good", label: "ตรงดีแล้ว" },
  { value: "more_top1", label: "ปรับให้เพลงอันดับ 1 ของฉันตรงกับเพลงของเมมเบอร์อันดับ 1 มากขึ้น" },
  { value: "more_top23", label: "ปรับให้เพลงอันดับ 2–3 ของฉันมีน้ำหนักในการจัดอันดับเมมเบอร์มากขึ้น" },
];

type GameMode = SongMatchGameMode;

const GAME_MODES: Record<GameMode, { label: string; description: string }> = {
  quick: {
    label: "โหมดเร็ว",
    description: "ทุกเพลงปรากฏอย่างน้อย 1 ครั้ง ก่อนรอบคัดเพลงที่ชนะทุกคู่",
  },
  detailed: {
    label: "โหมดละเอียด",
    description: "ทุกเพลงปรากฏอย่างน้อย 2 ครั้ง ก่อนรอบคัดเพลงที่ชนะทุกคู่",
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
  const [feedbackFocus, setFeedbackFocus] = useState<SongMatchFeedbackFocus | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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

  const answer = useCallback((winner: string | null, outcome: "pick" | "tie" | "neither" = "pick") => {
    if (!catalog || !currentPair || !sessionId) return;
    const comparison: SongComparison = { songA: currentPair[0], songB: currentPair[1], winner, outcome };
    const next = [...comparisons, comparison];
    let nextPairs = pairs;
    if (next.length >= pairs.length) {
      const adaptivePairs = createAdaptiveSongPairs(catalog.songs.map((song) => song.id), next);
      if (adaptivePairs.length > 0) {
        nextPairs = [...pairs, ...adaptivePairs];
        setPairs(nextPairs);
      } else {
        setScreen("result");
      }
    }
    setComparisons(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ catalogVersion: catalog.version, sessionId, mode: gameMode, pairs: nextPairs, comparisons: next } satisfies SavedGame));
  }, [catalog, comparisons, currentPair, gameMode, pairs, sessionId]);

  useEffect(() => {
    if (screen !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "a" && currentPair) answer(currentPair[0], "pick");
      if (event.key.toLowerCase() === "b" && currentPair) answer(currentPair[1], "pick");
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
    setFeedbackFocus(null);
    setFeedbackStatus(null);
    setFeedbackSubmitted(false);
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
    setFeedbackFocus(null);
    setFeedbackStatus(null);
    setFeedbackSubmitted(false);
    setScreen(saved.comparisons.length >= saved.pairs.length ? "result" : "playing");
  }

  async function submitFeedback() {
    if (!catalog || !sessionId || !feedbackFocus || feedbackSubmitted || comparisons.length !== pairs.length) return;
    setSubmittingFeedback(true);
    setFeedbackStatus(null);
    try {
      const memberComparisons = comparisons.slice(0, questionCountForMode(gameMode, catalog.songs.length));
      const preferenceScores = songPreferenceScores(catalog.songs.map((song) => song.id), comparisons);
      const rankedSongIds = [...catalog.songs]
        .sort((a, b) =>
          (preferenceScores[b.id] ?? 0.5) - (preferenceScores[a.id] ?? 0.5) ||
          a.artist.localeCompare(b.artist) ||
          a.title.localeCompare(b.title)
        )
        .map((song) => song.id);
      const results = matchMembers(catalog, memberComparisons, rankedSongIds.slice(0, 3));
      const response = await fetch("/api/song-match/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          catalogVersion: catalog.version,
          mode: gameMode,
          questionCount: comparisons.length,
          feedbackFocus,
          songCount: catalog.songs.length,
          memberCount: catalog.members.length,
          comparisons,
          results: results.map(({ member, score }) => ({ memberId: member.id, score })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "ส่ง Feedback ไม่สำเร็จ");
      setFeedbackSubmitted(true);
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
                <span className="mt-1 block text-2xl font-bold text-white">เริ่มต้น {questionCountForMode(mode, catalog.songs.length)} ข้อ</span>
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
    const memberComparisons = comparisons.slice(0, questionCountForMode(gameMode, catalog.songs.length));
    const answerPattern = analyzeAnswerPattern(comparisons);
    const preferenceScores = songPreferenceScores(catalog.songs.map((song) => song.id), comparisons);
    const rankedSongs = [...catalog.songs]
      .map((song) => ({ song, score: preferenceScores[song.id] ?? 0.5 }))
      .sort((a, b) => b.score - a.score || a.song.artist.localeCompare(b.song.artist) || a.song.title.localeCompare(b.song.title));
    const results = matchMembers(catalog, memberComparisons, rankedSongs.slice(0, 3).map(({ song }) => song.id));
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
          <div className="mt-6 overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0d1620]">
            <div className="px-5 py-4">
              <h2 className="text-lg font-semibold text-white">อันดับเพลงของคุณ</h2>
              <p className="mt-1 text-xs text-[#7f7d92]">เรียงจากคำตอบในรอบนี้และรอบคัดอันดับเพิ่มเติม</p>
            </div>
            <ol className="border-t border-white/5">
              {rankedSongs.slice(0, 10).map(({ song }, index) => (
                <SongRankRow key={song.id} rank={index + 1} artist={song.artist} title={song.title} />
              ))}
            </ol>
            {rankedSongs.length > 10 && (
              <details className="border-t border-white/5">
                <summary className="cursor-pointer px-5 py-3 text-center text-sm font-medium text-cyan-300 transition hover:bg-white/5">ดูครบทั้ง {rankedSongs.length} เพลง</summary>
                <ol className="border-t border-white/5">
                  {rankedSongs.slice(10).map(({ song }, index) => (
                    <SongRankRow key={song.id} rank={index + 11} artist={song.artist} title={song.title} />
                  ))}
                </ol>
              </details>
            )}
          </div>
          <div className="mt-6 rounded-2xl border border-pink-400/20 bg-[#1b101d] p-5 text-center">
            <h2 className="text-lg font-semibold text-white">ถ้าจะปรับผลนี้ คุณอยากให้ระบบให้น้ำหนักแบบไหน?</h2>
            <div className="mt-4 space-y-2 text-left">
              {FEEDBACK_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFeedbackFocus(option.value)}
                  disabled={submittingFeedback || feedbackSubmitted}
                  aria-pressed={feedbackFocus === option.value}
                  className={`w-full rounded-xl border px-4 py-3 text-sm leading-relaxed transition disabled:opacity-60 ${feedbackFocus === option.value ? "border-pink-300 bg-pink-400/25 text-pink-100" : "border-white/10 bg-white/5 text-[#c8c6d6] hover:border-pink-400/40 hover:text-pink-200"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void submitFeedback()}
              disabled={!feedbackFocus || submittingFeedback || feedbackSubmitted}
              className="mt-4 w-full rounded-xl bg-pink-400 py-3 text-sm font-bold text-[#1b101d] transition hover:bg-pink-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submittingFeedback ? "กำลังส่ง…" : feedbackSubmitted ? "ส่ง Feedback แล้ว ✓" : "ส่ง Feedback"}
            </button>
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
  const baseQuestionCount = questionCountForMode(gameMode, catalog.songs.length);
  const isAdaptiveRound = comparisons.length >= baseQuestionCount;
  const songA = songById.get(currentPair[0]);
  const songB = songById.get(currentPair[1]);
  if (!songA || !songB) return <StateMessage>ข้อมูลเพลงไม่ครบ</StateMessage>;
  const videoA = youtubeVideoId(songA.youtubeUrl);
  const videoB = youtubeVideoId(songB.youtubeUrl);

  return (
    <main className="min-h-screen bg-[#0a0a12] px-3 py-6 sm:px-4 sm:py-10">
      <section className="mx-auto max-w-3xl">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.18em] text-pink-400/60">คุณเป็นใครใน GE 2026</p><h1 className="mt-1 text-xl font-bold text-white">{isAdaptiveRound ? "รอบคัดอันดับเพลงที่ยังชนะทุกคู่" : "เลือกเพลงที่คุณชอบมากกว่า"}</h1></div>
          <p className="shrink-0 text-sm tabular-nums text-[#9896b0]">{comparisons.length + 1} / {pairs.length}</p>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 transition-all" style={{ width: `${((comparisons.length + 1) / pairs.length) * 100}%` }} /></div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5">
          <SongButton label="A" title={songA.title} artist={songA.artist} onClick={() => answer(songA.id, "pick")} />
          <SongButton label="B" title={songB.title} artist={songB.artist} onClick={() => answer(songB.id, "pick")} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-5">
          <VideoEmbed videoId={videoA} title={`${songA.title} YouTube video`} />
          <VideoEmbed videoId={videoB} title={`${songB.title} YouTube video`} />
        </div>
        {isAdaptiveRound ? (
          <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-center text-sm text-amber-100">รอบคัดอันดับต้องเลือกเพลง A หรือ B หนึ่งเพลง</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => answer(null, "tie")} className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm font-medium text-[#c8c6d6] transition hover:border-cyan-400/35 hover:text-cyan-200">เลือกไม่ได้จริง ๆ</button>
            <button type="button" onClick={() => answer(null, "neither")} className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm font-medium text-[#c8c6d6] transition hover:border-pink-400/35 hover:text-pink-200">ไม่ใช่แนวทั้งคู่</button>
          </div>
        )}
        <p className="mt-5 text-center text-xs text-[#6a6880]">ฟังก่อนแล้วเลือกคำตอบ · ใช้แป้นพิมพ์ A/B ได้</p>
      </section>
    </main>
  );
}

function SongButton({ label, title, artist, onClick }: { label: "A" | "B"; title: string; artist: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={`เลือกเพลง ${title}`} className="min-h-28 rounded-2xl border border-cyan-500/30 bg-[#0d1a1f] p-3 text-left transition hover:border-cyan-300 hover:bg-[#10232a] active:scale-[0.98] sm:p-5"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 font-bold text-cyan-300">{label}</span><span className="mt-3 block text-base font-bold leading-snug text-white sm:text-xl">{title}</span>{artist && <span className="mt-1 block text-xs text-[#9896b0] sm:text-sm">{artist}</span>}</button>;
}

function VideoEmbed({ videoId, title }: { videoId: string | null; title: string }) {
  return videoId ? <YouTubePlayer key={videoId} videoId={videoId} title={title} /> : <div className="flex aspect-video items-center justify-center rounded-xl border border-white/10 bg-[#13131e] px-2 text-center text-xs text-[#6a6880]">ไม่มีวิดีโอ</div>;
}

function SongRankRow({ rank, artist, title }: { rank: number; artist: string; title: string }) {
  return (
    <li className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-300">{rank}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white">{title}</span>
        <span className="block truncate text-xs text-[#7f7d92]">{artist || "ไม่ระบุวง"}</span>
      </span>
    </li>
  );
}

function StateMessage({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#0a0a12] px-4"><p className="text-center text-sm text-[#9896b0]">{children}</p></main>;
}
