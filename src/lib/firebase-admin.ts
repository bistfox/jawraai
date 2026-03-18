import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_ADMIN_CONFIG;
  if (!serviceAccountString) {
      throw new Error('FIREBASE_ADMIN_CONFIG environment variable is not set.');
  }
  const serviceAccount = JSON.parse(serviceAccountString);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminDb = admin.firestore();
