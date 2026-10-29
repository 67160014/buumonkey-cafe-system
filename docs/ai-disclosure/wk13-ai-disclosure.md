## การใช้ AI ในงานนี้ (AI Usage Declaration)

### 1. ใช้ AI หรือไม่?

- [ ] ไม่ได้ใช้ AI
- [x] ใช้ AI (กรุณาระบุรายละเอียด)

### 2. เครื่องมือ AI ที่ใช้

- ChatGPT / Gemini 

## 3. งานส่วนไหนใช้ AI

- [x] Integration & API Contract - ส่วน: ช่วยออกแบบและตรวจสอบโครงสร้าง JSON request/response เพื่อป้องกัน naming convention mismatch (เช่น `snake_case` vs `camelCase`) ระหว่าง frontend และ backend
- [x] Test Case Design - ส่วน: ช่วยแปลง User Stories, Acceptance Criteria และ Sequence Diagram เป็นตาราง Test Cases แบบ End-to-End (E2E) ครอบคลุมทั้ง Happy Path และ Error Cases
- [x] Backend Development - ส่วน: ช่วยร่างโค้ด endpoint `GET /api/reports/sales` สำหรับสรุปยอดขายตามสาขา (`branchId`)
- [x] Bug Fixing & Refactoring - ส่วน: ช่วยวิเคราะห์สาเหตุของบั๊ก (เช่น ค่า `undefined` บน frontend หรือการตัดสต็อกผิดสาขา) และเสนอแนวทาง refactoring ฟังก์ชันกลาง
- [x] Requirement Update - ส่วน: ช่วยร่างประวัติการปรับปรุงข้อกำหนด (Requirement Revision Log) ใน `wk03-requirements.md` เช่น การเพิ่ม FR-09 สำหรับกรณีสต็อกเป็นศูนย์ (`stock = 0`)

## 4. Prompt ที่ใช้ (ตัวอย่าง)

“ช่วยออกแบบตาราง Test Case แบบ End-to-End (E2E) สำหรับระบบร้านกาแฟ POS โดยครอบคลุม Flow 'Order to Payment to Report' แยกตามสาขา (branch_id) จาก Acceptance Criteria ใน wk04 และ Sequence Diagram ใน wk09 พร้อมทั้งช่วยตรวจโค้ด endpoint `GET /api/reports/sales` ใน Express.js/MySQL2 เพื่อป้องกันปัญหาการส่งค่า DECIMAL เป็น String และแนะนำการบันทึกประวัติการแก้ไข Requirement ใน wk03 เมื่อพบปัญหาสต็อกเป็นศูนย์”

## 5. ผลลัพธ์จาก AI

AI ช่วยสร้างโครงร่างตาราง Test Cases แบบครบถ้วน ช่วยระบุจุดบกพร่องจากการเชื่อมต่อระหว่าง Module (เช่น ชื่อ field ไม่ตรงกัน) ช่วยเสนอโครงสร้างโค้ดสำหรับรายงานยอดขายที่กรองตาม `branchId` และช่วยร่างข้อความการปรับปรุง Requirement ให้สอดคล้องกับหลักเกณฑ์การประเมิน CLO5

## 6. การปรับแต่งของตัวเอง

- ตรวจสอบและแก้ไขชื่อ field ใน API Response ให้เป็น `camelCase` ตรงตามข้อตกลงของทีม
- ดำเนินการทดสอบ End-to-End จริงบนหน้าจอ POS และฐานข้อมูล พร้อมกรอกผลลัพธ์จริง (Actual Result) และสถานะ Pass/Fail ในตาราง Test Case
- ตรวจสอบความถูกต้องของคำสั่ง SQL Query ใน `getSalesReport` รวมถึงทดสอบการกรองข้อมูลแยกตาม `branch_id` ระหว่าง 2 สาขาจริง
- แก้ไขบั๊กจริงในโค้ดฝั่ง frontend/backend ตามขั้นตอน Reproduce, Isolate, และ Fix & Verify
- อัปเดตไฟล์ `wk03-requirements.md` โดยระบุหมายเลข FR, วันที่พบปัญหา และเหตุผลที่สอดคล้องกับพฤติกรรมจริงของ Prototype

## 7. เหตุผลในการใช้ AI

ใช้ AI เพื่อช่วยเร่งกระบวนการออกแบบ Test Case ให้ครอบคลุมทุกเงื่อนไข (Edge Cases) และช่วยวิเคราะห์หาจุดขัดแย้งของ API Contract ระหว่างการรวม Module (Integration) ทำให้การแก้ไขบั๊กและการพัฒนา Endpoint ใหม่เป็นไปอย่างมีระบบ โดยผู้จัดทำเป็นผู้ลงมือทดสอบ รวมโค้ด และตรวจสอบความถูกต้องของระบบจริงด้วยตนเอง

## AI Usage Declaration — Coding Sprint สัปดาห์ที่ 13

### 1. Diagram/เอกสารต้นทางของ sprint นี้:

ต่อยอดจากเอกสาร **Architecture & Component Design สัปดาห์ที่ 11**
(`wk11-architecture.md`) ในส่วน **Report & Analytics Module** และ
Sequence Diagram สัปดาห์ที่ 9 (`wk09-sequence-diagram.png`) ใน flow การเรียก
รายงานยอดขาย

### 2. ส่วนที่ AI ช่วยเขียนโค้ด:

- `src/controllers/reportController.js`
  - ฟังก์ชัน `getSalesSummary`
  - ตรวจสอบ `branchId` และส่งคำขอไปยัง model
- `src/models/reportModel.js`
  - ฟังก์ชัน `buildSalesFilter` สำหรับกรองข้อมูลตามสาขา
  - ฟังก์ชัน `getSalesSummary` สำหรับ query และรวมยอดขายด้วย `SUM`
- `src/routes/reportRoutes.js`
  - route `GET /api/reports/sales`
- `public/report-ui.js`
  - ฟังก์ชัน `loadReport` สำหรับส่ง `branchId` และแสดงยอดขายรวมแยกตามเมนู

### 3. สมาชิกที่อธิบายโค้ดส่วนนี้ได้ (ต้องมีอย่างน้อย 1 คนต่อส่วน):

**จิรภัทร บัวชุมสุข, ณฐกร โกศินานนท์**

### 4. โค้ด/schema/สถาปัตยกรรมมีจุดใดต่างจาก diagram เดิมหรือไม่:

- [x] ไม่ต่าง
- [ ] ต่าง — เหตุผล: ____ และได้ปรับปรุง diagram สัปดาห์นี้ให้ตรงแล้ว:
  [ ] แล้ว [ ] ยังไม่ได้ปรับ

