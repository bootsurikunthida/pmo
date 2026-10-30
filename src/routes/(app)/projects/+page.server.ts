import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { listTasks, summarize } from '#lib/server/tasks.js';
import { diffChanges, logActivity } from '#lib/server/activity.js';

export const load: PageServerLoad = async () => {
	const [projects, tasks] = await Promise.all([
		db.select().from(schema.projects).orderBy(asc(schema.projects.archived), asc(schema.projects.id)),
		listTasks()
	]);
	const { byProject, today } = summarize(tasks, [], projects);
	return {
		today,
		projects: projects.map((p) => ({ ...p, stats: byProject.find((b) => b.projectId === p.id)! }))
	};
};

function requireAdmin(locals: App.Locals) {
	if (locals.user?.role !== 'admin') return fail(403, { message: 'เฉพาะ Admin เท่านั้น' });
	return null;
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const denied = requireAdmin(locals);
		if (denied) return denied;
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		if (!name) return fail(400, { message: 'กรุณากรอกชื่อโปรเจกต์' });
		const [dup] = await db.select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.name, name));
		if (dup) return fail(400, { message: 'มีโปรเจกต์ชื่อนี้อยู่แล้ว' });
		const [p] = await db.insert(schema.projects).values({ name, description }).returning();
		await logActivity({
			actor: { id: locals.user!.id, name: locals.user!.name },
			action: 'create',
			entityType: 'project',
			entityId: p.id,
			entityLabel: p.name,
			changes: { name: { from: '', to: name }, description: { from: '', to: description } }
		});
		return { ok: true };
	},

	update: async ({ request, locals }) => {
		const denied = requireAdmin(locals);
		if (denied) return denied;
		const form = await request.formData();
		const id = Number(form.get('id'));
		const name = String(form.get('name') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const archived = form.get('archived') === 'on';
		if (!id || !name) return fail(400, { message: 'ข้อมูลไม่ครบ' });
		const [before] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
		if (!before) return fail(404, { message: 'ไม่พบโปรเจกต์' });
		const patch = { name, description, archived };
		const changes = diffChanges(before as unknown as Record<string, unknown>, patch, ['name', 'description', 'archived']);
		if (Object.keys(changes).length) {
			await db.update(schema.projects).set(patch).where(eq(schema.projects.id, id));
			await logActivity({
				actor: { id: locals.user!.id, name: locals.user!.name },
				action: 'update',
				entityType: 'project',
				entityId: id,
				entityLabel: name,
				changes
			});
		}
		return { ok: true };
	}
};
