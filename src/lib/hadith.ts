export interface HadithCollection {
  id: string;
  nameAr: string;
  nameEn: string;
  totalHadith: number;
  icon: string;
}

export interface Hadith {
  id: number;
  collection: string;
  bookNumber: number;
  hadithNumber: number;
  textAr: string;
  textEn: string;
}

export const COLLECTIONS: HadithCollection[] = [
  {
    id: "bukhari",
    nameAr: "صحيح البخاري",
    nameEn: "Sahih Bukhari",
    totalHadith: 7563,
    icon: "📖",
  },
  {
    id: "muslim",
    nameAr: "صحيح مسلم",
    nameEn: "Sahih Muslim",
    totalHadith: 7453,
    icon: "📗",
  },
  {
    id: "abudawud",
    nameAr: "سنن أبي داود",
    nameEn: "Sunan Abu Dawud",
    totalHadith: 5274,
    icon: "📘",
  },
  {
    id: "tirmidhi",
    nameAr: "جامع الترمذي",
    nameEn: "Jami At-Tirmidhi",
    totalHadith: 3956,
    icon: "📙",
  },
  {
    id: "nasai",
    nameAr: "سنن النسائي",
    nameEn: "Sunan An-Nasai",
    totalHadith: 5758,
    icon: "📕",
  },
  {
    id: "ibnmajah",
    nameAr: "سنن ابن ماجه",
    nameEn: "Sunan Ibn Majah",
    totalHadith: 4341,
    icon: "📓",
  },
  {
    id: "malik",
    nameAr: "موطأ مالك",
    nameEn: "Muwatta Malik",
    totalHadith: 1832,
    icon: "📒",
  },
  {
    id: "nawawi40",
    nameAr: "الأربعون النووية",
    nameEn: "40 Hadith Nawawi",
    totalHadith: 42,
    icon: "🌟",
  },
  {
    id: "riyadussalihin",
    nameAr: "رياض الصالحين",
    nameEn: "Riyad As-Salihin",
    totalHadith: 1896,
    icon: "🌿",
  },
  {
    id: "adab",
    nameAr: "الأدب المفرد",
    nameEn: "Al-Adab Al-Mufrad",
    totalHadith: 1322,
    icon: "📜",
  },
  {
    id: "bulugh",
    nameAr: "بلوغ المرام",
    nameEn: "Bulugh Al-Maram",
    totalHadith: 1597,
    icon: "⚖️",
  },
  
];

export async function getDailyHadithData(): Promise<Hadith | null> {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const number = (dayOfYear % 42) + 1;
  try {
    const base =
      "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";
    const res = await fetch(`${base}/ara-nawawi/${number}.json`, {
      next: { revalidate: 86400 },
    });
    const data = await res.json();
    const textAr = data.hadiths?.[0]?.text || data.hadith?.[0]?.text || "";
    return {
      id: number,
      collection: "nawawi40",
      bookNumber: 1,
      hadithNumber: number,
      textAr,
      textEn: "",
    };
  } catch {
    return null;
  }
}
