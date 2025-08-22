'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

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

export default function CustomerBookingHistoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lineUserId = params.lineUserId as string;
  const token = searchParams.get('token') || '';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!lineUserId || !token) return;

    const fetchCustomerBookings = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch customer bookings
        const res = await fetch(`/api/customers/${lineUserId}/bookings`, {
          headers: {
            'x-admin-token': token
          }
        });

        const data = await res.json();

        if (res.ok) {
          setBookings(data);
          // Set customer name from first booking if available
          if (data.length > 0) {
            setCustomerName(data[0].customer_name || 'Unknown Customer');
          }
        } else {
          setError(data.error || 'Failed to load customer bookings');
        }
      } catch (err) {
        console.error('Error fetching customer bookings:', err);
        setError('Error loading customer bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerBookings();
  }, [lineUserId, token]);

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-500">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">ต้องการการยืนยันตัวตน</h1>
          <p className="text-gray-600 mb-4">กรุณาใส่ Admin token ใน URL</p>
          <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            ตัวอย่าง: /admin/customers/USER_ID/bookings?token=YOUR_ADMIN_TOKEN
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600">กำลังโหลดประวัติการจอง...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-500">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            onClick={() => window.location.reload()}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">ประวัติการจอง</h1>
          <p className="text-gray-600 mt-1">
            ประวัติการจองทั้งหมดของ {customerName || 'ลูกค้า'}
          </p>
        </div>
        <div className="bg-indigo-50 text-indigo-800 px-4 py-2 rounded-lg">
          <p className="text-sm font-medium">LINE User ID: {lineUserId}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">จำนวนการจอง</p>
              <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">ยอดเงินรวม</p>
              <p className="text-2xl font-bold text-gray-800">
                ฿{bookings.reduce((sum, booking) => sum + (booking.deposit_amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">การจองที่ยืนยัน</p>
              <p className="text-2xl font-bold text-gray-800">
                {bookings.filter(b => b.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">ยังไม่มีประวัติการจอง</h2>
          <p className="text-gray-600">ลูกค้ายังไม่มีประวัติการจองใดๆ</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    บริการ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่จอง
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การชำระเงิน
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดเงิน
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การกระทำ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.service_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.start_at).toLocaleString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusLabels[booking.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[booking.status]?.text || booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusLabels[booking.payment_status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {paymentStatusLabels[booking.payment_status]?.text || booking.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{booking.deposit_amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => window.open(`/admin/bookings/${booking.id}?token=${token}`, '_blank')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}