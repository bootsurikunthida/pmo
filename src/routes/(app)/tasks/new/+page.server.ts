import { fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { createTask, nextTaskCode, parseTaskForm } from '#lib/server/tasks.js';

async function options() {
	const [users, projects] = await Promise.all([
		db
			.select({ id: schema.users.id, name: schema.users.name, position: schema.users.position })
			.from(schema.users)
			.where(eq(schema.users.active, true))
			.orderBy(asc(schema.users.id)),
		db
			.select({ id: schema.projects.id, name: schema.projects.name })
			.from(schema.projects)
			.where(eq(schema.projects.archived, false))
			.orderBy(asc(schema.projects.id))
	]);
	return { users, projects };
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { users, projects } = await options();
	const code = await nextTaskCode();
	const projectId = Number(url.searchParams.get('project')) || undefined;
	return {
		users,
		projects,
		draft: {
			code,
			projectId,
			assigneeId: locals.user!.role === 'member' ? locals.user!.id : null,
			status: 'todo',
			priority: 'medium',
			progress: 0,
			estimateHours: 0,
			actualHours: 0
		}
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const { data, errors } = parseTaskForm(form);
		if (Object.keys(errors).length) {
			return fail(400, { errors, values: Object.fromEntries(form) as Record<string, string> });
		}
		if (data.code) {
			const [dup] = await db.select({ id: schema.tasks.id }).from(schema.tasks).where(eq(schema.tasks.code, data.code));
			if (dup) return fail(400, { errors: { code: 'รหัสงานนี้มีอยู่แล้ว' }, values: Object.fromEntries(form) as Record<string, string> });
		}
		const task = await createTask(locals.user!, data);
		redirect(303, `/tasks/${task.id}`);
	}
};
