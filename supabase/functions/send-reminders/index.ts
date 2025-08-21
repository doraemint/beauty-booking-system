import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0);

  const { data, error } = await supabase
    .from("bookings")
    .select("id, start_at, customer_id, service_id, customers(line_user_id), services(name)")
    .eq("status", "confirmed")
    .gte("start_at", start.toISOString())
    .lt("start_at", end.toISOString());

  if (error) return new Response(error.message, { status: 500 });

  for (const b of data || []) {
    const to = b.customers?.line_user_id as string | undefined;
    if (!to) continue;
    const timeTxt = new Date(b.start_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN")}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text: `แจ้งเตือนนัดพรุ่งนี้ 📅\n${b.services?.name ?? ""} — ${timeTxt}` }],
      }),
    });
  }

  return new Response("ok");
});
