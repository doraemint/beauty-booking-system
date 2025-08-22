"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import liff from "@line/liff";

export default function EditBookingPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";

  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Initialize LIFF and get user info
  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID as string | undefined;
        if (!liffId) {
          console.error("LIFF ID not configured");
          setLoading(false);
          return;
        }

        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        // Get user ID
        const ctx: any = (liff as any).getContext?.();
        if (ctx?.userId) {
          setUid(ctx.userId);
        } else {
          const profile = await liff.getProfile();
          setUid(profile.userId);
        }

        // Load current booking info
        if (bookingId) {
          await loadBookingInfo();
        }
      } catch (error) {
        console.error("LIFF initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initLiff();
  }, [bookingId]);

  const loadBookingInfo = async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.customers?.[0]?.name || "");
        setPhone(data.customers?.[0]?.phone || "");
      }
    } catch (error) {
      console.error("Error loading booking info:", error);
    }
  };

  const saveChanges = async () => {
    if (!bookingId || !uid) {
      alert("Missing required information");
      return;
    }

    if (!name.trim() || !phone.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}/customer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          line_user_id: uid,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Information updated successfully");
        setTimeout(() => {
          window.location.href = `/book/success?bookingId=${bookingId}`;
        }, 1500);
      } else {
        alert(`Error: ${data.error || "Failed to update information"}`);
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Error saving changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-5m-1 8v4m0-4h.01M12 8v8m0 0v.01"
                ></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Edit Information
            </h1>
            <p className="text-gray-600 mt-2">
              Update your name and phone number
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-white/20 backdrop-blur-sm">
            {message && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {message}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <button
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl"
                }`}
                onClick={saveChanges}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
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
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    Save Changes
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                  onClick={() => window.history.back()}
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
