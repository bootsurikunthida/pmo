# Project Tracker — ทีมการตลาดดิจิทัล

Web App ติดตามงานแทน Excel ที่ส่งกันทาง LINE: มีฐานข้อมูลกลาง, Login แยกสิทธิ์,
Kanban Board, Dashboard สรุปรายคน/รายโปรเจกต์/งานที่ช้า และ Activity Log ว่าใครแก้อะไรเมื่อไร

**Stack:** SvelteKit 3 (SSR) · Svelte 5 · Tailwind v4 · shadcn-svelte · Drizzle ORM · SQLite (better-sqlite3) →
ภายหลังย้ายไป Cloudflare D1 + Pages/Workers

## รันบนเครื่อง

```bash
npm install
npm run db:seed        # สร้างตาราง (migrations) + นำเข้าข้อมูลจาก data/project_tracking_sample.xlsx
npm run dev            # http://localhost:5173
```

บัญชีทดสอบ (สร้างจาก seed):

| บัญชี | รหัสผ่าน | สิทธิ์ |
| --- | --- | --- |
| `admin` | `Admin1234` | Admin (ผู้ดูแลระบบ) |
| `vipa` | `Admin1234` | Admin (หัวหน้าทีม วิภา) |
| `napa`, `piya`, `thanaphon`, … (username = ส่วนหน้า @ ของอีเมลในชีตทีมงาน) | `Pass1234` | พนักงาน |

คำสั่งอื่น: `npm run db:seed -- --force` ล้างข้อมูลแล้วนำเข้าใหม่ · `npm run db:seed -- path/to/file.xlsx` นำเข้าไฟล์อื่น ·
`npm run db:studio` เปิด Drizzle Studio · `npm run check` ตรวจ type

> หมายเหตุ: ถ้าโฟลเดอร์โปรเจกต์อยู่ใต้ `AppData\Roaming` ของแอปที่ติดตั้งแบบ MSIX (เช่น scratch workspace ของ Claude)
> Windows จะ redirect path ทำให้ Vite/SvelteKit คำนวณ path ไม่ตรงกัน (403 / HMR พัง) — ให้ย้ายโปรเจกต์ไปโฟลเดอร์ปกติ เช่น `C:\Users\<you>\Desktop\project-tracker`

## สิทธิ์การใช้งาน

| ความสามารถ | Admin | พนักงาน |
| --- | --- | --- |
| ดู Dashboard / Board / งาน / โปรเจกต์ / Activity Log | ✓ | ✓ |
| สร้างงานใหม่ | ✓ | ✓ (ค่าเริ่มต้นมอบหมายให้ตัวเอง) |
| แก้ไขงาน | ทุกฟิลด์ ทุกงาน | เฉพาะงานของตัวเอง: สถานะ, % คืบหน้า, ชั่วโมงจริง, หมายเหตุ |
| ลากการ์ดบน Kanban | ทุกงาน | เฉพาะงานของตัวเอง |
| ลบงาน / จัดการโปรเจกต์ / จัดการพนักงาน | ✓ | — |
| เปลี่ยนรหัสผ่านตัวเอง | ✓ | ✓ |

## โครงสร้างโปรเจกต์

```
project-tracker/
├─ data/project_tracking_sample.xlsx   ไฟล์ Excel ต้นทาง (ใช้ seed)
├─ drizzle/0000_init.sql               migration SQL (ใช้กับ D1 ได้: wrangler d1 migrations apply)
├─ scripts/seed.ts                     อ่าน Excel -> users / projects / tasks
├─ src/
│  ├─ hooks.server.ts                  ตรวจ session cookie ทุก request -> locals.user
│  ├─ lib/
│  │  ├─ constants.ts                  enum สถานะ/ความสำคัญ/สิทธิ์ (ใช้ร่วม client+server)
│  │  ├─ labels.ts, dates.ts           ป้ายภาษาไทย, วันที่ พ.ศ., คำนวณ "เกินกำหนด/ใกล้ครบกำหนด"
│  │  ├─ components/                   StatusBadge, PriorityBadge, TimingBadge, TaskForm, ActivityItem, …
│  │  ├─ components/ui/                shadcn-svelte (button, card, dialog, table, …)
│  │  └─ server/
│  │     ├─ db/schema.ts               ตาราง users, sessions, projects, tasks, activity_logs
│  │     ├─ db/index.ts                เชื่อม SQLite (จุดที่สลับเป็น D1)
│  │     ├─ auth.ts, password.ts       session token (SHA-256) + PBKDF2 (Web Crypto — ใช้บน Workers ได้)
│  │     ├─ activity.ts                logActivity / diffChanges
│  │     └─ tasks.ts                   CRUD งาน + สิทธิ์ + สรุป Dashboard
│  └─ routes/
│     ├─ login, logout
│     └─ (app)/                        ต้อง login
│        ├─ +page              Dashboard (KPI, รายคน, รายโปรเจกต์, งานที่ช้า, งานของฉัน)
│        ├─ board              Kanban (ลาก-วาง / ปุ่ม ‹ ›, filter โปรเจกต์/คน/ของฉัน)
│        ├─ tasks, tasks/new, tasks/[id]   รายการ + ฟอร์ม + ประวัติการแก้ไขของงาน
│        ├─ projects, projects/[id]        การ์ดโปรเจกต์ + รายละเอียด
│        ├─ employees          Admin: เพิ่ม/แก้/ปิดใช้งาน/ลบ/รีเซ็ตรหัสผ่าน
│        ├─ activity           Activity Log ทั้งระบบ (กรองประเภท/การกระทำ/คน + แบ่งหน้า)
│        └─ account            เปลี่ยนรหัสผ่านตัวเอง
└─ vite.config.ts                      adapter-auto (dev) — เปลี่ยนเป็น adapter-cloudflare ตอน deploy
```

## การ map ข้อมูลจาก Excel

| ชีต / คอลัมน์ | ตาราง | หมายเหตุ |
| --- | --- | --- |
| ทีมงาน: ชื่อ, ตำแหน่ง, หน้าที่หลัก, อีเมล, วันเริ่มงาน, ระดับ | `users` | username = ส่วนหน้า @ ของอีเมล; ตำแหน่ง "หัวหน้าทีม" → role admin |
| งานทั้งหมด: ลูกค้า / โครงการ | `projects` | สร้างอัตโนมัติจากชื่อที่ไม่ซ้ำ (7 โปรเจกต์) |
| งานทั้งหมด: รหัสงาน…หมายเหตุ | `tasks` | สถานะ ยังไม่เริ่ม/กำลังดำเนินการ/รอตรวจ/เสร็จแล้ว/ระงับ → todo/doing/review/done/hold; ความสำคัญ สูง/กลาง/ต่ำ → high/medium/low |
| งานทั้งหมด: วันคงเหลือ, สถานะเวลา | — | เป็นสูตร ไม่นำเข้า คำนวณสดใน `dates.ts` (เกินกำหนด = ยังไม่เสร็จและเลยกำหนด, ใกล้ครบกำหนด ≤ 3 วัน) |
| ภาพรวม | — | เป็นค่าสรุป ไม่นำเข้า Dashboard คำนวณสดจากฐานข้อมูล |

## ย้ายไป Cloudflare D1 + Pages/Workers

1. `npm i -D wrangler` แล้วสร้าง D1: `wrangler d1 create project-tracker` และใส่ binding `DB` ใน `wrangler.toml`
2. apply migration: `wrangler d1 migrations apply project-tracker --remote` (ใช้ไฟล์ใน `drizzle/`)
3. แก้ `src/lib/server/db/index.ts` ให้ใช้ `drizzle-orm/d1` กับ `platform.env.DB` (schema และ query ทั้งหมดใช้ต่อได้)
4. เปลี่ยน adapter ใน `vite.config.ts` เป็น `@sveltejs/adapter-cloudflare` (ติดตั้งไว้แล้ว) แล้ว `npm run build`
5. นำเข้าข้อมูลเริ่มต้นด้วย `wrangler d1 execute --file` จาก SQL dump ของ `local.db` หรือปรับ `scripts/seed.ts` ให้สร้าง SQL
