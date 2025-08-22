"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";

type Row = {
  id: string;
  start_at: string;
  deposit_amount: number;
  payment_status: string;
  status: string;
  payment_method: string;
  payment_slip_url?: string | null;
  promptpay_qr_code?: string | null;
  customers?: {
    name?: string | null;
    phone?: string | null;
    line_user_id?: string | null;
  } | null;
  services?: { name?: string | null } | null;
};

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>("");
  const [filter, setFilter] = useState("awaiting_deposit");
  const initialToken = useMemo(
    () =>
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("token") || ""
        : "",
    []
  );

  useEffect(() => {
    setToken(initialToken);
  }, [initialToken]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/list?status=${filter}`, {
        headers: token ? { "x-admin-token": token } : undefined,
        cache: "no-store",
      });

      if (res.ok) {
        const j = await res.json();
        setRows(j);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(
          `โหลดข้อมูลไม่สำเร็จ: ${errorData.error || "token อาจไม่ถูกต้อง"}`
        );
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      alert("โหลดข้อมูลไม่สำเร็จ: เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  async function approve(id: string) {
    if (!confirm("ยืนยันการอนุมัติการจองนี้?")) return;

    try {
      const res = await fetch(`/api/admin/bookings/${id}/approve`, {
        method: "POST",
        headers: token ? { "x-admin-token": token } : undefined,
      });

      if (res.ok) {
        load();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`อนุมัติไม่สำเร็จ: ${errorData.error || "เกิดข้อผิดพลาด"}`);
      }
    } catch (error) {
      console.error("Error approving booking:", error);
      alert("อนุมัติไม่สำเร็จ: เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  }
  async function reject(id: string) {
    const reason = prompt("เหตุผลที่ไม่อนุมัติ (ไม่บังคับ)") || "";
    try {
      const res = await fetch(`/api/admin/bookings/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        load();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`ไม่อนุมัติไม่สำเร็จ: ${errorData.error || "เกิดข้อผิดพลาด"}`);
      }
    } catch (error) {
      console.error("Error rejecting booking:", error);
      alert("ไม่อนุมัติไม่สำเร็จ: เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  }

  // Status filter options
  const statusOptions = [
    { value: "awaiting_deposit", label: "รอการยืนยันมัดจำ" },
    { value: "confirmed", label: "ยืนยันแล้ว" },
    { value: "cancelled", label: "ยกเลิก" },
    { value: "no_show", label: "ไม่มา" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            การจัดการการจอง
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            จัดการและติดตามสถานะการจองของลูกค้า
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/reports/daily?date=${new Date()
              .toISOString()
              .slice(0, 10)}&format=csv`}
            target="_blank"
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm flex items-center"
          >
            <span className="mr-1 hidden md:inline">📊</span>
            รายงาน
          </a>
          <Link
            href={`/admin/promptpay?token=${encodeURIComponent(token)}`}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm flex items-center"
          >
            <span className="mr-1 hidden md:inline">⚙️</span>
            PromptPay
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex overflow-x-auto pb-2 md:pb-0">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                className={`px-3 py-2 md:px-4 md:py-2 whitespace-nowrap text-sm font-medium rounded-lg mr-2 ${
                  filter === option.value
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาลูกค้า..."
              className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-48 text-sm"
            />
            <span className="absolute left-2.5 top-2.5 text-gray-400 text-sm">
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* Bookings list - Mobile Cards */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">📅</span>
            </div>
            <p className="text-gray-500">ไม่มีรายการการจอง</p>
          </div>
        ) : (
          rows.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">
                    {b.customers?.name || "(ไม่มีชื่อ)"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {b.customers?.phone || "-"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    b.payment_method === "promptpay_qr"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {b.payment_method === "promptpay_qr"
                    ? "PromptPay QR"
                    : "โอนเงิน"}
                </span>
              </div>

              <div className="mb-3">
                <p className="font-medium text-gray-800">
                  {b.services?.name || "-"}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(b.start_at).toLocaleString("th-TH", {
                    timeZone: "Asia/Bangkok",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-500">มัดจำ</p>
                  <p className="font-bold text-gray-800">฿{b.deposit_amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">สลิป</p>
                  {b.payment_slip_url ? (
                    <a
                      href={b.payment_slip_url}
                      target="_blank"
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      ดูสลิป
                    </a>
                  ) : b.promptpay_qr_code ? (
                    <span className="text-green-600 text-sm">ชำระผ่าน QR</span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </div>
              </div>

              {filter === "awaiting_deposit" && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => approve(b.id)}
                    className="flex-1 py-2 px-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => reject(b.id)}
                    className="flex-1 py-2 px-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    ไม่อนุมัติ
                  </button>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100">
                <a
                  href={`/admin/bookings/${
                    b.id
                  }/receipt?token=${encodeURIComponent(token)}`}
                  target="_blank"
                  className="block w-full py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-center text-sm font-medium hover:bg-gray-200"
                >
                  ใบรับมัดจำ
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bookings table - Desktop */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ลูกค้า
                </th>
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
                  นัดหมาย
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  มัดจำ
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  การชำระเงิน
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  สลิป
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-2 text-gray-500">กำลังโหลดข้อมูล...</p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    ไม่มีรายการการจอง
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {b.customers?.name || "(ไม่มีชื่อ)"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {b.customers?.phone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {b.services?.name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(b.start_at).toLocaleString("th-TH", {
                          timeZone: "Asia/Bangkok",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{b.deposit_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          b.payment_method === "promptpay_qr"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {b.payment_method === "promptpay_qr"
                          ? "PromptPay QR"
                          : "โอนเงิน"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {b.payment_slip_url ? (
                        <a
                          href={b.payment_slip_url}
                          target="_blank"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          ดูสลิป
                        </a>
                      ) : b.promptpay_qr_code ? (
                        <span className="text-green-600">ชำระผ่าน QR</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/admin/bookings/${
                            b.id
                          }/receipt?token=${encodeURIComponent(token)}`}
                          target="_blank"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          ใบรับมัดจำ
                        </a>
                        {filter === "awaiting_deposit" && (
                          <>
                            <button
                              onClick={() => approve(b.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => reject(b.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              ไม่อนุมัติ
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary cards - Mobile Only */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">การจองทั้งหมด</p>
              <p className="text-xl font-bold mt-1">{rows.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg">
              📅
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">รายได้จากมัดจำ</p>
              <p className="text-xl font-bold mt-1">
                ฿
                {rows
                  .reduce((sum, b) => sum + b.deposit_amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg">
              💰
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
