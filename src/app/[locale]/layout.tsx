import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Cairo, Amiri, Inter } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import SessionWrapper from "@/components/auth/SessionWrapper";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });
const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SessionWrapper>
        <div
          className={`${cairo.variable} ${amiri.variable} ${inter.variable} min-h-screen bg-surface`}
          dir={locale === "ar" ? "rtl" : "ltr"}
          style={{ fontFamily: "var(--font-cairo), sans-serif" }}
        >
          <Navbar locale={locale} />
          {children}
        </div>
      </SessionWrapper>
    </NextIntlClientProvider>
  );
}
