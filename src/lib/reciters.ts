// src/lib/reciters.ts
//
// Curated, static list of reciters — replaces the old mp3quran.net-backed
// catalog entirely. mp3quran only serves one MP3 file per full surah with
// no ayah timestamps, so accurate per-ayah playback was never possible for
// most of that catalog. Every reciter listed here instead has verified
// per-ayah audio on EveryAyah.com (one MP3 file per verse), so every
// reciter shown in the app behaves identically:
//   - exact start from any tapped ayah
//   - exact continuation to the end of the surah
//   - zero seeking, zero estimation, anywhere
// Reciters without per-ayah coverage are deliberately excluded rather than
// shown with degraded/inconsistent functionality.

export interface CuratedReciter {
  /** EveryAyah.com edition/folder id — doubles as this reciter's unique id. */
  id: string;
  nameAr: string;
  nameEn: string;
}

export const CURATED_RECITERS: CuratedReciter[] = [
  {
    id: "Alafasy_128kbps",
    nameAr: "مشاري راشد العفاسي",
    nameEn: "Mishary Alafasy",
  },
  {
    id: "Abdul_Basit_Murattal_192kbps",
    nameAr: "عبد الباسط عبد الصمد",
    nameEn: "Abdul Basit Abdul Samad",
  },
  {
    id: "Husary_128kbps",
    nameAr: "محمود خليل الحصري",
    nameEn: "Mahmoud Khalil Al-Husary",
  },
  {
    id: "Minshawy_Murattal_128kbps",
    nameAr: "محمد صديق المنشاوي",
    nameEn: "Muhammad Siddiq Al-Minshawi",
  },
  {
    id: "MaherAlMuaiqly128kbps",
    nameAr: "ماهر المعيقلي",
    nameEn: "Maher Al Muaiqly",
  },
  {
    id: "Abdurrahmaan_As-Sudais_192kbps",
    nameAr: "عبد الرحمن السديس",
    nameEn: "Abdurrahman As-Sudais",
  },
  {
    id: "Saood_ash-Shuraym_128kbps",
    nameAr: "سعود الشريم",
    nameEn: "Saud Ash-Shuraym",
  },
  {
    id: "Hudhaify_128kbps",
    nameAr: "علي بن عبد الرحمن الحذيفي",
    nameEn: "Ali Al-Hudhaify",
  },
  {
    id: "Ghamadi_40kbps",
    nameAr: "سعد الغامدي",
    nameEn: "Saad Al-Ghamdi",
  },
  {
    id: "Muhammad_Ayyoub_128kbps",
    nameAr: "محمد أيوب",
    nameEn: "Muhammad Ayyoub",
  },
];

/**
 * Builds the URL for a single ayah's audio file. Each ayah is already its
 * own file on EveryAyah.com, so "start at ayah N" simply means "play this
 * URL" — there is no seeking or timestamp estimation in this function or
 * anywhere that calls it.
 */
export function ayahAudioUrl(
  editionId: string,
  surahId: number,
  ayah: number,
): string {
  const s = String(surahId).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/${editionId}/${s}${a}.mp3`;
}
