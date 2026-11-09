import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getLocales } from 'expo-localization';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useTranslation } from 'react-i18next';

import { iosSupportsOnDeviceRecognition } from '../../modules/on-device-speech';
import type { Language } from '../i18n';

const DEFAULT_REGION: Record<Language, string> = { en: 'en-US', de: 'de-DE', 'pt-BR': 'pt-BR' };

function normalise(tag: string) {
  return tag.replace('_', '-').toLowerCase();
}

/** Candidate recogniser locales for an app language, device-preferred first (e.g. en-GB before en-US). */
function candidateLocales(language: Language): string[] {
  const prefix = language.split('-')[0];
  const fromDevice = getLocales()
    .map((l) => l.languageTag)
    .filter((tag) => (language === 'pt-BR' ? normalise(tag) === 'pt-br' : tag.split('-')[0] === prefix));
  return [...new Set([...fromDevice, DEFAULT_REGION[language]])];
}

/**
 * Finds a locale that is guaranteed to be recognised on-device, or null.
 * Returning null hides dictation: we never fall back to network recognition.
 */
async function findOnDeviceLocale(language: Language): Promise<string | null> {
  try {
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) return null;
    const candidates = candidateLocales(language);
    if (Platform.OS === 'ios') {
      return candidates.find((tag) => iosSupportsOnDeviceRecognition(tag)) ?? null;
    }
    if (Platform.OS === 'android') {
      // Older Android versions can only *prefer* offline recognition, which isn't a guarantee.
      if (typeof Platform.Version !== 'number' || Platform.Version < 33) return null;
      if (!ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()) return null;
      const { installedLocales } = await ExpoSpeechRecognitionModule.getSupportedLocales({});
      const installed = new Set(installedLocales.map(normalise));
      return candidates.find((tag) => installed.has(normalise(tag))) ?? null;
    }
  } catch {
    // Any failure means dictation stays hidden; typing always works.
  }
  return null;
}

const localeCache = new Map<Language, Promise<string | null>>();

function onDeviceLocale(language: Language) {
  let cached = localeCache.get(language);
  if (!cached) {
    cached = findOnDeviceLocale(language);
    localeCache.set(language, cached);
  }
  return cached;
}

/** Only one input can dictate at a time; this tracks which one. */
let activeOwner: symbol | null = null;

/** `onTranscript` receives everything dictated since `start()`, updated as recognition progresses. */
export function useDictation(onTranscript: (transcript: string) => void) {
  const { i18n } = useTranslation();
  const language = i18n.language as Language;
  const [locale, setLocale] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(false);
  const [owner] = useState(() => Symbol('dictation'));
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  });
  // Final results arrive per utterance in continuous mode; keep them and append the interim one.
  const committed = useRef('');

  useEffect(() => {
    let cancelled = false;
    onDeviceLocale(language).then((found) => {
      if (!cancelled) setLocale(found);
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  useSpeechRecognitionEvent('result', (event) => {
    if (activeOwner !== owner) return;
    const transcript = event.results[0]?.transcript?.trim();
    if (!transcript) return;
    const joined = [committed.current, transcript].filter(Boolean).join(' ');
    if (event.isFinal) committed.current = joined;
    onTranscriptRef.current(joined);
  });

  useSpeechRecognitionEvent('end', () => {
    if (activeOwner !== owner) return;
    activeOwner = null;
    setListening(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (activeOwner !== owner) return;
    activeOwner = null;
    setListening(false);
    if (event.error !== 'aborted' && event.error !== 'no-speech') setError(true);
  });

  useEffect(
    () => () => {
      if (activeOwner === owner) {
        ExpoSpeechRecognitionModule.abort();
        activeOwner = null;
      }
    },
    [owner],
  );

  const start = useCallback(async () => {
    if (!locale) return;
    setError(false);
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError(true);
      return;
    }
    if (activeOwner) ExpoSpeechRecognitionModule.abort();
    activeOwner = owner;
    committed.current = '';
    setListening(true);
    ExpoSpeechRecognitionModule.start({
      lang: locale,
      requiresOnDeviceRecognition: true,
      interimResults: true,
      continuous: true,
      addsPunctuation: true,
    });
  }, [locale, owner]);

  const stop = useCallback(() => {
    if (activeOwner === owner) ExpoSpeechRecognitionModule.stop();
  }, [owner]);

  return { available: locale !== null, listening, error, start, stop };
}
