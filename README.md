# Challenge Your Thoughts

A private, offline React Native app (iOS + Android) for recording and challenging automatic thoughts, CBT-style. See `SPEC.md` for the product specification.

## Running

The app uses native modules (on-device speech, notifications, SQLite, video), so it needs a **development build**. Expo Go isn't enough.

```bash
npm install
npx expo run:ios       # or: npx expo run:android
```

Other commands:

```bash
npm test               # translation key/placeholder parity checks
npm run typecheck
npx expo lint
```

## Layout

| Path | Contents |
|---|---|
| `src/app/` | Screens (Expo Router): home list, onboarding, thought detail, challenge flow, settings, reminders |
| `src/flow/` | The 5-step thought-challenge flow and its auto-saving draft hook |
| `src/db/` | Local SQLite storage (`expo-sqlite`) with migrations |
| `src/i18n/` | `i18next` setup, UI translations (`locales/`) and native permission strings (`native/`) |
| `src/speech/` | On-device-only dictation hook |
| `src/notifications/` | Local reminder scheduling |
| `src/patterns.ts` | Stable thinking-pattern ids (names and explanations live in the translation files) |
| `modules/on-device-speech/` | Small local iOS module: checks whether a locale can be transcribed fully on-device |
| `assets/mascot/` | App-ready sloth media |

## Privacy notes

- No network use with user data. Everything is stored in a local SQLite database.
- Dictation is shown only when recognition is guaranteed to run on-device:
  - **iOS:** the language's `SFSpeechRecognizer` must report `supportsOnDeviceRecognition`. `expo-speech-recognition` alone would silently fall back to Apple's servers, so a local native module checks this.
  - **Android:** requires Android 13+ (`createOnDeviceSpeechRecognizer`) and an installed on-device language pack. Older versions can only *prefer* offline recognition, so dictation is hidden there.
- Reminders are local scheduled notifications. No push server is used.
- "Delete all data" removes all rows, then runs `VACUUM` and truncates the WAL file.

## Not in v1 (open decisions in SPEC.md)

- Local export/import
- App lock and encryption at rest
- Excluding the database from OS cloud backups
- Region-specific crisis resources (onboarding uses generic wording for now)
