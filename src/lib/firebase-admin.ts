import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App;
let _adminAuth: Auth;

function getAdminApp(): App {
  if (!app) {
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
  }
  return app;
}

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_adminAuth) {
      _adminAuth = getAuth(getAdminApp());
    }
    return (_adminAuth as unknown as Record<string | symbol, unknown>)[prop];
  },
});
