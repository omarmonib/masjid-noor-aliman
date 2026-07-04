export interface NewsItem {
  id: string;
  titleAr: string;
  titleEn: string | null;
  summaryAr: string | null;
  summaryEn: string | null;
  contentAr: string;
  contentEn: string | null;
  category: "news" | "announcement";
  image: string | null;
  publishedAt: string;
}

export interface EventItem {
  id: string;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  date: string;
  time: string;
  location: string;
  category: "lecture" | "quran" | "charity" | "celebration" | "other";
}

export const NEWS_CATEGORIES = [
  { id: "news", labelAr: "خبر", labelEn: "News" },
  { id: "announcement", labelAr: "إعلان", labelEn: "Announcement" },
] as const;

export const EVENT_CATEGORIES = [
  { id: "lecture", labelAr: "محاضرة", labelEn: "Lecture", icon: "🎙️" },
  { id: "quran", labelAr: "قرآن", labelEn: "Quran", icon: "📖" },
  { id: "charity", labelAr: "خيري", labelEn: "Charity", icon: "💚" },
  { id: "celebration", labelAr: "احتفال", labelEn: "Celebration", icon: "🌙" },
  { id: "other", labelAr: "أخرى", labelEn: "Other", icon: "📌" },
] as const;
