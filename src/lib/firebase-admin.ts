import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_ADMIN_CONFIG;
    if (!serviceAccountString) {
        throw new Error('FIREBASE_ADMIN_CONFIG environment variable is not set.');
    }
    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Firebase Admin Initialization Error:', error.message);
  }
}

export const adminDb = admin.firestore();
