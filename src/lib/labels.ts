import type { TaskStatus, Priority, Role, ActivityAction, EntityType } from './constants';

export const STATUS_LABELS: Record<TaskStatus, string> = {
	todo: 'To do',
	doing: 'Doing',
	review: 'รอตรวจ',
	done: 'Done',
	hold: 'ระงับ'
};

export const STATUS_TH: Record<TaskStatus, string> = {
	todo: 'ยังไม่เริ่ม',
	doing: 'กำลังดำเนินการ',
	review: 'รอตรวจ',
	done: 'เสร็จแล้ว',
	hold: 'ระงับ'
};

export const STATUS_ORDER: TaskStatus[] = ['todo', 'doing', 'review', 'done', 'hold'];

export const PRIORITY_LABELS: Record<Priority, string> = {
	high: 'สูง',
	medium: 'กลาง',
	low: 'ต่ำ'
};

export const ROLE_LABELS: Record<Role, string> = {
	admin: 'Admin / หัวหน้า',
	member: 'พนักงาน'
};

export const ACTION_LABELS: Record<ActivityAction, string> = {
	create: 'สร้าง',
	update: 'แก้ไข',
	delete: 'ลบ',
	status_change: 'เปลี่ยนสถานะ',
	login: 'เข้าสู่ระบบ',
	logout: 'ออกจากระบบ',
	import: 'นำเข้าข้อมูล'
};

export const ENTITY_LABELS: Record<EntityType, string> = {
	task: 'งาน',
	project: 'โปรเจกต์',
	user: 'พนักงาน',
	system: 'ระบบ'
};

export const FIELD_LABELS: Record<string, string> = {
	title: 'ชื่องาน',
	code: 'รหัสงาน',
	projectId: 'โปรเจกต์',
	project: 'โปรเจกต์',
	assigneeId: 'ผู้รับผิดชอบ',
	assignee: 'ผู้รับผิดชอบ',
	priority: 'ความสำคัญ',
	status: 'สถานะ',
	startDate: 'วันเริ่ม',
	dueDate: 'กำหนดเสร็จ',
	estimateHours: 'ชั่วโมงประเมิน',
	actualHours: 'ชั่วโมงจริง',
	progress: '% ความคืบหน้า',
	notes: 'หมายเหตุ',
	name: 'ชื่อ',
	username: 'Username',
	email: 'อีเมล',
	position: 'ตำแหน่ง',
	duties: 'หน้าที่หลัก',
	level: 'ระดับ',
	role: 'สิทธิ์',
	active: 'สถานะใช้งาน',
	startDateUser: 'วันเริ่มงาน',
	description: 'รายละเอียด',
	archived: 'เก็บถาวร',
	password: 'รหัสผ่าน'
};

export function fieldLabel(f: string) {
	return FIELD_LABELS[f] ?? f;
}

/** แปลงค่าของ field ให้อ่านง่ายใน Activity log */
export function formatValue(field: string, v: unknown): string {
	if (v === null || v === undefined || v === '') return '—';
	if (field === 'status' && typeof v === 'string' && v in STATUS_LABELS)
		return STATUS_LABELS[v as TaskStatus];
	if (field === 'priority' && typeof v === 'string' && v in PRIORITY_LABELS)
		return PRIORITY_LABELS[v as Priority];
	if (field === 'role' && typeof v === 'string' && v in ROLE_LABELS)
		return ROLE_LABELS[v as Role];
	if (field === 'active') return v === true || v === 'true' || v === 1 ? 'ใช้งาน' : 'ปิดใช้งาน';
	if (field === 'progress') return `${v}%`;
	return String(v);
}
