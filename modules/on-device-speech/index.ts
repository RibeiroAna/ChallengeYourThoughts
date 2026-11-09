import { requireOptionalNativeModule } from 'expo';

interface OnDeviceSpeechModule {
  supportsOnDeviceRecognition(localeIdentifier: string): boolean;
}

const native = requireOptionalNativeModule<OnDeviceSpeechModule>('OnDeviceSpeech');

/** iOS only. Returns false when the module is missing (e.g. Expo Go), so dictation stays hidden. */
export function iosSupportsOnDeviceRecognition(localeIdentifier: string): boolean {
  try {
    return native?.supportsOnDeviceRecognition(localeIdentifier) ?? false;
  } catch {
    return false;
  }
}
