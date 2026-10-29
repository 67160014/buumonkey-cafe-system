# wk14-quality-review.md — สรุปผลตรวจโค้ด

ตรวจ routes ทั้งหมด 12 endpoints ใน `src/routes/` และโค้ดที่เกี่ยวข้อง

## Endpoints ที่ตรวจ

- **Branches:** `GET /api/branches`, `GET /api/branches/:branchId/cashiers`
- **Menu:** `GET /api/menu/item`, `POST /api/menu/item`, `PUT /api/menu/item/:menuId`, `DELETE /api/menu/item/:menuId`, `GET /api/menu/:branchId`
- **Orders:** `POST /api/orders`, `GET /api/orders`, `GET /api/orders/customizations`, `GET /api/orders/:orderId/receipt`
- **Reports:** `GET /api/reports/sales`

## ผล Checklist

| หัวข้อ | ผลตรวจ |
|---|---|
| ตรวจข้อมูลนำเข้า | มีตรวจหลายจุด แต่ยังขาดการตรวจ `orderDate` และวันปฏิทินบางกรณี |
| จำกัดสิทธิ์ / IDOR | **ต้องแก้ก่อนใช้งานจริง:** ยังไม่มีระบบ login และตรวจสิทธิ์สาขา ผู้เรียกอาจเข้าถึงข้อมูลหรือจัดการข้อมูลต่างสาขาได้ |
| SQL Injection | ผ่าน — ใช้ parameterized query |
| Error handling | ผ่าน — endpoint ที่เรียกฐานข้อมูลมีการจัดการข้อผิดพลาด |
| Race condition ของสต็อก | ผ่าน — สร้างออเดอร์ใน transaction และล็อกแถวสต็อกก่อนตัดยอด |

## ประเด็นที่ควรปรับปรุง

1. **ความเสี่ยงสูง: ไม่มีการยืนยันตัวตนและตรวจสิทธิ์สาขา**  
   API ดู/แก้ข้อมูลตาม branch ที่ส่งมา โดยยังไม่ตรวจว่าผู้เรียกมีสิทธิ์ในสาขานั้น ควรเพิ่มระบบ login และตรวจสิทธิ์ฝั่ง server ก่อนนำไปใช้งานจริง เรื่องนี้ยังไม่ได้แก้เพราะระบบยังไม่มีโครงสร้าง authentication
2. **ปานกลาง: ไม่ตรวจ `orderDate` จาก request**  
   ควรใช้เวลาจาก server หรือเพิ่มการตรวจรูปแบบและช่วงวันที่
3. **ต่ำ: ใช้ `PUT` แต่แก้ข้อมูลบาง field ได้**  
   ควรเปลี่ยนเป็น `PATCH` หรือบังคับให้ `PUT` ส่งข้อมูลครบ
4. **ต่ำ: ตรวจวันที่รายงานไม่เข้มงวดพอ**  
   ควรตรวจว่าวันที่มีอยู่จริงในปฏิทิน

## การแก้ไขที่ทำแล้ว

เพิ่มการตรวจว่า cashier อยู่สาขาเดียวกับออเดอร์ก่อนสร้างออเดอร์ หากไม่ตรงจะยกเลิกรายการ การแก้นี้ช่วยป้องกันการผูก cashier ผิดสาขา แต่ **ยังไม่ทดแทนระบบตรวจสิทธิ์ผู้ใช้**

## การทดสอบหลังแก้

- ตรวจ syntax ผ่าน
- ทดสอบด้วย mock: cashier ผิดสาขาถูกปฏิเสธและ rollback
- ทดสอบด้วย mock: cashier สาขาถูกยังสร้างออเดอร์ได้
- ยังไม่ได้ทดสอบกับ MySQL จริง
