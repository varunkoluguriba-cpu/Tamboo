// Shared AsyncStorage keys used across screens.
export const HOME_MODE_KEY = 'tamboo-customer-home-mode';

// Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration →
// Web client ID. Needed for native Google Sign-In to mint a token Firebase will accept.
export const GOOGLE_WEB_CLIENT_ID = '81013137310-bpjkthlfec58lc17onklg12j9djcv1up.apps.googleusercontent.com';
export const ADDRESSES_KEY = 'tamboo-customer-addresses';
export const NOTIF_PREFS_KEY = 'tamboo-customer-notif-prefs';
export const CART_KEY = 'tamboo-customer-cart';
// Set once onboarding has been seen, so a logged-out returning user goes straight to Login.
export const SEEN_ONBOARDING_KEY = 'tamboo-customer-seen-onboarding';
