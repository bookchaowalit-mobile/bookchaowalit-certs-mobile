# Certs — Mobile

React Native mobile app (Expo) for **Certs**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Tech Stack

- **Framework:** Expo SDK 53 + Expo Router
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **UI:** React Native + Ionicons

## Features

- **Certificate tracker** (home tab): certifications sorted by urgency
  (expired → expiring within 60 days → valid → no expiry) with
  "expires in N days" text and color-coded status.
- **Summary bar** counting certificates per status.
- **Add / delete** certificates with validated dates (real calendar dates,
  expiry after issue date).
- Starts with sample certificates held in memory (`lib/certs.ts`);
  persistence and expiry reminders are on the backlog.

## Getting Started

```bash
npm ci
npx expo start
```

## Validation

```bash
npm run validate   # expo lint + tsc --noEmit + vitest
npx expo export --platform android --output-dir dist   # bundle smoke check
```

Pure logic lives in `lib/` and is unit-tested with Vitest (`lib/*.test.ts`).
CI (`.github/workflows/build.yml`) runs all of the above and fails on errors;
the EAS preview build is owner-triggered (`workflow_dispatch`) and needs the
`EXPO_TOKEN` secret plus the committed `eas.json`.

## Build

```bash
# Android
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios --profile preview
```

## Related

- **Frontend:** [bookchaowalit-website/certs-frontend](https://github.com/bookchaowalit-website/certs-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
