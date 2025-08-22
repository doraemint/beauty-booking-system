'use client';

import BottomNavBar from '@/components/BottomNavBar';

export default function TestNavbarPage() {
  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Test Navbar Page</h1>
        <p className="mb-4">This page is for testing the bottom navbar.</p>
        <div className="bg-white p-4 rounded-lg shadow">
          <p>Content area - scroll down to see if navbar appears at bottom</p>
          <div className="h-96 bg-gray-200 rounded my-4 flex items-center justify-center">
            <p>Scrollable content area</p>
          </div>
          <div className="h-96 bg-gray-300 rounded my-4 flex items-center justify-center">
            <p>More content</p>
          </div>
          <div className="h-96 bg-gray-400 rounded my-4 flex items-center justify-center">
            <p>Even more content</p>
          </div>
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
}