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

export type SongMatchFeedbackFocus = "good" | "more_top1" | "more_top23";

export type SongMatchFeedbackResult = {
  memberId: string;
  score: number;
};

export type SongMatchFeedbackSubmission = {
  sessionId: string;
  catalogVersion: number;
  mode: SongMatchGameMode;
  questionCount: number;
  feedbackFocus: SongMatchFeedbackFocus;
  songCount: number;
  memberCount: number;
  comparisons: SongComparison[];
  results: SongMatchFeedbackResult[];
};

export type SongMatchFeedbackRecord = Omit<SongMatchFeedbackSubmission, "feedbackFocus"> & {
  rating: number | null;
  feedbackFocus: SongMatchFeedbackFocus | null;
};
