"use client";

import { useState, useEffect } from "react";

const PROTECTED_ADMIN_EMAIL = "omar.monib.03@gmail.com";


interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  image: string | null;
}

interface Stats {
  totalUsers: number;
  totalMedia: number;
}

export default function AdminDashboard({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalMedia: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "media">(
    "overview",
  );
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, mediaRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/media"),
      ]);
      const usersData = await usersRes.json();
      const mediaData = await mediaRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
      setStats({
        totalUsers: Array.isArray(usersData) ? usersData.length : 0,
        totalMedia: Array.isArray(mediaData) ? mediaData.length : 0,
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const updateRole = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
        setMessage(isAr ? "تم تحديث الصلاحية" : "Role updated");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
    setUpdatingRole(null);
  };

  const tabs = [
    {
      id: "overview" as const,
      labelAr: "نظرة عامة",
      labelEn: "Overview",
      icon: "📊",
    },
    {
      id: "users" as const,
      labelAr: "المستخدمون",
      labelEn: "Users",
      icon: "👥",
    },
    {
      id: "media" as const,
      labelAr: "الخطب والتسجيلات",
      labelEn: "Sermons",
      icon: "🎙️",
    },
  ];

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D3D28] to-[#1B6B4A] py-10 px-4 text-center text-white">
        <div className="text-4xl mb-3">⚙️</div>
        <h1 className="font-arabic text-3xl font-bold">
          {isAr ? "لوحة الإدارة" : "Admin Dashboard"}
        </h1>
        <p className="font-arabic text-white/60 text-sm mt-1">
          {isAr ? "مسجد نور الإيمان" : "Masjid Noor Al-Iman"}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-arabic text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center font-arabic text-green-700 text-sm">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: "👥",
                      labelAr: "إجمالي المستخدمين",
                      labelEn: "Total Users",
                      value: stats.totalUsers,
                      color: "bg-blue-50 text-blue-700 border-blue-100",
                    },
                    {
                      icon: "🎙️",
                      labelAr: "التسجيلات",
                      labelEn: "Recordings",
                      value: stats.totalMedia,
                      color: "bg-green-50 text-green-700 border-green-100",
                    },
                    {
                      icon: "👤",
                      labelAr: "المديرون",
                      labelEn: "Admins",
                      value: users.filter((u) => u.role === "ADMIN").length,
                      color: "bg-purple-50 text-purple-700 border-purple-100",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl border p-5 text-center ${stat.color}`}
                    >
                      <div className="text-3xl mb-2">{stat.icon}</div>
                      <div className="font-arabic text-3xl font-bold mb-1">
                        {stat.value}
                      </div>
                      <div className="font-arabic text-sm">
                        {isAr ? stat.labelAr : stat.labelEn}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick links */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-arabic text-lg font-bold text-gray-800 mb-4">
                    {isAr ? "روابط سريعة" : "Quick Links"}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        href: "/ar/admin/media",
                        icon: "🎙️",
                        labelAr: "إدارة الخطب والتسجيلات",
                        labelEn: "Manage Sermons",
                      },
                      {
                        href: "/ar/mosque",
                        icon: "🕌",
                        labelAr: "صفحة المسجد",
                        labelEn: "Mosque Page",
                      },
                      {
                        href: "/ar/sermons",
                        icon: "📻",
                        labelAr: "صفحة التسجيلات",
                        labelEn: "Sermons Page",
                      },
                      {
                        href: "/ar",
                        icon: "🏠",
                        labelAr: "الصفحة الرئيسية",
                        labelEn: "Home Page",
                      },
                    ].map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                      >
                        <span className="text-2xl">{link.icon}</span>
                        <span className="font-arabic text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                          {isAr ? link.labelAr : link.labelEn}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Recent users */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-arabic text-lg font-bold text-gray-800">
                      {isAr ? "آخر المستخدمين" : "Recent Users"}
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {users.slice(0, 5).map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-4 px-6 py-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                          {user.name?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-arabic font-medium text-gray-800 truncate">
                            {user.name || "—"}
                          </p>
                          <p className="font-arabic text-xs text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-arabic ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}
                        >
                          {user.role === "ADMIN"
                            ? isAr
                              ? "مدير"
                              : "Admin"
                            : isAr
                              ? "مستخدم"
                              : "User"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users management */}
            {activeTab === "users" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-arabic text-lg font-bold text-gray-800">
                    {isAr
                      ? `المستخدمون (${users.length})`
                      : `Users (${users.length})`}
                  </h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 px-6 py-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 text-lg">
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.image}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          (user.name?.[0] || user.email[0]).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-arabic font-medium text-gray-800 truncate">
                          {user.name || "—"}
                        </p>
                        <p className="font-arabic text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                        <p className="font-arabic text-xs text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString(
                            isAr ? "ar-EG" : "en-US",
                          )}
                        </p>
                      </div>
                      {user.email === PROTECTED_ADMIN_EMAIL ? (
                        <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-arabic">
                          🔒 {isAr ? "مدير أساسي" : "Founding Admin"}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => updateRole(user.id, e.target.value)}
                          disabled={updatingRole === user.id}
                          className="font-arabic text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                        >
                          <option value="USER">
                            {isAr ? "مستخدم" : "User"}
                          </option>
                          <option value="ADMIN">
                            {isAr ? "مدير" : "Admin"}
                          </option>
                        </select>
                      )}
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="py-12 text-center text-gray-400 font-arabic">
                      {isAr ? "لا يوجد مستخدمون" : "No users found"}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Media — redirect to existing page */}
            {activeTab === "media" && (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">🎙️</div>
                <p className="font-arabic text-gray-600 mb-6">
                  {isAr
                    ? "انتقل إلى صفحة إدارة الخطب والتسجيلات"
                    : "Go to the Sermons management page"}
                </p>
                <a
                  href={`/${locale}/admin/media`}
                  className="inline-block px-6 py-3 rounded-xl text-white font-arabic font-bold"
                  style={{
                    background: "linear-gradient(to right, #0D3D28, #1B6B4A)",
                  }}
                >
                  {isAr ? "إدارة الخطب والتسجيلات ←" : "Manage Sermons ←"}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
