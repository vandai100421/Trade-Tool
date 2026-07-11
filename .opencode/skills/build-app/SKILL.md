---
name: build-app
description: Use when building, running, or deploying the Next.js web app. Triggers on phrases like "build app", "build", "chạy app", "npm run", "deploy", "production", "dev server", or when running npm/next commands.
---

# Build App Skill

Workflow for building and running the Trading Signals Next.js web app.

## Prerequisites

### 1. Check Node.js

```bash
node --version
```

Requires Node.js >= 18.17. If not found, install from https://nodejs.org.

### 2. Install dependencies

```bash
npm install
```

Run in project root. This installs all dependencies from `package.json`.

### 3. Environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in:
- `TWELVE_DATA_API_KEY` — optional, can enter via Settings page instead
- `RESEND_API_KEY` — required for email notifications (server-side only)
- `EMAIL_TO` — optional, can enter via Settings page instead

## Pre-build checks

### 4. Type check

```bash
npm run typecheck
```

Fix ALL TypeScript errors before building.

### 5. Lint

```bash
npm run lint
```

Fix all ESLint warnings and errors.

### 6. Run tests (if configured)

```bash
npm test
```

Ensure all tests pass.

## Build commands

### 7a. Dev server

```bash
npm run dev
```

- Runs at `http://localhost:3000`
- Hot reload on file changes
- Best for development

### 7b. Production build

```bash
npm run build
```

Output: `.next/` directory.

### 7c. Run production server

```bash
npm run start
```

Runs the production build at `http://localhost:3000`.

## Configuration

### Twelve Data API key

Two options:
1. **Via Settings page** (recommended): Open app → Settings → enter API key → Save. Stored in localStorage.
2. **Via .env.local**: Set `TWELVE_DATA_API_KEY` in `.env.local`. Note: this makes it available server-side only, not useful for client-side polling. Prefer option 1.

### Resend API key

MUST be in `.env.local` (server-side only, never exposed to browser):

```
RESEND_API_KEY=re_xxxxxxxx
```

The Next.js API route at `/api/email` reads this key and proxies email requests to Resend.

## Common issues

### WebSocket connection failed (BTC price not updating)
- Check browser console for WebSocket errors
- Check network/firewall allows `wss://stream.binance.com:9443`
- Some corporate networks block WebSocket — try different network

### Twelve Data 401/403
- API key not set → open app → Settings → enter Twelve Data API key
- API key invalid → verify at twelvedata.com
- Quota exceeded → check API Usage bar in Settings

### Notifications not showing
- Browser blocked notifications → check browser settings → allow notifications for localhost:3000
- `Notification.permission` might be 'denied' → user must reset in browser settings

### Email not sending
- `RESEND_API_KEY` not set in `.env.local` → check file exists and key is valid
- Check server logs for Resend API errors
- Verify email address is valid

### Build failed: TypeScript errors
- Run `npm run typecheck` to see all errors
- Common: missing types for `lightweight-charts` → ensure `npm install` ran
- Import path errors → use `@/` alias for `src/` imports

### localStorage not working
- Ensure code checks `typeof window !== 'undefined'` before accessing localStorage
- Server-side rendering doesn't have localStorage — use `useEffect` for hydration

## Post-build

### 8. Test in browser

1. `npm run dev` → open `http://localhost:3000`
2. Go to Settings → enter Twelve Data API key → Save
3. Go back to Home → verify 3 tabs appear
4. Select BTC/USDT → verify candles load + signal card shows
5. Select XAU/USD → verify polling works (wait 30s for first update)
6. Check browser console for any errors

### 9. Deploy

Common deployment options:
- **Vercel** (recommended for Next.js): `npm i -g vercel && vercel`
- **Self-hosted**: `npm run build && npm run start` on your server
