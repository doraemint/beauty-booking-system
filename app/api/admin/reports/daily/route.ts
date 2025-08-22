import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdmin(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const date = url.searchParams.get("date"); // YYYY-MM-DD
  const format = url.searchParams.get("format") || "csv";
  if (!date)
    return NextResponse.json(
      { error: "date required (YYYY-MM-DD)" },
      { status: 400 }
    );

  const start = new Date(date + "T00:00:00+07:00").toISOString();
  const end = new Date(date + "T23:59:59+07:00").toISOString();

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, start_at, deposit_amount, payment_status, status, customers(name,phone), services(name)"
    )
    .gte("start_at", start)
    .lte("start_at", end)
    .order("start_at", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (format === "json") return NextResponse.json(data);

  const rows = [
    [
      "booking_id",
      "datetime",
      "customer",
      "phone",
      "service",
      "deposit",
      "status",
      "payment_status",
    ],
    ...data.map((b: any) => [
      b.id,
      new Date(b.start_at).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
      }),
      b.customers?.[0]?.name || "",
      b.customers?.[0]?.phone || "",
      b.services?.[0]?.name || "",
      b.deposit_amount,
      b.status,
      b.payment_status,
    ]),
  ];

  const csv = rows
    .map((r) =>
      r
        .map(String)
        .map((s) => (s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s))
        .join(",")
    )
    .join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="daily_${date}.csv"`,
    },
  });
}
