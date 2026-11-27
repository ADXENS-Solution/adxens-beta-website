# syntax=docker/dockerfile:1
# Image du CMS help (EmDash sur Astro, serveur Node standalone).
# Construite par .github/workflows/cd-production.yml (branche prod) et
# déployée sur le VPS 1 par le dépôt adxens-platform (gitops/apps/help).
#
# Les trois valeurs ci-dessous sont lues par astro.config.mjs AU BUILD et
# figées dans l'image. Les secrets (clé de chiffrement, Google, SMTP) ne sont
# PAS ici : ils sont lus au démarrage, depuis Vault.
#
# Même famille d'image (Debian, glibc) pour le build et l'exécution : le
# moteur SQLite (@libsql/client) a un module natif.

ARG NODE_IMAGE=node:22-slim
ARG PNPM_VERSION=11.1.0

# --- Dépendances de production seulement ---------------------------------
FROM ${NODE_IMAGE} AS deps
ARG PNPM_VERSION
WORKDIR /app
RUN npm install -g "pnpm@${PNPM_VERSION}" && npm cache clean --force
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# --- Build ---------------------------------------------------------------
FROM ${NODE_IMAGE} AS build
ARG PNPM_VERSION
WORKDIR /app
RUN npm install -g "pnpm@${PNPM_VERSION}" && npm cache clean --force
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG EMDASH_SITE_URL
ARG DATABASE_PATH=/data/emdash.db
ARG UPLOADS_DIR=/data/uploads
RUN test -n "$EMDASH_SITE_URL" || { echo "EMDASH_SITE_URL manquant (build-arg)"; exit 1; } \
 && EMDASH_SITE_URL="$EMDASH_SITE_URL" DATABASE_PATH="$DATABASE_PATH" UPLOADS_DIR="$UPLOADS_DIR" pnpm build

# --- Exécution -----------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321
WORKDIR /app
COPY --from=deps  --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/seed ./seed
COPY --from=build --chown=node:node /app/.emdash ./.emdash
# Dossiers des données : remplacés par les disques en production.
RUN mkdir -p /data/uploads && chown -R node:node /data
USER 1000:1000
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
