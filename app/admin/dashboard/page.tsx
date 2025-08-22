"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const [token, setToken] = useState("");
  const [stats, setStats] = useState({
    pendingBookings: 0,
    todayBookings: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token") || "";
    setToken(tokenParam);
  }, []);

  // Load dashboard data
  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      setLoading(true);
      
      try {
        // Fetch stats data
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch pending bookings count
        const { count: pendingBookingsCount, error: pendingError } =
          await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("status", "awaiting_deposit");
            
        if (pendingError) {
          console.error("Error fetching pending bookings:", pendingError);
        }

        // Fetch today's bookings count (bookings that start today)
        const { count: todayBookingsCount, error: todayError } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .gte("start_at", today.toISOString())
          .lt("start_at", tomorrow.toISOString())
          .in("status", ["awaiting_deposit", "confirmed"]);
          
        if (todayError) {
          console.error("Error fetching today's bookings:", todayError);
        }

        // Fetch total customers count
        const { count: totalCustomersCount, error: customersError } =
          await supabase
            .from("customers")
            .select("*", { count: "exact", head: true });
            
        if (customersError) {
          console.error("Error fetching customers count:", customersError);
        }

        // Fetch total revenue (sum of deposit amounts for confirmed bookings)
        const { data: revenueData, error: revenueError } = await supabase
          .from("bookings")
          .select("deposit_amount, status");

        let totalRevenue = 0;
        if (revenueError) {
          console.error("Error fetching revenue data:", revenueError);
        } else if (revenueData) {
          // Only sum deposit amounts for confirmed bookings
          totalRevenue = revenueData
            .filter(booking => booking.status === "confirmed")
            .reduce(
              (sum, booking: any) => sum + (booking.deposit_amount || 0),
              0
            );
        }

        setStats({
          pendingBookings: pendingBookingsCount || 0,
          todayBookings: todayBookingsCount || 0,
          totalCustomers: totalCustomersCount || 0,
          totalRevenue: totalRevenue,
        });

        // Fetch recent bookings with customer and service information
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            id,
            start_at,
            status,
            customers(name),
            services(name)
          `)
          .order("created_at", { ascending: false })
          .limit(10);
          
        if (bookingsError) {
          console.error("Error fetching bookings:", bookingsError);
        } else if (bookingsData) {
          const formattedBookings = bookingsData.map((booking: any) => ({
            id: booking.id,
            customer: booking.customers?.name || "Unknown Customer",
            service: booking.services?.name || "Unknown Service",
            time: new Date(booking.start_at).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: booking.status,
          }));

          setRecentBookings(formattedBookings);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // Stat cards
  const statCards = [
    {
      title: "รอการยืนยัน",
      value: stats.pendingBookings,
      icon: "📋",
      color: "bg-yellow-500",
      href: `/admin/bookings?token=${token}&status=awaiting_deposit`,
    },
    {
      title: "การจองวันนี้",
      value: stats.todayBookings,
      icon: "📅",
      color: "bg-blue-500",
      href: `/admin/bookings?token=${token}`,
    },
    {
      title: "ลูกค้าทั้งหมด",
      value: stats.totalCustomers,
      icon: "👥",
      color: "bg-green-500",
      href: `/admin/customers?token=${token}`,
    },
    {
      title: "รายได้ทั้งหมด",
      value: `฿${stats.totalRevenue.toLocaleString()}`,
      icon: "💰",
      color: "bg-purple-500",
      href: `/admin/reports?token=${token}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section - only visible on desktop */}
      <div className="hidden md:block bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">ยินดีต้อนรับกลับ!</h1>
        <p className="opacity-90">นี่คือภาพรวมของระบบการจองของคุณในวันนี้</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            href={stat.href}
            className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 block hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm">{stat.title}</p>
                <p className="text-lg md:text-2xl font-bold mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`${stat.color} w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white text-lg`}
              >
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions - Mobile Only */}
      <div className="md:hidden bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          การดำเนินการด่วน
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/admin/bookings?token=${token}&status=awaiting_deposit`}
            className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 mx-auto mb-2">
              📋
            </div>
            <p className="font-medium text-gray-800 text-sm">
              ยืนยันการชำระเงิน
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.pendingBookings} รายการ
            </p>
          </Link>

          <Link
            href={`/admin/bookings?token=${token}&status=confirmed`}
            className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mx-auto mb-2">
              ✅
            </div>
            <p className="font-medium text-gray-800 text-sm">
              การจองยืนยันแล้ว
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.todayBookings} รายการ
            </p>
          </Link>

          <Link
            href={`/admin/services/deposits?token=${token}`}
            className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mx-auto mb-2">
              💰
            </div>
            <p className="font-medium text-gray-800 text-sm">จัดการมัดจำ</p>
            <p className="text-xs text-gray-500 mt-1">ตั้งค่าราคา</p>
          </Link>

          <Link
            href={`/admin/promptpay?token=${token}`}
            className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mx-auto mb-2">
              ⚙️
            </div>
            <p className="font-medium text-gray-800 text-sm">
              ตั้งค่า PromptPay
            </p>
            <p className="text-xs text-gray-500 mt-1">การชำระเงิน</p>
          </Link>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">การจองล่าสุด</h2>
          <Link
            href={`/admin/bookings?token=${token}`}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ดูทั้งหมด →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate text-sm">
                    {booking.customer}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {booking.service}
                  </p>
                </div>
                <div className="text-right ml-2">
                  <p className="font-medium text-gray-800 text-sm">
                    {booking.time}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      booking.status === "awaiting_deposit"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {booking.status === "awaiting_deposit" ? "รอการยืนยัน" : "ยืนยันแล้ว"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions - Desktop Only */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-6">
          การดำเนินการด่วน
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`/admin/bookings?token=${token}&status=awaiting_deposit`}
            className="block p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 mr-3">
                📋
              </div>
              <div>
                <p className="font-medium text-gray-800">ยืนยันการชำระเงิน</p>
                <p className="text-sm text-gray-500">
                  {stats.pendingBookings} รายการที่รอการยืนยัน
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/admin/bookings?token=${token}&status=confirmed`}
            className="block p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                ✅
              </div>
              <div>
                <p className="font-medium text-gray-800">การจองที่ยืนยันแล้ว</p>
                <p className="text-sm text-gray-500">ดูรายการที่กำลังจะมาถึง</p>
              </div>
            </div>
          </Link>

          <Link
            href={`/admin/services/deposits?token=${token}`}
            className="block p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mr-3">
                💰
              </div>
              <div>
                <p className="font-medium text-gray-800">จัดการมัดจำ</p>
                <p className="text-sm text-gray-500">ปรับปรุงจำนวนเงินมัดจำ</p>
              </div>
            </div>
          </Link>

          <Link
            href={`/admin/promptpay?token=${token}`}
            className="block p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mr-3">
                ⚙️
              </div>
              <div>
                <p className="font-medium text-gray-800">ตั้งค่า PromptPay</p>
                <p className="text-sm text-gray-500">จัดการข้อมูลการชำระเงิน</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}