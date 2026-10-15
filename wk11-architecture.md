# เอกสารการออกแบบสถาปัตยกรรมระบบ (Architecture & Component Design)

**โครงการ:** ระบบจัดการร้านกาแฟ (Cafe POS System)  
**สัปดาห์ที่ 11:** การออกแบบระบบตามแนวทาง 4+1 View Model  
**ชื่อไฟล์งาน:** `wk11-architecture.md`

---

## 1. ภาพรวมสถาปัตยกรรมระบบ (System Architecture Overview)

ระบบ Cafe POS System ถูกออกแบบโดยใช้สถาปัตยกรรมแบบ **3-Tier Layered Architecture (MVC Pattern on Express.js)** ซึ่งแยกส่วนแสดงผล (Client-side Frontend), ส่วนประมวลผลธุรกิจ (Server-side Backend/MVC) และส่วนจัดเก็บข้อมูล (MySQL Database) ออกจากกันอย่างชัดเจน เหมาะสมกับขนาดโปรเจกต์ โครงสร้างทีม และกรอบเวลาการพัฒนา 3–4 เดือน

### สถาปัตยกรรมหลักแบ่งเป็น 3 ชั้น (3-Tier Layered Architecture)
1. **Presentation Layer (Frontend):**  
   พัฒนาด้วย HTML5, CSS, และ Vanilla JavaScript (`app.js`, UI scripts ต่างๆ) รันบน Web Browser ผ่านอุปกรณ์แท็บเล็ตหน้าร้าน
2. **Application / Business Logic Layer (Backend):**  
   พัฒนาด้วย Node.js + Express.js จัดโครงสร้างแบบ MVC (Controllers, Models, Routes) เพื่อจัดการ API Endpoints, Business Rules (การคิดเงิน, คำนวณส่วนลด/ตัวเลือกเสริม, ตัดสต็อก, สรุปรายงาน)
3. **Data Layer (Database):**  
   ใช้ MySQL ในการจัดเก็บข้อมูลโครงสร้างแบบ Relational Data สื่อสารผ่าน Database Driver (`src/config/db.js`) และบริหารจัดการโครงสร้างด้วย SQL Migrations

---

## 2. การอธิบายสถาปัตยกรรมตามมุมมอง 4+1 View Model

### 2.1 Logical View (มุมมองด้านฟังก์ชันการทำงาน)
อธิบายการแบ่งกลุ่ม Module ภายในระบบตามความรับผิดชอบหลัก:

* **Menu Management Module:**  
  จัดการข้อมูลรายการอาหาร/เครื่องดื่ม, หมวดหมู่ และตัวเลือกเสริม (`menuController.js`, `menuItemModel.js`)
* **Order & POS Module:**  
  รับและบันทึกออเดอร์, จัดการการสั่งซื้อ, รองรับตัวเลือกเพิ่มเติม/Customizations (`orderController.js`, `orderModel.js`, `Order.js`)
* **Cashier & Receipt Module:**  
  ประมวลผลการรับชำระเงิน, ออกใบเสร็จรับเงิน และจัดการข้อมูลแคชเชียร์/พนักงาน (`cashierModel.js`, `receipt-ui.js`)
* **Report & Analytics Module:**  
  ดึงข้อมูลสถิติ ยอดขาย สรุปการขายประจำวัน/สาขา (`reportController.js`, `reportModel.js`)
* **Branch Management Module:**  
  จัดการข้อมูลสาขาต่าง ๆ ของระบบ (`branchRoutes.js`)

---

### 2.2 Development View (มุมมองโครงสร้างไฟล์ และ Repository)
แสดงโครงสร้างการจัดวางไฟล์ใน GitHub Repository ที่ตรงตามซอร์สโค้ดและ Directory Structure จริงของระบบ:

```text
cafe-pos-system/
├── node_modules/                               # แพ็กเกจ Dependencies ที่ติดตั้งผ่าน npm
├── public/                                      # โฟลเดอร์จัดการ Frontend / UI ของระบบ
│   ├── app.js                                   # สคริปต์หลักของแอปพลิเคชันฝั่ง UI
│   ├── index.html                               # หน้าแรก/หน้าหลักของระบบ POS หน้าร้าน
│   ├── index-ui.js                              # สคริปต์จัดการ Logic สำหรับหน้า index.html
│   ├── menu.html                                # หน้าจัดการรายการเมนูอาหาร/เครื่องดื่ม
│   ├── menu-ui.js                               # สคริปต์จัดการ Logic สำหรับหน้า menu.html
│   ├── receipt.html                             # หน้าแสดงและพิมพ์ใบเสร็จรับเงิน
│   ├── receipt-ui.js                            # สคริปต์จัดการ Logic สำหรับหน้า receipt.html
│   ├── report.html                              # หน้าแสดงรายงานสรุปยอดขาย
│   └── report-ui.js                             # สคริปต์จัดการ Logic สำหรับหน้า report.html
├── src/                                         # ซอร์สโค้ดหลักฝั่ง Backend (MVC Architecture)
│   ├── config/                                  # ตั้งค่าระบบและฐานข้อมูล
│   │   ├── db.js                                # ไฟล์ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
│   │   └── orderCustomizations.js               # กำหนดตัวเลือกเพิ่มเติม/การปรับแต่งออเดอร์
│   ├── controllers/                             # ประมวลผล Business Logic
│   │   ├── menuController.js                    # จัดการ Logic เพิ่ม/แก้ไข/ดึงข้อมูลเมนู
│   │   ├── orderController.js                   # จัดการ Logic การรับและสร้างออเดอร์
│   │   └── reportController.js                  # จัดการ Logic การคำนวณและสรุปข้อมูลรายงาน
│   ├── models/                                  # ติดต่อ Database และทำ Data Mapping
│   │   ├── Order.js                             # โมเดลโครงสร้างข้อมูลออเดอร์
│   │   ├── cashierModel.js                      # โมเดลจัดการข้อมูลแคชเชียร์/พนักงาน
│   │   ├── menuItemModel.js                     # โมเดลจัดการข้อมูลรายการเมนู
│   │   ├── orderModel.js                        # โมเดล Query ออเดอร์และตัวเลือกเสริม
│   │   └── reportModel.js                       # โมเดลดึงข้อมูลสถิติและรายงานยอดขาย
│   ├── routes/                                  # กำหนดเส้นทาง API (Endpoints)
│   │   ├── branchRoutes.js                      # API Endpoints สำหรับข้อมูลสาขา
│   │   ├── menuRoutes.js                        # API Endpoints สำหรับการจัดการเมนู
│   │   ├── orderRoutes.js                       # API Endpoints สำหรับการจัดการออเดอร์
│   │   └── reportRoutes.js                      # API Endpoints สำหรับรายงานยอดขายและใบเสร็จ
│   └── app.js                                   # ไฟล์หลักเริ่มต้น Express Server
├── .env                                         # ไฟล์กำหนดค่า Environment Variables Local
├── .env.example                                 # ไฟล์ตัวอย่างการตั้งค่า Environment Variables
├── package-lock.json                            # ไฟล์ล็อกเวอร์ชันของ Dependencies
├── package.json                                 # ไฟล์กำหนดข้อมูลโปรเจกต์และ Dependencies
└── wk07-schema.sql                              # ไฟล์ SQL Schema หลักสร้างโครงสร้างฐานข้อมูล
```
### 2.3 Process View (มุมมองการประมวลผลและการสื่อสาร)
แสดงลำดับขั้นตอนการสื่อสารแบบ Async HTTP REST API เมื่อเกิดกิจกรรมสั่งซื้อสินค้าในระบบ:

#### Flow การสั่งซื้อออเดอร์และการออกใบเสร็จ (Order Creation & Receipt Flow)

1. **Frontend (`public/index.html` & `index-ui.js`):**
   * แคชเชียร์เลือกเมนูและตัวเลือกเสริม (Customizations) แล้วกดสร้างออเดอร์
   * สคริปต์ JavaScript ส่งคำขอผ่าน `fetch()` เป็น HTTP Request แบบ `POST /api/orders` พร้อม Payload JSON

2. **Backend Express (`src/app.js` $\rightarrow$ `src/routes/orderRoutes.js`):**
   * Express Route ส่ง Request ไปยัง `orderController.js`

3. **Business Logic & Persistence (`src/controllers/orderController.js` & `src/models/orderModel.js`):**
   * `orderController` ตรวจสอบความถูกต้องของข้อมูลออเดอร์ คำนวณราคารวม
   * เรียก `orderModel` เพื่อทำ SQL Transaction บันทึกข้อมูลลงตารางออเดอร์และตารางตัวเลือกเสริม (`order_customizations`) ใน MySQL Database ผ่าน `src/config/db.js`

4. **Response & Receipt Rendering (`public/receipt.html` & `receipt-ui.js`):**
   * Backend ส่ง Response `201 Created` พร้อมรายละเอียด Order ID
   * Frontend Redirect ไปยังหน้า `receipt.html` สคริปต์ `receipt-ui.js` เรียก `GET /api/reports/receipt/:id` เพื่อนำข้อมูลมาจัดรูปแบบใบเสร็จรับเงินสำหรับแสดงผลและพิมพ์

---

### 2.4 Physical / Deployment View (มุมมองการติดตั้งอุปกรณ์)
แสดงสถาปัตยกรรมการติดตั้งใช้งานระบบ (Deployment Infrastructure):

* **Client Devices (POS Tablets / PCs หน้าร้าน):**
  * อุปกรณ์สำหรับแคชเชียร์ รันเว็บเบราว์เซอร์ (Chrome / Edge) เพื่อโหลดไฟล์ Frontend Static Assets จากโฟลเดอร์ `public/`
* **Application & Web Server (Node.js Host):**
  * **Runtime:** Node.js Execution Environment รันสคริปต์ `src/app.js`
  * **Framework:** Express.js ทำหน้าที่ให้บริการทั้ง Static Web Pages และ RESTful API Endpoints
* **Database Server (MySQL Server):**
  * จัดเก็บข้อมูลตารางตามโครงสร้างใน `wk07-schema.sql` และอัปเดตผ่าน `migrations/`
  * สื่อสารกับ Node.js ผ่านพอร์ต 3306

---

### 2.5 Scenarios View / Use Case View (+1 View)
ใช้ Scenario **"การสั่งซื้อเครื่องดื่มแบบปรับแต่งตัวเลือกเสริมและการเรียกดูใบเสร็จ"** เพื่อยืนยันความถูกต้องของสถาปัตยกรรม:

1. **Cashier** ทำรายการเลือกเครื่องดื่มพร้อมระบุการปรับแต่ง (เช่น ระดับความหวาน, เพิ่มช็อต) ผ่าน UI (`index.html`)
2. คำขอถูกส่งต่อไปประมวลผลที่ Backend ผ่าน API Route (`orderRoutes.js`)
3. `orderController.js` ประมวลผล Business Rules และเรียก `orderModel.js` บันทึกข้อมูลลงฐานข้อมูล MySQL
4. เมื่อบันทึกสำเร็จ ระบบนำทางไปยังหน้าใบเสร็จ (`receipt.html`) ซึ่งดึงข้อมูลจาก `reportRoutes.js` และ `reportController.js` เพื่อแสดงผลใบเสร็จรับเงินได้อย่างถูกต้อง

---

## 3. แผนภาพสถาปัตยกรรม (Architecture & Component Diagrams)

### 3.1 Architecture Diagram
<p align="center">
  <img src="./Architecture Diagram.png" alt="Architecture Diagram" width="200" />
</p>

### 3.2 Component Diagram
<p align="center">
  <img src="./Component Diagram.png" alt="Component Diagram" width="200" />
</p>

---

## 4. ข้อสรุปและการเชื่อมโยงกับ Repository จริง
การออกแบบสถาปัตยกรรมนี้ตรงตามโครงสร้างไฟล์ใน Repository จริงของโปรเจกต์ `cafe-pos-system` ทุกประการ โดยแบ่งแยกโค้ดตามหลัก Separation of Concerns (SoC) ด้วยสถาปัตยกรรม MVC ทำให้ง่ายต่อการพัฒนาต่อยอด การทดสอบระบบ และการบำรุงรักษาในอนาคต
