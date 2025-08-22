"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import liff from "@line/liff";
import BottomNavBar from "@/components/BottomNavBar";

type Booking = {
  id: string;
  start_at: string;
  status: string;
  payment_status: string;
  deposit_amount: number;
  payment_method: string;
  created_at: string;
  service_name: string;
  service_price: number;
  customer_name: string;
  customer_phone: string;
};

export default function BookingHistoryPage() {
  const sp = useSearchParams();
  const [uid, setUid] = useState<string>(sp.get("uid") || "");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status labels for display
  const statusLabels: Record<string, { text: string; color: string }> = {
    awaiting_deposit: {
      text: "รอการยืนยันมัดจำ",
      color: "bg-yellow-100 text-yellow-800",
    },
    confirmed: { text: "ยืนยันแล้ว", color: "bg-green-100 text-green-800" },
    cancelled: { text: "ยกเลิก", color: "bg-red-100 text-red-800" },
    no_show: { text: "ไม่มา", color: "bg-gray-100 text-gray-800" },
  };

  const paymentStatusLabels: Record<string, { text: string; color: string }> = {
    unpaid: { text: "ยังไม่ชำระ", color: "bg-yellow-100 text-yellow-800" },
    paid: { text: "ชำระแล้ว", color: "bg-green-100 text-green-800" },
    refunded: { text: "คืนเงิน", color: "bg-blue-100 text-blue-800" },
    rejected: { text: "ถูกปฏิเสธ", color: "bg-red-100 text-red-800" },
  };

  const paymentMethodLabels: Record<string, string> = {
    bank_transfer: "โอนเงิน",
    promptpay_qr: "PromptPay QR",
  };

  // Initialize LIFF and get user info
  useEffect(() => {
    if (uid) return; // Already have uid

    (async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID as string | undefined;
        if (!liffId) {
          setError("LIFF is not configured");
          setLoading(false);
          return;
        }

        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          // Redirect to login
          liff.login({ redirectUri: window.location.href });
          return;
        }

        // Get user ID from LIFF context
        const ctx: any = (liff as any).getContext?.();
        if (ctx?.userId) {
          setUid(ctx.userId);
          return;
        }

        // Fallback to ID token
        const idToken = liff.getIDToken();
        if (idToken) {
          const payload = JSON.parse(atob(idToken.split(".")[1]));
          if (payload?.sub) {
            setUid(payload.sub);
            return;
          }
        }

        // Last resort: profile
        const profile = await liff.getProfile();
        if (profile?.userId) setUid(profile.userId);
      } catch (e) {
        console.error("LIFF init error", e);
        setError("Failed to initialize LINE login");
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  // Fetch booking history when uid is available
  useEffect(() => {
    if (!uid) return;

    const fetchBookingHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/customers/${uid}/bookings`);
        const data = await res.json();

        if (res.ok) {
          setBookings(data);
        } else {
          setError(data.error || "Failed to load booking history");
        }
      } catch (err) {
        console.error("Error fetching booking history:", err);
        setError("Error loading booking history");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingHistory();
  }, [uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center pb-16 md:pb-0">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดประวัติการจอง...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center pb-16 md:pb-0">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
            onClick={() => window.location.reload()}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pb-16 md:pb-0 relative">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ประวัติการจอง
            </h1>
            <p className="text-gray-600 mt-2">ประวัติการจองทั้งหมดของคุณ</p>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-white/20 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  ></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">ยังไม่มีประวัติการจอง</h2>
              <p className="text-gray-600 mb-6">
                คุณยังไม่มีประวัติการจองใดๆ คลิกปุ่มด้านล่างเพื่อเริ่มจองคิว
              </p>
              <button
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-medium"
                onClick={() => (window.location.href = "/book")}
              >
                จองคิวใหม่
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-white/20 backdrop-blur-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">
                  ประวัติการจองทั้งหมด ({bookings.length})
                </h2>
                <p className="text-gray-600 mt-1">
                  แสดงประวัติการจองล่าสุดของคุณ
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-lg">
                              {booking.service_name}
                            </h3>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  ></path>
                                </svg>
                                <span>
                                  {new Date(booking.start_at).toLocaleString("th-TH", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                  ></path>
                                </svg>
                                <span className="font-medium text-green-600">
                                  ฿{booking.deposit_amount?.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[booking.status]?.color || "bg-gray-100 text-gray-800"}`}
                          >
                            {statusLabels[booking.status]?.text || booking.status}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatusLabels[booking.payment_status]?.color || "bg-gray-100 text-gray-800"}`}
                          >
                            {paymentStatusLabels[booking.payment_status]?.text || booking.payment_status}
                          </span>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                            {paymentMethodLabels[booking.payment_method] || booking.payment_method}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                          onClick={() => (window.location.href = `/book/details?bookingId=${booking.id}`)}
                        >
                          ดูรายละเอียด
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <BottomNavBar />
    </div>
  );
}