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
  winner: string | null;
  outcome?: "pick" | "tie" | "neither";
};

export type SongMatchGameMode = "quick" | "detailed";

export type SongMatchFeedbackResult = {
  memberId: string;
  score: number;
};

export type SongMatchFeedbackSubmission = {
  sessionId: string;
  catalogVersion: number;
  mode: SongMatchGameMode;
  questionCount: number;
  rating: number;
  songCount: number;
  memberCount: number;
  comparisons: SongComparison[];
  results: SongMatchFeedbackResult[];
};

export type SongMatchFeedbackRecord = SongMatchFeedbackSubmission;
