"use client";

import { useState, useEffect, useCallback } from "react";
import { MEDIA_TYPES, type MediaItem } from "@/lib/media";

export default function MediaManager({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [type, setType] = useState<string>("lesson");
  const [speaker, setSpeaker] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/media");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setTitleAr("");
    setTitleEn("");
    setSpeaker("");
    setDescription("");
    setExternalUrl("");
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!titleAr.trim()) {
      setError(isAr ? "العنوان بالعربية مطلوب" : "Arabic title is required");
      return;
    }
    if (!file && !externalUrl.trim()) {
      setError(
        isAr
          ? "أرفق ملفاً صوتياً أو أدخل رابطاً"
          : "Attach an audio file or enter a URL",
      );
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("titleAr", titleAr.trim());
    if (titleEn.trim()) formData.append("titleEn", titleEn.trim());
    formData.append("type", type);
    if (speaker.trim()) formData.append("speaker", speaker.trim());
    if (description.trim()) formData.append("description", description.trim());
    if (file) formData.append("file", file);
    if (externalUrl.trim()) formData.append("externalUrl", externalUrl.trim());

    const res = await fetch("/api/media", { method: "POST", body: formData });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || (isAr ? "حدث خطأ" : "Something went wrong"));
      return;
    }

    setSuccess(isAr ? "تم الرفع بنجاح" : "Uploaded successfully");
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? "هل تريد حذف هذا العنصر؟" : "Delete this item?"))
      return;
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filtered =
    filter === "all" ? items : items.filter((i) => i.type === filter);

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Upload form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-arabic text-lg font-bold text-gray-800 mb-4">
          {isAr ? "إضافة تسجيل صوتي جديد" : "Add New Audio"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "العنوان (عربي) *" : "Title (Arabic) *"}
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "العنوان (إنجليزي)" : "Title (English)"}
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "القسم" : "Section"}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {MEDIA_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {isAr ? t.labelAr : t.labelEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "اسم القارئ / الخطيب" : "Reciter / Speaker"}
              </label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <label className="block font-arabic text-sm text-gray-600 mb-1">
              {isAr ? "الوصف" : "Description"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              dir="rtl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "رفع ملف صوتي" : "Upload Audio File"}
              </label>
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "أو رابط صوتي خارجي" : "Or external audio URL"}
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://.../audio.mp3"
                disabled={!!file}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-400"
                dir="ltr"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-red-600 text-sm font-arabic">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-green-600 text-sm font-arabic">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-white font-arabic font-bold transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
            }}
          >
            {submitting
              ? isAr
                ? "جارٍ الرفع..."
                : "Uploading..."
              : isAr
                ? "رفع التسجيل"
                : "Upload"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-arabic text-lg font-bold text-gray-800">
            {isAr ? "المحتوى الحالي" : "Current Content"}
          </h2>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: "all", labelAr: "الكل", labelEn: "All", icon: "📂" },
              ...MEDIA_TYPES,
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1.5 rounded-full font-arabic text-xs transition-all ${
                  filter === t.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.icon} {isAr ? t.labelAr : t.labelEn}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 font-arabic">
            {isAr ? "جارٍ التحميل..." : "Loading..."}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 font-arabic">
            {isAr ? "لا يوجد محتوى" : "No content yet"}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((item) => {
              const meta = MEDIA_TYPES.find((t) => t.id === item.type);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl flex-shrink-0">{meta?.icon}</span>
                    <div className="min-w-0">
                      <p
                        className="font-arabic font-bold text-gray-800 truncate"
                        dir="rtl"
                      >
                        {isAr ? item.titleAr : item.titleEn || item.titleAr}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-arabic mt-0.5">
                        <span>{isAr ? meta?.labelAr : meta?.labelEn}</span>
                        {item.speaker && (
                          <>
                            <span>·</span>
                            <span>{item.speaker}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>
                          {new Date(item.createdAt).toLocaleDateString(
                            isAr ? "ar-EG" : "en-US",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary transition-colors font-arabic"
                    >
                      {isAr ? "استماع" : "Listen"}
                    </a>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-arabic"
                    >
                      {isAr ? "حذف" : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
