"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

type Service = {
  id: string;
  name: string;
  price: number;
  deposit: number;
  duration_mins: number;
  is_active: boolean;
  image_url?: string | null;
};

export default function ServicesManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      try {
        const res = await fetch("/api/services/list");
        if (res.ok) {
          const data = await res.json();
          // Add is_active field if not present
          const servicesWithActive = data.map((service: any) => ({
            ...service,
            is_active:
              service.is_active !== undefined ? service.is_active : true,
          }));
          setServices(servicesWithActive);
        } else {
          console.error("Failed to load services");
        }
      } catch (err) {
        console.error("Error loading services:", err);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [token]);

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setImagePreview(service.image_url || null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingService || !token) return;

    try {
      // Determine if we're creating a new service or updating an existing one
      if (!editingService.id) {
        // Creating a new service
        const res = await fetch("/api/services/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": token,
          },
          body: JSON.stringify({ service: editingService }),
        });

        if (res.ok) {
          const data = await res.json();
          // Add the new service to the local state
          setServices([...services, data.service]);
          setIsModalOpen(false);
          setEditingService(null);
          setImagePreview(null);
          alert("เพิ่มบริการใหม่สำเร็จ");
        } else {
          const errorData = await res.json();
          alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
        }
      } else {
        // Updating an existing service
        const res = await fetch("/api/services/update-single", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": token,
          },
          body: JSON.stringify({ service: editingService }),
        });

        if (res.ok) {
          const data = await res.json();
          // Update the service in the local state
          setServices(
            services.map((s) => (s.id === editingService.id ? data.service : s))
          );
          setIsModalOpen(false);
          setEditingService(null);
          setImagePreview(null);
          alert("บันทึกการแก้ไขสำเร็จ");
        } else {
          const errorData = await res.json();
          alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
        }
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const toggleServiceStatus = async (id: string, currentStatus: boolean) => {
    try {
      // In a real implementation, you would call an API to update the service status
      setServices(
        services.map((service) =>
          service.id === id
            ? { ...service, is_active: !currentStatus }
            : service
        )
      );
    } catch (error) {
      console.error("Error updating service status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!token) return;

    // Confirm deletion
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบบริการ "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/services/delete?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": token,
        },
      });

      if (res.ok) {
        // Remove the service from the local state
        setServices(services.filter((service) => service.id !== id));
        alert("ลบบริการสำเร็จ");
      } else {
        const errorData = await res.json();
        alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("เกิดข้อผิดพลาดในการลบบริการ");
    }
  };

  const handleInputChange = (
    field: keyof Service,
    value: string | number | boolean
  ) => {
    if (editingService) {
      setEditingService({
        ...editingService,
        [field]: value,
      });
    }
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Supabase
  const uploadImage = async () => {
    if (!fileInputRef.current?.files?.[0] || !token) return;

    const file = fileInputRef.current.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/services/image", {
        method: "POST",
        headers: {
          "x-admin-token": token,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // Update the editing service with the new image URL
        if (editingService) {
          setEditingService({
            ...editingService,
            image_url: data.url,
          });
        }
        alert("อัพโหลดรูปภาพสำเร็จ");
      } else {
        const errorData = await res.json();
        console.error("Upload error:", errorData);
        alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert(`เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Remove image
  const removeImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setImagePreview(null);
    if (editingService) {
      setEditingService({
        ...editingService,
        image_url: null,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            การจัดการบริการ
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            จัดการบริการและความพร้อมใช้งาน
          </p>
        </div>

        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
          onClick={() => {
            setEditingService({
              id: "",
              name: "",
              price: 0,
              deposit: 0,
              duration_mins: 30,
              is_active: true,
            });
            setImagePreview(null);
            setIsModalOpen(true);
          }}
        >
          <span className="mr-2 text-lg">+</span>
          <span className="text-sm md:text-base">เพิ่มบริการใหม่</span>
        </button>
      </div>

      {/* Mobile Services Grid */}
      <div className="md:hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
                  !service.is_active ? "opacity-70" : ""
                }`}
              >
                {service.image_url ? (
                  <div className="h-40 bg-gray-200 relative">
                    <Image
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      width={100}
                      height={100}
                    />
                    {!service.is_active && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          ปิดการใช้งาน
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                    <div className="text-indigo-400 text-4xl">💇</div>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {service.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {service.duration_mins} นาที
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      ฿{service.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">มัดจำ</p>
                      <p className="font-medium text-sm">
                        ฿{service.deposit.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() =>
                          toggleServiceStatus(service.id, service.is_active)
                        }
                        className={`p-2 rounded-lg ${
                          service.is_active
                            ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                            : "text-green-500 hover:text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {service.is_active ? "🚫" : "✅"}
                      </button>
                      <button
                        onClick={() => handleDelete(service.id, service.name)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Services Grid */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="flex justify-center py-12 col-span-3">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
                !service.is_active ? "opacity-70" : ""
              }`}
            >
              {service.image_url ? (
                <div className="h-40 bg-gray-200 relative">
                  <Image
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                    width={100}
                    height={100}
                  />
                  {!service.is_active && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-bold">ปิดการใช้งาน</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                  <div className="text-indigo-400 text-4xl">💇</div>
                </div>
              )}

              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {service.duration_mins} นาที
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    ฿{service.price.toLocaleString()}
                  </span>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">มัดจำ</p>
                    <p className="font-medium">
                      ฿{service.deposit.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() =>
                        toggleServiceStatus(service.id, service.is_active)
                      }
                      className={`p-2 rounded-lg ${
                        service.is_active
                          ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                          : "text-green-500 hover:text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {service.is_active ? "🚫" : "✅"}
                    </button>
                    <button
                      onClick={() => handleDelete(service.id, service.name)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Service Modal */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                  {editingService.id ? "แก้ไขบริการ" : "เพิ่มบริการใหม่"}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingService(null);
                    setImagePreview(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อบริการ
                  </label>
                  <input
                    type="text"
                    value={editingService.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="เช่น โบท็อกซ์"
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รูปภาพบริการ
                  </label>

                  {imagePreview ? (
                    <div className="relative">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg border border-gray-300"
                        width={100}
                        height={100}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                      onClick={triggerFileInput}
                    >
                      <div className="text-indigo-400 text-3xl mb-2">📷</div>
                      <p className="text-gray-600 text-sm">
                        คลิกเพื่อเลือกรูปภาพ
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        หรือลากไฟล์มาที่นี่
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="mt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                    >
                      เลือกรูปภาพ
                    </button>
                    {fileInputRef.current?.files?.[0] && (
                      <button
                        type="button"
                        onClick={uploadImage}
                        disabled={uploading}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm text-white ${
                          uploading
                            ? "bg-indigo-400 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        {uploading ? "กำลังอัพโหลด..." : "อัพโหลด"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ราคาเต็ม (บาท)
                    </label>
                    <input
                      type="number"
                      value={editingService.price}
                      onChange={(e) =>
                        handleInputChange(
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      มัดจำ (บาท)
                    </label>
                    <input
                      type="number"
                      value={editingService.deposit}
                      onChange={(e) =>
                        handleInputChange(
                          "deposit",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ระยะเวลา (นาที)
                  </label>
                  <input
                    type="number"
                    value={editingService.duration_mins}
                    onChange={(e) =>
                      handleInputChange(
                        "duration_mins",
                        parseInt(e.target.value) || 30
                      )
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="30"
                  />
                </div>

                {editingService.image_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL รูปภาพ
                    </label>
                    <input
                      type="text"
                      value={editingService.image_url}
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                    />
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingService.is_active}
                    onChange={(e) =>
                      handleInputChange("is_active", e.target.checked)
                    }
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    เปิดใช้งานบริการ
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingService(null);
                    setImagePreview(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 md:hidden">
        <h2 className="text-lg font-bold text-gray-800 mb-3">การจัดการด่วน</h2>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={`/admin/services/deposits?token=${token}`}
            className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mx-auto mb-2">
              💰
            </div>
            <p className="font-medium text-gray-800 text-sm">จัดการมัดจำ</p>
          </a>

          <a
            href={`/admin/promptpay?token=${token}`}
            className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mx-auto mb-2">
              ⚙️
            </div>
            <p className="font-medium text-gray-800 text-sm">PromptPay</p>
          </a>
        </div>
      </div>
    </div>
  );
}
