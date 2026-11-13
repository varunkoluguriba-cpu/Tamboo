import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, type ConfirmationResult } from 'firebase/auth';

// Same Firebase project as the apps (phone OTP). The browser verifies the code with Firebase,
// then sends the ID token to /api/auth/verify — the server never trusts a number on its own.
const app = initializeApp({
  apiKey: 'AIzaSyA75LXJ0pGBiV5eOA10snz8pzXKFzdQySw',
  authDomain: 'tamboo-da19d.firebaseapp.com',
  projectId: 'tamboo-da19d',
});
export const auth = getAuth(app);

// Google: the same Firebase Google provider the app uses; returns the Firebase ID token.
export async function googleIdToken(): Promise<string> {
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  return cred.user.getIdToken();
}

let verifier: RecaptchaVerifier | null = null;
export async function sendOtp(phoneE164: string, buttonId: string): Promise<ConfirmationResult> {
  if (!verifier) verifier = new RecaptchaVerifier(auth, buttonId, { size: 'invisible' });
  try {
    return await signInWithPhoneNumber(auth, phoneE164, verifier);
  } catch (e) {
    verifier.clear();
    verifier = null;
    throw e;
  }
}
