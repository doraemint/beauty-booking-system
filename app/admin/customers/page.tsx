'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type CustomerSummary = {
  line_user_id: string;
  customer_count: number;
  first_registered: string;
  total_bookings: number;
  total_spent: number;
};

type CustomerDetail = {
  id: string;
  name: string | null;
  phone: string | null;
  personal_bookings: number;
  personal_spent: number;
};

export default function CustomersManagementPage() {
  const [customerSummaries, setCustomerSummaries] = useState<CustomerSummary[]>([]);
  const [customerDetails, setCustomerDetails] = useState<Record<string, CustomerDetail[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [token, setToken] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Get token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token') || '';
    setToken(tokenParam);
  }, []);

  // Load customer summaries from Supabase
  useEffect(() => {
    if (!token) return;

    const loadCustomerSummaries = async () => {
      setLoading(true);
      
      try {
        // Fetch customer summaries
        const { data, error } = await supabase
          .from('customer_summary')
          .select('*')
          .order('first_registered', { ascending: false });

        if (error) {
          console.error('Error fetching customer summaries:', error);
          return;
        }

        setCustomerSummaries(data || []);
      } catch (error) {
        console.error('Error loading customer summaries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerSummaries();
  }, [token]);

  // Load customer details for a specific LINE ID
  const loadCustomerDetails = async (lineUserId: string) => {
    // If already loading or already loaded, skip
    if (loadingDetails[lineUserId] || customerDetails[lineUserId]) {
      return;
    }

    // Set loading state for this LINE ID
    setLoadingDetails(prev => ({ ...prev, [lineUserId]: true }));

    try {
      // Fetch detailed customer information for this LINE ID
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          phone,
          created_at,
          bookings(id, deposit_amount, status)
        `)
        .eq('line_user_id', lineUserId)
        .order('created_at', { ascending: true });

      if (customersError) {
        console.error('Error fetching customer details:', customersError);
        return;
      }

      // Process customer details with individual booking counts and spending
      const processedDetails: CustomerDetail[] = customersData.map((customer: any) => {
        // Filter only confirmed bookings for calculations
        const confirmedBookings = customer.bookings.filter(
          (booking: any) => booking.status === 'confirmed'
        );
        
        const bookingCount = confirmedBookings.length;
        const totalSpent = confirmedBookings.reduce(
          (sum: number, booking: any) => sum + (booking.deposit_amount || 0),
          0
        );

        return {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          personal_bookings: bookingCount,
          personal_spent: totalSpent
        };
      });

      // Update state with the new details
      setCustomerDetails(prev => ({
        ...prev,
        [lineUserId]: processedDetails
      }));
    } catch (error) {
      console.error('Error loading customer details:', error);
    } finally {
      // Remove loading state for this LINE ID
      setLoadingDetails(prev => ({ ...prev, [lineUserId]: false }));
    }
  };

  // Filter customers based on search term
  const filteredSummaries = customerSummaries.filter(summary => 
    (summary.line_user_id.includes(searchTerm))
  );

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">การจัดการลูกค้า</h1>
        <p className="opacity-90">ดูและจัดการข้อมูลลูกค้าของคุณ</p>
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาด้วย LINE ID..."
            className="pl-12 pr-4 py-3 w-full bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
        </div>
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mr-3">
                👥
              </div>
              <div>
                <p className="text-gray-500 text-sm">LINE ID ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{customerSummaries.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 mr-3">
                📅
              </div>
              <div>
                <p className="text-gray-500 text-sm">การจองทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {customerSummaries.reduce((sum, summary) => sum + summary.total_bookings, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 mr-3">
                💰
              </div>
              <div>
                <p className="text-gray-500 text-sm">รายได้ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  ฿{customerSummaries.reduce((sum, summary) => sum + summary.total_spent, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-yellow-100 w-12 h-12 rounded-xl flex items-center justify-center text-yellow-600 mr-3">
                👤
              </div>
              <div>
                <p className="text-gray-500 text-sm">ลูกค้าทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {customerSummaries.reduce((sum, summary) => sum + summary.customer_count, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customers List - Mobile Optimized */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">ลูกค้าล่าสุด</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredSummaries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-500">ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSummaries.map((summary) => (
              <div key={summary.line_user_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Summary Card */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 w-10 h-10 rounded-xl flex items-center justify-center text-indigo-600 mr-3">
                        <span className="font-medium">{summary.line_user_id.substring(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 truncate max-w-[150px]">
                          {summary.line_user_id.substring(0, 15)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(summary.first_registered).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <button 
                      className="bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-indigo-600 transition-colors"
                      onClick={() => loadCustomerDetails(summary.line_user_id)}
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">ลูกค้า</p>
                      <p className="font-medium text-gray-800">{summary.customer_count} คน</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">การจอง</p>
                      <p className="font-medium text-gray-800">{summary.total_bookings}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">ค่าใช้จ่าย</p>
                      <p className="font-medium text-gray-800">฿{summary.total_spent.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <button
                    className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    onClick={() => window.open(`/admin/customers/${summary.line_user_id}/bookings?token=${token}`, '_blank')}
                  >
                    ดูประวัติการจอง
                  </button>
                </div>
                
                {/* Details Section - Only shown when expanded */}
                {customerDetails[summary.line_user_id] && (
                  <div className="bg-gray-50 border-t border-gray-100 p-4">
                    <h3 className="font-medium text-gray-800 mb-3">รายละเอียดลูกค้า</h3>
                    <div className="space-y-3">
                      {customerDetails[summary.line_user_id].map((customer, customerIndex) => (
                        <div key={customerIndex} className="bg-white rounded-xl p-3 border border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-gray-800">
                              {customer.name || '(ไม่มีชื่อ)'}
                            </p>
                            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                              #{customerIndex + 1}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">เบอร์โทร:</span>
                              <span className="font-medium text-gray-800">{customer.phone || '-'}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-blue-50 rounded-lg p-2 text-center">
                                <p className="text-xs text-blue-600">การจอง</p>
                                <p className="font-medium text-blue-800">{customer.personal_bookings}</p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-2 text-center">
                                <p className="text-xs text-purple-600">ค่าใช้จ่าย</p>
                                <p className="font-medium text-purple-800">฿{customer.personal_spent.toLocaleString()}</p>
                              </div>
                            </div>
                            
                            <button
                              className="mt-2 w-full py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                              onClick={() => window.open(`/admin/customers/${summary.line_user_id}/bookings?token=${token}`, '_blank')}
                            >
                              ดูประวัติการจองทั้งหมด
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Loading indicator for details */}
                {loadingDetails[summary.line_user_id] && (
                  <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="px-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex">
            <div className="flex-shrink-0 mr-3">
              <span className="text-xl text-blue-500">ℹ️</span>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-1">ข้อมูลลูกค้า</h3>
              <p className="text-blue-700 text-sm">
                แต่ละบัตรแสดงข้อมูลสรุปตาม LINE ID ซึ่งแต่ละ ID อาจมีหลายลูกค้า คลิก &quot;ดูรายละเอียด&quot; เพื่อดูข้อมูลลูกค้าแต่ละคน
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}