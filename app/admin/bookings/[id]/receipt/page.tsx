import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getData(id: string) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, start_at, deposit_amount, payment_status, status, payment_slip_url, customers(name,phone), services(name, price)"
    )
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export default async function ReceiptPage({ params, searchParams }: any) {
  // very simple token check via query for MVP
  const token = process.env.ADMIN_TOKEN;
  if (token && searchParams.token !== token) {
    return <div className="container py-10">Unauthorized</div>;
  }

  const b = await getData(params.id);
  const when = new Date(b.start_at).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
  });

  return (
    <div className="container py-10">
      <div className="card max-w-2xl mx-auto p-8 print:shadow-none">
        <h1 className="text-2xl font-semibold mb-2">ใบรับมัดจำ</h1>
        <p className="text-sm text-gray-500 mb-6">Booking ID: {b.id}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-medium">ลูกค้า</div>
            <div>{b.customers?.[0]?.name || "-"}</div>
            <div className="text-gray-500">{b.customers?.[0]?.phone || ""}</div>
          </div>
          <div>
            <div className="font-medium">นัดหมาย</div>
            <div>{b.services?.[0]?.name || "-"}</div>
            <div className="text-gray-500">{when}</div>
          </div>
        </div>

        <hr className="my-6" />

        <div className="flex justify-between text-lg">
          <div>ยอดมัดจำ</div>
          <div>฿{b.deposit_amount}</div>
        </div>
        <div className="mt-2 text-sm">
          สถานะการชำระ: <span className="badge">{b.payment_status}</span>
        </div>
        {b.payment_slip_url && (
          <div className="mt-4">
            <a href={b.payment_slip_url} className="underline" target="_blank">
              ดูสลิป
            </a>
          </div>
        )}

        <div className="mt-8 flex gap-2 print:hidden">
          <button className="btn btn-ghost" onClick={() => window.print()}>
            พิมพ์ / บันทึกเป็น PDF
          </button>
        </div>
      </div>
    </div>
  );
}
