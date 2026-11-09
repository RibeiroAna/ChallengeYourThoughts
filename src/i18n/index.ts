import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import de from './locales/de.json';
import ptBR from './locales/pt-BR.json';

export const SUPPORTED_LANGUAGES = ['en', 'de', 'pt-BR'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
/** 'system' follows the device language. */
export type LanguageSetting = Language | 'system';

export function isLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** Picks the first supported device language, falling back to English. */
export function deviceLanguage(): Language {
  for (const locale of getLocales()) {
    if (isLanguage(locale.languageTag)) return locale.languageTag;
    // Any Portuguese variant gets pt-BR, our only Portuguese translation.
    if (locale.languageCode === 'pt') return 'pt-BR';
    if (locale.languageCode && isLanguage(locale.languageCode)) return locale.languageCode;
  }
  return 'en';
}

export function resolveLanguage(setting: LanguageSetting): Language {
  return setting === 'system' ? deviceLanguage() : setting;
}

export function initI18n(setting: LanguageSetting) {
  if (i18n.isInitialized) return i18n;
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      'pt-BR': { translation: ptBR },
    },
    lng: resolveLanguage(setting),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return i18n;
}

export default i18n;
