"use client";

import { useState, useEffect, useCallback } from "react";
import { EVENT_CATEGORIES, type EventItem } from "@/lib/mosque-content";

export default function EventsManager({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/events");
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
    setDescriptionAr("");
    setDescriptionEn("");
    setDate("");
    setTime("");
    setLocation("");
    setCategory("other");
    setEditingId(null);
  };

  const startEdit = (item: EventItem) => {
    setEditingId(item.id);
    setTitleAr(item.titleAr);
    setTitleEn(item.titleEn || "");
    setDescriptionAr(item.descriptionAr || "");
    setDescriptionEn(item.descriptionEn || "");
    setDate(item.date.slice(0, 10));
    setTime(item.time);
    setLocation(item.location);
    setCategory(item.category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!titleAr.trim() || !date || !time.trim() || !location.trim()) {
      setError(
        isAr
          ? "العنوان والتاريخ والوقت والمكان مطلوبة"
          : "Title, date, time and location are required",
      );
      return;
    }

    setSubmitting(true);
    const payload = {
      titleAr: titleAr.trim(),
      titleEn: titleEn.trim(),
      descriptionAr: descriptionAr.trim(),
      descriptionEn: descriptionEn.trim(),
      date,
      time: time.trim(),
      location: location.trim(),
      category,
    };

    const res = await fetch(
      editingId ? `/api/events/${editingId}` : "/api/events",
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
          ? "تم التحديث بنجاح"
          : "Updated successfully"
        : isAr
          ? "تمت الإضافة بنجاح"
          : "Added successfully",
    );
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? "هل تريد حذف هذه الفعالية؟" : "Delete this event?"))
      return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-arabic text-lg font-bold text-gray-800 mb-4">
          {editingId
            ? isAr
              ? "تعديل الفعالية"
              : "Edit Event"
            : isAr
              ? "إضافة فعالية جديدة"
              : "Add New Event"}
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
                {isAr ? "الوصف (عربي)" : "Description (Arabic)"}
              </label>
              <textarea
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "الوصف (إنجليزي)" : "Description (English)"}
              </label>
              <textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "التاريخ *" : "Date *"}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "الوقت *" : "Time *"}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "المكان *" : "Location *"}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block font-arabic text-sm text-gray-600 mb-1">
                {isAr ? "النوع" : "Category"}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {isAr ? c.labelAr : c.labelEn}
                  </option>
                ))}
              </select>
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
            {isAr ? "الفعاليات الحالية" : "Current Events"}
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 font-arabic">
            {isAr ? "جارٍ التحميل..." : "Loading..."}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-400 font-arabic">
            {isAr ? "لا توجد فعاليات" : "No events yet"}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item) => {
              const catMeta = EVENT_CATEGORIES.find(
                (c) => c.id === item.category,
              );
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-arabic">
                        {catMeta?.icon}{" "}
                        {isAr ? catMeta?.labelAr : catMeta?.labelEn}
                      </span>
                      <span className="text-xs text-gray-400 font-arabic">
                        {new Date(item.date).toLocaleDateString(
                          isAr ? "ar-EG" : "en-US",
                        )}{" "}
                        · {item.time}
                      </span>
                    </div>
                    <p
                      className="font-arabic font-bold text-gray-800 truncate"
                      dir="rtl"
                    >
                      {item.titleAr}
                    </p>
                    <p className="text-xs text-gray-400 font-arabic mt-0.5">
                      📍 {item.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary transition-colors font-arabic"
                    >
                      {isAr ? "تعديل" : "Edit"}
                    </button>
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
