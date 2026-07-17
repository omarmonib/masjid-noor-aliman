import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Cairo, Amiri, Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppChrome from "@/components/layout/AppChrome";
import SessionWrapper from "@/components/auth/SessionWrapper";
import type { Metadata, Viewport } from "next";
import NativeAdhanScheduler from "@/components/notifications/NativeAdhanScheduler";
import NativeAuthBridge from "@/components/auth/NativeAuthBridge";
import UpdateGate from "@/components/notifications/UpdateGate";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });
const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// themeColor (and other viewport-level settings) must live in a dedicated
// `viewport` export in Next.js 14 App Router — putting it inside `metadata`
// still works today but logs the "Unsupported metadata themeColor" warning
// on every request and will be a hard error in a future Next.js major.
export const viewport: Viewport = {
  themeColor: "#1B6B4A",
};

export const metadata: Metadata = {
  title: "مسجد نور الإيمان",
  description: "الموقع الرسمي لمسجد نور الإيمان - بلبيس",
  manifest: "/manifest.json",
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
            {/* AppChrome switches between WebLayout and NativeLayout —
               the entire nav/app-bar/bottom-nav experience lives inside
               one of those two, never here. This file only owns things
               that must exist regardless of which shell is active. */}
            <AppChrome locale={locale}>{children}</AppChrome>

            {/* These three self-guard on isNativeApp() internally and
               correctly no-op on web, so they're mounted once here
               rather than duplicated inside WebLayout/NativeLayout. */}
            <NativeAdhanScheduler />
            <NativeAuthBridge />
            <UpdateGate locale={locale} />
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
