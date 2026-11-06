# Down Dog roadmap

Last updated: November 5, 2026

## Direction

Grow Down Dog from a guided stretching app into a simple daily home for movement, nutrition, focused work, and wellbeing. Keep the experience calm, quick to use on an iPhone, and useful without requiring every metric to be logged.

This is the proposed delivery order. Everything below is planned, not yet implemented; release dates and implementation choices will be set as each phase is scoped.

## Current foundation

- Seven 18-minute stretching routines with position images, spoken instructions, and a closing meditation.
- Offline practice, transition cues, and a completion announcement.
- An end-of-session check-in for healthy diet, procrastination, and a daily rating.
- Completion history, recent activity, and daily/best streaks saved in the current browser on the current device.

Today, a session is saved after its check-in is submitted. Both Yes answers are required for the streak; either No breaks it for that day. Changes to these rules should be an explicit product decision as tracking expands.

## Phase 1 — Richer daily tracking

Create a daily overview where users can log and review activity independently of completing a stretching session. Support adding, editing, and deleting entries, including entries for previous days.

### Nutrition

- Log meals and snacks with food names, portions, and meal times.
- Track calories, protein, sugar, carbohydrates, fat, and fiber, with clear units.
- Show per-meal values and daily totals; allow partial entries without treating unknown values as zero.
- Support saved meals and repeat entries to make everyday logging faster.
- Start with manual entry; evaluate food search and barcode scanning as later additions.
- Allow optional personal targets without requiring a weight-loss goal.

### Daily workouts

- Record workout type, duration, intensity, and estimated calories burned.
- Include completed stretching sessions in the daily activity view without duplicate logging.
- Distinguish manually entered calorie estimates from imported device estimates and record their source.
- Keep calories consumed and calories burned visible as separate measures.

### Daily deep work

- Plan focused work blocks with a task, intended duration, and optional recurring schedule.
- Provide a timer with start, pause, resume, and finish controls.
- Log actual focused minutes, completed blocks, and optional interruptions or notes.
- Compare planned blocks with completed work for the day.

### Stress levels

- Add a quick 1–5 stress check-in, labeled from very low to very high.
- Allow multiple timestamped check-ins per day with optional context or notes.
- Keep stress separate from the existing overall day rating.

**Milestone:** A user can review a full day of meals, exercise, focused work, and stress in one place. Existing session history remains intact, and new tracking works offline.

## Phase 2 — Background music for stretching and meditation

- Offer a small selection of calm music and ambient sound, with silence as an option.
- Let users choose sound separately for stretching and the closing meditation.
- Provide independent music and instruction volume controls.
- Lower the music automatically during spoken instructions and keep transition and completion cues audible.
- Use smooth loops and fades, and remember the user's preferences.
- Bundle or download music with appropriate distribution rights for offline listening.
- Test playback, interruptions, pause/resume, and audio routing on the user's iPhone in Safari.

Background music means music underneath an active practice. Lock-screen playback is a separate capability to evaluate for the native app; the current web app pauses when hidden or locked.

**Milestone:** Music plays throughout an active session without obscuring instructions or the ending cue, including offline.

## Phase 3 — User sign-up, authentication, and sync

### Sign-up and onboarding

- Add account creation, account verification, and a short first-use setup.
- Let users select which tracking areas matter to them and set optional goals.
- Offer to import existing local session history into their account, preserving dates and check-in answers without creating duplicates.
- Keep a clear path for trying the app before creating an account.

### Authentication and account management

- Add sign-in, sign-out, account recovery, and clear expired-session handling.
- Choose the initial sign-in method during implementation; evaluate email-based access and Sign in with Apple.
- Store each user's records privately and sync them across signed-in devices.
- Retain offline entry and reconcile changes when connectivity returns.
- Provide data export, account deletion, and clear information about what is stored and synced.

This phase introduces a backend and shared data model to support both the web app and the future iOS app.

**Milestone:** A user can create an account, bring their existing history with them, and see the same records on another signed-in device without data loss or duplication.

## Phase 4 — Weekly, monthly, and annual reporting

- Add weekly, monthly, and annual views with previous-period comparisons.
- Report stretching completions, active days, and streaks.
- Report logged nutrition totals and averages, including calories, protein, and sugar.
- Report workout frequency, duration, and estimated calories burned.
- Report deep work minutes, completed blocks, and planned-versus-completed activity.
- Report stress trends alongside the separate overall day rating.
- Allow users to inspect the entries behind a summary and export their records.
- Clearly distinguish missing data from zero activity, show logging coverage, and handle local dates consistently.

Reporting depends on the structured records from Phase 1. Account sync makes reports available across devices; earlier local history should remain usable. Do not invent nutrition, workout, focus, or stress details for historical sessions that lack them.

**Milestone:** Each reporting period produces understandable, accurate summaries that agree with the underlying entries, including when logging is incomplete.

## Phase 5 — Native iOS app

- Build a native iOS experience for guided practice, daily tracking, and reports using the same account and data model as the web app.
- Support offline sessions and logging, followed by reliable sync.
- Design and test audio behavior for locked screens, background playback, interruptions, headphones, and calls.
- Add optional reminders for stretching, workouts, deep work, and check-ins, with user-controlled schedules.
- Evaluate optional Apple Health integration for workout and energy data, with explicit permissions and duplicate prevention.
- Test accessibility and the main flows on physical iPhones, including the user's iPhone 17.
- Release a TestFlight beta, collect feedback, and prepare an App Store release.

**Milestone:** Users can complete their daily routine in the native app, retain their web history, and move between devices consistently.

## Decisions to settle before implementation

- Whether stretching, nutrition, and deep work should have independent streaks, and how the current combined streak should evolve.
- Which nutrition fields and goals belong in the first release.
- Whether workout calories begin as manual entries only or include an integration.
- The initial authentication method, backend, and account migration flow.
- The music catalog, distribution rights, and offline download size.
- The scope of Apple Health integration and the first native iOS release.

Each phase should be broken into implementation tasks with acceptance checks before development begins. This roadmap does not change current app behavior.
