import adhkarRaw from "@/data/adhkar-raw.json";

export type AdhkarCategory = string;

export interface Dhikr {
  id: string;
  textAr: string;
  repeat: number;
}

export interface AdhkarCategoryData {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  color: string;
  adhkar: Dhikr[];
}

const CATEGORY_MAP: Array<{
  jsonId: number;
  labelEn: string;
  icon: string;
  color: string;
}> = [
  {
    jsonId: 1,
    labelEn: "Morning & Evening",
    icon: "🌅",
    color: "from-amber-500 to-orange-400",
  },
  {
    jsonId: 2,
    labelEn: "Sleep",
    icon: "🌙",
    color: "from-indigo-600 to-blue-500",
  },
  {
    jsonId: 3,
    labelEn: "Waking Up",
    icon: "☀️",
    color: "from-yellow-400 to-amber-400",
  },
  {
    jsonId: 4,
    labelEn: "Entering Bathroom",
    icon: "🚿",
    color: "from-cyan-500 to-teal-400",
  },
  {
    jsonId: 5,
    labelEn: "Leaving Bathroom",
    icon: "✅",
    color: "from-teal-500 to-green-400",
  },
  {
    jsonId: 6,
    labelEn: "Before Wudu",
    icon: "💧",
    color: "from-blue-400 to-cyan-400",
  },
  {
    jsonId: 7,
    labelEn: "After Wudu",
    icon: "🤲",
    color: "from-blue-500 to-indigo-400",
  },
  {
    jsonId: 8,
    labelEn: "Leaving Home",
    icon: "🚪",
    color: "from-green-500 to-emerald-400",
  },
  {
    jsonId: 9,
    labelEn: "Entering Home",
    icon: "🏠",
    color: "from-emerald-500 to-green-400",
  },
  {
    jsonId: 10,
    labelEn: "Going to Mosque",
    icon: "🕌",
    color: "from-primary to-emerald-600",
  },
  {
    jsonId: 11,
    labelEn: "Entering Mosque",
    icon: "🕌",
    color: "from-green-600 to-teal-500",
  },
  {
    jsonId: 12,
    labelEn: "Leaving Mosque",
    icon: "🕌",
    color: "from-teal-600 to-cyan-500",
  },
  {
    jsonId: 13,
    labelEn: "Adhan",
    icon: "📢",
    color: "from-orange-500 to-amber-400",
  },
  {
    jsonId: 18,
    labelEn: "Opening Prayer",
    icon: "🙏",
    color: "from-purple-500 to-violet-400",
  },
  {
    jsonId: 19,
    labelEn: "Ruku",
    icon: "🙇",
    color: "from-violet-500 to-purple-400",
  },
  {
    jsonId: 21,
    labelEn: "Sujood",
    icon: "⬇️",
    color: "from-pink-500 to-rose-400",
  },
  {
    jsonId: 24,
    labelEn: "Tashahhud",
    icon: "☝️",
    color: "from-rose-500 to-pink-400",
  },
  {
    jsonId: 27,
    labelEn: "After Prayer",
    icon: "✨",
    color: "from-emerald-600 to-teal-500",
  },
  {
    jsonId: 28,
    labelEn: "Istikhara",
    icon: "🌿",
    color: "from-lime-500 to-green-400",
  },
  {
    jsonId: 34,
    labelEn: "Anxiety & Grief",
    icon: "💚",
    color: "from-green-500 to-teal-400",
  },
  {
    jsonId: 35,
    labelEn: "Distress",
    icon: "🤍",
    color: "from-slate-500 to-gray-400",
  },
  {
    jsonId: 53,
    labelEn: "Calamity",
    icon: "🌧️",
    color: "from-blue-600 to-indigo-500",
  },
  {
    jsonId: 67,
    labelEn: "Seeing the Crescent",
    icon: "🌙",
    color: "from-yellow-500 to-amber-400",
  },
  {
    jsonId: 68,
    labelEn: "Breaking Fast",
    icon: "🌙",
    color: "from-orange-400 to-amber-300",
  },
  {
    jsonId: 69,
    labelEn: "Before Eating",
    icon: "🍽️",
    color: "from-amber-500 to-yellow-400",
  },
  {
    jsonId: 70,
    labelEn: "After Eating",
    icon: "🍽️",
    color: "from-yellow-500 to-orange-400",
  },
  {
    jsonId: 77,
    labelEn: "Sneezing",
    icon: "🤧",
    color: "from-cyan-500 to-blue-400",
  },
  {
    jsonId: 79,
    labelEn: "Congratulating Marriage",
    icon: "💍",
    color: "from-pink-400 to-rose-300",
  },
  {
    jsonId: 82,
    labelEn: "Anger",
    icon: "😤",
    color: "from-red-500 to-orange-400",
  },
  {
    jsonId: 95,
    labelEn: "Riding a Vehicle",
    icon: "🚗",
    color: "from-blue-500 to-cyan-400",
  },
  {
    jsonId: 96,
    labelEn: "Travel",
    icon: "✈️",
    color: "from-sky-500 to-blue-400",
  },
  {
    jsonId: 119,
    labelEn: "Day of Arafah",
    icon: "🕋",
    color: "from-yellow-600 to-amber-500",
  },
  {
    jsonId: 129,
    labelEn: "Forgiveness & Repentance",
    icon: "💫",
    color: "from-purple-500 to-indigo-400",
  },
  {
    jsonId: 130,
    labelEn: "Tasbih & Tahmid",
    icon: "📿",
    color: "from-emerald-500 to-green-400",
  },
];

export function getAllAdhkar(): AdhkarCategoryData[] {
  const data = adhkarRaw as Array<{
    id: number;
    category: string;
    array: Array<{ id: number; text: string; count: number }>;
  }>;

  return CATEGORY_MAP.map((cat) => {
    const found = data.find((d) => d.id === cat.jsonId);
    const adhkar: Dhikr[] = (found?.array || []).map((item) => ({
      id: `${cat.jsonId}-${item.id}`,
      textAr: item.text,
      repeat: item.count || 1,
    }));

    return {
      id: String(cat.jsonId),
      labelAr: found?.category || cat.labelEn,
      labelEn: cat.labelEn,
      icon: cat.icon,
      color: cat.color,
      adhkar,
    };
  });
}
