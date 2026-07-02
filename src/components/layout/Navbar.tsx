"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  const navLinks = [
    { href: "", labelAr: "الرئيسية", labelEn: "Home" },
    { href: "/hadith", labelAr: "الحديث", labelEn: "Hadith" },
    { href: "/quran", labelAr: "القرآن", labelEn: "Quran" },
    { href: "/sermons", labelAr: "الخطب والتسجيلات", labelEn: "Sermons" },
    { href: "/adhkar", labelAr: "الأذكار", labelEn: "Adhkar" },
    {
      href: "/prayer-times",
      labelAr: "مواقيت الصلاة",
      labelEn: "Prayer Times",
    },
    { href: "/radio", labelAr: "الإذاعة", labelEn: "Radio" },
    { href: "/mosque", labelAr: "المسجد", labelEn: "Mosque" },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div
        className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Logo */}
        <Link href={`/${locale}`} className="flex flex-col">
          <span className="font-arabic text-lg font-bold text-gray-800 leading-tight">
            {isAr ? "مسجد نور الإيمان" : "Masjid Noor Al-Iman"}
          </span>
          <span className="text-xs text-primary font-arabic">
            {isAr ? "Masjid Noor Al-Iman" : "مسجد نور الإيمان"}
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const href = `/${locale}${link.href}`;
            const isActive =
              pathname === href ||
              (link.href !== "" && pathname.startsWith(href));
            return (
              <Link
                key={link.href}
                href={href}
                className={`px-3 py-2 rounded-lg font-arabic text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                }`}
              >
                {isAr ? link.labelAr : link.labelEn}
              </Link>
            );
          })}
        </div>

        {/* Auth button */}
        <div className="hidden md:flex items-center gap-2">
          {session?.user?.role === "ADMIN" && (
            <Link
              href={`/${locale}/admin`}
              className="font-arabic text-sm px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
            >
              {isAr ? "لوحة الإدارة" : "Admin"}
            </Link>
          )}

          {session ? (
            <div className="flex items-center gap-2">
              <span className="font-arabic text-sm text-gray-600">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
                className="font-arabic text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500 transition-colors"
              >
                {isAr ? "خروج" : "Sign Out"}
              </button>
            </div>
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className="font-arabic text-sm px-4 py-2 rounded-lg text-white transition-colors"
              style={{
                background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
              }}
            >
              {isAr ? "دخول" : "Sign In"}
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-50"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="w-5 h-0.5 bg-gray-600 mb-1" />
          <div className="w-5 h-0.5 bg-gray-600 mb-1" />
          <div className="w-5 h-0.5 bg-gray-600" />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const href = `/${locale}${link.href}`;
            const isActive = pathname === href;
            return (
              <Link
                key={link.href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl font-arabic text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {isAr ? link.labelAr : link.labelEn}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-gray-100">
            {session ? (
              <button
                onClick={() => {
                  signOut({ callbackUrl: `/${locale}` });
                  setMenuOpen(false);
                }}
                className="w-full font-arabic text-sm px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-right"
              >
                {isAr ? "تسجيل الخروج" : "Sign Out"}
              </button>
            ) : (
              <Link
                href={`/${locale}/auth/login`}
                onClick={() => setMenuOpen(false)}
                className="block text-center font-arabic text-sm px-4 py-2.5 rounded-xl text-white"
                style={{
                  background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
                }}
              >
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
