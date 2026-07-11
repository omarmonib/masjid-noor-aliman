// src/components/notifications/UpdateGate.tsx
"use client";

import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { isNativeApp } from "@/lib/capacitor-adhan";

export default function UpdateGate({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [status, setStatus] = useState<"ok" | "optional" | "required">("ok");
  const [downloadUrl, setDownloadUrl] = useState("");

  useEffect(() => {
    if (!isNativeApp()) return;

    (async () => {
      const info = await App.getInfo();
      const installed = parseInt(info.build, 10);

      const res = await fetch(
        "https://masjid-noor-aliman.vercel.app/api/app-version",
      );
      const data = await res.json();
      setDownloadUrl(data.downloadUrl);

      if (installed < data.minVersionCode) setStatus("required");
      else if (installed < data.latestVersionCode) setStatus("optional");
    })();
  }, []);

  const openDownload = async () => {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: downloadUrl });
  };

  if (status === "ok") return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl p-6 max-w-sm text-center"
        dir={isAr ? "rtl" : "ltr"}
      >
        <p className="font-arabic font-bold text-gray-800 mb-2">
          {isAr ? "يتوفر تحديث جديد" : "An update is available"}
        </p>
        <p className="font-arabic text-sm text-gray-500 mb-4">
          {status === "required"
            ? isAr
              ? "يجب تحديث التطبيق للمتابعة. سيتم تحميل ملف التثبيت من المتصفح."
              : "Please update to continue. The installer will download in your browser."
            : isAr
              ? "يتضمن التحديث تحسينات جديدة"
              : "This update includes new improvements"}
        </p>
        <button
          onClick={openDownload}
          className="inline-block px-6 py-2.5 rounded-xl text-white font-arabic font-bold"
          style={{ background: "linear-gradient(to right, #0D3D28, #1B6B4A)" }}
        >
          {isAr ? "تحميل التحديث" : "Download Update"}
        </button>
        {status === "optional" && (
          <button
            onClick={() => setStatus("ok")}
            className="block mx-auto mt-3 text-xs text-gray-400 font-arabic"
          >
            {isAr ? "لاحقاً" : "Later"}
          </button>
        )}
      </div>
    </div>
  );
}
