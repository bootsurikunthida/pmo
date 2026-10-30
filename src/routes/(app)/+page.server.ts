import { desc, eq, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { listTasks, summarize } from '#lib/server/tasks.js';

export const load: PageServerLoad = async ({ locals }) => {
	const [tasks, users, projects, recent] = await Promise.all([
		listTasks(),
		db
			.select({
				id: schema.users.id,
				username: schema.users.username,
				name: schema.users.name,
				position: schema.users.position
			})
			.from(schema.users)
			.where(eq(schema.users.active, true))
			.orderBy(asc(schema.users.id)),
		db
			.select({ id: schema.projects.id, name: schema.projects.name })
			.from(schema.projects)
			.where(eq(schema.projects.archived, false))
			.orderBy(asc(schema.projects.id)),
		db.select().from(schema.activityLogs).orderBy(desc(schema.activityLogs.id)).limit(8)
	]);

	// ไม่นับบัญชี admin ระบบที่ไม่มีงาน ในตารางรายคน
	const people = users.filter((u) => u.username !== 'admin' || tasks.some((t) => t.assigneeId === u.id));
	const summary = summarize(tasks, people, projects);
	const myTasks = tasks.filter((t) => t.assigneeId === locals.user!.id && t.status !== 'done');

	return { summary, recent, myTasks };
};
