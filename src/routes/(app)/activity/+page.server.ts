import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { ENTITY_TYPES, ACTIVITY_ACTIONS, type EntityType, type ActivityAction } from '#lib/server/db/schema.js';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async ({ url }) => {
	const entityRaw = url.searchParams.get('entity') ?? '';
	const entity = ENTITY_TYPES.includes(entityRaw as EntityType) ? (entityRaw as EntityType) : undefined;
	const actionRaw = url.searchParams.get('action') ?? '';
	const action = ACTIVITY_ACTIONS.includes(actionRaw as ActivityAction) ? (actionRaw as ActivityAction) : undefined;
	const actorId = Number(url.searchParams.get('actor')) || undefined;
	const pageNo = Math.max(1, Number(url.searchParams.get('page')) || 1);

	const conds = [];
	if (entity) conds.push(eq(schema.activityLogs.entityType, entity));
	if (action) conds.push(eq(schema.activityLogs.action, action));
	if (actorId) conds.push(eq(schema.activityLogs.actorId, actorId));
	const where = conds.length ? and(...conds) : undefined;

	const [logs, [{ total }], actors] = await Promise.all([
		db
			.select()
			.from(schema.activityLogs)
			.where(where)
			.orderBy(desc(schema.activityLogs.id))
			.limit(PAGE_SIZE)
			.offset((pageNo - 1) * PAGE_SIZE),
		db.select({ total: sql<number>`count(*)` }).from(schema.activityLogs).where(where),
		db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).orderBy(asc(schema.users.id))
	]);

	return {
		logs,
		actors,
		total,
		page: pageNo,
		pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		filter: { entity, action, actorId }
	};
};
