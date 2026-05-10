import admin from 'firebase-admin';

function parseServiceAccountConfig(rawValue: string) {
  const trimmed = rawValue.trim();
  const normalized =
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
      ? trimmed.slice(1, -1)
      : trimmed;

  // Common .env mistake: value is wrapped in quotes AND inner quotes are escaped:
  // FIREBASE_ADMIN_CONFIG="{\"type\":\"service_account\", ... }"
  // After stripping outer quotes we get: {\"type\":\"service_account\", ...}
  const unescapedQuotes = normalized.replace(/\\"/g, '"');

  const candidates: string[] = [
    normalized,
    unescapedQuotes,
    // If newlines were turned into real line breaks inside private_key, re-escape them.
    unescapedQuotes.replace(
      /"private_key":"([\s\S]*?)","client_email"/,
      (_m, privateKey: string) =>
        `"private_key":"${privateKey.replace(/\r?\n/g, '\\n')}","client_email"`
    ),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `Failed to parse FIREBASE_ADMIN_CONFIG. Expected service account JSON string. ` +
      `If your .env contains: FIREBASE_ADMIN_CONFIG="{\\\"type\\\":...}" this parser handles it, ` +
      `but check formatting (quotes/escapes).`
  );
}

function getAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccountString = process.env.FIREBASE_ADMIN_CONFIG;
  if (!serviceAccountString) {
    throw new Error('FIREBASE_ADMIN_CONFIG environment variable is not set.');
  }

  const serviceAccount = parseServiceAccountConfig(serviceAccountString);
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export function getAdminDb() {
  return getAdminApp().firestore();
}
