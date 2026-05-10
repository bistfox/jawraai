export function generateRefCode(uid: string): string {
  const clean = uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JW${clean}${rand}`.slice(0, 12);
}

export function weekKeyUTC(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function monthKeyUTC(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

