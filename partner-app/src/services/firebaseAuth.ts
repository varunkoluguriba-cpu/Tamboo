import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';

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

export function signOut(): Promise<void> {
  return firebaseSignOut(auth());
}

export function currentUser(): FirebaseAuthTypes.User | null {
  return auth().currentUser;
}
