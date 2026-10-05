import { launchImageLibrary } from 'react-native-image-picker';

// Returns a base64 data URI ready to store directly and display via <Image source={{uri}} />.
// No separate object-storage service yet — see backend's raised JSON body limit.
export async function pickImageBase64(): Promise<string | null> {
  const res = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.6,
    maxWidth: 1280,
    maxHeight: 1280,
    includeBase64: true,
  });
  if (res.didCancel || res.errorCode || !res.assets || !res.assets[0]?.base64) return null;
  const asset = res.assets[0];
  const mime = asset.type || 'image/jpeg';
  return `data:${mime};base64,${asset.base64}`;
}
