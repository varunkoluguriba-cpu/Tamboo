const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Requires a Firebase service account key (Firebase Console → Project Settings →
// Service Accounts → Generate new private key). Provide it either as a path to the
// JSON file (FIREBASE_SERVICE_ACCOUNT_PATH) or as inline JSON (FIREBASE_SERVICE_ACCOUNT_JSON,
// e.g. for Render's environment variables where a file isn't convenient).
function loadCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  const relPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
  // Resolve relative to the backend's working directory (not this config file's location).
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(path.resolve(process.cwd(), relPath));
}

if (!getApps().length) {
  initializeApp({ credential: cert(loadCredential()) });
}

module.exports = { auth: getAuth };
