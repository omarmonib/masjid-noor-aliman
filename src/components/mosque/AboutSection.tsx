import Image from "next/image";
export default function AboutSection({ locale }: { locale: string }) {
  const isAr = locale === "ar";

  const info = [
    {
      icon: "🕌",
      labelAr: "اسم المسجد",
      labelEn: "Mosque Name",
      valueAr: "مسجد نور الإيمان",
      valueEn: "Masjid Noor Al-Iman",
    },
    {
      icon: "📍",
      labelAr: "العنوان",
      labelEn: "Address",
      valueAr: "حي الزهور - بلبيس - محافظة الشرقية - مصر",
      valueEn: "Al-Zohour District - Belbeis - Al-Sharqia - Egypt",
    },
    {
      icon: "📞",
      labelAr: "التواصل",
      labelEn: "Contact",
      valueAr: "الحاج محمد رابع: ٠١٠٦٦٢٧١٩٨٦",
      valueEn: "Mohamed Rabiea: 01066271986",
    },
    {
      icon: "📞",
      labelAr: "التواصل",
      labelEn: "Contact",
      valueAr: "الحاج أحمد رابع: ٠١٠٦٧٤٧٠٤٧٠",
      valueEn: "Ahmed Rabiea: 01067470470",
    },
  ];

  const services = isAr
    ? [
        "إقامة الصلوات الخمس",
        "صلاة الجمعة والعيدين",
        "دروس تحفيظ القرآن الكريم",
        "الدروس الدينية الأسبوعية",
        "عقود الزواج",
        "الإرشاد الديني",
        "الخدمات الاجتماعية",
        "إحياء المناسبات الدينية",
      ]
    : [
        "Five daily prayers",
        "Friday and Eid prayers",
        "Quran memorization classes",
        "Weekly religious lessons",
        "Marriage contracts",
        "Religious counseling",
        "Social services",
        "Religious occasions",
      ];

  return (
    <div className="space-y-6">
      {/* Info cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 text-white font-arabic font-bold"
          style={{ background: "linear-gradient(to right, #0D3D28, #1B6B4A)" }}
        >
          {isAr ? "معلومات المسجد" : "Mosque Information"}
        </div>
        <div className="divide-y divide-gray-50">
          {info.map(({ icon, labelAr, labelEn, valueAr, valueEn }) => (
            <div
              key={labelAr}
              className="flex items-center justify-between px-6 py-4"
            >
              <p className="font-arabic text-gray-800 font-medium" dir="rtl">
                {isAr ? valueAr : valueEn}
              </p>
              <div className="flex items-center gap-2 text-gray-500">
                <span className="font-arabic text-sm">
                  {isAr ? labelAr : labelEn}
                </span>
                <span className="text-xl">{icon}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History / Founder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 text-white font-arabic font-bold"
          style={{ background: "linear-gradient(to right, #0D3D28, #1B6B4A)" }}
        >
          {isAr ? "نشأة المسجد" : "History of the Mosque"}
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
          {/* Founder photo — replace the placeholder below with the real image.
              1. Add the photo file to /public/images/founder.jpg
              2. Uncomment the <img> tag and remove the emoji placeholder span */}
          <div className="w-32 h-32 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            <Image
              src="/images/founder.png"
              alt={isAr ? "الحاج محمود ربيع" : "Haj Mahmoud Rabie"}
              fill
              className="object-cover"
            />
          </div>
          <div className="text-center sm:text-right" dir="rtl">
            <p className="font-arabic text-gray-800 leading-relaxed">
              {isAr
                ? "تأسس مسجد نور الإيمان عام ١٩٨٦م على يد الحاج محمود ربيع، رحمه الله، الذي بذل جهداً كبيراً في بناء المسجد وخدمة أهل المنطقة، فجزاه الله خير الجزاء وجعل ذلك في ميزان حسناته."
                : "Masjid Noor Al-Iman was founded in 1986 by Haj Mahmoud Rabie, who dedicated great effort to building the mosque and serving the local community. May Allah reward him abundantly."}
            </p>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 text-white font-arabic font-bold"
          style={{ background: "linear-gradient(to right, #0D3D28, #1B6B4A)" }}
        >
          {isAr ? "خدمات المسجد" : "Mosque Services"}
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          {services.map((s) => (
            <div
              key={s}
              className="flex items-center gap-2 font-arabic text-sm text-gray-700"
              dir="rtl"
            >
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Map placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 text-white font-arabic font-bold"
          style={{ background: "linear-gradient(to right, #0D3D28, #1B6B4A)" }}
        >
          {isAr ? "الموقع" : "Location"}
        </div>
        <div className="p-5">
          <div className="bg-gray-50 rounded-xl h-48 flex items-center justify-center border border-gray-100">
            <div className="text-center">
              <div className="text-4xl mb-2">📍</div>
              <p className="font-arabic text-gray-500 text-sm">
                {isAr ? "بلبيس، محافظة الشرقية" : "Belbeis, Al-Sharqia"}
              </p>
              <a
                href="https://maps.app.goo.gl/EoZWNncauEDcFBU39"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-primary font-arabic text-sm hover:underline"
              >
                {isAr ? "فتح في خرائط جوجل ←" : "Open in Google Maps ←"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}