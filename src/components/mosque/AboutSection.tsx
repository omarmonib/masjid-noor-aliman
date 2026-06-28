"use client";

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
      valueAr: "حي الزهور - بلبيس",
      valueEn: "Al-Zohour District - Belbeis - Al-Sharqia - Egypt",
    },
    {
      icon: "🕐",
      labelAr: "أوقات العمل",
      labelEn: "Working Hours",
      valueAr: "مفتوح طوال اليوم",
      valueEn: "Open all day",
    },
  ];

  const admins = [
    { nameAr: "م/ محمد رابع", nameEn: "Mohamed Rabiea", phone: "01066271986" },
    { nameAr: "أ/ أحمد رابع", nameEn: "Ahmed Rabiea", phone: "01067470470" },
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

  const WhatsAppIcon = () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.113.546 4.1 1.502 5.836L.057 23.215a.75.75 0 0 0 .921.921l5.379-1.445A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.695 9.695 0 0 1-4.95-1.355l-.355-.21-3.681.989.988-3.607-.228-.37A9.696 9.696 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div
      className="px-4 sm:px-6 py-3 sm:py-4 text-white font-arabic font-bold text-sm sm:text-base"
      style={{ background: "linear-gradient(to right, #0D3D28, #1B6B4A)" }}
    >
      {title}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Sadaqa Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-4 sm:px-6 py-5 sm:py-6 text-center border border-[#C9A84C]/30 shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, #0D3D28 0%, #1B6B4A 55%, #0D3D28 100%)",
        }}
      >
        {/* subtle decorative glow */}
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{ background: "#C9A84C" }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
          style={{ background: "#C9A84C" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-2">
          <span className="text-2xl">🌿</span>
          <p
            className="font-arabic text-bold text-sm sm:text-base text-white/90 leading-relaxed break-words max-w-md mx-auto"
            dir="rtl"
          >
            {isAr ? (
              <>
                هذا العمل صدقة جارية في ذكرى الحاج محمود رابع{" "}
                <span className="whitespace-nowrap">رحمه الله ونوّر قبره</span>
              </>
            ) : (
              "This work is a continuous charity in memory of the late Haj Mahmoud Rabiea — may Allah have mercy on him"
            )}
          </p>
        </div>
      </div>

      {/* ── Mosque Info ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title={isAr ? "معلومات المسجد" : "Mosque Information"} />
        <div className="divide-y divide-gray-50">
          {info.map(({ icon, labelAr, labelEn, valueAr, valueEn }, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 flex-shrink-0">
                <span className="text-lg sm:text-xl">{icon}</span>
                <span className="font-arabic text-xs sm:text-sm">
                  {isAr ? labelAr : labelEn}
                </span>
              </div>
              <p
                className="font-arabic text-gray-800 font-medium text-sm sm:text-base leading-relaxed"
                dir="rtl"
              >
                {isAr ? valueAr : valueEn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Admins / Contact ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader
          title={isAr ? "التواصل مع الإدارة" : "Contact Administration"}
        />
        <div className="divide-y divide-gray-50">
          {admins.map((admin, idx) => (
            <div
              key={idx}
              className="flex flex-row items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3"
              dir="rtl"
            >
              <span className="font-arabic font-bold text-gray-800 text-sm sm:text-base">
                {isAr ? admin.nameAr : admin.nameEn}
              </span>
              <a
                href={`https://wa.me/2${admin.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-white font-arabic text-xs sm:text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-sm flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #25D366, #1ebe5d)",
                }}
              >
                <WhatsAppIcon />
                <span dir="ltr">{admin.phone}</span>
              </a>
            </div>
          ))}
        </div>
      </div>
      {/* ── History / Founder ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title={isAr ? "نشأة المسجد" : "History of the Mosque"} />
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden relative">
            <Image
              src="/images/founder.png"
              alt={isAr ? "الحاج محمود رابع" : "Haj Mahmoud Rabiea"}
              fill
              sizes="(max-width: 640px) 96px, 128px"
              className="object-cover"
            />
          </div>
          <div className="text-center sm:text-right" dir="rtl">
            <p className="font-arabic text-gray-800 leading-loose text-sm sm:text-base">
              {isAr
                ? "تأسس مسجد نور الإيمان عام ١٩٨٦م على يد الحاج محمود رابع، رحمه الله، الذي بذل جهداً كبيراً في بناء المسجد وخدمة أهل المنطقة، فجزاه الله خير الجزاء وجعل ذلك في ميزان حسناته."
                : "Masjid Noor Al-Iman was founded in 1986 by Haj Mahmoud Rabie, who dedicated great effort to building the mosque and serving the local community. May Allah reward him abundantly."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Services ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title={isAr ? "خدمات المسجد" : "Mosque Services"} />
        <div className="p-4 sm:p-5 grid grid-cols-2 gap-2 sm:gap-3">
          {services.map((s) => (
            <div
              key={s}
              className="flex items-center gap-2 font-arabic text-xs sm:text-sm text-gray-700"
              dir="rtl"
            >
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* ── Location ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title={isAr ? "الموقع" : "Location"} />
        <div className="p-4 sm:p-5">
          <div className="bg-gray-50 rounded-xl h-40 sm:h-48 flex items-center justify-center border border-gray-100">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-2">📍</div>
              <p className="font-arabic text-gray-500 text-xs sm:text-sm">
                {isAr ? "بلبيس، محافظة الشرقية" : "Belbeis, Al-Sharqia"}
              </p>
              <a
                href="https://maps.app.goo.gl/EoZWNncauEDcFBU39"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-primary font-arabic text-xs sm:text-sm hover:underline"
              >
                {isAr ? "فتح في خرائط جوجل ←" : "Open in Google Maps ←"}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Technical Feedback ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader
          title={isAr ? "الشكاوى والاقتراحات التقنية" : "Technical Feedback"}
        />
        <div className="p-4 sm:p-6 space-y-3" dir="rtl">
          <p className="font-arabic text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-right">
            {isAr
              ? "نرحب بملاحظاتكم واقتراحاتكم. إذا واجهت أي مشكلة تقنية أو كان لديك اقتراح لتحسين التطبيق، يُرجى التواصل مع مطوّر التطبيق مباشرة."
              : "Encountered a bug or have a suggestion? Contact the website developer directly."}
          </p>
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 text-center sm:text-right">
            <div>
              <p className="font-arabic font-bold text-gray-800 text-sm sm:text-base">
                {isAr ? "م/ عمر منيب" : "Eng. Omar Mounib"}
              </p>
              <p className="font-arabic text-xs text-gray-400 mt-0.5">
                {isAr ? "المطور التقني" : "Developer"}
              </p>
            </div>
            <a
              href="https://wa.me/201204171020"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-white font-arabic text-xs sm:text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-sm flex-shrink-0 whitespace-nowrap"
              style={{
                background: "linear-gradient(135deg, #25D366, #1ebe5d)",
              }}
            >
              <WhatsAppIcon />
              <span dir="ltr">01204171020</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
