/**
 * นำเข้าข้อมูลเริ่มต้นจากไฟล์ Excel (project_tracking_sample.xlsx)
 *
 *   npm run db:seed                     -> ใช้ data/project_tracking_sample.xlsx
 *   npm run db:seed -- path/to/file.xlsx
 *   npm run db:seed -- --force          -> ล้างข้อมูลเดิมแล้วนำเข้าใหม่
 *
 * ชีตที่อ่าน:
 *   "ทีมงาน"     -> users     (ลำดับ, ชื่อ, ตำแหน่ง, หน้าที่หลัก, อีเมล, วันเริ่มงาน, ระดับ)
 *   "งานทั้งหมด" -> projects + tasks (รหัสงาน, ลูกค้า/โครงการ, ชื่องาน, ผู้รับผิดชอบ, ความสำคัญ,
 *                   สถานะ, วันเริ่ม, กำหนดเสร็จ, ชั่วโมงประเมิน, ชั่วโมงจริง, % ความคืบหน้า, หมายเหตุ)
 *   "ภาพรวม"     -> ไม่นำเข้า (เป็นค่าที่คำนวณได้ — Dashboard คำนวณสดจากฐานข้อมูล)
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sql } from 'drizzle-orm';
import XLSX from 'xlsx';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from '../src/lib/server/db/schema';
import { hashPassword } from '../src/lib/server/password';
import type { TaskStatus, Priority } from '../src/lib/server/db/schema';

const args = process.argv.slice(2);
const force = args.includes('--force');
const fileArg = args.find((a) => !a.startsWith('--'));
const xlsxPath = path.resolve(fileArg ?? 'data/project_tracking_sample.xlsx');
const dbPath = process.env.DATABASE_URL || 'local.db';

const DEFAULT_PASSWORD = 'Pass1234';
const ADMIN_PASSWORD = 'Admin1234';

const STATUS_MAP: Record<string, TaskStatus> = {
	ยังไม่เริ่ม: 'todo',
	กำลังดำเนินการ: 'doing',
	รอตรวจ: 'review',
	เสร็จแล้ว: 'done',
	ระงับ: 'hold'
};
const PRIORITY_MAP: Record<string, Priority> = { สูง: 'high', กลาง: 'medium', ต่ำ: 'low' };

/** 29/10/2026 -> 2026-10-29 */
function parseDate(v: unknown): string | null {
	if (!v) return null;
	const s = String(v).trim();
	const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
	const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
	return null;
}
function num(v: unknown): number {
	const n = parseFloat(String(v ?? '').replace('%', '').replace(/,/g, ''));
	return isNaN(n) ? 0 : n;
}
function str(v: unknown): string {
	return String(v ?? '').trim();
}

/** หา header row (แถวที่มีคอลัมน์แรกตรงกับ key) แล้วคืน rows ถัดไปเป็น object */
function readSheet(wb: XLSX.WorkBook, name: string, firstHeader: string) {
	const ws = wb.Sheets[name];
	if (!ws) throw new Error(`ไม่พบชีต "${name}" ในไฟล์ ${xlsxPath}`);
	const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: '' });
	const hi = rows.findIndex((r) => str(r[0]) === firstHeader);
	if (hi < 0) throw new Error(`ไม่พบหัวตาราง "${firstHeader}" ในชีต "${name}"`);
	const headers = rows[hi].map(str);
	return rows
		.slice(hi + 1)
		.filter((r) => str(r[0]) !== '')
		.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

async function main() {
	if (!fs.existsSync(xlsxPath)) throw new Error(`ไม่พบไฟล์ Excel: ${xlsxPath}`);
	console.log(`DB: ${dbPath}`);
	console.log(`Excel: ${xlsxPath}`);

	const client = new Database(dbPath);
	client.pragma('journal_mode = WAL');
	client.pragma('foreign_keys = ON');
	const db = drizzle(client, { schema });

	migrate(db, { migrationsFolder: path.resolve('drizzle') });
	console.log('✓ migrations applied');

	const existing = db.select({ n: sql<number>`count(*)` }).from(schema.users).get();
	if (existing && existing.n > 0) {
		if (!force) {
			console.log(`ฐานข้อมูลมีผู้ใช้อยู่แล้ว ${existing.n} คน — ข้ามการ seed (ใช้ --force เพื่อล้างและนำเข้าใหม่)`);
			return;
		}
		console.log('--force: ล้างข้อมูลเดิม');
		db.delete(schema.activityLogs).run();
		db.delete(schema.sessions).run();
		db.delete(schema.tasks).run();
		db.delete(schema.projects).run();
		db.delete(schema.users).run();
	}

	const wb = XLSX.readFile(xlsxPath);
	const teamRows = readSheet(wb, 'ทีมงาน', 'ลำดับ');
	const taskRows = readSheet(wb, 'งานทั้งหมด', 'รหัสงาน');
	console.log(`อ่านได้: ทีมงาน ${teamRows.length} คน, งาน ${taskRows.length} รายการ`);

	// ---- users ----
	const adminHash = await hashPassword(ADMIN_PASSWORD);
	const memberHash = await hashPassword(DEFAULT_PASSWORD);

	const admin = db
		.insert(schema.users)
		.values({
			username: 'admin',
			passwordHash: adminHash,
			role: 'admin',
			name: 'ผู้ดูแลระบบ',
			position: 'System Admin',
			email: 'admin@example.com',
			level: 5
		})
		.returning()
		.get();

	const userByName = new Map<string, schema.User>();
	for (const r of teamRows) {
		const name = str(r['ชื่อ']);
		const email = str(r['อีเมล']);
		const position = str(r['ตำแหน่ง']);
		const username = (email.split('@')[0] || name).toLowerCase();
		const isLead = /หัวหน้า|team lead/i.test(position);
		const level = num(str(r['ระดับ']).replace(/[^\d.]/g, '')) || 1;
		const u = db
			.insert(schema.users)
			.values({
				username,
				passwordHash: isLead ? adminHash : memberHash,
				role: isLead ? 'admin' : 'member',
				name,
				position,
				duties: str(r['หน้าที่หลัก']),
				email,
				level,
				startDate: parseDate(r['วันเริ่มงาน'])
			})
			.returning()
			.get();
		userByName.set(name, u);
	}
	console.log(`✓ users: ${userByName.size + 1}`);

	// ---- projects ----
	const projectByName = new Map<string, schema.Project>();
	for (const r of taskRows) {
		const pname = str(r['ลูกค้า / โครงการ']);
		if (!pname || projectByName.has(pname)) continue;
		const p = db.insert(schema.projects).values({ name: pname }).returning().get();
		projectByName.set(pname, p);
	}
	console.log(`✓ projects: ${projectByName.size}`);

	// ---- tasks ----
	let order = 0;
	const inserted: schema.Task[] = [];
	for (const r of taskRows) {
		const pname = str(r['ลูกค้า / โครงการ']);
		const assigneeName = str(r['ผู้รับผิดชอบ']);
		const assignee = userByName.get(assigneeName);
		if (assigneeName && !assignee) console.warn(`  ! ไม่พบผู้รับผิดชอบ "${assigneeName}" (${str(r['รหัสงาน'])})`);
		const status = STATUS_MAP[str(r['สถานะ'])] ?? 'todo';
		const t = db
			.insert(schema.tasks)
			.values({
				code: str(r['รหัสงาน']),
				projectId: projectByName.get(pname)!.id,
				title: str(r['ชื่องาน']),
				assigneeId: assignee?.id ?? null,
				priority: PRIORITY_MAP[str(r['ความสำคัญ'])] ?? 'medium',
				status,
				startDate: parseDate(r['วันเริ่ม']),
				dueDate: parseDate(r['กำหนดเสร็จ']),
				estimateHours: num(r['ชั่วโมงประเมิน']),
				actualHours: num(r['ชั่วโมงจริง']),
				progress: Math.round(num(r['% ความคืบหน้า'])),
				notes: str(r['หมายเหตุ']),
				sortOrder: order++
			})
			.returning()
			.get();
		inserted.push(t);
	}
	console.log(`✓ tasks: ${inserted.length}`);

	// ---- activity log ----
	db.insert(schema.activityLogs)
		.values({
			actorId: admin.id,
			actorName: admin.name,
			action: 'import',
			entityType: 'system',
			entityLabel: path.basename(xlsxPath),
			changes: JSON.stringify({
				users: { from: 0, to: userByName.size },
				projects: { from: 0, to: projectByName.size },
				tasks: { from: 0, to: inserted.length }
			})
		})
		.run();

	console.log('\nบัญชีสำหรับทดสอบ:');
	console.log(`  admin  / ${ADMIN_PASSWORD}   (ผู้ดูแลระบบ)`);
	const lead = [...userByName.values()].find((u) => u.role === 'admin');
	if (lead) console.log(`  ${lead.username.padEnd(6)} / ${ADMIN_PASSWORD}   (${lead.name} — หัวหน้าทีม)`);
	console.log(`  <username> / ${DEFAULT_PASSWORD}   (พนักงานทุกคน เช่น napa, piya, thanaphon)`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
