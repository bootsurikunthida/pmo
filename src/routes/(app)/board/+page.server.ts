import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { TASK_STATUSES, type TaskStatus } from '#lib/server/db/schema.js';
import { canEditTask, getTask, listTasks, updateTask } from '#lib/server/tasks.js';
import { todayISO } from '#lib/dates.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const projectId = Number(url.searchParams.get('project')) || undefined;
	const mine = url.searchParams.get('mine') === '1';
	const assigneeId = mine ? locals.user!.id : Number(url.searchParams.get('assignee')) || undefined;

	const [tasks, users, projects] = await Promise.all([
		listTasks({ projectId, assigneeId }),
		db
			.select({ id: schema.users.id, name: schema.users.name })
			.from(schema.users)
			.where(eq(schema.users.active, true))
			.orderBy(asc(schema.users.id)),
		db
			.select({ id: schema.projects.id, name: schema.projects.name })
			.from(schema.projects)
			.where(eq(schema.projects.archived, false))
			.orderBy(asc(schema.projects.id))
	]);

	return { tasks, users, projects, filter: { projectId, assigneeId, mine }, today: todayISO() };
};

export const actions: Actions = {
	move: async ({ request, locals }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const status = String(form.get('status')) as TaskStatus;
		if (!id || !TASK_STATUSES.includes(status)) return fail(400, { message: 'ข้อมูลไม่ถูกต้อง' });

		const task = await getTask(id);
		if (!task) return fail(404, { message: 'ไม่พบงาน' });
		if (!canEditTask(locals.user!, task)) {
			return fail(403, { message: 'คุณแก้ไขได้เฉพาะงานที่ตัวเองรับผิดชอบ' });
		}
		await updateTask(locals.user!, id, { status });
		return { ok: true };
	}
};
