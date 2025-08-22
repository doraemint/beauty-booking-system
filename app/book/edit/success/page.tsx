"use client";

import { useEffect, useState } from "react";
import BottomNavBar from "@/components/BottomNavBar";

export default function EditSuccessPage() {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  // Get search params on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("bookingId");
      setBookingId(id);
    }
  }, []);

  useEffect(() => {
    if (!bookingId) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to booking details or home
          window.location.href = `/book/details?bookingId=${bookingId}`;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center pb-16 md:pb-0 relative">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg
              className="w-12 h-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Information Updated Successfully!
          </h1>
          <p className="text-gray-600 mb-8">
            Your name and phone number have been updated successfully.
          </p>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100">
            <p className="text-gray-700 mb-4">
              You will be redirected to your booking details in
            </p>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">{countdown}</span>
            </div>
            <p className="text-gray-500 text-sm">seconds</p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors"
              onClick={() =>
                (window.location.href = `/book/details?bookingId=${bookingId}`)
              }
            >
              View Booking Details
            </button>
            <button
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              onClick={() => window.history.back()}
            >
              Back
            </button>
          </div>
        </div>
      </div>
      
      <BottomNavBar />
    </div>
  );
}
