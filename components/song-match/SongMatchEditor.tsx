"use client";

import { useCallback, useEffect, useState } from "react";
import type { SongMatchCatalog, SongMatchMember, SongMatchSong } from "@/lib/song-match/types";
import { youtubeVideoId } from "@/lib/song-match/youtube";

const inputClass =
  "w-full rounded-lg border border-[#2a2a3d] bg-[#0a0a12] px-3 py-2 text-sm text-[#f0eff8] placeholder-[#5f5d72] outline-none transition focus:border-cyan-500/50";
const SONG_ARTISTS = ["AKB48", "HKT48", "IZ4648", "NGT48", "NMB48", "SKE48", "STU48"];
const songNameCollator = new Intl.Collator(["th", "en"], {
  sensitivity: "base",
  numeric: true,
});

function compareSongs(a: SongMatchSong, b: SongMatchSong) {
  return songNameCollator.compare(a.artist || "\uffff", b.artist || "\uffff") || songNameCollator.compare(a.title, b.title);
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function SongMatchEditor({ token, section }: { token: string; section: "songs" | "members" }) {
  const [catalog, setCatalog] = useState<SongMatchCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/song-match/catalog?drafts=1", {
        headers: { "x-tools-token": token },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      setCatalog(await response.json());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function updateSong(id: string, patch: Partial<SongMatchSong>) {
    setCatalog((current) => current ? { ...current, songs: current.songs.map((song) => song.id === id ? { ...song, ...patch } : song) } : current);
  }

  function addSong() {
    setCatalog((current) => current ? { ...current, songs: [{ id: newId("song"), title: "", artist: "", youtubeUrl: "" }, ...current.songs] } : current);
  }

  function removeSong(id: string) {
    if (!catalog) return;
    const usedBy = catalog.members.filter((member) => member.picks.includes(id));
    if (usedBy.length > 0) {
      setStatus(`ลบเพลงไม่ได้ เพราะ ${usedBy.map((member) => member.name).join(", ")} เลือกเพลงนี้อยู่`);
      return;
    }
    if (!window.confirm("ลบเพลงนี้ออกจาก Song Library?")) return;
    setCatalog({ ...catalog, songs: catalog.songs.filter((song) => song.id !== id) });
  }

  function updateMember(id: string, patch: Partial<SongMatchMember>) {
    setCatalog((current) => current ? { ...current, members: current.members.map((member) => member.id === id ? { ...member, ...patch } : member) } : current);
  }

  function updatePick(member: SongMatchMember, rank: number, songId: string) {
    const picks = [member.picks[0] ?? "", member.picks[1] ?? "", member.picks[2] ?? ""];
    picks[rank] = songId;
    updateMember(member.id, { picks });
  }

  function addMember() {
    setCatalog((current) => current ? { ...current, members: [{ id: newId("member"), name: "", imageUrl: "", isPublished: false, displayOrder: Math.min(0, ...current.members.map((member) => member.displayOrder)) - 1, picks: ["", "", ""] }, ...current.members] } : current);
  }

  function removeMember(id: string) {
    if (!catalog || !window.confirm("ลบเมมคนนี้และอันดับเพลงทั้งหมด?")) return;
    setCatalog({ ...catalog, members: catalog.members.filter((member) => member.id !== id) });
  }

  async function uploadImage(memberId: string, file: File) {
    setUploadingMemberId(memberId);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/song-match/upload", { method: "POST", headers: { "x-tools-token": token }, body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "อัปโหลดรูปไม่สำเร็จ");
      updateMember(memberId, { imageUrl: result.url, imageBlobPathname: result.pathname });
      setStatus("อัปโหลดรูปแล้ว — กด Save All เพื่อบันทึก URL");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingMemberId(null);
    }
  }

  async function save() {
    if (!catalog) return;
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/song-match/catalog", { method: "PUT", headers: { "content-type": "application/json", "x-tools-token": token }, body: JSON.stringify(catalog) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "บันทึกไม่สำเร็จ");
      setCatalog(result);
      setStatus("บันทึกข้อมูลแล้ว ✓");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="pt-10 text-sm text-[#9896b0]">กำลังโหลดข้อมูล…</p>;
  if (!catalog) return <p className="pt-10 text-sm text-red-300">{status ?? "ไม่พบข้อมูล"}</p>;
  const sortedSongs = [...catalog.songs].sort(compareSongs);

  return (
    <div className="space-y-10">
      <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between gap-3 border-b border-[#2a2a3d] bg-[#0a0a12]/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-xs text-[#6a6880]">{catalog.members.length} เมม · {catalog.songs.length} เพลง</p>
          {status && <p className="mt-0.5 max-w-lg text-xs text-cyan-300">{status}</p>}
        </div>
        <button type="button" onClick={save} disabled={saving} className="shrink-0 rounded-xl bg-cyan-500/20 px-5 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/30 disabled:opacity-50">{saving ? "Saving…" : "Save All"}</button>
      </div>

      {section === "songs" && (
        <section>
        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="text-lg font-semibold text-white">Song Library</h2><p className="text-xs text-[#6a6880]">เพิ่มเพลงครั้งเดียว แล้วเลือกใช้กับเมมหลายคนได้</p></div>
          <button type="button" onClick={addSong} className="rounded-lg border border-cyan-500/30 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10">+ Add song</button>
        </div>
        <div className="space-y-4">
          {catalog.songs.map((song, index) => {
            const videoId = youtubeVideoId(song.youtubeUrl);
            return (
              <article key={song.id} className="rounded-2xl border border-[#2a2a3d] bg-[#13131e] p-4">
                <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-cyan-200">เพลง {index + 1}</p><button type="button" onClick={() => removeSong(song.id)} className="text-xs text-red-400 hover:text-red-300">ลบ</button></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className={inputClass} placeholder="ชื่อเพลง" value={song.title} onChange={(event) => updateSong(song.id, { title: event.target.value })} />
                  <select className={inputClass} value={song.artist} onChange={(event) => updateSong(song.id, { artist: event.target.value })}>
                    <option value="">— เลือกวง —</option>
                    {song.artist && !SONG_ARTISTS.includes(song.artist) && <option value={song.artist}>{song.artist}</option>}
                    {SONG_ARTISTS.map((artist) => <option key={artist} value={artist}>{artist}</option>)}
                  </select>
                </div>
                <input className={`${inputClass} mt-2`} placeholder="YouTube URL" value={song.youtubeUrl} onChange={(event) => updateSong(song.id, { youtubeUrl: event.target.value })} />
                {song.youtubeUrl && <p className={`mt-2 text-xs ${videoId ? "text-emerald-400" : "text-red-400"}`}>{videoId ? `YouTube video ID: ${videoId}` : "ลิงก์ YouTube ไม่ถูกต้อง"}</p>}
              </article>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-full border border-[#2a2a3d] bg-[#13131e] px-4 py-2 text-xs font-medium text-[#9896b0] transition hover:border-cyan-500/40 hover:text-cyan-300">↑ Back to top</button>
        </div>
        </section>
      )}

      {section === "members" && (
        <section>
        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="text-lg font-semibold text-white">Members</h2><p className="text-xs text-[#6a6880]">Publish ได้เมื่อมีรูปและเพลงครบสามอันดับ</p></div>
          <button type="button" onClick={addMember} className="rounded-lg border border-pink-500/30 px-3 py-2 text-xs text-pink-300 hover:bg-pink-500/10">+ Add member</button>
        </div>
        <div className="space-y-5">
          {catalog.members.map((member, index) => (
            <article key={member.id} className="rounded-2xl border border-pink-500/20 bg-[#15101a] p-4">
              <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold text-pink-200">เมม {index + 1}</p><button type="button" onClick={() => removeMember(member.id)} className="text-xs text-red-400 hover:text-red-300">ลบ</button></div>
              <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                <div>
                  <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    {member.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Blob and local fallback URLs are both supported.
                      <img src={member.imageUrl} alt={member.name || "Member preview"} className="h-full w-full object-cover object-top" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-xs text-[#6a6880]">
                        ยังไม่มีรูป
                      </div>
                    )}
                  </div>
                  <label className="mt-2 block cursor-pointer rounded-lg border border-[#2a2a3d] px-2 py-2 text-center text-xs text-[#9896b0] hover:border-pink-500/30 hover:text-pink-300">
                    {uploadingMemberId === member.id ? "Uploading…" : "Upload image"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingMemberId === member.id} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(member.id, file); event.target.value = ""; }} />
                  </label>
                </div>
                <div className="space-y-3">
                  <input className={inputClass} placeholder="ชื่อเมม" value={member.name} onChange={(event) => updateMember(member.id, { name: event.target.value })} />
                  <input className={inputClass} placeholder="Image URL หรือ upload จากด้านซ้าย" value={member.imageUrl} onChange={(event) => updateMember(member.id, { imageUrl: event.target.value, imageBlobPathname: undefined })} />
                  {[0, 1, 2].map((rank) => (
                    <label key={rank} className="block">
                      <span className="mb-1 block text-xs text-[#9896b0]">เพลงอันดับ {rank + 1}</span>
                      <select className={inputClass} value={member.picks[rank] ?? ""} onChange={(event) => updatePick(member, rank, event.target.value)}>
                        <option value="">— เลือกเพลง —</option>
                        {sortedSongs.map((song) => <option key={song.id} value={song.id} disabled={member.picks.some((pick, pickIndex) => pickIndex !== rank && pick === song.id)}>{song.artist || "ไม่ระบุวง"} - {song.title}</option>)}
                      </select>
                    </label>
                  ))}
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-sm text-[#c8c6d6]"><input type="checkbox" checked={member.isPublished} onChange={(event) => updateMember(member.id, { isPublished: event.target.checked })} className="accent-pink-400" /> Published</label>
                    <label className="flex items-center gap-2 text-xs text-[#9896b0]">ลำดับแสดง <input type="number" className="w-20 rounded-lg border border-[#2a2a3d] bg-[#0a0a12] px-2 py-1 text-white" value={member.displayOrder} onChange={(event) => updateMember(member.id, { displayOrder: Number(event.target.value) })} /></label>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-5 flex justify-center">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-full border border-[#2a2a3d] bg-[#13131e] px-4 py-2 text-xs font-medium text-[#9896b0] transition hover:border-pink-500/40 hover:text-pink-300">↑ Back to top</button>
        </div>
        </section>
      )}
    </div>
  );
}
