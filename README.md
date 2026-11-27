# Adxens Beta Website

Astro + [EmDash](https://docs.emdashcms.com/) port of the Adxens V2 marketing site. The homepage is Astro templates with React islands; legal pages, FAQ, and contact/CTA settings are edited in EmDash.

## Requirements

- Node.js **22.16+** (22.23.4 recommended)
- [pnpm](https://pnpm.io/)

## Getting started

```bash
pnpm install
pnpm exec emdash seed seed/seed.json --on-conflict=update   # schema + Terms/Privacy/FAQ/settings
pnpm dev
```

1. Open http://localhost:4321/_emdash/admin (or use the printed **Dev bypass** URL in the terminal to skip passkeys in local dev).
2. Complete setup if prompted; seed content is already in `data.db` after the seed command.
3. Marketing site: http://localhost:4321

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview build |
| `pnpm start` | Run Node standalone server from `dist` |
| `pnpm typecheck` | `astro check` |

## Content model (EmDash)

| Collection | Purpose |
| --- | --- |
| `pages` | Legal docs (`terms-and-conditions`, `privacy-policy`) |
| `site_settings` | Contact links, CTA, beta badge, FAQ repeater (drag-reorder in admin) |
| `posts` | Optional blog (template leftover) |

Admin: `/_emdash/admin`

## Routes

| Route | Notes |
| --- | --- |
| `/` | Marketing homepage |
| `/terms-and-conditions` | EmDash page |
| `/privacy-policy` | EmDash page |
| `/join`, `/join/eligible`, `/join/ineligible` | Redirect to `/#apply` |
| `/robots.txt` | Allow `/`, disallow `/_emdash/` + `/search`, links sitemap |
| `/sitemap.xml` | Home + legal pages |
| `/llms.txt` | AEO summary + FAQ for answer engines |

## SEO / AEO

- Homepage: canonical, OG/Twitter via `EmDashHead`, `Organization` + `WebSite` + `WebPage` + `FAQPage` JSON-LD
- Legal pages: EmDash SEO panel (`supports: ["seo"]`) with code defaults; override title/description/canonical/noIndex in admin
- Set public origin before launch: `EMDASH_SITE_URL` or `SITE_URL` (also wired into `astro.config` `site` + EmDash `siteUrl`)
- Turn **Staging mode** off in Admin → Settings (or seed `settings.staging: false`) so pages are indexable

## Environment

Copy [`.env.example`](.env.example) to `.env` for local secrets. Do not commit `.env`.

| Variable | Purpose |
| --- | --- |
| `EMDASH_SITE_URL` | Public origin (also sets Astro `site` + EmDash `siteUrl`) |
| `EMDASH_ENCRYPTION_KEY` | Encrypts admin/plugin secrets (`pnpm exec emdash secrets generate`) |
| `DATABASE_PATH` | SQLite file path (default `./data.db`; use volume path in prod) |
| `UPLOADS_DIR` | Media directory (default `./uploads`; use volume path in prod) |
| `EMDASH_OAUTH_GOOGLE_CLIENT_ID` / `EMDASH_OAUTH_GOOGLE_CLIENT_SECRET` | Google admin login |
| `EMAIL_SMTP_*` | Built-in SMTP for magic links / invites |

Production Node does **not** auto-load `.env`. Inject vars via the platform secret manager, or start with `node --env-file=.env ./dist/server/entry.mjs`.

Google OAuth redirect URI:

`https://<public-host>/_emdash/api/auth/oauth/google/callback`

DevOps: mount a writable local/block volume covering `DATABASE_PATH` and `UPLOADS_DIR` (e.g. `/data` → `/data/emdash.db` + `/data/uploads`). The process needs write access to the DB directory for SQLite WAL sidecars.

## Notes

- Local SQLite DB: `data.db` (gitignored) unless `DATABASE_PATH` is set
- Media uploads: `uploads/` unless `UPLOADS_DIR` is set
- Do not commit secrets
