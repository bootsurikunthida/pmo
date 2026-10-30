import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { canDeleteTask, canEditTask, deleteTask, getTask, parseTaskForm, updateTask } from '#lib/server/tasks.js';
import { todayISO } from '#lib/dates.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	const task = await getTask(id);
	if (!task) error(404, 'ไม่พบงาน');

	const [users, projects, history] = await Promise.all([
		db
			.select({ id: schema.users.id, name: schema.users.name, position: schema.users.position })
			.from(schema.users)
			.where(eq(schema.users.active, true))
			.orderBy(asc(schema.users.id)),
		db.select({ id: schema.projects.id, name: schema.projects.name }).from(schema.projects).orderBy(asc(schema.projects.id)),
		db
			.select()
			.from(schema.activityLogs)
			.where(and(eq(schema.activityLogs.entityType, 'task'), eq(schema.activityLogs.entityId, id)))
			.orderBy(desc(schema.activityLogs.id))
	]);

	return {
		task,
		users,
		projects,
		history,
		today: todayISO(),
		canEdit: canEditTask(locals.user!, task),
		canDelete: canDeleteTask(locals.user!)
	};
};

export const actions: Actions = {
	update: async ({ params, request, locals }) => {
		const id = Number(params.id);
		const existing = await getTask(id);
		if (!existing) error(404);
		if (!canEditTask(locals.user!, existing)) return fail(403, { message: 'คุณแก้ไขได้เฉพาะงานที่ตัวเองรับผิดชอบ' });

		const form = await request.formData();
		const { data, errors } = parseTaskForm(form);
		if (Object.keys(errors).length) return fail(400, { errors });

		// พนักงานทั่วไป: แก้ได้เฉพาะ status / progress / actualHours / notes
		const patch =
			locals.user!.role === 'admin'
				? data
				: { status: data.status, progress: data.progress, actualHours: data.actualHours, notes: data.notes };

		await updateTask(locals.user!, id, patch);
		return { saved: true };
	},

	delete: async ({ params, locals }) => {
		if (!canDeleteTask(locals.user!)) return fail(403, { message: 'เฉพาะ Admin เท่านั้นที่ลบงานได้' });
		await deleteTask(locals.user!, Number(params.id));
		redirect(303, '/tasks');
	}
};
