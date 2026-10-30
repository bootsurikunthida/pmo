/** ค่าคงที่ที่ใช้ร่วมกันทั้ง server และ client (ไม่มีข้อมูลลับ) */

export const ROLES = ['admin', 'member'] as const;
export type Role = (typeof ROLES)[number];

export const TASK_STATUSES = ['todo', 'doing', 'review', 'done', 'hold'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ['high', 'medium', 'low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ACTIVITY_ACTIONS = [
	'create',
	'update',
	'delete',
	'status_change',
	'login',
	'logout',
	'import'
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ENTITY_TYPES = ['task', 'project', 'user', 'system'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];
