import type { Handle } from '@sveltejs/kit/hooks';
import * as auth from '#lib/server/auth.js';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(auth.SESSION_COOKIE);
	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(token);
	if (session) {
		auth.setSessionCookie(event, token, session.expiresAt);
	} else {
		auth.deleteSessionCookie(event);
	}
	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};
