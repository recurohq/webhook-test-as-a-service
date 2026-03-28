import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE_NAME = 'webhook_session';

function generateToken(password: string): string {
  return crypto.createHmac('sha256', password).update('webhook-as-a-service').digest('hex');
}

export async function setSession(password: string, days: number) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, generateToken(password), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: days * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function checkAuth(): Promise<boolean> {
  const password = process.env.PASSWORD || '';
  if (!password) return true;
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return false;
  const expected = generateToken(password);
  try {
    return crypto.timingSafeEqual(Buffer.from(cookie.value), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function authJson() {
  return Response.json({ error: 'unauthorized' }, { status: 401 });
}
