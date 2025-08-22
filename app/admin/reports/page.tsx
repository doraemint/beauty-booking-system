'use client';

import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Get token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token') || '';
    setToken(tokenParam);
  }, []);

  const downloadReport = () => {
    if (!token) {
      alert('กรุณาใส่ Admin token');
      return;
    }

    setLoading(true);
    
    try {
      // Construct the report URL
      let reportUrl = '';
      if (reportType === 'daily') {
        reportUrl = `/api/admin/reports/daily?date=${date}&format=csv&token=${encodeURIComponent(token)}`;
      } else if (reportType === 'monthly') {
        reportUrl = `/api/admin/reports/monthly?month=${date.substring(0, 7)}&format=csv&token=${encodeURIComponent(token)}`;
      } else {
        reportUrl = `/api/admin/reports/custom?start=${date}&end=${date}&format=csv&token=${encodeURIComponent(token)}`;
      }

      // Open the report in a new tab
      window.open(reportUrl, '_blank');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('เกิดข้อผิดพลาดในการสร้างรายงาน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">รายงานการจอง</h1>
        <p className="text-gray-600 mt-1">สร้างและดาวน์โหลดรายงานการจองในช่วงเวลาที่ต้องการ</p>
      </div>

      {/* Report Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ประเภทรายงาน
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'daily', label: 'รายวัน', icon: '📅' },
                { value: 'monthly', label: 'รายเดือน', icon: '📆' },
                { value: 'custom', label: 'กำหนดเอง', icon: '⚙️' },
              ].map((type) => (
                <button
                  key={type.value}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                    reportType === type.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setReportType(type.value as any)}
                >
                  <span className="text-2xl mb-2">{type.icon}</span>
                  <span className="font-medium text-gray-800">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {reportType === 'daily' && 'เลือกวันที่'}
              {reportType === 'monthly' && 'เลือกเดือน'}
              {reportType === 'custom' && 'เลือกวันที่'}
            </label>
            <input
              type={reportType === 'monthly' ? 'month' : 'date'}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start">
              <span className="text-blue-500 text-xl mr-3">ℹ️</span>
              <div>
                <h3 className="font-medium text-blue-800 mb-2">ข้อมูลรายงาน</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>รายงานจะถูกสร้างในรูปแบบ CSV ซึ่งสามารถเปิดได้ด้วย Excel หรือ Google Sheets</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>รายงานประกอบด้วยข้อมูลการจอง รายละเอียดลูกค้า และสถานะการชำระเงิน</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>สามารถกรองข้อมูลตามช่วงเวลาที่ต้องการได้</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Generate Button */}
          <button
            className={`w-full py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            onClick={downloadReport}
            disabled={loading || !token}
          >
            {loading ? (
              <>
                <span className="mr-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </span>
                กำลังสร้างรายงาน...
              </>
            ) : (
              <>
                <span className="mr-2">📊</span>
                สร้างและดาวน์โหลดรายงาน
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Preview (Placeholder) */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">ตัวอย่างรายงาน</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บริการ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">มัดจำ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-06-15</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">สมชาย ใจดี</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">โบท็อกซ์</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">฿500</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    ยืนยันแล้ว
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-06-15</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">玛丽 陈</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">เลเซอร์หน้าใส</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">฿300</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    รอการยืนยัน
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-500 text-center">
          นี่คือตัวอย่างข้อมูลรายงาน คลิก "สร้างและดาวน์โหลดรายงาน" เพื่อรับรายงานจริง
        </p>
      </div>
    </div>
  );
}