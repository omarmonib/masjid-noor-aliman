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
      valueAr: "بلبيس — محافظة الشرقية — مصر",
      valueEn: "Belbeis — Al-Sharqia — Egypt",
    },
    {
      icon: "📞",
      labelAr: "التواصل",
      labelEn: "Contact",
      valueAr: "٠١٢٣٤٥٦٧٨٩",
      valueEn: "01234567890",
    },
    {
      icon: "🕐",
      labelAr: "أوقات الإدارة",
      labelEn: "Office Hours",
      valueAr: "السبت — الخميس: ٩ص — ٢م",
      valueEn: "Sat — Thu: 9AM — 2PM",
    },
    {
      icon: "🌐",
      labelAr: "البريد الإلكتروني",
      labelEn: "Email",
      valueAr: "info@masjidnoorAliman.com",
      valueEn: "info@masjidnooraliman.com",
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
                href="https://maps.google.com/?q=بلبيس+الشرقية+مصر"
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
