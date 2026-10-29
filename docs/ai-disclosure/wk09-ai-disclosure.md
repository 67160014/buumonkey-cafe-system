### การใช้ AI ในงานนี้ (AI Usage Declaration)

#### 1. ใช้ AI หรือไม่?

- [ ] ไม่ได้ใช้ AI
- [x] ใช้ AI (กรุณาระบุรายละเอียด)

#### 2. เครื่องมือ AI ที่ใช้:

- GitHub Copilot
- ChatGPT

#### 3. งานส่วนไหนใช้ AI:

- [ ] Requirement Analysis
- [x] Database Design — ส่วน: ตรวจสอบและปรับ Schema ให้รองรับ `branch`, `branch_id` และ `stock_quantity`
- [x] System Architecture — ส่วน: ตรวจสอบการแยก `Order Controller`, `MenuItemModel` และ `Order Model`
- [x] Document/Grammar Check — ส่วน: ตรวจสอบความสอดคล้องระหว่าง Sequence Diagram, Schema และโค้ด
- [ ] อื่นๆ

#### 4. Prompt ที่ใช้ (ตัวอย่าง):

- "ตรวจสอบว่าโค้ด Backend ตรงกับ Sequence Diagram ที่ออกแบบไว้หรือไม่"
- "ปรับโค้ดให้ใช้ `branchId` และ `cashierId` ให้ตรงกับ Schema"
- "ตรวจสอบ Diagram-Code Drift และระบุส่วนที่ต้องปรับ Diagram หรือโค้ดให้สอดคล้องกัน"
- "ตรวจสอบและแก้ไข route/controller/model ของ CRUD เมนูให้ตรงกับ Schema"

#### 5. ผลลัพธ์จาก AI:

AI ช่วยเสนอการปรับ Controller, Model, และ Schema รวมถึงชี้จุดที่ชื่อฟิลด์และโครงสร้างโค้ดไม่ตรงกัน

#### 6. การปรับแต่งของตัวเอง:

สมาชิกในกลุ่มเป็นผู้ตรวจสอบและตัดสินใจเลือกใช้การแก้ไขที่เหมาะสม ปรับจาก `employeeId` เป็น `cashierId` ให้ตรงกับ Schema ตรวจสอบ SQL และ Validation ด้วยตนเอง ปรับ Sequence Diagram ให้ตรงกับโครงสร้างโค้ดจริง

#### 7. เหตุผลในการใช้ AI:

ใช้ AI เพื่อช่วยตรวจสอบความสอดคล้องระหว่าง Diagram, Schema และโค้ด ช่วยค้นหาข้อผิดพลาดจากการเชื่อมต่อหลายไฟล์ และช่วยอธิบายแนวทางแก้ไข โดยสมาชิกในกลุ่มยังเป็นผู้ทำความเข้าใจ ตรวจสอบ

## AI Usage Declaration — Coding Sprint สัปดาห์ที่ 9

### 1. Diagram/เอกสารต้นทางของ sprint นี้:

ต่อยอดจาก:
- Schema ฐานข้อมูลและตาราง `menu_item`, `orders`, `order_item` จากสัปดาห์ที่ 7
- Sequence Diagram ของ flow การสั่งซื้อที่ออกแบบก่อนเริ่ม Coding Sprint สัปดาห์ที่ 9

### 2. ส่วนที่ AI ช่วยเขียนโค้ด:

- `src/controllers/orderController.js`
  - ตรวจสอบข้อมูลคำสั่งซื้อ
  - รวมจำนวนเมนูที่ซ้ำกัน
  - ตรวจสอบเมนูและ stock ตาม `branchId`
  - สร้าง order และเพิ่มรายการสินค้า
  - ตัด stock และคำนวณ `lowStockMenuIds`
- `src/models/orderModel.js`
  - เพิ่มคำสั่งสร้างข้อมูลใน `orders`
  - เพิ่มคำสั่งสร้างข้อมูลใน `order_item`
  - ดึงรายการ order ทั้งหมด
- `src/models/menuItemModel.js`
  - Query เมนูและ stock ตามสาขา
  - ตัด stock โดยป้องกัน stock ติดลบ
  - รองรับ CRUD เมนูตาม `branchId`
- `src/controllers/menuController.js`
  - ตรวจสอบข้อมูลและจัดการ CRUD เมนู

### Prompt ที่ใช้ (ตัวอย่าง):

- "ตรวจสอบว่าโค้ด Backend ตรงกับ Sequence Diagram ที่ออกแบบไว้หรือไม่"
- "ปรับโค้ดให้ใช้ `branchId` และ `cashierId` ให้ตรงกับ schema"
- "ตรวจสอบ Diagram-Code Drift และระบุส่วนที่ต้องปรับ Diagram หรือโค้ดให้สอดคล้องกัน"
- "ตรวจสอบและแก้ไข route/controller/model ของ CRUD เมนูให้ตรงกับ schema"

### ผลลัพธ์จาก AI:

- ชี้จุดที่ชื่อฟิลด์ในโค้ดไม่ตรงกับ schema เช่น `employeeId`/`cashierId` และ `created_at`/`order_date`
- ช่วยตรวจสอบว่า flow validation, stock check, create order, add order item และ deduct stock สอดคล้องกับ Diagram

### การปรับแต่งและการตรวจสอบของกลุ่ม:

- กลุ่มเป็นผู้ตัดสินใจใช้ `cashierId` แทน `employeeId` ให้ตรงกับ schema
- กลุ่มตรวจสอบและปรับ Sequence Diagram ให้แสดง Model Layer หลังจากพบโครงสร้างโค้ดจริง
- กลุ่มตรวจสอบ SQL, ชื่อตาราง/คอลัมน์, validation และลำดับการทำงานก่อนนำไปใช้
- กลุ่มเลือกคงข้อจำกัดเรื่อง database transaction ไว้ตามขอบเขตของ Sprint และบันทึกไว้ในเอกสาร

### เหตุผลในการใช้ AI:

ใช้ AI เพื่อช่วยตรวจสอบความสอดคล้องระหว่าง Diagram, Schema และโค้ด ช่วยค้นหาข้อผิดพลาดจากการ Integrate หลายไฟล์ และช่วยอธิบายแนวทางแก้ไข

### 3. สมาชิกที่อธิบายโค้ดส่วนนี้ได้ (ต้องมีอย่างน้อย 1 คนต่อส่วน):

- `orderController.js`: **จิรภัทร บัวชุมสุข, ณฐกร โกศินานนท์**
- `orderModel.js`: **จิรภัทร บัวชุมสุข, ณฐกร โกศินานนท์**
- `menuItemModel.js`: **จิรภัทร บัวชุมสุข, ณฐกร โกศินานนท์**

### 4. โค้ด/schema/สถาปัตยกรรมมีจุดใดต่างจาก diagram เดิมหรือไม่:

- [ ] ไม่ต่าง
- [x] ต่าง — เหตุผล: Diagram เดิมแสดงการติดต่อระหว่าง Order API กับฐานข้อมูลในระดับภาพรวม แต่โค้ดจริงแยกหน้าที่ผ่าน `Order Controller`, `Menu Item Model` และ `Order Model` นอกจากนี้ Schema จริงใช้ `cashierId`/`cashier_id`, `branchId`/`branch_id` และ `menu_id` เป็น `VARCHAR` และได้ปรับปรุง diagram สัปดาห์นี้ให้ตรงแล้ว: [x] แล้ว [ ] ยังไม่ได้ปรับ