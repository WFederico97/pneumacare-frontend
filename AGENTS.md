# AGENTS.md — pneumacare-frontend

## Stack

- **Angular 21.2** (`@angular/build` `^21.2.12`), standalone components, no `NgModule`s
- **TypeScript 5.9** — `strict: true`, `strictTemplates: true`, `noImplicitReturns: true`
- **Tailwind CSS v4** (`tailwindcss ^4.3.0`) + `@tailwindcss/postcss ^4.3.0`
- **RxJS 7.8** — HTTP layer only; prefer Angular Signals for local UI state
- **Builder**: `@angular/build:application` (esbuild + Lightning CSS, **not** webpack)
- **Package manager**: `npm` (pinned to `11.7.0` via `packageManager` field)

## Developer Commands

```bash
# Start dev server (proxies /api → http://localhost:8080)
npm start                   # or: ng serve

# Production build (outputs to dist/pneumacare-frontend/browser/)
npm run build               # or: ng build

# Development build with watch
npm run watch               # or: ng build --watch --configuration development
```

No test runner is configured (`skipTests: true` everywhere); `ng test` is a no-op.

## Project Structure

```
src/
├── app/
│   ├── app.ts              ← root component (inline template, no app.html)
│   ├── app.config.ts       ← ApplicationConfig with all providers
│   ├── app.routes.ts       ← top-level Routes array
│   ├── core/               ← singleton services, models, interceptors, guards
│   │   ├── models/         ← TypeScript interfaces / types
│   │   └── services/       ← @Injectable({ providedIn: 'root' }) services
│   └── <feature>/          ← one folder per page/bounded context (e.g. home/)
│       ├── <feature>.ts
│       ├── <feature>.html
│       └── <feature>.css
├── index.html              ← has class="dark" on <html>; title = "PneumaCare"
├── main.ts                 ← bootstrapApplication entry point
└── styles.css              ← global Tailwind entry point
```

Add new bounded-context feature folders as siblings to `core/` and `home/`.

## Angular Conventions (Angular 21)

### File naming
- Component files use **no `.component.` infix**: `home.ts`, `home.html`, `home.css`
- Class names match the file: `home.ts` → `export class Home`
- Services: `health.service.ts` → `export class HealthService`
- Models/interfaces: `health.model.ts` — plain `.ts` file, no class decorator

### Standalone components
Every component, directive, and pipe **must** be standalone. Never create or import `NgModule`s.

```typescript
@Component({
  selector: 'app-example',
  imports: [CommonModule, RouterLink],   // explicit imports, no shared modules
  templateUrl: './example.html',
  styleUrl: './example.css',
})
export class Example { }
```

### Dependency injection
Always use the `inject()` function. **Never** use constructor injection.

```typescript
// ✅ correct
export class Home {
  private readonly healthService = inject(HealthService);
}

// ❌ wrong
constructor(private healthService: HealthService) { }
```

### Signals for state
Use Angular Signals for all local component state. Do **not** use `BehaviorSubject` or `Subject` for UI state.

```typescript
readonly isLoading = signal(true);
readonly data      = signal<Foo | null>(null);

// update
this.isLoading.set(false);
this.data.set(response.data);
```

Use RxJS Observables only for HTTP calls and stream-based operations.

### Control flow syntax
Use the **built-in control flow** (`@if`, `@else`, `@for`, `@switch`). Do **not** use structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`).

```html
<!-- ✅ correct -->
@if (isLoading()) {
  <span>Loading…</span>
} @else if (data()) {
  <span>{{ data()?.name }}</span>
}

<!-- ❌ wrong -->
<span *ngIf="isLoading()">Loading…</span>
```

### `host` binding
Prefer `host: { class: 'block' }` on the `@Component` decorator for host-element styling over a wrapping `<div>`.

### `app.html` / `app.css`
`src/app/app.html` and `src/app/app.css` are **dead files** (Angular CLI scaffold artifacts). `app.ts` uses an inline template (`template: '<router-outlet />'`). Do not edit these files; ignore them.

## Tailwind CSS v4 — Critical Rules

### PostCSS config format
Angular 21's `@angular/build` **only reads `postcss.config.json` or `.postcssrc.json`**.
Files named `postcss.config.js`, `postcss.config.mjs`, or `postcss.config.cjs` are **silently ignored**.

The correct config is at the project root:
```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

### No `tailwind.config.*`
Tailwind v4 is zero-config. There is **no** `tailwind.config.js`. All configuration lives in `src/styles.css` via `@import`, `@source`, `@theme`, and `@custom-variant`.

### `@source` directives are required
Angular's esbuild pipeline processes CSS files in isolation; Tailwind's auto-detection cannot find templates. **Always declare `@source` paths** in `src/styles.css` when adding new source directories:

```css
@source "./app/**/*.{ts,html}";
@source "./main.ts";
```

Paths are relative to `src/styles.css`.

### No `@apply` in `@layer base`
`@apply` is unreliable inside user-authored `@layer base` blocks in Tailwind v4. Use CSS custom properties from the generated theme instead:

```css
/* ✅ correct */
@layer base {
  html { background-color: var(--color-slate-950); }
}

/* ❌ wrong */
@layer base {
  html { @apply bg-slate-950; }
}
```

`@apply` is fine inside component stylesheets or `@utility` blocks.

### Dark mode
Dark mode is **always forced on**. `<html class="dark">` is set in `index.html`.
The variant is declared in `src/styles.css` as:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Use `dark:` utilities in templates normally — they are always active.

## TypeScript Rules

- **`strict: true`** is non-negotiable. Never add `// @ts-ignore` or `as any` casts.
- All component properties holding signals or injected services should be `readonly`.
- Interface files in `core/models/` mirror backend DTOs. Keep field names identical to the JSON keys returned by the API (camelCase as serialized by Jackson).
- Prefer `interface` over `type` alias for object shapes. Use `type` only for unions, intersections, and mapped types.

## Adding a New Feature Page

1. Create `src/app/<feature>/` with `<feature>.ts`, `<feature>.html`, `<feature>.css`
2. Register the route in `src/app/app.routes.ts`
3. If the feature needs an HTTP service, create `src/app/core/services/<feature>.service.ts` and a matching model in `src/app/core/models/<feature>.model.ts`
4. Run `npm run build` to verify bundle stays under 2 MB (warning at 1 MB)

## Bundle Budget

| Type | Warning | Error |
|---|---|---|
| Initial (JS + CSS) | 1 MB | 2 MB |
| Any component style | 4 kB | 8 kB |

Current baseline: ~239 kB initial (12 kB CSS + 227 kB JS).

## Dev Proxy

`proxy.conf.json` forwards all `/api/*` requests to `http://localhost:8080`.
This means the frontend **never hardcodes the backend URL** in source. Always use relative paths like `/api/health`.

## Known Dead / Incomplete Files

| File | Status |
|---|---|
| `src/app/app.html` | Dead — Angular CLI scaffold artifact; `app.ts` uses inline template |
| `src/app/app.css` | Empty — kept to satisfy Angular CLI defaults |

## CI

Two workflow files are configured in `.github/workflows/`:

| File | Trigger | Purpose |
|---|---|---|
| `build.yml` | push / PR → `main`, `develop` | `npm ci` + `npm run build` (production). TypeScript errors, template errors, or budget violations exit non-zero and block merge. `timeout-minutes: 5`. |
| `sast.yml` | push / PR → `main`, `develop` + weekly schedule | CodeQL TypeScript/JavaScript analysis (`security-and-quality` queries) + dependency review on PRs (blocks HIGH/CRITICAL CVEs). |

No GitHub Secrets are required — `GITHUB_TOKEN` is sufficient for both workflows.

To run the same checks locally:
```bash
npm ci && npm run build   # mirrors the build.yml check
```
