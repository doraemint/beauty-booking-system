import { Suspense } from 'react';
import BookPageContent from './BookPageContent';
import BottomNavBar from '@/components/BottomNavBar';

export default function BookPage() {
  return (
    <div className="pb-16 md:pb-0 min-h-screen relative">
      <Suspense fallback={<div>Loading...</div>}>
        <BookPageContent />
      </Suspense>
      <BottomNavBar />
    </div>
  );
}
