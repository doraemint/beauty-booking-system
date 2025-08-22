"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get token from URL on initial load
  useEffect(() => {
    const tokenParam = searchParams.get("token") || "";
    setToken(tokenParam);
  }, [searchParams]);

  // Navigation items
  const navItems = [
    { name: "ภาพรวม", href: "/admin/dashboard", icon: "📊" },
    { name: "การจอง", href: "/admin/bookings", icon: "📅" },
    { name: "บริการ", href: "/admin/services", icon: "💇" },
    { name: "ลูกค้า", href: "/admin/customers", icon: "👥" },
    { name: "รายงาน", href: "/admin/reports", icon: "📈" },
    { name: "การตั้งค่า", href: "/admin/settings", icon: "⚙️" },
    { name: "PromptPay", href: "/admin/promptpay", icon: "💳" },
  ];

  // Find current page name for header
  const currentPage = navItems.find((item) => pathname?.startsWith(item.href));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-bold text-gray-800 truncate">
              {currentPage?.name || "Admin Panel"}
            </h1>
          </div>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Desktop Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200 hidden md:block">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <h1 className="text-lg font-bold text-indigo-600">
              Beauty Booking
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหา..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar for mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-lg">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <h1 className="text-lg font-bold text-indigo-600">
              Beauty Booking
            </h1>
            <button
              className="p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          <nav className="mt-2 px-2">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={`${item.href}?token=${token}`}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    pathname === item.href
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="text-xs text-gray-500 truncate">
              Token: {token ? "●●●●●●●●" : "Not set"}
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 z-[-1]"
          onClick={() => setSidebarOpen(false)}
        ></div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-lg font-bold text-indigo-600">Beauty Booking</h1>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={`${item.href}?token=${token}`}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <main
        className={`flex-1 pb-16 md:pb-0 ${
          pathname === "/admin/dashboard" ? "" : "pt-4"
        } md:ml-64 md:pt-4`}
      >
        <div className="container mx-auto px-4">{children}</div>
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.name}
              href={`${item.href}?token=${token}`}
              className={`flex flex-col items-center py-2 text-xs ${
                pathname === item.href ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
