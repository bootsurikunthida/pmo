import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { hashPassword, verifyPassword } from '#lib/server/password.js';
import { logActivity } from '#lib/server/activity.js';

export const load: PageServerLoad = async () => ({});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const current = String(form.get('current') ?? '');
		const next = String(form.get('next') ?? '');
		const confirm = String(form.get('confirm') ?? '');
		if (next.length < 6) return fail(400, { message: 'รหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร' });
		if (next !== confirm) return fail(400, { message: 'รหัสผ่านใหม่ไม่ตรงกัน' });

		const [u] = await db.select().from(schema.users).where(eq(schema.users.id, locals.user!.id));
		if (!u || !(await verifyPassword(current, u.passwordHash))) {
			return fail(400, { message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
		}
		await db
			.update(schema.users)
			.set({ passwordHash: await hashPassword(next), updatedAt: new Date().toISOString() })
			.where(eq(schema.users.id, u.id));
		await logActivity({
			actor: { id: u.id, name: u.name },
			action: 'update',
			entityType: 'user',
			entityId: u.id,
			entityLabel: u.name,
			changes: { password: { from: '••••', to: '•••• (เปลี่ยนเอง)' } }
		});
		return { ok: true };
	}
};
