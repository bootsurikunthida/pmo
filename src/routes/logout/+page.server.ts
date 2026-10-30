import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as auth from '#lib/server/auth.js';
import { logActivity } from '#lib/server/activity.js';

export const load: PageServerLoad = async () => {
	redirect(302, '/');
};

export const actions: Actions = {
	default: async (event) => {
		if (event.locals.session && event.locals.user) {
			await auth.invalidateSession(event.locals.session.id);
			await logActivity({
				actor: { id: event.locals.user.id, name: event.locals.user.name },
				action: 'logout',
				entityType: 'user',
				entityId: event.locals.user.id,
				entityLabel: event.locals.user.name
			});
		}
		auth.deleteSessionCookie(event);
		redirect(302, '/login');
	}
};
