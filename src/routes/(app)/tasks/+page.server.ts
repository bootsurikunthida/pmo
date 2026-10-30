import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { TASK_STATUSES, type TaskStatus } from '#lib/server/db/schema.js';
import { listTasks } from '#lib/server/tasks.js';
import { taskTiming, todayISO } from '#lib/dates.js';

export const load: PageServerLoad = async ({ url }) => {
	const projectId = Number(url.searchParams.get('project')) || undefined;
	const assigneeId = Number(url.searchParams.get('assignee')) || undefined;
	const statusRaw = url.searchParams.get('status') ?? '';
	const status = TASK_STATUSES.includes(statusRaw as TaskStatus) ? (statusRaw as TaskStatus) : undefined;
	const late = url.searchParams.get('late') === '1';
	const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();

	const today = todayISO();
	let tasks = await listTasks({ projectId, assigneeId, status });
	if (late) tasks = tasks.filter((t) => ['overdue', 'due_soon'].includes(taskTiming(t, today).status));
	if (q)
		tasks = tasks.filter(
			(t) =>
				t.title.toLowerCase().includes(q) ||
				t.code.toLowerCase().includes(q) ||
				t.notes.toLowerCase().includes(q)
		);

	const [users, projects] = await Promise.all([
		db
			.select({ id: schema.users.id, name: schema.users.name })
			.from(schema.users)
			.where(eq(schema.users.active, true))
			.orderBy(asc(schema.users.id)),
		db
			.select({ id: schema.projects.id, name: schema.projects.name })
			.from(schema.projects)
			.orderBy(asc(schema.projects.id))
	]);

	return { tasks, users, projects, today, filter: { projectId, assigneeId, status, late, q } };
};
