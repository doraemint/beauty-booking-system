import { Suspense } from 'react';
import BookPageContent from './BookPageContent';

export default function BookPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookPageContent />
    </Suspense>
  );
}
