"use client";

import { useState } from "react";
import { analyzeAnswerPattern } from "@/lib/song-match/answer-quality";
import type { SongMatchCatalog, SongMatchFeedbackRecord, SongMatchSong } from "@/lib/song-match/types";

const songNameCollator = new Intl.Collator(["th", "en"], { sensitivity: "base", numeric: true });

function compareSongs(a: SongMatchSong, b: SongMatchSong) {
  return songNameCollator.compare(a.artist || "\uffff", b.artist || "\uffff") || songNameCollator.compare(a.title, b.title);
}

export function SongMatchExport({ token }: { token: string }) {
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function exportAll() {
    setExporting(true);
    setStatus(null);
    try {
      const headers = { "x-tools-token": token };
      const [catalogResponse, feedbackResponse] = await Promise.all([
        fetch("/api/song-match/catalog?drafts=1", { headers, cache: "no-store" }),
        fetch("/api/song-match/feedback", { headers, cache: "no-store" }),
      ]);
      const [catalogResult, feedbackResult] = await Promise.all([
        catalogResponse.json(),
        feedbackResponse.json(),
      ]);
      if (!catalogResponse.ok) throw new Error(catalogResult.error ?? "โหลด Song Match ไม่สำเร็จ");
      if (!feedbackResponse.ok) throw new Error(feedbackResult.error ?? "โหลด Feedback ไม่สำเร็จ");

      const catalog = catalogResult as SongMatchCatalog;
      const feedbackRuns = feedbackResult as SongMatchFeedbackRecord[];
      const feedbackRunsWithQuality = feedbackRuns.map((run) => ({
        ...run,
        answerPattern: analyzeAnswerPattern(run.comparisons),
      }));
      const reliableFeedbackRuns = feedbackRunsWithQuality.filter((run) => !run.answerPattern.lowConfidence);
      const ratingDistribution = Object.fromEntries(
        [1, 2, 3, 4, 5].map((rating) => [rating, reliableFeedbackRuns.filter((run) => run.rating === rating).length]),
      );
      const feedbackSummary = {
        totalRuns: feedbackRuns.length,
        reliableRuns: reliableFeedbackRuns.length,
        lowConfidenceRuns: feedbackRuns.length - reliableFeedbackRuns.length,
        averageRating: reliableFeedbackRuns.length > 0
          ? reliableFeedbackRuns.reduce((total, run) => total + run.rating, 0) / reliableFeedbackRuns.length
          : null,
        ratingDistribution,
      };
      const songsById = new Map(catalog.songs.map((song) => [song.id, song]));
      const exportedAt = new Date();
      const payload = {
        schemaVersion: 2,
        exportedAt: exportedAt.toISOString(),
        catalogVersion: catalog.version,
        catalogUpdatedAt: catalog.updatedAt,
        counts: {
          songs: catalog.songs.length,
          members: catalog.members.length,
          publishedMembers: catalog.members.filter((member) => member.isPublished).length,
          feedbackRuns: feedbackRuns.length,
        },
        songs: [...catalog.songs].sort(compareSongs).map((song) => ({
          id: song.id,
          artist: song.artist,
          title: song.title,
          youtubeUrl: song.youtubeUrl,
          analysis: { tempo: null, moods: [], styles: [], notes: null, sources: [] },
        })),
        members: [...catalog.members]
          .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "th"))
          .map((member) => ({
            id: member.id,
            name: member.name,
            isPublished: member.isPublished,
            picks: member.picks.flatMap((songId, index) => {
              const song = songsById.get(songId);
              return song ? [{ rank: index + 1, songId, artist: song.artist, title: song.title }] : [];
            }),
        })),
        feedbackSummary,
        feedbackRuns: feedbackRunsWithQuality,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `song-match-analysis-${exportedAt.toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus(`สำเร็จ: ${payload.counts.songs} เพลง · ${payload.counts.publishedMembers} เมม · ${payload.counts.feedbackRuns} Feedback`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Export ไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-pink-500/20 bg-[#15101a] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-pink-200">Export Song Match Results</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#7f7d92]">ดาวน์โหลดเพลง เมม สรุป Feedback และคำตอบทุก session เป็น JSON</p>
        </div>
        <button type="button" onClick={() => void exportAll()} disabled={exporting} className="shrink-0 rounded-xl bg-pink-500/15 px-4 py-2 text-sm font-semibold text-pink-200 transition hover:bg-pink-500/25 disabled:opacity-50">
          {exporting ? "Exporting…" : "Export JSON"}
        </button>
      </div>
      {status && <p className="mt-3 text-xs text-cyan-300">{status}</p>}
    </div>
  );
}
