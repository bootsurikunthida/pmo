import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { verifyPassword } from '#lib/server/password.js';
import * as auth from '#lib/server/auth.js';
import { logActivity } from '#lib/server/activity.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const username = String(form.get('username') ?? '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') ?? '');
		if (!username || !password) {
			return fail(400, { username, message: 'กรุณากรอก username และรหัสผ่าน' });
		}

		const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
		const ok = user ? await verifyPassword(password, user.passwordHash) : false;
		if (!user || !ok) {
			return fail(400, { username, message: 'username หรือรหัสผ่านไม่ถูกต้อง' });
		}
		if (!user.active) {
			return fail(403, { username, message: 'บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
		}

		const token = auth.generateSessionToken();
		const session = await auth.createSession(token, user.id);
		auth.setSessionCookie(event, token, session.expiresAt);
		await logActivity({
			actor: { id: user.id, name: user.name },
			action: 'login',
			entityType: 'user',
			entityId: user.id,
			entityLabel: user.name
		});

		const next = event.url.searchParams.get('next');
		redirect(302, next && next.startsWith('/') ? next : '/');
	}
};
