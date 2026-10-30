import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from './db';

const DAY_MS = 1000 * 60 * 60 * 24;
const SESSION_DAYS = 30;
export const SESSION_COOKIE = 'pt_session';

function b64url(bytes: Uint8Array): string {
	let s = '';
	for (const b of bytes) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(input: string): Promise<string> {
	const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export function generateSessionToken(): string {
	return b64url(crypto.getRandomValues(new Uint8Array(24)));
}

export async function createSession(token: string, userId: number) {
	const id = await sha256Hex(token);
	const session = { id, userId, expiresAt: new Date(Date.now() + DAY_MS * SESSION_DAYS) };
	await db.insert(schema.sessions).values(session);
	return session;
}

export type SessionUser = Omit<schema.User, 'passwordHash'>;

export async function validateSessionToken(
	token: string
): Promise<{ session: schema.Session; user: SessionUser } | { session: null; user: null }> {
	const id = await sha256Hex(token);
	const [row] = await db
		.select({ session: schema.sessions, user: schema.users })
		.from(schema.sessions)
		.innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
		.where(eq(schema.sessions.id, id));
	if (!row) return { session: null, user: null };

	const { session } = row;
	if (Date.now() >= session.expiresAt.getTime() || !row.user.active) {
		await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
		return { session: null, user: null };
	}
	// ต่ออายุ session อัตโนมัติเมื่อเหลือน้อยกว่าครึ่ง
	if (Date.now() >= session.expiresAt.getTime() - (DAY_MS * SESSION_DAYS) / 2) {
		session.expiresAt = new Date(Date.now() + DAY_MS * SESSION_DAYS);
		await db
			.update(schema.sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(schema.sessions.id, id));
	}
	const { passwordHash: _ph, ...user } = row.user;
	return { session, user };
}

export async function invalidateSession(id: string) {
	await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
}

export async function invalidateUserSessions(userId: number) {
	await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

export function setSessionCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(SESSION_COOKIE, token, {
		expires: expiresAt,
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: event.url.protocol === 'https:'
	});
}

export function deleteSessionCookie(event: RequestEvent) {
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
}
