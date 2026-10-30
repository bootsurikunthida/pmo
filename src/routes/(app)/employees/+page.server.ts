import { error, fail } from '@sveltejs/kit';
import { asc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { ROLES, type Role } from '#lib/server/db/schema.js';
import { hashPassword } from '#lib/server/password.js';
import { invalidateUserSessions } from '#lib/server/auth.js';
import { diffChanges, logActivity } from '#lib/server/activity.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') error(403, 'เฉพาะ Admin เท่านั้น');

	const rows = await db
		.select({
			id: schema.users.id,
			username: schema.users.username,
			role: schema.users.role,
			name: schema.users.name,
			position: schema.users.position,
			duties: schema.users.duties,
			email: schema.users.email,
			level: schema.users.level,
			startDate: schema.users.startDate,
			active: schema.users.active,
			openTasks: sql<number>`(select count(*) from tasks t where t.assignee_id = ${schema.users.id} and t.status != 'done')`,
			totalTasks: sql<number>`(select count(*) from tasks t where t.assignee_id = ${schema.users.id})`
		})
		.from(schema.users)
		.orderBy(asc(schema.users.active), asc(schema.users.id));

	return { employees: rows.sort((a, b) => Number(b.active) - Number(a.active) || a.id - b.id) };
};

function parseUserForm(form: FormData) {
	const errors: Record<string, string> = {};
	const username = String(form.get('username') ?? '').trim().toLowerCase();
	if (!/^[a-z0-9._-]{2,32}$/.test(username)) errors.username = 'username ใช้ a-z 0-9 . _ - ยาว 2–32 ตัว';
	const name = String(form.get('name') ?? '').trim();
	if (!name) errors.name = 'กรุณากรอกชื่อ';
	const role = String(form.get('role') ?? 'member') as Role;
	if (!ROLES.includes(role)) errors.role = 'สิทธิ์ไม่ถูกต้อง';
	const data = {
		username,
		name,
		role,
		position: String(form.get('position') ?? '').trim(),
		duties: String(form.get('duties') ?? '').trim(),
		email: String(form.get('email') ?? '').trim(),
		level: Math.max(1, Math.min(10, Number(form.get('level')) || 1)),
		startDate: String(form.get('startDate') ?? '').trim() || null,
		active: form.get('active') !== 'off'
	};
	return { data, errors };
}

const guard = (locals: App.Locals) =>
	locals.user?.role !== 'admin' ? fail(403, { message: 'เฉพาะ Admin เท่านั้น' }) : null;

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const denied = guard(locals);
		if (denied) return denied;
		const form = await request.formData();
		const { data, errors } = parseUserForm(form);
		const password = String(form.get('password') ?? '');
		if (password.length < 6) errors.password = 'รหัสผ่านอย่างน้อย 6 ตัวอักษร';
		if (Object.keys(errors).length) return fail(400, { errors, action: 'create' });

		const [dup] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.username, data.username));
		if (dup) return fail(400, { errors: { username: 'username นี้มีอยู่แล้ว' }, action: 'create' });

		const [u] = await db
			.insert(schema.users)
			.values({ ...data, passwordHash: await hashPassword(password) })
			.returning();
		await logActivity({
			actor: { id: locals.user!.id, name: locals.user!.name },
			action: 'create',
			entityType: 'user',
			entityId: u.id,
			entityLabel: u.name,
			changes: {
				username: { from: '', to: u.username },
				position: { from: '', to: u.position },
				role: { from: '', to: u.role }
			}
		});
		return { ok: true };
	},

	update: async ({ request, locals }) => {
		const denied = guard(locals);
		if (denied) return denied;
		const form = await request.formData();
		const id = Number(form.get('id'));
		const { data, errors } = parseUserForm(form);
		if (Object.keys(errors).length) return fail(400, { errors, action: 'update', id });

		const [before] = await db.select().from(schema.users).where(eq(schema.users.id, id));
		if (!before) return fail(404, { message: 'ไม่พบพนักงาน' });
		if (before.id === locals.user!.id && (data.role !== 'admin' || !data.active)) {
			return fail(400, { errors: { role: 'ไม่สามารถลดสิทธิ์หรือปิดบัญชีของตัวเองได้' }, action: 'update', id });
		}
		if (data.username !== before.username) {
			const [dup] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.username, data.username));
			if (dup) return fail(400, { errors: { username: 'username นี้มีอยู่แล้ว' }, action: 'update', id });
		}

		const changes = diffChanges(before as unknown as Record<string, unknown>, data, [
			'username', 'name', 'role', 'position', 'duties', 'email', 'level', 'startDate', 'active'
		]);

		const password = String(form.get('password') ?? '');
		const patch: Partial<schema.User> = { ...data, updatedAt: new Date().toISOString() };
		if (password) {
			if (password.length < 6) return fail(400, { errors: { password: 'รหัสผ่านอย่างน้อย 6 ตัวอักษร' }, action: 'update', id });
			patch.passwordHash = await hashPassword(password);
			changes.password = { from: '••••', to: '•••• (รีเซ็ตใหม่)' };
		}
		if (Object.keys(changes).length === 0) return { ok: true };

		await db.update(schema.users).set(patch).where(eq(schema.users.id, id));
		if (!data.active || password) await invalidateUserSessions(id);
		await logActivity({
			actor: { id: locals.user!.id, name: locals.user!.name },
			action: 'update',
			entityType: 'user',
			entityId: id,
			entityLabel: data.name,
			changes
		});
		return { ok: true };
	},

	delete: async ({ request, locals }) => {
		const denied = guard(locals);
		if (denied) return denied;
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (id === locals.user!.id) return fail(400, { message: 'ไม่สามารถลบบัญชีของตัวเองได้' });
		const [before] = await db.select().from(schema.users).where(eq(schema.users.id, id));
		if (!before) return fail(404, { message: 'ไม่พบพนักงาน' });

		// งานที่เคยรับผิดชอบจะกลายเป็น "ยังไม่ระบุ" (เก็บประวัติไว้ใน activity log)
		await db.update(schema.tasks).set({ assigneeId: null }).where(eq(schema.tasks.assigneeId, id));
		await db.delete(schema.users).where(eq(schema.users.id, id));
		await logActivity({
			actor: { id: locals.user!.id, name: locals.user!.name },
			action: 'delete',
			entityType: 'user',
			entityId: id,
			entityLabel: before.name,
			changes: { username: { from: before.username, to: '' }, position: { from: before.position, to: '' } }
		});
		return { ok: true };
	}
};
