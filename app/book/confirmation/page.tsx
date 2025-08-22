"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode.react";
import Image from "next/image";

export default function BookingConfirmationPage() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Get booking ID from URL on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("bookingId");
      setBookingId(id);
    }
  }, []);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const fetchBookingData = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        const data = await res.json();

        if (res.ok) {
          setBookingData({
            id: data.id,
            service: data.services?.[0]?.name || "ไม่ระบุ",
            amount: data.deposit_amount,
            qrCodeData: data.promptpay_qr_code,
            qrImageUrl: data.promptpay_qr_image_url,
            customerName: data.customers?.[0]?.name || "ไม่ระบุ",
            customerPhone: data.customers?.[0]?.phone || "ไม่ระบุ",
            paymentMethod: data.payment_method,
          });
        }
      } catch (error) {
        console.error("Error fetching booking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลการจอง...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
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
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            ไม่พบข้อมูลการจอง
          </h1>
          <p className="text-gray-600 mt-2">
            ไม่สามารถโหลดข้อมูลการจองได้ กรุณากลับไปหน้าจองคิว
          </p>
          <button
            onClick={() => router.push("/book")}
            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            กลับไปหน้าจองคิว
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-500"
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
            <h1 className="text-3xl font-bold text-gray-800">จองคิวสำเร็จ!</h1>
            <p className="text-gray-600 mt-2">
              {bookingData.paymentMethod === "promptpay_qr"
                ? "โปรดชำระเงินผ่าน QR code ด้านล่างเพื่อยืนยันการจอง"
                : "โปรดชำระเงินผผ่าน LINE ด้านล่างเพื่อยืนยันการจอง"}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Booking Summary */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">สรุปรายการ</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">บริการ</p>
                  <p className="font-medium">{bookingData.service}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ยอดชำระ</p>
                  <p className="font-medium text-lg text-green-600">
                    ฿{bookingData.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ชื่อลูกค้า</p>
                  <p className="font-medium">{bookingData.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">เบอร์โทร</p>
                  <p className="font-medium">{bookingData.customerPhone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">รหัสการจอง</p>
                  <p className="font-mono text-sm">{bookingData.id}</p>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="p-6">
              {bookingData.paymentMethod === "promptpay_qr" ? (
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                    สแกนเพื่อชำระเงินผ่าน PromptPay
                  </h3>

                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                      {bookingData.qrImageUrl ? (
                        <Image
                          src={bookingData.qrImageUrl}
                          alt="PromptPay QR Code"
                          className="w-48 h-48"
                          width={48}
                          height={48}
                        />
                      ) : bookingData.qrCodeData ? (
                        <QRCode
                          value={bookingData.qrCodeData}
                          size={192}
                          level="H"
                          includeMargin={true}
                          imageSettings={{
                            src: "https://upload.wikimedia.org/wikipedia/commons/4/41/PromptPay_Logo.svg",
                            height: 40,
                            width: 40,
                            excavate: true,
                          }}
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                          <p className="text-gray-500">ไม่มี QR Code</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
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
                        ></path>
                      </svg>
                      <div>
                        <p className="text-blue-800 text-sm font-medium">
                          คำแนะนำการชำระเงิน
                        </p>
                        <p className="text-blue-700 text-sm mt-1">
                          1. เปิดแอปธนาคารที่รองรับ PromptPay
                          <br />
                          2. สแกน QR code ด้านบน
                          <br />
                          3. ตรวจสอบจำนวนเงินให้ถูกต้อง
                          <br />
                          4. ยืนยันการทำรายการ
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <div>
                      <p className="text-yellow-800 text-sm font-medium">
                        คำแนะนำการชำระเงิน
                      </p>
                      <p className="text-yellow-700 text-sm mt-1">
                        โปรดกลับไปที่แชต LINE และส่งสลิปการโอนเงินมาที่นี่
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  กลับหน้าหลัก
                </button>
                <button
                  onClick={() =>
                    router.push(`/book/details?bookingId=${bookingData.id}`)
                  }
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  ดูรายละเอียดการจอง
                </button>
                {bookingData.paymentMethod === "promptpay_qr" &&
                  (bookingData.qrImageUrl || bookingData.qrCodeData) && (
                    <button
                      onClick={() => window.print()}
                      className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      พิมพ์ QR Code
                    </button>
                  )}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>หลังชำระเงินแล้ว ระบบจะอัปเดตสถานะการจองอัตโนมัติ</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
