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

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

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
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${cairo.variable} ${amiri.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body
        className="bg-surface min-h-screen"
        style={{ fontFamily: "var(--font-cairo), sans-serif" }}
      >
        <NextIntlClientProvider messages={messages}>
          <SessionWrapper>
            <Navbar locale={locale} />
            {children}
          </SessionWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
