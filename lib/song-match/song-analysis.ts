import songAnalysisData from "@/data/song-match-song-analysis.json";

export type SongAnalysis = {
  tempo: number | null;
  energy: "low" | "medium" | "high";
  valence: "negative" | "mixed" | "positive";
  moods: string[];
  styles: string[];
  themes: string[];
  settings: string[];
  seasons: string[];
  releaseDate: string | null;
  credits: {
    lyricist: string | null;
    composer: string | null;
    arranger: string | null;
  };
  confidence: "low" | "medium" | "high";
  notes: string;
  sources: string[];
};

type SongAnalysisRecord = {
  id: string;
  artist: string;
  title: string;
  analysis: SongAnalysis;
};

const records = songAnalysisData.songs as SongAnalysisRecord[];

export const songAnalysisById = new Map(records.map((record) => [record.id, record.analysis]));
