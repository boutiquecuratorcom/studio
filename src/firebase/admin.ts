import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Ensure initialization happens only once.
if (!admin.apps.length) {
  // When deployed to a Google Cloud environment (like App Hosting),
  // the SDK automatically uses the runtime's service account credentials.
  // No credentials need to be passed manually.
  admin.initializeApp();
}

/**
 * Gets the initialized Firebase Admin SDK instances.
 * Throws an error if the SDK could not be initialized, which will be caught by the page component.
 */
export const getAdminInstances = () => {
    if (!admin.apps.length) {
        throw new Error("[Firebase Admin] Admin SDK failed to initialize. This can happen if the server environment is not configured with Google Cloud credentials.");
    }
    return {
        db: admin.firestore(),
        auth: admin.auth(),
    };
};

/**
 * Verifies a Firebase ID token.
 */
export async function verifyIdToken(token: string): Promise<DecodedIdToken | null> {
    if (!admin.apps.length) {
        console.error('[Firebase Admin] Cannot verify token, SDK not initialized.');
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
