'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  // Get token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token') || '';
    setToken(tokenParam);
  }, []);

  // Settings data
  const [generalSettings, setGeneralSettings] = useState({
    businessName: 'Beauty Salon',
    businessPhone: '02-123-4567',
    businessEmail: 'info@beautysalon.co.th',
    businessAddress: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
    timezone: 'Asia/Bangkok',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    lineNotifications: true,
    smsNotifications: false,
    reminderHours: 24,
  });

  const [bookingSettings, setBookingSettings] = useState({
    maxAdvanceBookingDays: 30,
    cancellationPolicy: 'สามารถยกเลิกได้ก่อนวันนัด 24 ชั่วโมง',
    allowSameDayBooking: true,
  });

  const tabs = [
    { id: 'general', name: 'ทั่วไป', icon: '⚙️' },
    { id: 'notifications', name: 'การแจ้งเตือน', icon: '🔔' },
    { id: 'booking', name: 'การจอง', icon: '📅' },
  ];

  const saveSettings = async () => {
    if (!token) {
      alert('กรุณาใส่ Admin token');
      return;
    }

    setLoading(true);
    
    try {
      // In a real implementation, you would save to an API
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">การตั้งค่าระบบ</h1>
        <p className="text-gray-600 mt-1">จัดการการตั้งค่าทั่วไปของระบบการจอง</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">ข้อมูลธุรกิจ</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อบริษัท</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={generalSettings.businessName}
                  onChange={(e) => setGeneralSettings({...generalSettings, businessName: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={generalSettings.businessPhone}
                  onChange={(e) => setGeneralSettings({...generalSettings, businessPhone: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                <input
                  type="email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={generalSettings.businessEmail}
                  onChange={(e) => setGeneralSettings({...generalSettings, businessEmail: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เขตเวลา</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={generalSettings.timezone}
                  onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                >
                  <option value="Asia/Bangkok">เอเชีย/กรุงเทพ</option>
                  <option value="Asia/Jakarta">เอเชีย/จาการ์ตา</option>
                  <option value="Asia/Kuala_Lumpur">เอเชีย/กัวลาลัมเปอร์</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                value={generalSettings.businessAddress}
                onChange={(e) => setGeneralSettings({...generalSettings, businessAddress: e.target.value})}
              ></textarea>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">การแจ้งเตือน</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">การแจ้งเตือนทางอีเมล</h3>
                  <p className="text-sm text-gray-500">ส่งการแจ้งเตือนผ่านอีเมล</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">การแจ้งเตือนผ่าน LINE</h3>
                  <p className="text-sm text-gray-500">ส่งการแจ้งเตือนผ่านข้อความ LINE</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationSettings.lineNotifications}
                    onChange={(e) => setNotificationSettings({...notificationSettings, lineNotifications: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">การแจ้งเตือนทาง SMS</h3>
                  <p className="text-sm text-gray-500">ส่งการแจ้งเตือนผ่านข้อความ SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationSettings.smsNotifications}
                    onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">แจ้งเตือนล่วงหน้า (ชั่วโมง)</label>
                <input
                  type="number"
                  className="w-full md:w-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={notificationSettings.reminderHours}
                  onChange={(e) => setNotificationSettings({...notificationSettings, reminderHours: parseInt(e.target.value) || 0})}
                />
                <p className="mt-1 text-sm text-gray-500">ระบุจำนวนชั่วโมงล่วงหน้าที่จะแจ้งเตือนลูกค้า</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'booking' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">การตั้งค่าการจอง</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">จองล่วงหน้าได้สูงสุด (วัน)</label>
                <input
                  type="number"
                  className="w-full md:w-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={bookingSettings.maxAdvanceBookingDays}
                  onChange={(e) => setBookingSettings({...bookingSettings, maxAdvanceBookingDays: parseInt(e.target.value) || 0})}
                />
                <p className="mt-1 text-sm text-gray-500">ลูกค้าสามารถจองล่วงหน้าได้สูงสุดกี่วัน</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">อนุญาตให้จองในวันเดียวกัน</h3>
                  <p className="text-sm text-gray-500">อนุญาตให้ลูกค้าจองบริการในวันเดียวกันกับวันที่ทำรายการ</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={bookingSettings.allowSameDayBooking}
                    onChange={(e) => setBookingSettings({...bookingSettings, allowSameDayBooking: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">นโยบายการยกเลิก</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  value={bookingSettings.cancellationPolicy}
                  onChange={(e) => setBookingSettings({...bookingSettings, cancellationPolicy: e.target.value})}
                ></textarea>
                <p className="mt-1 text-sm text-gray-500">อธิบายนโยบายการยกเลิกการจอง</p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            className={`px-6 py-3 rounded-lg font-medium text-white flex items-center ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            onClick={saveSettings}
            disabled={loading || !token}
          >
            {loading ? (
              <>
                <span className="mr-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </span>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <span className="mr-2">💾</span>
                บันทึกการตั้งค่า
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-xl text-blue-500">ℹ️</span>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">คำแนะนำการตั้งค่า</h3>
            <ul className="text-blue-700 space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>ตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>การตั้งค่าจะมีผลทันทีหลังจากบันทึกแล้ว</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>หากมีข้อสงสัย โปรดติดต่อฝ่ายสนับสนุน</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}