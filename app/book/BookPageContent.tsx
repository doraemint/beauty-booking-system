"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import liff from "@line/liff";
import Image from "next/image";

type Service = {
  id: string;
  name: string;
  deposit: number;
  price: number;
  duration_mins: number;
  image_url?: string | null;
};

export default function BookPage() {
  const sp = useSearchParams();

  // ถ้ามี ?uid= ใน URL ใช้ก่อน (รองรับกรณีเปิดจากลิงก์ webhook เดิม)
  const [uid, setUid] = useState<string>(sp.get("uid") || "");
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [startAt, setStartAt] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "bank_transfer" | "promptpay_qr"
  >("bank_transfer");

  // โหลดบริการ
  useEffect(() => {
    fetch("/api/services/list")
      .then((r) => r.json())
      .then(setServices)
      .catch(() => {});
  }, []);

  // ถ้าไม่มี uid ให้ลองดึงจาก LIFF (เปิดจาก Rich Menu หรือปุ่มลิงก์ LIFF)
  useEffect(() => {
    if (uid) return; // มี uid แล้วไม่ต้อง init LIFF

    (async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID as string | undefined;
        if (!liffId) return; // ยังไม่ได้ตั้งค่า LIFF → ปล่อยให้เตือน "กำลังยืนยัน..."

        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          // ให้ผู้ใช้ login ผ่าน LINE แล้วกลับมาหน้าเดิม
          liff.login({ redirectUri: window.location.href });
          return;
        }

        // 1) พยายามอ่าน Messaging userId (ถ้าเปิด LIFF จากห้องแชต OA)
        const ctx: any = (liff as any).getContext?.();
        if (ctx?.userId) {
          setUid(ctx.userId);
          return;
        }

        // 2) ลองอ่านจาก ID Token (LINE Login user id = claim 'sub')
        const idToken = liff.getIDToken();
        if (idToken) {
          const payload = JSON.parse(atob(idToken.split(".")[1]));
          if (payload?.sub) {
            setUid(payload.sub);
            return;
          }
        }

        // 3) Fallback: โปรไฟล์
        const profile = await liff.getProfile();
        if (profile?.userId) setUid(profile.userId);
      } catch (e) {
        console.error("LIFF init error", e);
      }
    })();
  }, [uid]);

  // Auto-fill customer information when uid is available
  useEffect(() => {
    if (!uid) return;

    const fetchCustomerInfo = async () => {
      try {
        const res = await fetch(`/api/customers/${uid}/latest`);
        const data = await res.json();
        
        if (res.ok && data.found) {
          setName(data.name || "");
          setPhone(data.phone || "");
          // Show a notification that info was auto-filled
          if (data.name || data.phone) {
            console.log("Customer information auto-filled");
          }
        }
      } catch (error) {
        console.error("Error fetching customer info:", error);
      }
    };

    fetchCustomerInfo();
  }, [uid]);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          service_id: serviceId,
          start_at: startAt,
          line_user_id: uid,
          payment_method: paymentMethod,
        }),
      });
      const j = await res.json();
      if (res.ok) {
        if (paymentMethod === "promptpay_qr") {
          // Redirect to confirmation page with booking ID
          window.location.href = `/book/confirmation?bookingId=${j.booking_id}`;
        } else {
          setOk(j.booking_id); // Store booking ID for later use
        }
      } else {
        alert(j.error || "เกิดข้อผิดพลาด");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative z-0">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              จองคิว
            </h1>
          </div>
          <p className="text-gray-600 text-lg">เลือกบริการและเวลาที่ต้องการ</p>
        </div>

        {/* Loading/Auth Status */}
        {!uid && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-4 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
                <div>
                  <p className="text-orange-800 font-medium">
                    กำลังยืนยันตัวตนผ่าน LINE
                  </p>
                  <p className="text-orange-700 text-sm mt-1">
                    ถ้าหน้านี้วนลูป ให้เปิดลิงก์นี้ &quot;ภายใน LINE&quot; อีกครั้ง
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Grid */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            เลือกบริการ
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={`group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                  serviceId === s.id
                    ? "ring-4 ring-indigo-500 shadow-2xl scale-105"
                    : "hover:ring-2 hover:ring-indigo-300"
                }`}
              >
                {/* Service Image */}
                {s.image_url ? (
                  <div className="relative overflow-hidden">
                    <Image
                      src={s.image_url}
                      alt={s.name}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                      width={100}
                      height={48}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                {/* Selected Indicator */}
                {serviceId === s.id && (
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Service Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-xl text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {s.name}
                    </h3>
                    <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm font-medium rounded-full border border-green-200">
                      มัดจำ ฿{s.deposit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center gap-2">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      <span className="font-semibold">฿{s.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{s.duration_mins} นาที</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
              <svg
                className="w-6 h-6 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              กรอกข้อมูล
            </h2>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="ชื่อ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {name && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      auto-filled
                    </span>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="เบอร์โทร"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {phone && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      auto-filled
                    </span>
                  </div>
                )}
              </div>

              {(name || phone) && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="text-green-800 text-sm">
                      เราได้กรอกข้อมูลของคุณจากรายการจองก่อนหน้า กรุณาตรวจสอบและแก้ไขหากจำเป็น
                    </p>
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="datetime-local"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>

              {/* Payment Method Selection */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
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
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  วิธีการชำระเงิน
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === "bank_transfer"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("bank_transfer")}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "bank_transfer"
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-gray-300"
                        }`}
                      >
                        {paymentMethod === "bank_transfer" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium">โอนเงิน</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-left">
                      ส่งสลิปผ่าน LINE
                    </p>
                  </button>
                  <button
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === "promptpay_qr"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("promptpay_qr")}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "promptpay_qr"
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-gray-300"
                        }`}
                      >
                        {paymentMethod === "promptpay_qr" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium">PromptPay QR</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-left">
                      สแกน QR code ชำระเงิน
                    </p>
                  </button>
                </div>
              </div>

              <button
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  !serviceId || !startAt || !uid || loading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl"
                }`}
                disabled={!serviceId || !startAt || !uid || loading}
                onClick={submit}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังจอง...
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
                      />
                    </svg>
                    ยืนยันการจอง
                  </>
                )}
              </button>

              {ok && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-800 font-medium">
                        สร้างคำขอจองแล้ว
                      </p>
                      <div className="mt-2">
                        <a
                          href={`/book/details?bookingId=${ok}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            ></path>
                          </svg>
                          แก้ไขข้อมูลการจอง
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Payment instructions based on method */}
                  <div className="mt-3 p-3 bg-white/50 rounded-lg">
                    <p className="text-sm text-green-700">
                      {paymentMethod === "promptpay_qr"
                        ? "กรุณาสแกน QR code ที่แสดงในหน้าถัดไปเพื่อชำระเงิน"
                        : "กรุณาส่งสลิปผ่านแชต LINE"}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-blue-800 text-sm">
                    {paymentMethod === "promptpay_qr"
                      ? "หลังชำระเงินผ่าน PromptPay QR ระบบจะอัปเดตสถานะอัตโนมัติ"
                      : "หลังส่งคำขอ ให้กลับไปแชต LINE แล้วส่งสลิปเป็นรูปภาพ"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
