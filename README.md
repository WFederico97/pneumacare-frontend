# Pneumacare Frontend

> Clinical decision-support UI for ICU respiratory physiotherapy.
> Angular 21.2 · TypeScript 5.9 · Tailwind CSS v4 · Node 22 · nginx

[![Build](https://github.com/WFederico97/pneumacare-frontend/actions/workflows/build.yml/badge.svg)](https://github.com/WFederico97/pneumacare-frontend/actions/workflows/build.yml)
[![SAST](https://github.com/WFederico97/pneumacare-frontend/actions/workflows/sast.yml/badge.svg)](https://github.com/WFederico97/pneumacare-frontend/actions/workflows/sast.yml)

---

## Table of Contents

- [Stack](#stack)
- [Project Structure](#project-structure)
- [Developer Commands](#developer-commands)
- [Docker Compose](#docker-compose)
- [Dockerfile](#dockerfile)
- [CI/CD](#cicd)
  - [build.yml — Build pipeline](#buildyml--build-pipeline)
  - [sast.yml — Static analysis](#sastyml--static-analysis)
- [Angular Conventions](#angular-conventions)
- [Tailwind CSS v4](#tailwind-css-v4)
- [Bundle Budget](#bundle-budget)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21.2 — standalone components, no `NgModule`s |
| Language | TypeScript 5.9 (`strict: true`, `strictTemplates: true`) |
| Builder | `@angular/build:application` — esbuild + Lightning CSS (not webpack) |
| CSS | Tailwind CSS v4 via `@tailwindcss/postcss` (zero-config, no `tailwind.config.js`) |
| State | Angular Signals for UI state; RxJS only for HTTP streams |
| Package manager | npm 11.7.0 (pinned in `packageManager` field) |
| Container | Node 22-alpine (build) → nginx:alpine (serve) |

---

## Project Structure

```
src/
├── app/
│   ├── app.ts              Root component — inline template (<router-outlet />)
│   ├── app.config.ts       ApplicationConfig with all providers
│   ├── app.routes.ts       Top-level Routes array
│   ├── core/
│   │   ├── models/         TypeScript interfaces mirroring backend DTOs
│   │   └── services/       @Injectable({ providedIn: 'root' }) services
│   └── <feature>/          One folder per page / bounded context
│       ├── <feature>.ts
│       ├── <feature>.html
│       └── <feature>.css
├── index.html              <html class="dark"> — dark mode always forced on
├── main.ts                 bootstrapApplication entry point
└── styles.css              Global Tailwind entry (@source declarations required)
```

---

## Developer Commands

```bash
# Install dependencies
npm ci

# Start dev server (proxies /api/* → http://localhost:8080)
npm start           # ng serve → http://localhost:4200

# Production build → dist/pneumacare-frontend/browser/
npm run build       # ng build

# Development build with watch
npm run watch       # ng build --watch --configuration development
```

`npm test` is currently not wired up (it maps to `ng test`, but no Angular `test` target is configured because `skipTests: true` was used). The compilation and Angular template type-check that run during `npm run build` serve as the quality gate.

---

## Docker Compose

`docker-compose.yml` builds the Angular app with the multi-stage `Dockerfile` and serves it via nginx on `http://localhost:4200`.

```bash
docker-compose up -d           # build and start
docker-compose up -d --build   # force rebuild after source changes
docker-compose down            # stop and remove container
```

> For local development with hot-reload use `npm start` (Angular dev server) instead.

---

## Dockerfile

Two-stage build:

**Stage 1 — Build** (`node:22-alpine`):
- `npm ci` — clean, reproducible dependency install from `package-lock.json`
- `npm run build` — TypeScript compilation + Angular template check + production bundle

**Stage 2 — Serve** (`nginx:alpine`):
- Copies `dist/pneumacare-frontend/browser/` to `/usr/share/nginx/html`
- Uses `nginx.conf` for Angular SPA routing (`try_files $uri $uri/ /index.html`), gzip, security headers, and long-lived cache for hashed assets

The container runs as the default nginx user (non-root in recent alpine images) and exposes port `80`.

---

## CI/CD

Two workflow files live in `.github/workflows/`. No sensitive secrets are needed for a static frontend build — all credentials belong to the backend repository.

### `build.yml` — Build pipeline

**Triggers**: push or pull request targeting `main` or `develop`.

| Step | Detail |
|---|---|
| Node 22 + npm cache | Cache keyed on `package-lock.json` |
| `npm ci` | Reproducible install; fails on lock mismatch |
| `npm run build` | TypeScript errors, template errors, or bundle budget overruns exit non-zero and block merge |
| Upload `dist/` artifact | Retained 7 days for inspection |

`timeout-minutes: 5` enforces the 5-minute execution threshold. Concurrent runs for the same branch are cancelled automatically.

### `sast.yml` — Static analysis

**Triggers**: push or PR to `main`/`develop`, plus a weekly scheduled scan (Monday 02:00 UTC).

| Job | Tool | Purpose |
|---|---|---|
| `codeql` | GitHub CodeQL (`security-and-quality`) | Scans TypeScript/JavaScript source for vulnerabilities and code-quality issues; uploads SARIF to the Security tab |
| `dependency-review` | `actions/dependency-review-action@v4` | PRs only — blocks merge if any new npm dependency introduces a HIGH or CRITICAL CVE |

> **Note**: No GitHub Secrets are required for these workflows. `GITHUB_TOKEN` (auto-provided by Actions) is sufficient for CodeQL uploads and dependency review.

---

## Angular Conventions

- **No constructor injection** — always use `inject()`.
- **Standalone only** — never create or import `NgModule`s.
- **Signals** for all local UI state; RxJS Observables for HTTP only.
- **Built-in control flow** (`@if`, `@for`, `@switch`) — never `*ngIf` / `*ngFor`.
- **File naming**: no `.component.` infix — `home.ts` → `export class Home`.

See `AGENTS.md` for the full coding conventions reference.

---

## Tailwind CSS v4

- Zero-config — no `tailwind.config.js`.
- Config lives in `src/styles.css` via `@import "tailwindcss"`, `@source`, `@theme`, and `@custom-variant`.
- PostCSS config **must** be `postcss.config.json` (Angular 21's esbuild ignores `.js` / `.mjs` variants).
- Dark mode is always forced on via `<html class="dark">` in `index.html`.
- New source directories must be declared with `@source "./app/<feature>/**/*.{ts,html}";` in `styles.css`.

---

## Bundle Budget

| Type | Warning | Error |
|---|---|---|
| Initial (JS + CSS) | 1 MB | 2 MB |
| Any component style | 4 kB | 8 kB |

Current baseline: ~239 kB initial (12 kB CSS + 227 kB JS). Run `npm run build` locally to verify after adding new features.
