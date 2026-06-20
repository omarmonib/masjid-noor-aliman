import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.quran.com" },
      { protocol: "https", hostname: "**.everyayah.com" },
      { protocol: "https", hostname: "www.searchtruth.com" },
      { protocol: "https", hostname: "static.qurancdn.com" },
      { protocol: "https", hostname: "cdn.islamic.network" },
    ],
  },
};

export default withNextIntl(nextConfig);
