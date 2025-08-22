'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode.react';

export default function PromptPayQRPage() {
  const router = useRouter();
  const [qrData, setQrData] = useState<string>('');
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Get booking ID from URL on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('bookingId');
      setBookingId(id);
    }
  }, []);

  useEffect(() => {
    if (!bookingId) {
      setError('ไม่พบข้อมูลการจอง');
      setLoading(false);
      return;
    }

    const fetchQRCode = async () => {
      try {
        const response = await fetch('/api/promptpay/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bookingId }),
        });

        const data = await response.json();
        
        console.log("API Response:", data);
        console.log("Response Status:", response.status);

        if (response.ok) {
          setQrData(data.qrData);
          setBookingInfo(data.bookingInfo);
        } else {
          setError(data.error || 'ไม่สามารถสร้าง QR Code ได้');
        }
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังสร้าง QR code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={() => router.push('/book')}
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
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">ชำระเงินผ่าน PromptPay</h1>
            <p className="text-gray-600 mt-2">
              สแกน QR code ด้านล่างเพื่อชำระเงิน
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Booking Summary */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">สรุปรายการ</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">บริการ</p>
                  <p className="font-medium">{bookingInfo?.serviceName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ยอดชำระ</p>
                  <p className="font-medium text-lg text-green-600">฿{bookingInfo?.amount?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">รหัสการจอง</p>
                  <p className="font-mono text-sm">{bookingInfo?.bookingId?.substring(0, 8) || '-'}...</p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                สแกนเพื่อชำระเงินผ่าน PromptPay
              </h3>
              
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <QRCode 
                    value={qrData} 
                    size={256} 
                    level="H" 
                    includeMargin={true}
                    imageSettings={{
                      src: "https://upload.wikimedia.org/wikipedia/commons/4/41/PromptPay_Logo.svg",
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="text-blue-800 text-sm font-medium">คำแนะนำการชำระเงิน</p>
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
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  กลับหน้าหลัก
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  พิมพ์ QR Code
                </button>
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
          .print-area, .print-area * {
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