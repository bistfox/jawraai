/** Normalize `[label](href)` targets for in-app navigation. */
export function normalizeChatMarkdownHref(raw: string): { href: string; isExternal: boolean } {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return { href: t, isExternal: true };
  let path = t;
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/');
  return { href: path, isExternal: false };
}
