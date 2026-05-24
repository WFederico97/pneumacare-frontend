# ─── Build stage ──────────────────────────────────────────────────────────────
# npm@11.7.0 requires Node 22.
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first (layer-cached until package files change).
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and run the production build.
# Angular enforces bundle budgets (warning 1 MB / error 2 MB) — the build
# fails if any budget is exceeded, acting as an automated bundle-size gate.
COPY . .
RUN npm run build

# ─── Serve stage ──────────────────────────────────────────────────────────────
FROM nginx:alpine AS final

# Runtime defaults; override via environment variables or docker-compose.
# BACKEND_HOST / BACKEND_PORT — backend service hostname and port reachable
#   from within the Docker network (e.g. "app" and "8080" in compose.yaml).
# OAUTH2_ISSUER_URI — included in the CSP connect-src header so the browser
#   can reach the OAuth2 token endpoint directly.
ENV BACKEND_HOST=localhost
ENV BACKEND_PORT=8080
ENV OAUTH2_ISSUER_URI=http://localhost:9000

# angular.json outputPath: dist/pneumacare-frontend (browser/ sub-dir for the app shell).
COPY --from=builder /app/dist/pneumacare-frontend/browser/ /usr/share/nginx/html/

# Store the template outside nginx's auto-processing directories to avoid
# nginx's own $uri, $host, etc. being wiped by a full-env envsubst pass.
COPY nginx.conf /etc/nginx/nginx.conf.template

EXPOSE 80

# At startup, substitute ONLY our three variables (explicit list prevents
# envsubst from corrupting nginx built-in variables such as $uri, $host,
# $proxy_add_x_forwarded_for, etc.), then launch nginx in the foreground.
CMD ["/bin/sh", "-c", \
  "envsubst '$BACKEND_HOST $BACKEND_PORT $OAUTH2_ISSUER_URI' \
     < /etc/nginx/nginx.conf.template \
     > /etc/nginx/conf.d/default.conf \
   && nginx -g 'daemon off;'"]
