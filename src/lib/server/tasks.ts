import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db, schema } from './db';
import { diffChanges, logActivity } from './activity';
import type { SessionUser } from './auth';
import { TASK_STATUSES, PRIORITIES, type Task, type TaskStatus, type Priority } from './db/schema';
import { taskTiming, todayISO } from '#lib/dates.js';

export interface TaskRow extends Task {
	projectName: string;
	assigneeName: string | null;
}

export async function listTasks(filter: {
	projectId?: number;
	assigneeId?: number;
	status?: TaskStatus;
} = {}): Promise<TaskRow[]> {
	const conds = [];
	if (filter.projectId) conds.push(eq(schema.tasks.projectId, filter.projectId));
	if (filter.assigneeId) conds.push(eq(schema.tasks.assigneeId, filter.assigneeId));
	if (filter.status) conds.push(eq(schema.tasks.status, filter.status));

	const rows = await db
		.select({
			task: schema.tasks,
			projectName: schema.projects.name,
			assigneeName: schema.users.name
		})
		.from(schema.tasks)
		.innerJoin(schema.projects, eq(schema.tasks.projectId, schema.projects.id))
		.leftJoin(schema.users, eq(schema.tasks.assigneeId, schema.users.id))
		.where(conds.length ? and(...conds) : undefined)
		.orderBy(asc(schema.tasks.sortOrder), asc(schema.tasks.id));

	return rows.map((r) => ({ ...r.task, projectName: r.projectName, assigneeName: r.assigneeName }));
}

export async function getTask(id: number): Promise<TaskRow | null> {
	const [r] = await db
		.select({
			task: schema.tasks,
			projectName: schema.projects.name,
			assigneeName: schema.users.name
		})
		.from(schema.tasks)
		.innerJoin(schema.projects, eq(schema.tasks.projectId, schema.projects.id))
		.leftJoin(schema.users, eq(schema.tasks.assigneeId, schema.users.id))
		.where(eq(schema.tasks.id, id));
	if (!r) return null;
	return { ...r.task, projectName: r.projectName, assigneeName: r.assigneeName };
}

/** รหัสงานถัดไป เช่น T-047 */
export async function nextTaskCode(): Promise<string> {
	const [row] = await db
		.select({ code: schema.tasks.code })
		.from(schema.tasks)
		.orderBy(desc(schema.tasks.id))
		.limit(1);
	const n = row ? parseInt(row.code.replace(/\D/g, ''), 10) || 0 : 0;
	return `T-${String(n + 1).padStart(3, '0')}`;
}

export function canEditTask(user: SessionUser, task: Pick<Task, 'assigneeId'>): boolean {
	return user.role === 'admin' || task.assigneeId === user.id;
}

export function canDeleteTask(user: SessionUser): boolean {
	return user.role === 'admin';
}

export interface TaskInput {
	code?: string;
	projectId: number;
	title: string;
	assigneeId: number | null;
	priority: Priority;
	status: TaskStatus;
	startDate: string | null;
	dueDate: string | null;
	estimateHours: number;
	actualHours: number;
	progress: number;
	notes: string;
}

export function parseTaskForm(form: FormData): { data: TaskInput; errors: Record<string, string> } {
	const errors: Record<string, string> = {};
	const title = String(form.get('title') ?? '').trim();
	if (!title) errors.title = 'กรุณากรอกชื่องาน';
	const projectId = Number(form.get('projectId'));
	if (!projectId) errors.projectId = 'กรุณาเลือกโปรเจกต์';
	const assigneeRaw = String(form.get('assigneeId') ?? '');
	const assigneeId = assigneeRaw ? Number(assigneeRaw) : null;
	const priority = String(form.get('priority') ?? 'medium') as Priority;
	if (!PRIORITIES.includes(priority)) errors.priority = 'ความสำคัญไม่ถูกต้อง';
	const status = String(form.get('status') ?? 'todo') as TaskStatus;
	if (!TASK_STATUSES.includes(status)) errors.status = 'สถานะไม่ถูกต้อง';
	const startDate = String(form.get('startDate') ?? '').trim() || null;
	const dueDate = String(form.get('dueDate') ?? '').trim() || null;
	if (startDate && dueDate && dueDate < startDate) errors.dueDate = 'กำหนดเสร็จต้องไม่ก่อนวันเริ่ม';
	const estimateHours = Number(form.get('estimateHours') ?? 0) || 0;
	const actualHours = Number(form.get('actualHours') ?? 0) || 0;
	let progress = Math.round(Number(form.get('progress') ?? 0) || 0);
	progress = Math.min(100, Math.max(0, progress));
	const notes = String(form.get('notes') ?? '').trim();
	const code = String(form.get('code') ?? '').trim() || undefined;

	return {
		data: {
			code,
			projectId,
			title,
			assigneeId,
			priority,
			status,
			startDate,
			dueDate,
			estimateHours,
			actualHours,
			progress,
			notes
		},
		errors
	};
}

const TRACKED_FIELDS: (keyof Task)[] = [
	'title',
	'projectId',
	'assigneeId',
	'priority',
	'status',
	'startDate',
	'dueDate',
	'estimateHours',
	'actualHours',
	'progress',
	'notes'
];

async function nameLookup(input: Partial<Task>, before?: Task) {
	// แปลง id -> ชื่อ เพื่อให้ log อ่านง่าย
	const out: Record<string, { from: unknown; to: unknown }> = {};
	const projIds = [before?.projectId, input.projectId].filter((x): x is number => !!x);
	const userIds = [before?.assigneeId, input.assigneeId].filter((x): x is number => !!x);
	const projects = projIds.length
		? await db.select().from(schema.projects).where(sql`${schema.projects.id} in ${projIds}`)
		: [];
	const users = userIds.length
		? await db.select().from(schema.users).where(sql`${schema.users.id} in ${userIds}`)
		: [];
	const pName = (id: number | null | undefined) => projects.find((p) => p.id === id)?.name ?? '—';
	const uName = (id: number | null | undefined) => users.find((u) => u.id === id)?.name ?? '—';
	return { out, pName, uName };
}

export async function createTask(actor: SessionUser, input: TaskInput): Promise<Task> {
	const code = input.code ?? (await nextTaskCode());
	const [maxOrder] = await db
		.select({ m: sql<number>`coalesce(max(${schema.tasks.sortOrder}), 0)` })
		.from(schema.tasks);
	const [task] = await db
		.insert(schema.tasks)
		.values({ ...input, code, sortOrder: (maxOrder?.m ?? 0) + 1 })
		.returning();

	const { pName, uName } = await nameLookup(input);
	await logActivity({
		actor: { id: actor.id, name: actor.name },
		action: 'create',
		entityType: 'task',
		entityId: task.id,
		entityLabel: `${task.code} ${task.title}`,
		changes: {
			project: { from: '', to: pName(input.projectId) },
			assignee: { from: '', to: uName(input.assigneeId) },
			status: { from: '', to: input.status },
			dueDate: { from: '', to: input.dueDate }
		}
	});
	return task;
}

export async function updateTask(
	actor: SessionUser,
	id: number,
	input: Partial<TaskInput>
): Promise<Task | null> {
	const [before] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
	if (!before) return null;

	const changes = diffChanges(before as unknown as Record<string, unknown>, input, TRACKED_FIELDS);
	if (Object.keys(changes).length === 0) return before;

	// ถ้าเปลี่ยนเป็น done ให้ progress = 100 อัตโนมัติ (ถ้าไม่ได้ระบุ)
	const patch: Partial<Task> = { ...input };
	if (input.status === 'done' && input.progress === undefined && before.progress < 100) {
		patch.progress = 100;
		changes.progress = { from: before.progress, to: 100 };
	}

	const [after] = await db
		.update(schema.tasks)
		.set({ ...patch, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))` })
		.where(eq(schema.tasks.id, id))
		.returning();

	// แปลง id เป็นชื่อสำหรับ log
	const { pName, uName } = await nameLookup(input, before);
	if (changes.projectId) {
		changes.project = { from: pName(before.projectId), to: pName(input.projectId) };
		delete changes.projectId;
	}
	if (changes.assigneeId) {
		changes.assignee = { from: uName(before.assigneeId), to: uName(input.assigneeId ?? null) };
		delete changes.assigneeId;
	}

	const onlyStatus = Object.keys(changes).every((k) => k === 'status' || k === 'progress');
	await logActivity({
		actor: { id: actor.id, name: actor.name },
		action: changes.status && onlyStatus ? 'status_change' : 'update',
		entityType: 'task',
		entityId: id,
		entityLabel: `${after.code} ${after.title}`,
		changes
	});
	return after;
}

export async function deleteTask(actor: SessionUser, id: number): Promise<boolean> {
	const [before] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
	if (!before) return false;
	await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
	await logActivity({
		actor: { id: actor.id, name: actor.name },
		action: 'delete',
		entityType: 'task',
		entityId: id,
		entityLabel: `${before.code} ${before.title}`,
		changes: { status: { from: before.status, to: '' } }
	});
	return true;
}

// ---------- Dashboard aggregates ----------

export interface PersonSummary {
	userId: number;
	name: string;
	position: string;
	total: number;
	todo: number;
	doing: number;
	review: number;
	done: number;
	hold: number;
	overdue: number;
	dueSoon: number;
	estimateHours: number;
	actualHours: number;
	donePct: number;
}

export interface ProjectSummary {
	projectId: number;
	name: string;
	total: number;
	todo: number;
	doing: number;
	review: number;
	done: number;
	hold: number;
	overdue: number;
	estimateHours: number;
	actualHours: number;
	donePct: number;
	avgProgress: number;
}

export function summarize(tasks: TaskRow[], users: { id: number; name: string; position: string }[], projects: { id: number; name: string }[]) {
	const today = todayISO();
	const withTiming = tasks.map((t) => ({ ...t, timing: taskTiming(t, today) }));

	const total = tasks.length;
	const done = tasks.filter((t) => t.status === 'done').length;
	const overdue = withTiming.filter((t) => t.timing.status === 'overdue').length;
	const dueSoon = withTiming.filter((t) => t.timing.status === 'due_soon').length;
	const estimateHours = tasks.reduce((s, t) => s + t.estimateHours, 0);
	const actualHours = tasks.reduce((s, t) => s + t.actualHours, 0);

	const byPerson: PersonSummary[] = users.map((u) => {
		const mine = withTiming.filter((t) => t.assigneeId === u.id);
		const d = mine.filter((t) => t.status === 'done').length;
		return {
			userId: u.id,
			name: u.name,
			position: u.position,
			total: mine.length,
			todo: mine.filter((t) => t.status === 'todo').length,
			doing: mine.filter((t) => t.status === 'doing').length,
			review: mine.filter((t) => t.status === 'review').length,
			done: d,
			hold: mine.filter((t) => t.status === 'hold').length,
			overdue: mine.filter((t) => t.timing.status === 'overdue').length,
			dueSoon: mine.filter((t) => t.timing.status === 'due_soon').length,
			estimateHours: mine.reduce((s, t) => s + t.estimateHours, 0),
			actualHours: mine.reduce((s, t) => s + t.actualHours, 0),
			donePct: mine.length ? Math.round((d / mine.length) * 100) : 0
		};
	});

	const byProject: ProjectSummary[] = projects.map((p) => {
		const mine = withTiming.filter((t) => t.projectId === p.id);
		const d = mine.filter((t) => t.status === 'done').length;
		return {
			projectId: p.id,
			name: p.name,
			total: mine.length,
			todo: mine.filter((t) => t.status === 'todo').length,
			doing: mine.filter((t) => t.status === 'doing').length,
			review: mine.filter((t) => t.status === 'review').length,
			done: d,
			hold: mine.filter((t) => t.status === 'hold').length,
			overdue: mine.filter((t) => t.timing.status === 'overdue').length,
			estimateHours: mine.reduce((s, t) => s + t.estimateHours, 0),
			actualHours: mine.reduce((s, t) => s + t.actualHours, 0),
			donePct: mine.length ? Math.round((d / mine.length) * 100) : 0,
			avgProgress: mine.length ? Math.round(mine.reduce((s, t) => s + t.progress, 0) / mine.length) : 0
		};
	});

	const overdueTasks = withTiming
		.filter((t) => t.timing.status === 'overdue')
		.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
	const dueSoonTasks = withTiming
		.filter((t) => t.timing.status === 'due_soon')
		.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

	return {
		today,
		kpi: {
			total,
			done,
			donePct: total ? Math.round((done / total) * 100) : 0,
			overdue,
			dueSoon,
			estimateHours,
			actualHours,
			inProgress: tasks.filter((t) => t.status === 'doing').length,
			review: tasks.filter((t) => t.status === 'review').length
		},
		byPerson,
		byProject,
		overdueTasks,
		dueSoonTasks
	};
}
