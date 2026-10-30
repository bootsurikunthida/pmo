import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { ROLES, TASK_STATUSES, PRIORITIES, ACTIVITY_ACTIONS, ENTITY_TYPES } from '../../constants';

export * from '../../constants';

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

/** พนักงาน (จากชีต "ทีมงาน") + บัญชีผู้ใช้สำหรับ Login */
export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ROLES }).notNull().default('member'),
	name: text('name').notNull(),
	position: text('position').notNull().default(''),
	duties: text('duties').notNull().default(''),
	email: text('email').notNull().default(''),
	level: integer('level').notNull().default(1),
	startDate: text('start_date'), // YYYY-MM-DD
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at').notNull().default(now),
	updatedAt: text('updated_at').notNull().default(now)
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(), // sha256(token)
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
});

/** โปรเจกต์ / ลูกค้า (จากคอลัมน์ "ลูกค้า / โครงการ") */
export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	description: text('description').notNull().default(''),
	archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
	createdAt: text('created_at').notNull().default(now),
	updatedAt: text('updated_at').notNull().default(now)
});

/** งาน (จากชีต "งานทั้งหมด") */
export const tasks = sqliteTable(
	'tasks',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		code: text('code').notNull().unique(), // T-001
		projectId: integer('project_id')
			.notNull()
			.references(() => projects.id),
		title: text('title').notNull(),
		assigneeId: integer('assignee_id').references(() => users.id),
		priority: text('priority', { enum: PRIORITIES }).notNull().default('medium'),
		status: text('status', { enum: TASK_STATUSES }).notNull().default('todo'),
		startDate: text('start_date'), // YYYY-MM-DD
		dueDate: text('due_date'), // YYYY-MM-DD
		estimateHours: real('estimate_hours').notNull().default(0),
		actualHours: real('actual_hours').notNull().default(0),
		progress: integer('progress').notNull().default(0), // 0-100
		notes: text('notes').notNull().default(''),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: text('created_at').notNull().default(now),
		updatedAt: text('updated_at').notNull().default(now)
	},
	(t) => [
		index('tasks_project_idx').on(t.projectId),
		index('tasks_assignee_idx').on(t.assigneeId),
		index('tasks_status_idx').on(t.status)
	]
);

/** Activity Log: ใครแก้อะไรเมื่อไร (append-only) */
export const activityLogs = sqliteTable(
	'activity_logs',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		actorId: integer('actor_id').references(() => users.id),
		actorName: text('actor_name').notNull(), // snapshot เผื่อผู้ใช้ถูกลบ
		action: text('action', { enum: ACTIVITY_ACTIONS }).notNull(),
		entityType: text('entity_type', { enum: ENTITY_TYPES }).notNull(),
		entityId: integer('entity_id'),
		entityLabel: text('entity_label').notNull().default(''),
		/** JSON: { field: { from, to } } */
		changes: text('changes').notNull().default('{}'),
		createdAt: text('created_at').notNull().default(now)
	},
	(t) => [
		index('activity_entity_idx').on(t.entityType, t.entityId),
		index('activity_actor_idx').on(t.actorId),
		index('activity_created_idx').on(t.createdAt)
	]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
