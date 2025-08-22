"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Booking = {
  id: string;
  start_at: string;
  deposit_amount: number;
  payment_status: string;
  status: string;
  payment_method: string;
  payment_slip_url?: string | null;
  promptpay_qr_code?: string | null;
  promptpay_qr_image_url?: string | null;
  customers?: {
    name?: string | null;
    phone?: string | null;
    line_user_id?: string | null;
  } | null;
  services?: {
    name?: string | null;
    price?: number | null;
    duration_mins?: number | null;
    deposit?: number | null;
  } | null;
};

export default function BookingDetailsPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setError("No booking ID provided");
      setLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/bookings/${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data);
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.error || "Failed to load booking details");
        }
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setError("Error loading booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Booking Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The booking you're looking for doesn't exist or has been removed.
          </p>
          <button
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
            onClick={() => (window.location.href = "/book")}
          >
            Book a New Appointment
          </button>
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, { text: string; color: string }> = {
    awaiting_deposit: {
      text: "รอการยืนยันมัดจำ",
      color: "bg-yellow-100 text-yellow-800",
    },
    confirmed: { text: "ยืนยันแล้ว", color: "bg-green-100 text-green-800" },
    cancelled: { text: "ยกเลิก", color: "bg-red-100 text-red-800" },
    no_show: { text: "ไม่มา", color: "bg-gray-100 text-gray-800" },
  };

  const paymentMethodLabels: Record<string, string> = {
    bank_transfer: "โอนเงิน",
    promptpay_qr: "PromptPay QR",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
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
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                ></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Booking Details
            </h1>
            <p className="text-gray-600 mt-2">Your appointment information</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-white/20 backdrop-blur-sm">
            {/* Booking Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {booking.services?.name || "Service"}
                  </h2>
                  <p className="text-indigo-100 mt-1">
                    Booking ID: {booking.id.substring(0, 8)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      statusLabels[booking.status]?.color ||
                      "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusLabels[booking.status]?.text || booking.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-indigo-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      ></path>
                    </svg>
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-800">
                        {booking.customers?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-800">
                        {booking.customers?.phone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">LINE User ID</p>
                      <p className="font-mono text-sm text-gray-600 break-all">
                        {booking.customers?.line_user_id?.substring(0, 8) ||
                          "-"}
                        ...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="bg-gray-50 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-indigo-500"
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
                    Appointment Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-medium text-gray-800">
                        {new Date(booking.start_at).toLocaleString("th-TH", {
                          timeZone: "Asia/Bangkok",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium text-gray-800">
                        {booking.services?.duration_mins || "-"} minutes
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium text-gray-800">
                        {paymentMethodLabels[booking.payment_method] ||
                          booking.payment_method}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 mb-8 border border-green-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-500"
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
                  Pricing
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Price</span>
                    <span className="font-medium">
                      ฿{booking.services?.price?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposit</span>
                    <span className="font-bold text-green-600">
                      ฿{booking.deposit_amount?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total Due</span>
                      <span className="text-green-600">
                        ฿{booking.deposit_amount?.toLocaleString() || "0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-blue-50 rounded-2xl p-5 mb-8 border border-blue-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    ></path>
                  </svg>
                  Payment Status
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium text-gray-800 capitalize">
                      {booking.payment_status || "-"}
                    </p>
                  </div>
                  <div>
                    {booking.payment_slip_url && (
                      <a
                        href={booking.payment_slip_url}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        View Slip
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 12l6-6m0 0v6m0-6h-6"
                          ></path>
                        </svg>
                      </a>
                    )}
                    {booking.promptpay_qr_code && (
                      <span className="text-green-600 font-medium">
                        Paid via PromptPay
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
                  onClick={() =>
                    (window.location.href = `/book/edit/${booking.id}?bookingId=${booking.id}`)
                  }
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    ></path>
                  </svg>
                  Edit Information
                </button>
                <button
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                  onClick={() => window.print()}
                >
                  Print Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
