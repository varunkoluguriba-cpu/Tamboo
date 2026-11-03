import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  signInWithPhoneNumber,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../constants';

// Thin wrapper around Firebase Phone Auth so screens don't touch the SDK directly —
// keeps the OTP flow easy to test/mock and easy to swap providers later if needed.
// Uses the modular (v22+) API, not the deprecated namespaced one.

const auth = () => getAuth(getApp());

export type ConfirmationResult = FirebaseAuthTypes.ConfirmationResult;

export async function sendOtp(e164Phone: string): Promise<ConfirmationResult> {
  // App logout only clears our JWT, so a previous Firebase session can still be around —
  // clear it so the instant-verification check below can only ever match this number.
  if (auth().currentUser) await firebaseSignOut(auth());
  return signInWithPhoneNumber(auth(), e164Phone);
}

// Android can verify the number instantly (always for Firebase test numbers, and for real
// numbers when it auto-reads the SMS) and sign in before the code is typed. The confirmation
// then has no verificationId and confirm() throws, which used to surface as "Incorrect code".
async function instantlyVerifiedUser(e164Phone: string): Promise<FirebaseAuthTypes.User | null> {
  for (let i = 0; i < 6; i++) {
    const u = auth().currentUser;
    if (u && u.phoneNumber === e164Phone) return u;
    await new Promise<void>((r) => setTimeout(() => r(), 500));
  }
  return null;
}

export async function confirmOtp(confirmation: ConfirmationResult, code: string, e164Phone: string): Promise<FirebaseAuthTypes.User> {
  if (!confirmation.verificationId) {
    const instant = await instantlyVerifiedUser(e164Phone);
    if (instant) return instant;
  }
  try {
    const cred = await confirmation.confirm(code);
    if (!cred?.user) throw new Error('Verification failed. Please try again.');
    return cred.user;
  } catch (err) {
    const instant = await instantlyVerifiedUser(e164Phone);
    if (instant) return instant;
    throw err;
  }
}

let googleConfigured = false;
function ensureGoogleConfigured() {
  if (googleConfigured) return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  googleConfigured = true;
}

// Native Google sign-in sheet, then exchange the Google ID token for a Firebase credential
// so the rest of the app (and the backend's /api/partner-auth/google) deals in Firebase ID
// tokens exactly like phone auth does — one verification path on the server either way.
export async function signInWithGoogle(): Promise<FirebaseAuthTypes.User> {
  ensureGoogleConfigured();
  await GoogleSignin.hasPlayServices();
  const result = await GoogleSignin.signIn();
  const idToken = (result as any)?.data?.idToken ?? (result as any)?.idToken;
  if (!idToken) throw new Error('Google sign-in did not return a token. Please try again.');
  const credential = GoogleAuthProvider.credential(idToken);
  const userCred = await signInWithCredential(auth(), credential);
  return userCred.user;
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth());
}

export function currentUser(): FirebaseAuthTypes.User | null {
  return auth().currentUser;
}
