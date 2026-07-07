import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Cairo, Amiri, Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import SessionWrapper from "@/components/auth/SessionWrapper";
import type { Metadata, Viewport } from "next";
import NotificationPrompt from "@/components/notifications/NotificationPrompt";
import AdhanPlayer from "@/components/notifications/AdhanPlayer";
import NativeAdhanScheduler from "@/components/notifications/NativeAdhanScheduler";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });
const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#1B6B4A",
};

export const metadata: Metadata = {
  title: "مسجد نور الإيمان",
  description: "الموقع الرسمي لمسجد نور الإيمان - بلبيس",
  manifest: "/manifest.json",
  themeColor: "#1B6B4A",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "نور الإيمان",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🕌</text></svg>",
    apple: "/icons/icon-192x192.png",
  },
};

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
  const session = await getServerSession(authOptions);

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${cairo.variable} ${amiri.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="application-name" content="مسجد نور الإيمان" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="نور الإيمان" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1B6B4A" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className="bg-surface min-h-screen"
        style={{ fontFamily: "var(--font-cairo), sans-serif" }}
      >
        <NextIntlClientProvider messages={messages}>
          <SessionWrapper session={session}>
            <Navbar locale={locale} />
            <NotificationPrompt locale={locale} />
            <AdhanPlayer locale={locale} />
            <NativeAdhanScheduler />
            {children}
          </SessionWrapper>
        </NextIntlClientProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) {window.addEventListener('load', function() {navigator.serviceWorker.register('/sw.js').catch(function(err) {console.error('SW registration failed:', err);});});}`,
          }}
        />
      </body>
    </html>
  );
}
