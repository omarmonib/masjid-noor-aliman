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
  // @libsql/client uses dynamic requires that confuse webpack's static
  // bundling (it tries to parse README/LICENSE files as JS). Keep these
  // external so Next just require()s them natively in the Node server
  // runtime instead of bundling them.
  experimental: {
    serverComponentsExternalPackages: [
      "@libsql/client",
      "@prisma/adapter-libsql",
      "libsql",
    ],
  },
};

export default withNextIntl(nextConfig);
