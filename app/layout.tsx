import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking SaaS MVP",
  description: "LINE OA + Booking + Deposit (Next.js + Supabase)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <div className="container py-6 relative">{children}</div>
      </body>
    </html>
  );
}
