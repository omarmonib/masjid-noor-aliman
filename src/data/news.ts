export interface NewsPost {
  id: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  contentAr: string;
  contentEn: string;
  date: string;
  category: "news" | "announcement" | "event";
  image?: string;
}

export interface Event {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  date: string;
  time: string;
  location: string;
  category: "lecture" | "quran" | "charity" | "celebration" | "other";
}

export const NEWS: NewsPost[] = [
  {
    id: "1",
    titleAr: "افتتاح قاعة المحاضرات الجديدة",
    titleEn: "New Lecture Hall Opening",
    summaryAr:
      "يسر المسجد الإعلان عن افتتاح قاعة المحاضرات الجديدة المجهزة بأحدث التقنيات.",
    summaryEn:
      "The mosque is pleased to announce the opening of the new lecture hall equipped with the latest technology.",
    contentAr:
      "بفضل الله تعالى ثم بفضل كرم المتبرعين الكرام، تم الانتهاء من بناء قاعة المحاضرات الجديدة وتجهيزها بأحدث وسائل العرض والصوت. تتسع القاعة لأكثر من ٢٠٠ شخص وستكون متاحة لإقامة الدروس العلمية والمحاضرات الدينية والندوات التعليمية. ندعو جميع أبناء المجتمع للاستفادة من هذا المرفق الجديد.",
    contentEn:
      "By the grace of Allah and the generosity of our donors, the new lecture hall has been completed and equipped with the latest audio-visual technology. The hall accommodates over 200 people and will be available for religious lectures, educational seminars, and community events.",
    date: "2026-06-15",
    category: "announcement",
  },
  {
    id: "2",
    titleAr: "انطلاق برنامج تحفيظ القرآن الصيفي",
    titleEn: "Summer Quran Memorization Program Launch",
    summaryAr:
      "يعلن المسجد عن انطلاق برنامج تحفيظ القرآن الكريم الصيفي للأطفال من سن ٦ إلى ١٥ سنة.",
    summaryEn:
      "The mosque announces the launch of the summer Quran memorization program for children aged 6-15.",
    contentAr:
      "بمناسبة إجازة الصيف، يطلق مسجد نور الإيمان برنامجاً مكثفاً لتحفيظ القرآن الكريم للأطفال. يمتد البرنامج على مدار ثلاثة أشهر بواقع ٣ أيام في الأسبوع. يشرف على البرنامج نخبة من المشايخ الحفاظ. مقاعد محدودة، يُرجى التسجيل المبكر.",
    contentEn:
      "To mark the summer holidays, Masjid Noor Al-Iman is launching an intensive Quran memorization program for children. The program runs for three months, three days a week, supervised by qualified Quran teachers. Limited seats available.",
    date: "2026-06-10",
    category: "news",
  },
  {
    id: "3",
    titleAr: "حملة الإفطار الخيري لشهر رمضان",
    titleEn: "Ramadan Charity Iftar Campaign",
    summaryAr:
      "المسجد يطلق حملة إفطار خيري يومية طوال شهر رمضان المبارك لخدمة الأسر المحتاجة.",
    summaryEn:
      "The mosque launches a daily charity iftar campaign throughout Ramadan to serve families in need.",
    contentAr:
      "انطلاقاً من رسالة المسجد في خدمة المجتمع، تنظم لجنة الشؤون الاجتماعية حملة إفطار خيري يومية تستهدف الأسر ذات الدخل المحدود والمسافرين والغرباء. يمكن المشاركة في الحملة بالتبرع أو التطوع. للتواصل: ٠١٢٣٤٥٦٧٨٩",
    contentEn:
      "As part of the mosque's community service mission, the social affairs committee is organizing a daily charity iftar targeting low-income families, travelers, and strangers. You can participate by donating or volunteering.",
    date: "2026-05-20",
    category: "news",
  },
  {
    id: "4",
    titleAr: "تجديد مكتبة المسجد",
    titleEn: "Mosque Library Renovation",
    summaryAr:
      "تم تجديد مكتبة المسجد وإضافة أكثر من ٥٠٠ كتاب جديد في مختلف العلوم الإسلامية.",
    summaryEn:
      "The mosque library has been renovated and over 500 new books added across various Islamic sciences.",
    contentAr:
      "الحمد لله، اكتملت أعمال تجديد مكتبة المسجد وتم تزويدها بأكثر من ٥٠٠ كتاب جديد تشمل علوم القرآن والحديث والفقه والتفسير والتاريخ الإسلامي. المكتبة مفتوحة يومياً بعد صلاة المغرب.",
    contentEn:
      "Alhamdulillah, the mosque library renovation is complete. It now houses over 500 new books covering Quran sciences, hadith, fiqh, tafsir, and Islamic history. Open daily after Maghrib prayer.",
    date: "2026-06-01",
    category: "announcement",
  },
];

export const EVENTS: Event[] = [
  {
    id: "1",
    titleAr: "درس أسبوعي في تفسير القرآن",
    titleEn: "Weekly Quran Tafsir Lesson",
    descriptionAr:
      "درس أسبوعي منتظم في تفسير القرآن الكريم يقدمه فضيلة الشيخ أحمد محمد، يُعقد كل جمعة بعد صلاة العشاء.",
    descriptionEn:
      "A regular weekly lesson in Quran interpretation by Sheikh Ahmed Mohamed, held every Friday after Isha prayer.",
    date: "2026-06-27",
    time: "21:30",
    location: "القاعة الرئيسية",
    category: "lecture",
  },
  {
    id: "2",
    titleAr: "مسابقة تحفيظ القرآن السنوية",
    titleEn: "Annual Quran Memorization Competition",
    descriptionAr:
      "المسابقة السنوية لتحفيظ القرآن الكريم للأطفال والشباب. جوائز قيمة للفائزين في جميع الفئات.",
    descriptionEn:
      "Annual Quran memorization competition for children and youth. Valuable prizes for winners in all categories.",
    date: "2026-07-15",
    time: "10:00",
    location: "قاعة المحاضرات",
    category: "quran",
  },
  {
    id: "3",
    titleAr: "ليلة خيرية لدعم الأيتام",
    titleEn: "Charity Night for Orphans",
    descriptionAr:
      "ليلة خيرية لجمع التبرعات لدعم الأيتام في المنطقة. يتضمن البرنامج محاضرات دينية وعروضاً فنية أصيلة.",
    descriptionEn:
      "A charity night to raise funds for orphans in the area. Program includes religious lectures and authentic cultural performances.",
    date: "2026-07-05",
    time: "20:00",
    location: "ساحة المسجد",
    category: "charity",
  },
  {
    id: "4",
    titleAr: "دورة تعليم أحكام الصلاة",
    titleEn: "Prayer Rules Educational Course",
    descriptionAr:
      "دورة مكثفة لتعليم أحكام الصلاة وشروطها وأركانها وسننها، مناسبة للمبتدئين والمتوسطين.",
    descriptionEn:
      "An intensive course on the rules, conditions, pillars, and Sunnahs of prayer, suitable for beginners and intermediates.",
    date: "2026-07-01",
    time: "18:00",
    location: "قاعة الدروس",
    category: "lecture",
  },
  {
    id: "5",
    titleAr: "احتفال بمناسبة المولد النبوي الشريف",
    titleEn: "Prophet's Birthday Celebration",
    descriptionAr:
      "احتفال بمناسبة ذكرى المولد النبوي الشريف يتضمن قراءة السيرة النبوية والمدائح النبوية الأصيلة.",
    descriptionEn:
      "Celebration of the Prophet's birthday including recitation of the Prophet's biography and authentic Islamic poetry.",
    date: "2026-09-04",
    time: "20:30",
    location: "القاعة الرئيسية",
    category: "celebration",
  },
  {
    id: "6",
    titleAr: "رحلة ترفيهية لأطفال المسجد",
    titleEn: "Children's Trip",
    descriptionAr:
      "رحلة ترفيهية وتعليمية لأطفال المسجد إلى متحف الحضارة الإسلامية في القاهرة.",
    descriptionEn:
      "A recreational and educational trip for mosque children to the Museum of Islamic Civilization in Cairo.",
    date: "2026-07-20",
    time: "08:00",
    location: "أمام المسجد",
    category: "other",
  },
];
