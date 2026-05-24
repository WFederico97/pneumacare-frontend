# ── Stage 1: Build ────────────────────────────────────────────────────────────
# npm@11.7.0 requires Node 22.
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies with a clean, reproducible install (uses package-lock.json).
COPY package*.json ./
RUN npm ci

# Copy source and run the production build.
# Angular enforces bundle budgets (warning 1 MB / error 2 MB) — the build fails
# if any budget is exceeded, acting as an automated bundle-size gate.
COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Remove the default nginx static assets.
RUN rm -rf /usr/share/nginx/html/*

# Copy the Angular production build output.
# angular.json outputPath: dist/pneumacare-frontend  (browser/ sub-dir for the app shell)
COPY --from=build /app/dist/pneumacare-frontend/browser /usr/share/nginx/html

# Custom nginx config for Angular SPA client-side routing.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
