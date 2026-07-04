"use client";

import { useState, useEffect, useCallback } from "react";
import type { Speaker } from "@/lib/speakers";

export default function SpeakersManager({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [order, setOrder] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/speakers");
    const data = await res.json();
    setSpeakers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setNameAr("");
    setNameEn("");
    setOrder("0");
    setEditingId(null);
  };

  const startEdit = (s: Speaker) => {
    setEditingId(s.id);
    setNameAr(s.nameAr);
    setNameEn(s.nameEn || "");
    setOrder(String(s.order));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nameAr.trim()) {
      setError(isAr ? "الاسم بالعربية مطلوب" : "Arabic name is required");
      return;
    }

    setSubmitting(true);
    const payload = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      order: Number(order) || 0,
    };

    const res = await fetch(
      editingId ? `/api/speakers/${editingId}` : "/api/speakers",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || (isAr ? "حدث خطأ" : "Something went wrong"));
      return;
    }

    setSuccess(
      editingId
        ? isAr
          ? "تم التحديث"
          : "Updated"
        : isAr
          ? "تمت الإضافة"
          : "Added",
    );
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        isAr
          ? "حذف هذا القارئ؟ التسجيلات المرتبطة به ستبقى لكن بدون قسم مخصص."
          : "Delete this speaker? Linked recordings will remain but lose their dedicated section.",
      )
    )
      return;
    const res = await fetch(`/api/speakers/${id}`, { method: "DELETE" });
    if (res.ok) setSpeakers((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-arabic text-lg font-bold text-gray-800 mb-4">
          {editingId
            ? isAr
              ? "تعديل القارئ"
              : "Edit Speaker"
            : isAr
              ? "إضافة قارئ / خطيب جديد"
              : "Add New Speaker"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "الاسم (عربي) *" : "Name (Arabic) *"}
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "الاسم (إنجليزي)" : "Name (English)"}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block font-arabic text-sm text-gray-600 mb-1">
              {isAr
                ? "ترتيب الظهور (الأصغر يظهر أولاً)"
                : "Display order (lower shows first)"}
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full sm:w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
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

          <div className="flex gap-3">
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
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : editingId
                  ? isAr
                    ? "حفظ التعديلات"
                    : "Save Changes"
                  : isAr
                    ? "إضافة"
                    : "Add"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-arabic hover:bg-gray-50 transition-colors"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-arabic text-lg font-bold text-gray-800">
            {isAr ? "القراء والخطباء الحاليون" : "Current Speakers"}
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 font-arabic">
            {isAr ? "جارٍ التحميل..." : "Loading..."}
          </div>
        ) : speakers.length === 0 ? (
          <div className="py-12 text-center text-gray-400 font-arabic">
            {isAr ? "لا يوجد قراء بعد" : "No speakers yet"}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {speakers.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-arabic font-bold text-gray-800" dir="rtl">
                    {s.nameAr}
                  </p>
                  {s.nameEn && (
                    <p className="text-xs text-gray-400">{s.nameEn}</p>
                  )}
                  <p className="text-xs text-gray-300 font-arabic mt-0.5">
                    {isAr ? "الترتيب" : "Order"}: {s.order}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary transition-colors font-arabic"
                  >
                    {isAr ? "تعديل" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-arabic"
                  >
                    {isAr ? "حذف" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
