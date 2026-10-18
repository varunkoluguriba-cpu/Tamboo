// PhotoRoom background-removal API — https://sdk.photoroom.com/v1/segment
// Separate from config/anthropic.js: Claude can only read/analyze images, not edit them, so
// background cleanup needs its own provider with its own key.
function getApiKey() {
  if (!process.env.PHOTOROOM_API_KEY) {
    throw new Error('PHOTOROOM_API_KEY is not configured');
  }
  return process.env.PHOTOROOM_API_KEY;
}

module.exports = { getApiKey };
