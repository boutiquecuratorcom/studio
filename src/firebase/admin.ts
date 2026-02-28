import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { ServiceAccount } from 'firebase-admin';

const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
let initialized = false;

if (admin.apps.length > 0) {
  initialized = true;
}

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This is a singleton to prevent re-initialization.
 */
function initializeAdmin() {
  if (initialized) {
    return;
  }
  if (!hasCredentials) {
    console.warn(
      '[Firebase Admin] No GOOGLE_APPLICATION_CREDENTIALS_JSON found. Skipping initialization.'
    );
    return;
  }
  try {
    const serviceAccount = JSON.parse(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON as string
    ) as ServiceAccount;
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log('[Firebase Admin] Initialized successfully.');
  } catch (error: any) {
    console.error('[Firebase Admin] Initialization failed:', error.message);
  }
}

// Call initialization right away
initializeAdmin();


export const getAdminInstances = () => {
    if (!initialized) {
        // This will cause an error on the page if credentials are not set up, which is desired behavior for SSR.
        throw new Error("[Firebase Admin] Admin SDK not initialized. Server-side rendering requires GOOGLE_APPLICATION_CREDENTIALS_JSON to be set.");
    }
    return {
        db: admin.firestore(),
        auth: admin.auth(),
    };
};

export async function verifyIdToken(token: string): Promise<DecodedIdToken | null> {
    if (!initialized) {
        return null;
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying ID token:', error);
        return null;
    }
}
