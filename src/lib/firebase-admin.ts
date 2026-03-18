import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_ADMIN_CONFIG;
  if (!serviceAccountString) {
      throw new Error('FIREBASE_ADMIN_CONFIG environment variable is not set.');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountString);
  } catch (error: any) {
    // This provides a more descriptive error if the environment variable is not valid JSON.
    throw new Error(`Failed to parse FIREBASE_ADMIN_CONFIG. The value is not valid JSON. Please check your environment variable. Original error: ${error.message}`);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminDb = admin.firestore();
