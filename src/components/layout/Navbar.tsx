"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", labelAr: "الرئيسية", labelEn: "Home" },
  { href: "/quran", labelAr: "القرآن", labelEn: "Quran" },
  { href: "/hadith", labelAr: "الحديث", labelEn: "Hadith" },
  { href: "/adhkar", labelAr: "الأذكار", labelEn: "Adhkar" },
  { href: "/prayer-times", labelAr: "مواقيت الصلاة", labelEn: "Prayer Times" },
  { href: "/mosque", labelAr: "المسجد", labelEn: "Mosque" },
  { href: "/donate", labelAr: "تبرع", labelEn: "Donate" },
];

export default function Navbar({ locale }: { locale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isAr = locale === "ar";

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gold/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${locale}`} className="flex flex-col leading-tight">
            <span className="font-arabic text-lg font-bold text-primary">
              مسجد نور الإيمان
            </span>
            <span className="text-xs text-gold font-medium tracking-wide">
              Masjid Noor Al-Iman
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const href = `/${locale}${link.href === "/" ? "" : link.href}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={link.href}
                  href={href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors font-arabic",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {isAr ? link.labelAr : link.labelEn}
                </Link>
              );
            })}
          </div>

          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
          {navLinks.map((link) => {
            const href = `/${locale}${link.href === "/" ? "" : link.href}`;
            return (
              <Link
                key={link.href}
                href={href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-arabic text-gray-700 hover:bg-primary/10 hover:text-primary"
              >
                {isAr ? link.labelAr : link.labelEn}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
