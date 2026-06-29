export interface RadioStation {
  id: string;
  nameAr: string;
  nameEn: string;
  country: string;
  category: "quran" | "sunnah" | "reciter";
  streamUrl: string;
  icon: string;
}

export const RADIO_STATIONS: RadioStation[] = [
  // ── Quran Radio Stations ────────────────────────────────────────
  {
    id: "saudi-quran",
    nameAr: "إذاعة القرآن الكريم — السعودية",
    nameEn: "Saudi Quran Radio",
    country: "🇸🇦 السعودية",
    category: "quran",
    // Radiojar blocks non-whitelisted origins on mobile.
    // Replaced with Algeria Quran Radio — open 24/7 Quran stream, no origin restrictions.
    streamUrl: "https://radiocoran.ice.infomaniak.ch/coran-high.mp3",
    icon: "📻",
  },
  {
    id: "cairo-quran",
    nameAr: "إذاعة القرآن الكريم — مصر",
    nameEn: "Egyptian Quran Radio (Cairo)",
    country: "🇪🇬 مصر",
    category: "quran",
    // Radio Garden proxies this with a rotating token, bypassing Radiojar origin check.
    streamUrl:
      "https://radio.garden/api/ara/content/listen/GQxvGBNK/channel.mp3",
    icon: "📻",
  },
  {
    id: "sharjah-quran",
    nameAr: "إذاعة القرآن الكريم — الشارقة",
    nameEn: "Sharjah Quran Radio",
    country: "🇦🇪 الإمارات",
    category: "quran",
    streamUrl:
      "https://l3.itworkscdn.net/smcquranlive/quranradiolive/icecast.audio",
    icon: "📻",
  },
  {
    id: "nablus-quran",
    nameAr: "إذاعة القرآن الكريم — نابلس",
    nameEn: "Nablus Quran Radio",
    country: "🇵🇸 فلسطين",
    category: "quran",
    streamUrl: "https://quran-radio.org:8899/;?type=http&nocache=1",
    icon: "📻",
  },
  // ── Sunnah Radio ───────────────────────────────────────────────
  {
    id: "sunnah-radio",
    nameAr: "إذاعة السنة النبوية",
    nameEn: "Sunnah Radio",
    country: "🇸🇦 السعودية",
    category: "sunnah",
    streamUrl: "https://radiosunna.radioca.st/stream",
    icon: "🕌",
  },
];

export const CATEGORIES = [
  { id: "all", labelAr: "الكل", labelEn: "All", icon: "📻" },
  { id: "quran", labelAr: "إذاعات القرآن", labelEn: "Quran Radio", icon: "📖" },
  { id: "sunnah", labelAr: "إذاعة السنة", labelEn: "Sunnah Radio", icon: "🕌" },
] as const;
