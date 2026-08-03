export type SongMatchSong = {
  id: string;
  title: string;
  artist: string;
  youtubeUrl: string;
};

export type SongMatchMember = {
  id: string;
  name: string;
  imageUrl: string;
  imageBlobPathname?: string;
  isPublished: boolean;
  displayOrder: number;
  picks: string[];
};

export type SongMatchCatalog = {
  version: number;
  updatedAt: string;
  songs: SongMatchSong[];
  members: SongMatchMember[];
};

export type SongComparison = {
  songA: string;
  songB: string;
  winner: string;
};

