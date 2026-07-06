import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.masjidnooraliman.app",
  appName: "مسجد نور الإيمان",
  webDir: "capacitor-www",
  server: {
    // Replace with your real production domain
    url: "https://YOUR-DOMAIN.vercel.app",
    cleartext: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#1B6B4A",
      sound: "adhan_short.wav",
    },
  },
};

export default config;
