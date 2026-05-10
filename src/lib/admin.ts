export const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() ||
  'lofeelzone@gmail.com';

export function isAdminEmail(email?: string | null) {
  return (email ?? '').trim().toLowerCase() === ADMIN_EMAIL;
}
