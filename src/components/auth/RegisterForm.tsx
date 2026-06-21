"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterForm({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError(
        isAr
          ? "كلمة المرور يجب أن تكون ٨ أحرف على الأقل"
          : "Password must be at least 8 characters",
      );
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      const msgs: Record<string, string> = {
        "Email already registered": isAr
          ? "البريد الإلكتروني مسجل مسبقاً"
          : "Email already registered",
        "All fields required": isAr
          ? "جميع الحقول مطلوبة"
          : "All fields required",
      };
      setError(msgs[data.error] || data.error);
    } else {
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/auth/login`), 2000);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="font-arabic text-2xl font-bold text-gray-800 mb-2">
            {isAr ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!"}
          </h2>
          <p className="font-arabic text-gray-500">
            {isAr ? "جارٍ التحويل لصفحة الدخول..." : "Redirecting to login..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🕌</div>
          <h1 className="font-arabic text-2xl font-bold text-gray-800">
            {isAr ? "مسجد نور الإيمان" : "Masjid Noor Al-Iman"}
          </h1>
          <p className="font-arabic text-gray-500 text-sm mt-1">
            {isAr ? "إنشاء حساب جديد" : "Create New Account"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block font-arabic text-sm font-medium text-gray-700 mb-2 text-right">
                {isAr ? "الاسم الكامل" : "Full Name"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                dir="rtl"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder={isAr ? "أدخل اسمك الكامل" : "Enter your full name"}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-arabic text-sm font-medium text-gray-700 mb-2 text-right">
                {isAr ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="email@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block font-arabic text-sm font-medium text-gray-700 mb-2 text-right">
                {isAr ? "كلمة المرور" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="••••••••"
              />
              <p className="font-arabic text-xs text-gray-400 mt-1 text-right">
                {isAr ? "٨ أحرف على الأقل" : "At least 8 characters"}
              </p>
            </div>

            {/* Confirm */}
            <div>
              <label className="block font-arabic text-sm font-medium text-gray-700 mb-2 text-right">
                {isAr ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center">
                <p className="font-arabic text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-arabic text-white font-bold transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
              }}
            >
              {loading
                ? isAr
                  ? "جارٍ الإنشاء..."
                  : "Creating account..."
                : isAr
                  ? "إنشاء الحساب"
                  : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-arabic text-sm text-gray-500">
              {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
              <Link
                href={`/${locale}/auth/login`}
                className="text-primary font-bold hover:underline"
              >
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link
            href={`/${locale}`}
            className="font-arabic text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            → {isAr ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
