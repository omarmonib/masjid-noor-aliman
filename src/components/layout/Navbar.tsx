"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import AdhanSettingsButton from "@/components/notifications/AdhanSettingsButton";

export default function Navbar({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
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

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div
        className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Logo — single line on desktop */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span className="text-lg">🕌</span>
          <span className="font-arabic text-base font-bold text-gray-800 whitespace-nowrap">
            {isAr ? "مسجد نور الإيمان" : "Masjid Noor Al-Iman"}
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const href = `/${locale}${link.href}`;
            const isActive =
              pathname === href ||
              (link.href !== "" && pathname.startsWith(href));
            return (
              <Link
                key={link.href}
                href={href}
                className={`px-2.5 py-1.5 rounded-lg font-arabic text-sm transition-colors ${
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

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-0">
            <NotificationBell locale={locale} />
            <AdhanSettingsButton locale={locale} />
          </div>

          {session ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-1.5 pl-2 pr-1 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {(session.user?.name ||
                    session.user?.email ||
                    "?")[0].toUpperCase()}
                </span>
                <ChevronDown size={14} />
              </button>

              {accountOpen && (
                <div
                  className="absolute mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
                  style={{ [isAr ? "right" : "left"]: 0 }}
                >
                  <div className="px-3 py-2 border-b border-gray-50">
                    <p className="font-arabic text-sm font-medium text-gray-700 truncate">
                      {session.user?.name || session.user?.email}
                    </p>
                  </div>
                  {isAdmin && (
                    <Link
                      href={`/${locale}/admin`}
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-2 font-arabic text-sm text-gray-600 hover:bg-gray-50"
                    >
                      {isAr ? "لوحة الإدارة" : "Admin"}
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: `/${locale}` })}
                    className="w-full text-right px-3 py-2 font-arabic text-sm text-red-500 hover:bg-red-50"
                  >
                    {isAr ? "تسجيل الخروج" : "Sign Out"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className="font-arabic text-sm px-3 py-1.5 rounded-lg text-white transition-colors"
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

          {isAdmin && (
            <Link
              href={`/${locale}/admin`}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl font-arabic text-sm transition-colors ${
                pathname === `/${locale}/admin`
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {isAr ? "لوحة الإدارة" : "Admin"}
            </Link>
          )}

          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl">
            <span className="font-arabic text-sm text-gray-600">
              {isAr ? "الأذان" : "Adhan"}
            </span>
            <div className="flex items-center gap-1.5">
              <NotificationBell locale={locale} />
              <AdhanSettingsButton locale={locale} />
            </div>
          </div>

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
