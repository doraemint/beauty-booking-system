import { Suspense } from "react";
import HistoryContent from "./HistoryContent";

export default function BookingHistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center pb-16 md:pb-0">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดประวัติการจอง...</p>
        </div>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}