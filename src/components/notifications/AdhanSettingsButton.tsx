"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import {
  ADHAN_VOICES,
  getSelectedVoice,
  setSelectedVoice,
  isNativeApp,
  type AdhanVoiceId,
} from "@/lib/capacitor-adhan";

export default function AdhanSettingsButton({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AdhanVoiceId>(getSelectedVoice());

  // Voice choice only matters on native — web push has no custom sound.
  if (!isNativeApp()) return null;

  const choose = (id: AdhanVoiceId) => {
    setSelected(id);
    setSelectedVoice(id);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={isAr ? "إعدادات صوت الأذان" : "Adhan sound settings"}
        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5"
            dir={isAr ? "rtl" : "ltr"}
          >
            <h3 className="font-arabic font-bold text-gray-800 mb-1">
              {isAr ? "اختر صوت الأذان" : "Choose Adhan Voice"}
            </h3>
            <p className="font-arabic text-xs text-gray-400 mb-4">
              {isAr
                ? "يُستخدم أذان الفجر تلقائياً لصلاة الفجر"
                : "The Fajr variant is used automatically for Fajr"}
            </p>
            <div className="space-y-2 mb-5">
              {ADHAN_VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => choose(v.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border font-arabic text-sm transition-colors text-right ${
                    selected === v.id
                      ? "border-primary bg-primary/5 text-primary font-bold"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  <span>{isAr ? v.labelAr : v.labelEn}</span>
                  {selected === v.id && <span>✓</span>}
                </button>
              ))}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-arabic font-bold"
            >
              {isAr ? "تم" : "Done"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
