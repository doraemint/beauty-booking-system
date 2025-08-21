export default function Home() {
  return (
    <main className="space-y-4">
      <h1 className="text-3xl font-semibold">Booking SaaS — MVP</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card space-y-2">
          <h2 className="text-xl font-medium">ลูกค้า</h2>
          <p>เริ่มจาก LINE พิมพ์ “จองคิว” จะได้ลิงก์หน้า /book พร้อม uid</p>
          <a className="btn btn-ghost w-fit" href="/book">ลองเปิด /book</a>
        </div>
        <div className="card space-y-2">
          <h2 className="text-xl font-medium">แอดมิน</h2>
          <p>ดู/อนุมัติสลิปได้ที่ /admin/bookings?token=&lt;ADMIN_TOKEN&gt;</p>
          <a className="btn btn-ghost w-fit" href="/admin/bookings">เปิด /admin/bookings</a>
        </div>
      </div>
    </main>
  );
}
