import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Thin wrapper around Firebase Phone Auth so screens don't touch the SDK directly —
// keeps the OTP flow easy to test/mock and easy to swap providers later if needed.

export type ConfirmationResult = FirebaseAuthTypes.ConfirmationResult;

export async function sendOtp(e164Phone: string): Promise<ConfirmationResult> {
  return auth().signInWithPhoneNumber(e164Phone);
}

export async function confirmOtp(confirmation: ConfirmationResult, code: string): Promise<FirebaseAuthTypes.User> {
  const cred = await confirmation.confirm(code);
  if (!cred?.user) throw new Error('Verification failed. Please try again.');
  return cred.user;
}

export function signOut(): Promise<void> {
  return auth().signOut();
}

export function currentUser(): FirebaseAuthTypes.User | null {
  return auth().currentUser;
}
