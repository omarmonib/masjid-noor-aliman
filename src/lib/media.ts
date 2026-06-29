export interface MediaItem {
  id: string;
  titleAr: string;
  titleEn: string | null;
  type: "quran" | "lesson";
  url: string;
  speaker: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export const MEDIA_TYPES = [
  { id: "quran", labelAr: "قرآن", labelEn: "Quran", icon: "📖" },
  {
    id: "lesson",
    labelAr: "خطب ودروس",
    labelEn: "Sermons & Lessons",
    icon: "🎙️",
  },
] as const;

export function getTypeMeta(type: string) {
  return MEDIA_TYPES.find((t) => t.id === type) ?? MEDIA_TYPES[1];
}

export function formatDuration(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
