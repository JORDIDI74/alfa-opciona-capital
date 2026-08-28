# syntax=docker/dockerfile:1
#
# Railway builds this image from the repository root. The app itself lives in
# `marshall-road-trip/`; the ALFA static page at the root is not part of it.

FROM node:22.22.2-slim AS deps
WORKDIR /app
# The lockfile is optional so a fresh checkout still builds; CI commits one
# (see .github/workflows/ci.yml) and `npm ci` takes over from there.
COPY marshall-road-trip/package.json marshall-road-trip/package-lock.jso[n] ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

FROM node:22.22.2-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY marshall-road-trip/ ./
RUN npm run build

FROM node:22.22.2-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# `output: "standalone"` emits the server plus only the dependencies it traced.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# Railway injects PORT; the standalone server reads PORT and HOSTNAME.
CMD ["node", "server.js"]
