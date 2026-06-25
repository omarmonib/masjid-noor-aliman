export async function getDailyVerse() {
  try {
    // Pick a random verse from the 6236 total
    const verseNumber = Math.floor(Math.random() * 6236) + 1;

    const res = await fetch(
      `https://api.alquran.cloud/v1/ayah/${verseNumber}/editions/quran-uthmani,en.asad`,
      { cache: "no-store" },
    );

    if (!res.ok) throw new Error("Failed to fetch verse");
    const data = await res.json();

    const arabic = data.data[0];
    const english = data.data[1];

    return {
      arabic: arabic.text,
      english: english.text,
      surah: arabic.surah.name,
      surahEn: arabic.surah.englishName,
      ayah: arabic.numberInSurah,
    };
  } catch {
    return {
      arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
      english: "Verily, with hardship comes ease.",
      surah: "الشرح",
      surahEn: "Al-Inshirah",
      ayah: 6,
    };
  }
}

export async function getDailyHadith() {
  try {
    // Pick a random hadith number from 1–100
    const hadithNumber = Math.floor(Math.random() * 100) + 1;

    const res = await fetch(
      `https://api.hadith.gading.dev/books/muslim/${hadithNumber}`,
      { cache: "no-store" },
    );

    if (!res.ok) throw new Error("Failed to fetch hadith");
    const data = await res.json();

    return {
      arabic: data.data.contents.arab,
      indonesian: data.data.contents.id,
      number: hadithNumber,
    };
  } catch {
    return {
      arabic:
        "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
      indonesian: null,
      number: 1,
    };
  }
}
