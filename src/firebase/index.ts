export { firebaseConfig } from "./config";

export {
  FirebaseProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
  useStorage,
} from "./provider";

export { FirebaseClientProvider } from "./client-provider";

export { useUser } from "./auth/use-user";
export { useCollection } from "./firestore/use-collection";
export { useDoc } from "./firestore/use-doc";

// IMPORTANT: only re-export from init (do NOT redeclare)
export { initializeFirebase } from "./init";
