/** วันที่ในระบบเก็บเป็น YYYY-MM-DD (string) เพื่อให้เทียบง่ายทั้งใน SQLite และ JS */

export function todayISO(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/** จำนวนวันจาก a ถึง b (b - a) */
export function daysBetween(a: string, b: string): number {
	const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
	const dbb = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
	return Math.round((dbb - da) / 86_400_000);
}

const TH_MONTHS = [
	'ม.ค.',
	'ก.พ.',
	'มี.ค.',
	'เม.ย.',
	'พ.ค.',
	'มิ.ย.',
	'ก.ค.',
	'ส.ค.',
	'ก.ย.',
	'ต.ค.',
	'พ.ย.',
	'ธ.ค.'
];

/** 2026-10-29 -> 29 ต.ค. 2569 */
export function fmtDate(iso: string | null | undefined, withYear = true): string {
	if (!iso) return '—';
	const y = +iso.slice(0, 4);
	const m = +iso.slice(5, 7);
	const d = +iso.slice(8, 10);
	return withYear ? `${d} ${TH_MONTHS[m - 1]} ${y + 543}` : `${d} ${TH_MONTHS[m - 1]}`;
}

/** ISO timestamp -> 29 ต.ค. 2569 14:05 */
export function fmtDateTime(ts: string | null | undefined): string {
	if (!ts) return '—';
	const d = new Date(ts);
	if (isNaN(d.getTime())) return ts;
	const y = d.getFullYear() + 543;
	const hh = String(d.getHours()).padStart(2, '0');
	const mm = String(d.getMinutes()).padStart(2, '0');
	return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${y} ${hh}:${mm}`;
}

/** เวลาผ่านมาแล้วแบบสั้น ๆ */
export function timeAgo(ts: string): string {
	const diff = Date.now() - new Date(ts).getTime();
	const m = Math.floor(diff / 60_000);
	if (m < 1) return 'เมื่อสักครู่';
	if (m < 60) return `${m} นาทีที่แล้ว`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h} ชม. ที่แล้ว`;
	const d = Math.floor(h / 24);
	if (d < 30) return `${d} วันที่แล้ว`;
	return fmtDateTime(ts);
}

export type TimeStatus = 'overdue' | 'due_soon' | 'normal' | 'done';

export interface Timing {
	status: TimeStatus;
	daysLeft: number | null;
	label: string;
}

/** คำนวณ "วันคงเหลือ" และ "สถานะเวลา" เหมือนสูตรคอลัมน์ L/M ใน Excel */
export function taskTiming(
	task: { status: string; dueDate: string | null },
	today = todayISO()
): Timing {
	if (task.status === 'done') return { status: 'done', daysLeft: null, label: 'เสร็จแล้ว' };
	if (!task.dueDate) return { status: 'normal', daysLeft: null, label: 'ไม่มีกำหนด' };
	const left = daysBetween(today, task.dueDate);
	if (left < 0) return { status: 'overdue', daysLeft: left, label: `เกินกำหนด ${-left} วัน` };
	if (left <= 3) return { status: 'due_soon', daysLeft: left, label: `ใกล้ครบกำหนด (${left} วัน)` };
	return { status: 'normal', daysLeft: left, label: `เหลือ ${left} วัน` };
}
