export type GuideDifficulty = "Easy" | "Medium" | "Hard";

export type Guide = {
  id: string;
  title: string;
  icon: string;
  iconAlt: string;
  difficulty: GuideDifficulty;
  whyItMatters: string;
  quickWin: string;
  checklist: string[];
};
