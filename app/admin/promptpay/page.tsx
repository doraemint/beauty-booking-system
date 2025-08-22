'use client';

import { useState, useEffect } from 'react';

export default function PromptPaySettingsPage() {
  const [promptpayId, setPromptpayId] = useState('');
  const [promptpayType, setPromptpayType] = useState('phone');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Get token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token') || '';
    setToken(tokenParam);
  }, []);

  // Load settings from API
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/admin/promptpay/settings', {
          headers: { 'x-admin-token': token }
        });
        
        if (res.ok) {
          const data = await res.json();
          setPromptpayId(data.promptpayId || '');
          setPromptpayType(data.promptpayType || 'phone');
        } else {
          setError('ไม่สามารถโหลดการตั้งค่าได้');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setError('เกิดข้อผิดพลาดในการโหลดการตั้งค่า');
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [token]);

  const saveSettings = async () => {
    if (!token) {
      setError('กรุณาใส่ Admin token');
      return;
    }
    
    // Validate input
    if (!promptpayId) {
      setError('กรุณากรอก PromptPay ID');
      return;
    }
    
    if (promptpayType === 'phone' && promptpayId.replace(/\D/g, '').length !== 10) {
      setError('กรุณากรอกเบอร์โทรศัพท์ 10 หลัก');
      return;
    }
    
    if (promptpayType === 'citizen' && promptpayId.replace(/\D/g, '').length !== 13) {
      setError('กรุณากรอกเลขบัตรประชาชน 13 หลัก');
      return;
    }
    
    if (promptpayType === 'wallet' && promptpayId.replace(/\D/g, '').length !== 15) {
      setError('กรุณากรอกเลข Wallet 15 หลัก');
      return;
    }
    
    setSaving(true);
    setError('');
    setMessage('');
    
    try {
      const res = await fetch('/api/admin/promptpay/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ promptpayId, promptpayType })
      });
      
      if (res.ok) {
        setMessage('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      } else {
        const errorData = await res.json();
        setError(`Error: ${errorData.error || 'Failed to save settings'}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setSaving(false);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center border border-gray-100">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600">กำลังโหลดการตั้งค่า...</p>
        </div>
      </div>
    );
  }

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
            ตัวอย่าง: /admin/promptpay?token=YOUR_ADMIN_TOKEN
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">ตั้งค่า PromptPay</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">จัดการข้อมูลการชำระเงินผ่าน PromptPay</p>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <span className="mr-2">✅</span>
          <span className="text-sm">{message}</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <span className="mr-2">⚠️</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <div className="space-y-6">
          {/* PromptPay Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ประเภท PromptPay
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'phone', label: 'เบอร์โทรศัพท์', icon: '📱' },
                { value: 'citizen', label: 'บัตรประชาชน', icon: '👤' },
                { value: 'wallet', label: 'Wallet', icon: '💳' },
              ].map((type) => (
                <button
                  key={type.value}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                    promptpayType === type.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPromptpayType(type.value as any)}
                >
                  <span className="text-2xl mb-2">{type.icon}</span>
                  <span className="font-medium text-gray-800 text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* PromptPay ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {promptpayType === 'phone' && 'เบอร์โทรศัพท์'}
              {promptpayType === 'citizen' && 'เลขบัตรประชาชน'}
              {promptpayType === 'wallet' && 'เลข Wallet'}
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder={
                promptpayType === 'phone' 
                  ? '08xxxxxxxx' 
                  : promptpayType === 'citizen' 
                    ? '13 หลัก' 
                    : '15 หลัก'
              }
              value={promptpayId}
              onChange={(e) => setPromptpayId(e.target.value)}
            />
            <p className="mt-2 text-sm text-gray-500">
              {promptpayType === 'phone' && 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก'}
              {promptpayType === 'citizen' && 'กรุณากรอกเลขบัตรประชาชน 13 หลัก'}
              {promptpayType === 'wallet' && 'กรุณากรอกเลข Wallet 15 หลัก'}
            </p>
          </div>
          
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start">
              <span className="text-blue-500 text-lg mr-3">ℹ️</span>
              <div>
                <h3 className="font-medium text-blue-800 mb-2">ข้อมูลสำคัญ</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>ตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>ข้อมูลนี้จะใช้สำหรับสร้าง QR code ให้ลูกค้าชำระเงิน</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>สามารถเปลี่ยนแปลงได้ทุกเมื่อตามต้องการ</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <button
            className={`w-full py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center ${
              saving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="mr-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </span>
                <span className="text-sm">กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <span className="mr-2 text-lg">💾</span>
                <span className="text-sm">บันทึกการตั้งค่า</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">เครื่องมือที่เกี่ยวข้อง</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a 
            href={`/admin/promptpay/generate?token=${token}`} 
            className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mx-auto mb-2">
              🧾
            </div>
            <p className="font-medium text-gray-800 text-sm">สร้าง QR Code</p>
            <p className="text-xs text-gray-500 mt-1">สำหรับบริการ</p>
          </a>
          
          <a 
            href={`/admin/services/deposits?token=${token}`} 
            className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mx-auto mb-2">
              💰
            </div>
            <p className="font-medium text-gray-800 text-sm">จัดการมัดจำ</p>
            <p className="text-xs text-gray-500 mt-1">กำหนดราคา</p>
          </a>
        </div>
      </div>
    </div>
  );
}