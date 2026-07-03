"use client";

import Link from "next/link";

interface Props {
  locale: string;
}

export default function AccessDenied({ locale }: Props) {
  const isAr = locale === "ar";

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="font-arabic text-2xl font-bold text-gray-800 mb-3">
          {isAr ? "غير مصرح لك بالدخول" : "Access Denied"}
        </h1>
        <p className="font-arabic text-gray-500 mb-8 leading-relaxed">
          {isAr
            ? "هذه الصفحة مخصصة للمديرين فقط. حسابك الحالي لا يملك صلاحيات الوصول إلى لوحة الإدارة."
            : "This page is restricted to administrators only. Your account does not have permission to access the admin panel."}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-block px-6 py-3 rounded-xl text-white font-arabic font-bold transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
          }}
        >
          {isAr ? "العودة للرئيسية ←" : "← Back to Home"}
        </Link>
      </div>
    </main>
  );
}
