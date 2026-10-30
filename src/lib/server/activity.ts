import { db, schema } from './db';
import type { ActivityAction, EntityType } from './db/schema';

export type Changes = Record<string, { from: unknown; to: unknown }>;

export interface LogInput {
	actor: { id: number | null; name: string };
	action: ActivityAction;
	entityType: EntityType;
	entityId?: number | null;
	entityLabel?: string;
	changes?: Changes;
}

export async function logActivity(input: LogInput) {
	await db.insert(schema.activityLogs).values({
		actorId: input.actor.id,
		actorName: input.actor.name,
		action: input.action,
		entityType: input.entityType,
		entityId: input.entityId ?? null,
		entityLabel: input.entityLabel ?? '',
		changes: JSON.stringify(input.changes ?? {})
	});
}

/** เปรียบเทียบ object เก่า/ใหม่ แล้วคืนเฉพาะ field ที่เปลี่ยน */
export function diffChanges<T extends Record<string, unknown>>(
	before: T,
	after: Partial<T>,
	fields: (keyof T)[]
): Changes {
	const out: Changes = {};
	for (const f of fields) {
		if (!(f in after)) continue;
		const a = before[f];
		const b = after[f];
		const na = a === undefined || a === null ? '' : a;
		const nb = b === undefined || b === null ? '' : b;
		if (String(na) !== String(nb)) out[String(f)] = { from: na, to: nb };
	}
	return out;
}
