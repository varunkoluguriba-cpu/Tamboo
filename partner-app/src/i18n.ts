// Tamboo Partner UI strings. The decoded design only ships a translated dictionary for the
// generic cross-app terms below — everything else in this app is business-specific copy that
// stays in English (same pattern the customer app uses for its own screen-specific text).
const KEYS = ['skip', 'next', 'cont', 'chooseLang'] as const;

type Key = (typeof KEYS)[number];
export type LangStrings = Record<Key, string>;

const R: Record<string, string[]> = {
  en: ['Skip', 'Next', 'Continue', 'Choose your language'],
  hi: ['छोड़ें', 'आगे', 'जारी रखें', 'अपनी भाषा चुनें'],
  te: ['దాటవేయి', 'తర్వాత', 'కొనసాగించండి', 'మీ భాషను ఎంచుకోండి'],
  ta: ['தவிர்', 'அடுத்து', 'தொடரவும்', 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்'],
  kn: ['ಬಿಟ್ಟುಬಿಡಿ', 'ಮುಂದೆ', 'ಮುಂದುವರಿಸಿ', 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ'],
  ml: ['ഒഴിവാക്കുക', 'അടുത്തത്', 'തുടരുക', 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക'],
  mr: ['वगळा', 'पुढे', 'पुढे चला', 'तुमची भाषा निवडा'],
  bn: ['এড়িয়ে যান', 'পরবর্তী', 'চালিয়ে যান', 'আপনার ভাষা বেছে নিন'],
  gu: ['છોડો', 'આગળ', 'ચાલુ રાખો', 'તમારી ભાષા પસંદ કરો'],
  pa: ['ਛੱਡੋ', 'ਅੱਗੇ', 'ਜਾਰੀ ਰੱਖੋ', 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ'],
  or: ['ଛାଡନ୍ତୁ', 'ପରବର୍ତ୍ତୀ', 'ଜାରି ରଖନ୍ତୁ', 'ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ'],
  ur: ['چھوڑیں', 'آگے', 'جاری رکھیں', 'اپنی زبان منتخب کریں'],
  as: ['এৰি দিয়ক', 'পৰৱৰ্তী', 'আগবাঢ়ক', 'আপোনাৰ ভাষা বাছক'],
};

// Full list of 23 target languages. Only the 13 above (incl. English) have real translations
// today; the rest render English until translated (flagged via `isFullyTranslated()`).
export const LANGS: Array<[string, string, string]> = [
  ['en', 'English', 'English'], ['hi', 'हिन्दी', 'Hindi'], ['te', 'తెలుగు', 'Telugu'], ['ta', 'தமிழ்', 'Tamil'], ['kn', 'ಕನ್ನಡ', 'Kannada'], ['ml', 'മലയാളം', 'Malayalam'],
  ['mr', 'मराठी', 'Marathi'], ['bn', 'বাংলা', 'Bengali'], ['gu', 'ગુજરાતી', 'Gujarati'], ['pa', 'ਪੰਜਾਬੀ', 'Punjabi'], ['or', 'ଓଡ଼ିଆ', 'Odia'], ['ur', 'اردو', 'Urdu'],
  ['as', 'অসমীয়া', 'Assamese'], ['mai', 'मैथिली', 'Maithili'], ['sat', 'ᱥᱟᱱᱛᱟᱲᱤ', 'Santali'], ['ks', 'کٲشُر', 'Kashmiri'], ['ne', 'नेपाली', 'Nepali'], ['sd', 'سنڌي', 'Sindhi'],
  ['kok', 'कोंकणी', 'Konkani'], ['doi', 'डोगरी', 'Dogri'], ['mni', 'ꯃꯩꯇꯩꯂꯣꯟ', 'Manipuri'], ['brx', 'बड़ो', 'Bodo'], ['sa', 'संस्कृतम्', 'Sanskrit'],
];

export const RTL = ['ur', 'ks', 'sd'];

const dict: Record<string, Partial<Record<Key, string>>> = {};
Object.keys(R).forEach((lang) => {
  dict[lang] = {};
  KEYS.forEach((k, i) => {
    dict[lang][k] = R[lang][i];
  });
});

export function t(lang: string): Record<Key, string> {
  return { ...(dict.en as Record<Key, string>), ...(dict[lang] || {}) };
}

export function isFullyTranslated(lang: string): boolean {
  return !!dict[lang];
}

export function langName(lang: string): [string, string, string] {
  return LANGS.find((x) => x[0] === lang) || LANGS[0];
}

export function isRTL(lang: string): boolean {
  return RTL.includes(lang);
}
