import { getDb } from './database';
import { isLanguage, type LanguageSetting } from '../i18n';

function get(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

function set(key: string, value: string) {
  getDb().runSync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

export function getLanguageSetting(): LanguageSetting {
  const value = get('language');
  return value && isLanguage(value) ? value : 'system';
}

export function setLanguageSetting(value: LanguageSetting) {
  set('language', value);
}

export function isOnboardingDone(): boolean {
  return get('onboardingDone') === '1';
}

export function setOnboardingDone(done: boolean) {
  set('onboardingDone', done ? '1' : '0');
}

export function isExampleAdded(): boolean {
  return get('exampleAdded') === '1';
}

export function setExampleAdded() {
  set('exampleAdded', '1');
}
