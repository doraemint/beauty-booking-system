"use client";

import { useState, useEffect } from "react";

type Service = {
  id: string;
  name: string;
  price: number;
  deposit: number;
  duration_mins: number;
};

export default function ServiceDepositManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Get token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token") || "";
    setToken(tokenParam);
  }, []);

  // Load services
  useEffect(() => {
    if (!token) return;

    const loadServices = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/services/list");
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        } else {
          setError("Failed to load services");
        }
      } catch (err) {
        setError("Error loading services");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [token]);

  const updateDeposit = (serviceId: string, newDeposit: number) => {
    setServices(
      services.map((service) =>
        service.id === serviceId ? { ...service, deposit: newDeposit } : service
      )
    );
  };

  const saveChanges = async () => {
    if (!token) {
      setError("Admin token is required");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/services/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ services }),
      });

      if (res.ok) {
        setMessage("บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save changes");
      }
    } catch (err) {
      setError("Error saving changes");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-500">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            ต้องการการยืนยันตัวตน
          </h1>
          <p className="text-gray-600 mb-4">กรุณาใส่ Admin token ใน URL</p>
          <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            ตัวอย่าง: /admin/services/deposits?token=YOUR_ADMIN_TOKEN
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            จัดการมัดจำบริการ
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            กำหนดจำนวนเงินมัดจำสำหรับแต่ละบริการ
          </p>
        </div>

        <button
          className={`px-4 py-2 rounded-lg font-medium text-white flex items-center justify-center ${
            saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          onClick={saveChanges}
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
              <span className="text-sm md:text-base">บันทึกการเปลี่ยนแปลง</span>
            </>
          )}
        </button>
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

      {/* Mobile Services List */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">{service.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {service.duration_mins} นาที • ฿
                    {service.price.toLocaleString()}
                  </p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  ฿{service.deposit.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  มัดจำ (บาท)
                </label>
                <div className="flex items-center">
                  <span className="mr-2 text-gray-500">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={service.deposit}
                    onChange={(e) =>
                      updateDeposit(service.id, parseFloat(e.target.value) || 0)
                    }
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Services Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    บริการ
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    ราคาเต็ม
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    ระยะเวลา
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    มัดจำ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {service.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{service.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.duration_mins} นาที
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2 text-gray-500">฿</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={service.deposit}
                          onChange={(e) =>
                            updateDeposit(
                              service.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-xl text-blue-500">ℹ️</span>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">คำแนะนำ</h3>
            <ul className="text-blue-700 space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span className="text-sm">
                  สามารถกำหนดมัดจำเป็นจำนวนคงที่สำหรับแต่ละบริการ
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span className="text-sm">
                  จำนวนมัดจำควรมีค่าตั้งแต่ 0 ขึ้นไป
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span className="text-sm">
                  เมื่อบันทึกแล้ว การเปลี่ยนแปลงจะมีผลทันที
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
