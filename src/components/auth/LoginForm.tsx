"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(
        isAr
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : "Invalid email or password",
      );
    } else {
      router.push(`/${locale}`);
      router.refresh();
    }
  };

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
            {isAr ? "تسجيل الدخول" : "Sign In"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  ? "جارٍ الدخول..."
                  : "Signing in..."
                : isAr
                  ? "تسجيل الدخول"
                  : "Sign In"}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="font-arabic text-sm text-gray-500">
              {isAr ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
              <Link
                href={`/${locale}/auth/register`}
                className="text-primary font-bold hover:underline"
              >
                {isAr ? "إنشاء حساب" : "Register"}
              </Link>
            </p>
          </div>
        </div>

        {/* Back home */}
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
