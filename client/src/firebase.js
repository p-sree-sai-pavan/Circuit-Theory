import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const initFirebase = (config) => {
  let app;
  if (getApps().length === 0) {
    app = initializeApp(config);
  } else {
    app = getApps()[0];
  }
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { auth, db };
};
