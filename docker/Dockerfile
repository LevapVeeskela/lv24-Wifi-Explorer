# syntax=docker/dockerfile:1
#
# Headless LV24 WiFi Explorer image: the `lv24-wifi` CLI plus the
# `lv24-wifi-mcp` stdio server. The Electron and Flutter UIs are not included.
#
# Built and pushed only by the manual `.github/workflows/ghcr-publish.yml`
# workflow (workflow_dispatch, linux/amd64, no QEMU, zero spend).
#
#   docker build -f docker/Dockerfile -t ghcr.io/levapveeskela/lv24-wifi-explorer:dev .
#   docker run --rm ghcr.io/levapveeskela/lv24-wifi-explorer providers
#   docker run --rm ghcr.io/levapveeskela/lv24-wifi-explorer scan --provider demo
#   docker run -i --rm ghcr.io/levapveeskela/lv24-wifi-explorer mcp
#
# The `demo` provider is deterministic and needs nothing from the host.
# Live Linux scans need NetworkManager (`nmcli`) and D-Bus on the host; this
# image does not ship nmcli, so run live scans on the host (or extend this file).
# Vendor names in MCP output are optional: mount the OUI registry and point
# LV24_OUI_REGISTRY at it (see docs/PACKAGES.md).

ARG NODE_VERSION=22

# ---------- build: workspace install + tsc output for core/backend/cli/mcp ----------
FROM node:${NODE_VERSION}-bookworm-slim AS build

ENV YARN_VERSION=1.22.22
WORKDIR /src

# The Node images ship a Corepack shim at /usr/local/bin/yarn, so `npm i -g yarn`
# would fail with EEXIST; activate the pinned Yarn 1 release instead.
RUN corepack enable \
 && corepack prepare "yarn@${YARN_VERSION}" --activate \
 && yarn --version

# Manifests first so the dependency layer survives source-only changes.
COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/core/package.json packages/core/
COPY packages/backend/package.json packages/backend/
COPY packages/cli/package.json packages/cli/
COPY packages/mcp/package.json packages/mcp/
COPY packages/web/package.json packages/web/
COPY packages/desktop/package.json packages/desktop/

# --ignore-scripts skips the Electron/esbuild postinstall downloads; only tsc
# (already a root devDependency) is needed to build the headless packages.
RUN yarn install --frozen-lockfile --non-interactive --ignore-scripts

COPY packages ./packages
RUN yarn build:core && yarn build:backend && yarn build:cli && yarn build:mcp

# ---------- deps: production-only tree (no React/MUI/Electron) ----------
FROM build AS deps

RUN mkdir -p /runtime/pkgs \
 && for pkg in core backend cli mcp; do \
      mkdir -p "/runtime/pkgs/${pkg}/dist"; \
      cp -R "/src/packages/${pkg}/dist/." "/runtime/pkgs/${pkg}/dist/"; \
      cp "/src/packages/${pkg}/package.json" "/runtime/pkgs/${pkg}/package.json"; \
    done

COPY docker/runtime-manifest.mjs /runtime/runtime-manifest.mjs

# npm (not yarn) is used here on purpose: the four workspace packages are
# `file:` dependencies at their real 1.0.0 version, so npm resolves the
# `@lv24/*` imports of the CLI/MCP to the local builds and never to npmjs.
WORKDIR /runtime
RUN node runtime-manifest.mjs /runtime /src \
 && npm install --omit=dev --ignore-scripts --no-fund --no-audit \
 && rm -f runtime-manifest.mjs package-lock.json

# ---------- runtime ----------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime

ARG VERSION=0.0.0-dev
ARG REVISION=unknown

LABEL org.opencontainers.image.title="LV24 WiFi Explorer CLI" \
      org.opencontainers.image.description="Headless lv24-wifi CLI and lv24-wifi-mcp stdio server" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}" \
      org.opencontainers.image.source="https://github.com/LevapVeeskela/lv24-Wifi-Explorer" \
      org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production \
    PATH="/app/node_modules/.bin:${PATH}"

WORKDIR /app
COPY --from=deps /runtime/ /app/

# Windows checkouts may materialize the script with CRLF, which breaks the
# shebang; normalize and mark executable at build time.
COPY docker/entrypoint.sh /usr/local/bin/lv24-entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/lv24-entrypoint \
 && chmod 0755 /usr/local/bin/lv24-entrypoint

# node:22 images already provide the unprivileged `node` user (uid 1000).
USER node

ENTRYPOINT ["/usr/local/bin/lv24-entrypoint"]
CMD ["providers"]
