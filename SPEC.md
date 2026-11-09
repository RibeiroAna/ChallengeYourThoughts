# Challenge Your Thoughts — Product Specification

A mobile app that helps people in Cognitive Behavioural Therapy (CBT) record and challenge their automatic thoughts, using a structured thought-record flow.

Status: pre-implementation. Items marked **[Decision needed]** are not settled yet.

---

## 1. Core principles (non-negotiable)

1. **One codebase, both platforms.** React Native, targeting iOS and Android.
2. **Fully offline and private.**
   - No login, account, or sign-up of any kind.
   - No user data leaves the device: no backend, no cloud sync, no analytics or crash-reporting SDKs that send data, no remote speech recognition.
   - Any third-party library must be checked to make sure it doesn't make network calls with user content.
3. **Multilingual from day one.** No hard-coded user-facing strings. Initial languages:
   - English (`en`), the default/fallback
   - German (`de`)
   - Brazilian Portuguese (`pt-BR`)
4. **Supportive, non-clinical tone.** The app supports CBT practice and does not replace a therapist.

---

## 2. Thought-challenge flow

Every thought goes through Steps 1–2. After Step 2, the user chooses **Save** (stop here) or **Save & challenge** (continue to Steps 3–5). A thought that was only saved can be challenged later from the thought list.

### Step 1 — Capture the thought
- Free-text input.
- Optional dictation through speech-to-text (see §4).

### Step 2 — Initial belief
- "How much do you believe this thought right now?"
- Slider from 0–100%.
- Actions: **Save** | **Save & challenge**.

### Step 3 — Evidence
- Two lists: **Evidence for** the thought and **Evidence against** it.
- The user can add, edit, and remove any number of items in each list. Text or dictation.
- Each item gets a **weight** (how strong/convincing that evidence is), as a slider from 1–100%.
- Optional: show a simple visual balance of total weight "for" vs "against".

### Step 4 — Thinking patterns (cognitive distortions)
- Multi-select list. Each pattern has a short explanation and an example, shown on tap.
- Initial set:
  - All-or-nothing thinking
  - Overgeneralisation
  - Mental filter
  - Disqualifying the positive
  - Mind reading
  - Fortune telling
  - Catastrophising
  - Magnification / minimisation
  - Emotional reasoning
  - "Should" statements
  - Labelling
  - Personalisation / blame
- Selecting none is allowed.

### Step 5 — Re-evaluation
- Write an **alternative (balanced) thought** (text or dictation).
- Re-rate belief in the **original thought** (same scale as Step 2).
- Optional: rate belief in the alternative thought.
- Show the change in belief (e.g. "80% → 45%").

### Flow behaviour
- The user can go back to earlier steps without losing input.
- Progress is saved as a draft automatically, so leaving the app mid-flow loses nothing.
- A thought has a status: `saved` (Steps 1–2 only), `in_progress`, or `challenged` (complete).

---

## 3. Other features

### Thought history
- List of all thoughts, newest first, showing status and belief before → after.
- Open a thought to view it, edit it, start/continue its challenge, or delete it.

### Reminders
- The user can set one or more reminders at specific times, with weekdays selectable per reminder.
- Implemented as **local scheduled notifications only**. No push server.
- Tapping a notification opens the app directly on "new thought".
- Notification text is localised in the user's language and phrased gently.
- Ask for notification permission only when the user first sets a reminder.

### Settings
- App language (defaults to the device language if supported, otherwise English).
- Reminder management.
- Data: delete all data (with confirmation).
- **[Decision needed]** Local export/import (e.g. a JSON file through the system share sheet) so users can move data to a new phone without a cloud. This is the only way to keep data when changing devices.
- **[Decision needed]** App lock with device biometrics/passcode.

### Mascot — Sloth
- A friendly sloth character used on onboarding, empty states, step transitions, and completion screens.
- Calm and encouraging, never pushy. It suits a "slow down and reflect" theme.
- Art is AI-generated (Muse); the license is cleared for commercial use.
- App-ready files live in `assets/mascot/`. Full-size originals are kept in `design/mascot/originals/` and are not bundled into the app.

| File | Content | Format |
|---|---|---|
| `sloth-sitting.webp` | Sitting, smiling (still) | 1024×1024, **transparent background** |
| `sloth-wave.mp4` | Waving / dancing | 720×1280 portrait, 8 s, no audio |
| `sloth-laptop.mp4` | Headphones, typing on laptop | 720×720, 8 s, no audio |
| `sloth-stretch.mp4` | Stretching, then sitting up | 720×720, 8 s, no audio |
| `sloth-idle.mp4` | Sitting, idle | 720×720, 8 s, no audio |

- **Videos have an opaque off-white background (`#FDFDFD`).** Screens that show a sloth video must use that exact colour behind it, or place the video inside a `#FDFDFD` rounded card. This also applies in dark mode. The still `sloth-sitting.webp` is transparent and works on any background.
- Videos play muted, with no controls, and must not interrupt the user's own audio.
- When the OS "reduce motion" setting is on, show `sloth-sitting.webp` instead of videos.
- Suggested placement: wave → onboarding/welcome; idle → empty states; laptop → writing steps; stretch → challenge complete.

### Onboarding
- A short intro (2–3 screens) explaining what a thought challenge is, with the sloth.
- States clearly that all data stays on the device.
- A note that the app is not a replacement for professional help, plus a pointer to crisis resources. **[Decision needed: content per language/region]**

---

## 4. Offline speech-to-text — feasibility

Dictation must run **on the device only**. "Speech-to-text" here means transcription, not translation between languages.

### Option A — Platform on-device recognisers (recommended first step)
- **iOS:** `SFSpeechRecognizer` with `requiresOnDeviceRecognition = true`. Supports English, German, and Portuguese on-device on recent iOS versions.
- **Android:** `SpeechRecognizer` in on-device mode (`createOnDeviceSpeechRecognizer`, Android 13+), or `EXTRA_PREFER_OFFLINE` on older versions. The user may need to download the language pack.
- The default Android/iOS recognisers **may use the cloud** unless on-device mode is forced. The implementation must enforce on-device mode and disable dictation rather than fall back to the network.
- RN library candidate: `expo-speech-recognition`. It exposes the on-device options and needs an Expo dev build.

### Option B — Bundled model (e.g. Whisper via `whisper.rn`, or Vosk)
- Fully self-contained and identical on both platforms.
- Costs: app size grows by tens to hundreds of MB, and transcription is slower on older phones.

### Requirement
- Dictation is an **optional enhancement**. Every input must work fully by typing. Hide the mic button when on-device recognition isn't available for the current language.

---

## 5. Suggested technical stack

| Concern | Suggestion |
|---|---|
| Framework | React Native with **Expo** (dev builds, since native modules are needed) + TypeScript |
| Navigation | `expo-router` or React Navigation |
| Local storage | `expo-sqlite` (relational data: thoughts, evidence, patterns). Consider encryption at rest (SQLCipher) **[Decision needed]** |
| i18n | `i18next` + `react-i18next`; `expo-localization` for the device language. One JSON file per language |
| Notifications | `expo-notifications` (local scheduling only) |
| Speech-to-text | `expo-speech-recognition` (on-device) — see §4 |
| State | React state/context, or a light store (e.g. Zustand) |
| Testing | Jest + React Native Testing Library |

Notes:
- Thinking-pattern names, explanations, and examples live in the translation files, not in the database. The database stores only stable pattern IDs (e.g. `catastrophising`).
- **[Decision needed]** OS backups (iCloud/Google device backup) may copy app data. Decide whether to exclude the database from backups to honour "no cloud" strictly.

---

## 6. Data model (draft)

```
Thought
  id, createdAt, updatedAt
  text
  initialBelief        (0–100)
  status               (saved | in_progress | challenged)
  alternativeThought   (nullable)
  finalBelief          (nullable, 0–100)   -- belief in the original thought after the challenge
  alternativeBelief    (nullable, 0–100)   -- optional
  currentStep          (for resuming drafts)

Evidence
  id, thoughtId
  side                 (for | against)
  text
  weight               (1–100)
  order

ThoughtPattern
  thoughtId, patternId   (patternId = stable key, e.g. "catastrophising")

Reminder
  id, time (HH:mm), weekdays[], enabled, notificationIds[]

Settings
  language, onboardingDone, (appLock, ...)
```

---

## 7. Possible future ideas (out of scope for v1)
- Record situation and emotions with intensity (classic CBT thought-record columns).
- Simple local insights: most frequent thinking patterns, average belief reduction.
- More languages, e.g. Esperanto (deferred from v1). Platform on-device speech recognisers likely don't support it, so dictation would need a bundled model or be text-only. `Intl` date/number formatting for `eo` may also need a fallback.
- Exporting a thought record as PDF to share with a therapist.

---

## 8. Open decisions summary
1. Local export/import for device migration.
2. App lock and encryption at rest.
3. Excluding data from OS cloud backups.
4. Crisis/disclaimer content per language.
