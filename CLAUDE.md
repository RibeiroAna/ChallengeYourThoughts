# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A React Native app (iOS + Android) that helps CBT patients record and challenge their thoughts. No code exists yet. **`SPEC.md` is the source of truth for features, flow, and open decisions — read it before implementing anything.** If a task touches an item marked **[Decision needed]** there, ask the user instead of guessing.

## Hard constraints

- **No network use with user data.** No login, backend, cloud sync, remote analytics, or cloud speech recognition. Everything is stored locally. Check new dependencies for this.
- **All user-facing strings are translated** (en, de, pt-BR). Never hard-code UI text.
- Mascot media: use `assets/mascot/` only, never `design/` (source originals). Sloth videos have an opaque `#FDFDFD` background — see SPEC.md §3 Mascot.
- Speech-to-text must run on-device only. Disable it rather than fall back to the cloud. Typing must always work without it.
