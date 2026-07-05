export interface MediaItem {
  id: string;
  titleAr: string;
  titleEn: string | null;
  type: "quran" | "lesson";
  url: string;
  speaker: string | null;
  speakerId: string | null;
  speakerRef: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    order: number;
    photoUrl: string | null;
  } | null;
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

export interface SpeakerGroup {
  key: string;
  label: string;
  order: number;
  photoUrl: string | null;
  items: MediaItem[];
}

/** Group media items into speaker sections, named speakers first (by order), then free-text speakers, then unspecified. */
export function groupBySpeaker(
  items: MediaItem[],
  isAr: boolean,
): SpeakerGroup[] {
  const groups = new Map<string, SpeakerGroup>();

  for (const item of items) {
    let key: string;
    let label: string;
    let order: number;
    let photoUrl: string | null = null;

    if (item.speakerRef) {
      key = `s:${item.speakerRef.id}`;
      label = isAr
        ? item.speakerRef.nameAr
        : item.speakerRef.nameEn || item.speakerRef.nameAr;
      order = item.speakerRef.order;
      photoUrl = item.speakerRef.photoUrl;
    } else if (item.speaker) {
      key = `f:${item.speaker}`;
      label = item.speaker;
      order = 100000;
    } else {
      key = "none";
      label = isAr ? "غير محدد" : "Unspecified";
      order = 999999;
    }

    if (!groups.has(key))
      groups.set(key, { key, label, order, photoUrl, items: [] });
    groups.get(key)!.items.push(item);
  }

  return Array.from(groups.values()).sort(
    (a, b) => a.order - b.order || a.label.localeCompare(b.label),
  );
}
