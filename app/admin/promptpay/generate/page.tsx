'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';

export default function PromptPayQRGeneratorPage() {
  const [token, setToken] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');

  // Get token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token') || '';
    setToken(tokenParam);
  }, []);

  // Load services
  useEffect(() => {
    if (!token) return;

    const loadServices = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/services/list');
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        } else {
          console.error('Failed to load services');
        }
      } catch (err) {
        console.error('Error loading services:', err);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [token]);

  const generateQR = async () => {
    if (!token) {
      alert('กรุณาใส่ Admin token');
      return;
    }

    if (!selectedService && !customAmount) {
      alert('กรุณาเลือกบริการหรือระบุจำนวนเงิน');
      return;
    }

    setGenerating(true);
    setQrCodeData('');
    setQrImageUrl('');

    try {
      const res = await fetch('/api/promptpay/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          service_id: selectedService || null,
          amount: customAmount ? parseFloat(customAmount) : null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQrCodeData(data.qr_code_data);
        setQrImageUrl(data.qr_image_url);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to generate QR code'}`);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง QR code');
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrImageUrl) return;
    
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `promptpay-qr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            ตัวอย่าง: /admin/promptpay/generate?token=YOUR_ADMIN_TOKEN
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">สร้าง QR Code PromptPay</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">สร้างและดาวน์โหลด QR code สำหรับการชำระเงินผ่าน PromptPay</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">รายละเอียดการชำระเงิน</h2>
          
          <div className="space-y-5">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกบริการจากฐานข้อมูล
              </label>
              {loading ? (
                <div className="flex justify-center py-3">
                  <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="">เลือกบริการ (ไม่บังคับ)</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ฿{service.price.toLocaleString()} (มัดจำ ฿{service.deposit.toLocaleString()})
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-4 text-gray-500 text-sm">หรือ</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            
            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระบุจำนวนเงินเอง
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">฿</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">ระบุจำนวนเงินหากไม่ต้องการใช้บริการจากรายการ</p>
            </div>
            
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start">
                <span className="text-blue-500 text-lg mr-3">ℹ️</span>
                <div>
                  <h3 className="font-medium text-blue-800 mb-2">คำแนะนำ</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>เลือกบริการจากรายการเพื่อใช้ราคาที่กำหนดไว้</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>หรือระบุจำนวนเงินเองสำหรับการชำระเงินเฉพาะครั้ง</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>สามารถสร้าง QR code ได้หลายครั้งตามต้องการ</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Generate Button */}
            <button
              className={`w-full py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center ${
                generating 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              onClick={generateQR}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="mr-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </span>
                  <span className="text-sm">กำลังสร้าง QR Code...</span>
                </>
              ) : (
                <>
                  <span className="mr-2 text-lg">🧾</span>
                  <span className="text-sm">สร้าง QR Code</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* QR Code Display */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">QR Code สำหรับชำระเงิน</h2>
          
          {qrCodeData ? (
            <div className="text-center">
              <div className="p-4 bg-white border-2 border-gray-200 rounded-xl inline-block">
                {qrImageUrl ? (
                  <img 
                    src={qrImageUrl} 
                    alt="PromptPay QR Code" 
                    className="w-64 h-64"
                  />
                ) : (
                  <QRCode 
                    value={qrCodeData} 
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
                )}
              </div>
              
              <div className="mt-4">
                {selectedService && (
                  <p className="font-medium text-gray-800">
                    บริการ: {services.find(s => s.id === selectedService)?.name || '-'}
                  </p>
                )}
                <p className="font-medium text-lg text-green-600 mt-1">
                  จำนวนเงิน: ฿{(customAmount ? parseFloat(customAmount) : services.find(s => s.id === selectedService)?.deposit || 0).toFixed(2)}
                </p>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                  onClick={downloadQR}
                >
                  ดาวน์โหลด QR Code
                </button>
                <button
                  className="flex-1 py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  onClick={() => window.print()}
                >
                  พิมพ์ QR Code
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🧾</span>
                </div>
                <p className="text-sm">กรุณากรอกข้อมูลและสร้าง QR Code</p>
                <p className="text-xs mt-1">เลือกบริการหรือระบุจำนวนเงินด้านซ้าย</p>
              </div>
            </div>
          )}
          
          <div className="mt-5 bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="flex items-start">
              <span className="text-green-500 text-lg mr-3">✅</span>
              <div>
                <h3 className="font-medium text-green-800 mb-2">วิธีการใช้งาน</h3>
                <ol className="text-sm text-green-700 list-decimal pl-5 space-y-1">
                  <li>ลูกค้าเปิดแอปธนาคารที่รองรับ PromptPay</li>
                  <li>สแกน QR Code ที่แสดงด้านบน</li>
                  <li>ตรวจสอบจำนวนเงินให้ถูกต้อง</li>
                  <li>ยืนยันการทำรายการ</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}