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
  return signInWithPhoneNumber(auth(), e164Phone);
}

export async function confirmOtp(confirmation: ConfirmationResult, code: string): Promise<FirebaseAuthTypes.User> {
  const cred = await confirmation.confirm(code);
  if (!cred?.user) throw new Error('Verification failed. Please try again.');
  return cred.user;
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
