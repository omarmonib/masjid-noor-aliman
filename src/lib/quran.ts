export async function getDailyVerse() {
  try {
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
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const number = (dayOfYear % 42) + 1;

  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-nawawi/${number}.json`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error("Failed to fetch hadith");
    const data = await res.json();
    const arabic = data.hadiths?.[0]?.text || data.hadith?.[0]?.text || "";

    return {
      arabic,
      number,
    };
  } catch {
    return {
      arabic:
        "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
      number: 1,
    };
  }
}
