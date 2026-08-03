import type { SongMatchCatalog, SongMatchSong } from "./types";

export type SongSelection = {
  memberId: string;
  memberName: string;
  memberDisplayOrder: number;
  rank: number;
};

export type SongStat = {
  song: SongMatchSong;
  selections: SongSelection[];
};

const songCollator = new Intl.Collator(["th", "en"], {
  sensitivity: "base",
  numeric: true,
});

export function createSongStats(catalog: SongMatchCatalog): SongStat[] {
  const selectionsBySong = new Map<string, SongSelection[]>();

  for (const member of catalog.members) {
    member.picks.forEach((songId, index) => {
      const selections = selectionsBySong.get(songId) ?? [];
      selections.push({
        memberId: member.id,
        memberName: member.name,
        memberDisplayOrder: member.displayOrder,
        rank: index + 1,
      });
      selectionsBySong.set(songId, selections);
    });
  }

  return catalog.songs
    .map((song) => ({
      song,
      selections: (selectionsBySong.get(song.id) ?? []).sort(
        (a, b) =>
          a.rank - b.rank ||
          a.memberDisplayOrder - b.memberDisplayOrder ||
          songCollator.compare(a.memberName, b.memberName),
      ),
    }))
    .filter((stat) => stat.selections.length > 0)
    .sort(
      (a, b) =>
        b.selections.length - a.selections.length ||
        songCollator.compare(a.song.artist, b.song.artist) ||
        songCollator.compare(a.song.title, b.song.title),
    );
}

