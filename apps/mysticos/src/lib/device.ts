import 'server-only';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'mysticos_device_id';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function getDeviceId() {
  return cookies().get(COOKIE_NAME)?.value || null;
}

export function getOrCreateDeviceId() {
  const store = cookies();
  let deviceId = store.get(COOKIE_NAME)?.value;

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    store.set(COOKIE_NAME, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ONE_YEAR_SECONDS,
    });
  }

  return deviceId;
}
