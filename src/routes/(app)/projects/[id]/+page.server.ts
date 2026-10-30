import { error } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { listTasks, summarize } from '#lib/server/tasks.js';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
	if (!project) error(404, 'ไม่พบโปรเจกต์');

	const [tasks, users, history] = await Promise.all([
		listTasks({ projectId: id }),
		db
			.select({ id: schema.users.id, name: schema.users.name, position: schema.users.position })
			.from(schema.users)
			.where(eq(schema.users.active, true))
			.orderBy(asc(schema.users.id)),
		db
			.select()
			.from(schema.activityLogs)
			.where(and(eq(schema.activityLogs.entityType, 'project'), eq(schema.activityLogs.entityId, id)))
			.orderBy(desc(schema.activityLogs.id))
			.limit(20)
	]);
	const people = users.filter((u) => tasks.some((t) => t.assigneeId === u.id));
	const summary = summarize(tasks, people, [project]);
	return { project, tasks, summary, history };
};
