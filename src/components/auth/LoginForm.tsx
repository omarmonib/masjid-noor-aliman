"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isNativeApp } from "@/lib/capacitor-adhan";


interface Props {
  locale: string;
  callbackUrl?: string;
}

export default function LoginForm({ locale, callbackUrl }: Props) {
  const isAr = locale === "ar";
  const router = useRouter();

  // Only trust internal, relative paths — never redirect off-site
  const destination =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : `/${locale}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
      router.push(destination);
      router.refresh();
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    if (isNativeApp()) {
      const nativeCallback = `${window.location.origin}/api/auth/native-complete?dest=${encodeURIComponent(destination)}`;
      await signIn("google", { callbackUrl: nativeCallback });
    } else {
      await signIn("google", { callbackUrl: destination });
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Google Sign In */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all mb-5 disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="font-arabic text-gray-700 text-sm font-medium">
              {isAr ? "تسجيل الدخول بـ Google" : "Sign in with Google"}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="font-arabic text-xs text-gray-400">
              {isAr ? "أو بالبريد الإلكتروني" : "or with email"}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center">
                <p className="font-arabic text-red-600 text-sm">{error}</p>
              </div>
            )}

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
