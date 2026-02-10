import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const COOKIE_NAME = 'mysticos_device_id';

export function getDeviceId() {
  const cookieStore = cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

// setDeviceId 已移动到 middleware.ts
