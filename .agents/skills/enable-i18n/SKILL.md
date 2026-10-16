---
name: enable-i18n
description: >
  Enable next-intl-based i18n in the shop template — locale-prefixed URLs,
  per-locale message catalogs, and a locale switcher. Use when the user wants
  "locale URLs", "multi-language", or "i18n" without Shopify Markets
  integration. For full Shopify Markets multi-region commerce (region-aware
  pricing, inventory, payments), use `enable-shopify-markets` instead — this
  skill is the routing/i18n layer only.
---

# Enable i18n (next-intl, no Markets)

Add next-intl so the storefront serves locale-prefixed URLs (`/en-US/products/foo`), loads per-locale message catalogs, and exposes a copy-language switcher. The default is one deployment with clean URLs, inline component copy with reusable functions in `lib/content/index.ts`, and `shopConfig.localization = { country: "US", language: "EN", locale: "en-US" }`. There is no next-intl dependency, message catalog, `lib/i18n/` directory, or `lib/params/server.ts` locale resolver to reuse in a fresh template.

> **Use `enable-shopify-markets` instead** for regional commerce. This skill translates storefront copy and adds routing; it must not infer a commerce country from a copy locale or mutate cart buyer country when language changes. Keep Shopify country/language configuration explicit, preserve intentional operation locale/cache inputs, and always display currency from Shopify responses.

## Inspect and preserve the installation

Read scoped `AGENTS.md`, `package.json`, `vite.config.ts`, `src/start.ts`, `src/router.tsx`, `lib/config/index.ts`, `lib/content/index.ts`, `src/routes`, components, and any existing localization files. Trace copy consumers, formatting, SEO, markdown, cart, auth, and chat boundaries before editing. `pnpm build` is `vite build`. `pnpm start` is `node .output/server/index.mjs`.

Choose the migration path from evidence:

- **Fresh simplified template:** introduce next-intl, catalogs, request config, routing, and the locale resolver using the steps below.
- **Already localized or customized:** preserve its next-intl version/configuration, catalogs, translations, rich text, providers, supported locales, domains, prefixes, locale cookies, redirects, and commerce behavior. Fill only missing pieces. Do not replace existing catalogs with template English, move routes twice, or reset the locale list to these examples. If the requested routing conflicts with existing public URLs, obtain a migration decision before changing them.
- **Mixed migration:** inventory inline copy, content functions, and catalogs. Convert only unmigrated consumers and retain modules still in use. Do not delete working translations or collapse locale-sensitive commerce/cache arguments.

Confirm the default copy locale and supported copy locales with the user. In a noninteractive run, report any unresolved choice and stop rather than choosing a routing or translation policy.

## Introduce next-intl and migrate copy

1. On a fresh installation, run `pnpm add next-intl` from the storefront root. Read the installed next-intl request and routing APIs before wiring them. There is no Next config and no `createNextIntlPlugin`. If next-intl already exists, preserve its compatible version rather than reinstalling blindly.
2. Create `lib/i18n/request/server.ts` as described below. Negotiate the locale in `src/start.ts` after Shopify dispatch and Markdown negotiation, and validate it on the `$locale` file route. Do not add `next.config.ts`, `proxy.ts`, or `app/`. Do not enable the agent, auth, BotID, or analytics as part of localization.
3. Inventory inline JSX text, labels in component configuration, template literals, and reusable functions in `lib/content/index.ts`. Create the default catalog from the storefront's actual customized copy, not a template snapshot. Convert functions to equivalent ICU messages with the same parameter names, zero/one/many behavior, number formatting, rich text, and accessibility labels. Do not serialize functions into JSON or build a custom `t()` parser.
4. Create catalogs and explicit loaders for each approved locale. Keep keys and interpolation arguments aligned. Do not present an English fallback as a completed translation; agree on any temporary fallback before enabling that locale publicly.
5. Replace inline server copy and content function calls with `getTranslations()` from `next-intl/server`. Pass translated primitive labels to client leaves when possible. For interactive plurals/interpolation, wrap only the relevant leaf in `NextIntlClientProvider` with the namespaces it uses, then use `useTranslations()` there. Never pass the full catalog from `src/routes/__root.tsx`, and never pass ordinary copy functions across the server/client boundary. Keep `components/ui/` copy-agnostic.
6. Cover error boundaries, not-found screens, metadata, email/contact text, and dynamic announcements as well as visible page headings. Components outside a provider need resolved labels or an explicitly scoped provider. Keep a minimal fallback for global errors that cannot access locale context.
7. Set `<html lang>` and UI number/date formatting from the validated copy locale. Leave `shopConfig.localization.country` and `.language` as deployment commerce settings unless Shopify content translation is explicitly requested and validated. A copy locale such as `fr-FR` does not by itself mean shipping/pricing country `FR`.
8. After all consumers are migrated and checked, remove only unused content functions. Preserve custom copy and existing catalogs. Update the installation's `AGENTS.md` to require aligned locale catalogs and scoped providers now that it is localized.

## Create the locale source of truth

On a fresh installation, create `lib/i18n/index.ts` with the user's approved locales. On an existing installation, extend its current source of truth instead. Routing, sitemap, alternates, and the switcher must read the same list. This list describes copy/routing locales, not a locale-to-currency or commerce-country map.

Example only; replace with the approved list and seed the default from the deployment's formatting locale when appropriate:

```ts
import type { Locale } from "./types";

export const locales = ["en-US", "fr-FR"] as const;
export const defaultLocale: Locale = "en-US";
export const enabledLocales: readonly Locale[] = locales;

export function isEnabledLocale(value: string): value is Locale {
  return enabledLocales.some((locale) => locale === value);
}
```

Define the shared `Locale` contract in `lib/i18n/types.ts`; import it directly wherever it is needed:

```ts
import type { locales } from "./index";

export type Locale = (typeof locales)[number];
```

Use domain/context files for new modules: universal routing configuration in `lib/i18n/routing/index.ts`, client navigation in `lib/i18n/navigation/client.ts`, and server request configuration in `lib/i18n/request/server.ts`. The validated locale is the `$locale` route param. Do not add barrels, forwarding exports, or `next/root-params`. Preserve working paths in an existing customized installation rather than renaming them solely to match these examples.

Validate route params, action inputs, and request payloads against this list. Retain any existing resolver and fallback policy rather than resetting it.

## What this skill turns on

1. `lib/i18n/routing/index.ts` and a locale switcher that uses the storefront router
2. A `$locale` layout route under `src/routes` containing every localized page
3. Locale negotiation in `src/start.ts` after Shopify dispatch and Markdown negotiation
4. Loaders and `beforeLoad` reading `params.locale`
5. Catalogs and `lib/i18n/request/server.ts` loading messages by the validated locale
6. Locale-prefixed canonicals and hreflang alternates in `lib/seo/index.ts`
7. Sitemap entries per locale from `src/routes/sitemap/$shard.ts`
8. Locale-aware Markdown negotiation in `markdownResponse`
9. A copy-language selector without a currency selector

## Routing constraints — read this first

Pages are file routes. The document shell is `src/routes/__root.tsx`. Request handling for Shopify, direct `/refine` 404s, and Markdown lives in `src/start.ts`. Server functions live in `lib/data/server-fn.ts` and `lib/<domain>/action.ts`. The router preloads on intent from `src/router.tsx`. There is no `app/`, `proxy.ts`, `next.config.ts`, Cache Components setting, or `ensureStatic`.

### A. Localized pages sit under `$locale`; documents stay at the root

Move shopper pages under `src/routes/$locale/`. Leave the root route, `src/styles.css`, and these routes unlocalized:

- `src/routes/api/**`
- `src/routes/md/**`
- `src/routes/llms[.]txt.ts`, `src/routes/robots[.]txt.ts`, `src/routes/manifest[.]webmanifest.ts`
- `src/routes/sitemap[.]xml.ts` and `src/routes/sitemap/$shard.ts`
- `src/routes/agent/ucp-profile[.]json.ts`

Do not add a second root document above `$locale`. `beforeLoad` on the locale layout throws `notFound()` from `@tanstack/react-router` when `params.locale` is not enabled.

### B. Locale is a route param, not a request read in the cache

Pass the validated locale into `withCache` keys. Do not read cookies or headers inside `withCache`. Server functions receive locale in their validator. They do not call a root-param getter.

### C. Keep the template `Link`

Do not replace `Link` from `@/components/ui/link` with next-intl's `Link`. The template `Link` preloads on intent. Pass explicitly locale-prefixed hrefs. `src/start.ts` can redirect a legacy unprefixed path, but those redirects must not be the only mechanism keeping navigation in the selected language.

Server redirects use `redirect` from `@tanstack/react-router`:

```ts
import { redirect } from "@tanstack/react-router";

throw redirect({ href: `/${locale}/account/login`, throw: true });
```

Do not import `next/navigation` or `lib/i18n/navigation/client.ts` into a server auth gate.

## Step-by-step

### Step 1: Routing config

Create `lib/i18n/routing/index.ts`:

```ts
import { defineRouting } from "next-intl/routing";
import { defaultLocale, enabledLocales } from "@/lib/i18n";

export const routing = defineRouting({
  locales: enabledLocales, // pulled from lib/i18n/index.ts — never hardcode
  defaultLocale,
  localePrefix: "always",
});
```

Create `lib/i18n/navigation/client.ts`:

```ts
"use client";

import { createNavigation } from "next-intl/navigation";
import { routing } from "@/lib/i18n/routing";

export const { usePathname, useRouter } = createNavigation(routing);
```

> Use this navigation only in the locale switcher. Internal links keep `Link` from `@/components/ui/link`. Client navigation otherwise uses `lib/navigation/client.ts`.

### Step 2: Move shopper routes under `src/routes/$locale/`

Move localized pages under `src/routes/$locale/`. Keep `src/routes/__root.tsx` as the document shell. Include home, search, collections, products, cart, account, blogs, pages, and policies. Do not limit the move to that list.

Leave these unlocalized, beside `$locale`:

- `src/routes/api/**`
- `src/routes/md/**`
- `src/routes/llms[.]txt.ts`, `src/routes/robots[.]txt.ts`, `src/routes/manifest[.]webmanifest.ts`
- `src/routes/sitemap[.]xml.ts`, `src/routes/sitemap/$shard.ts`
- `src/routes/agent/ucp-profile[.]json.ts`
- `src/styles.css` and the files in `public/`

The locale layout `beforeLoad` throws `notFound()` from `@tanstack/react-router` for an unknown locale. Update each `createFileRoute` path to include `$locale`. Regenerate `src/routeTree.gen.ts` by running `pnpm dev` or `pnpm build`. Do not hand-edit the generated tree.

### Step 3: Read locale from the route param

Loaders and `head` receive `params.locale`. Validate it with `isEnabledLocale` and throw `notFound()` when it fails. Server routes and server functions receive a validated locale argument. They do not import a root-param getter.

### Step 4: `lib/i18n/request/server.ts` loads messages by resolved locale

```ts
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import type enMessages from "@/lib/i18n/messages/en.json";
import { routing } from "@/lib/i18n/routing";

const messageLoaders: Record<string, () => Promise<{ default: typeof enMessages }>> = {
  "en-US": () => import("@/lib/i18n/messages/en.json"),
  "fr-FR": () => import("@/lib/i18n/messages/fr.json"),
};

// The caller passes the validated `$locale` param. Do not read `x-next-intl-locale`.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const loader = messageLoaders[locale];
  const messages = (await loader()).default as typeof enMessages;
  return { locale, messages };
});
```

### Step 5: Extend `src/start.ts`

Keep Shopify dispatch, the direct `/refine` 404, and `markdownResponse` ahead of locale negotiation. Redirect an unprefixed shopper path to the default locale only after those handlers decline the request. Skip `/api`, `/eve`, `/_eve_internal`, file extensions, and the document routes listed in Step 2. There is no matcher export.

New `/api/*` routes stay out of Shopify dispatch and locale negotiation unless Hydrogen owns that path. Keep `/api/agent/session` and `/agent/ucp-profile.json` unlocalized. The agent is off unless `shopConfig.agent.isEnabled` is true. If it is enabled, pass a validated copy locale into conversation context without changing Shopify country or language and without letting the client select a cart. Keep Start request APIs and `lib/cache` out of Eve's runtime imports.

### Step 6: Internal hrefs — keep the template `Link`

Leave existing `Link` imports from `@/components/ui/link` alone and pass locale-prefixed hrefs. Inspect product cards, menus, breadcrumbs, search, cart, and pagination so navigation retains the selected language without a negotiation redirect. The locale switcher may use the router from `lib/navigation/client.ts`. Reuse existing localized link helpers in customized installations.

For programmatic redirects in server code:

```ts
import { redirect } from "@tanstack/react-router";

throw redirect({ href: `/${locale}/account/login`, throw: true });
```

### Step 7: `lib/seo/index.ts` — locale-aware canonicals + hreflang alternates

Keep this module universal: callers resolve and validate the locale on the server, then pass it explicitly. Do not import the server root-param resolver into `index.ts`.

```ts
import { defaultLocale, enabledLocales } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

function withLocalePath(locale: string, pathname: string): string {
  const normalized = normalizePath(pathname);
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function buildAlternates({
  locale,
  pathname,
  searchParams,
}: {
  locale: Locale;
  pathname: string;
  searchParams?: SearchParamsInput;
}): Metadata["alternates"] {
  const canonical = buildCanonicalPath(withLocalePath(locale, pathname), searchParams);

  const languages: Record<string, string> = {};
  for (const candidate of enabledLocales) {
    languages[candidate] = buildCanonicalPath(withLocalePath(candidate, pathname), searchParams);
  }
  languages["x-default"] = buildCanonicalPath(
    withLocalePath(defaultLocale, pathname),
    searchParams,
  );

  return { canonical, languages };
}
```

Update every caller to pass its validated locale. Route loaders read `params.locale`. Server routes and server functions validate their own inputs.

### Step 8: Sitemap per-locale entries

Edit `src/routes/sitemap/$shard.ts`. For every resource, emit one `<url>` per enabled locale and add `<xhtml:link rel="alternate" hreflang="..." href="..." />` siblings inside each `<url>` pointing at the other locale variants. Add `xmlns:xhtml="http://www.w3.org/1999/xhtml"` to the `<urlset>` opening tag.

```ts
import { enabledLocales } from "@/lib/i18n";

function localizePath(locale: string, pathname: string): string {
  if (pathname === "/") return `/${locale}`;
  return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

// Inside renderShard(): for each item, for each locale, emit a <url> with
// a <loc> at the localized path and an <xhtml:link> per other locale.
```

`src/routes/sitemap[.]xml.ts` (the index) doesn't need locale handling — it only lists shard URLs, which stay locale-agnostic.

### Step 9: Locale-aware Markdown negotiation

`src/start.ts` serves Markdown through `markdownResponse`, using `getMarkdownPath()` and `getMarkdownMirrorPath()` in `lib/markdown/representation/index.ts`. Those helpers map `/`, `/search`, `/collections/:handle`, `/products/:handle`, and their `.md` mirrors to `src/routes/md/**`. Teach both to accept and strip a validated locale prefix so `/:locale/products/:handle` negotiates like `/products/:handle`. Inspect the handlers before forwarding locale. Keep their deployment commerce context unchanged, and preserve `?variant=` and search parameters.

### Step 10: Bare `/` and unknown locales

With `localePrefix: "always"`, `src/start.ts` redirects `/` to the negotiated locale after Shopify and Markdown decline the request. Do not add a second home route outside `$locale`.

Unknown locales throw `notFound()` from the `$locale` layout. The branded page is `notFoundComponent` on `src/routes/__root.tsx`.

### Step 12: Add or adapt the language selector

Inspect the current navigation, including any Shopify-menu customization. The simplified template does not ship a dormant `LocaleCurrencySelector` to re-enable. Add a leaf language selector, or preserve and extend an existing one. Keep the current resource and query parameters when switching. A copy-language switch must not change cart country or invent a currency choice.

## Verifying

After applying:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
# In another terminal, replace locale/handle with actual supported values:
curl -I http://localhost:3000/
curl -I http://localhost:3000/products/actual-handle
curl http://localhost:3000/sitemap.xml
curl http://localhost:3000/sitemap/products-1.xml
curl http://localhost:3000/en-US
```

Smoke-test checklist:

- [ ] Lint, typecheck, tests, and `vite build` pass; restart dev after route moves so `src/routeTree.gen.ts` regenerates
- [ ] Default copy matches the storefront before the locale prefix, including custom text
- [ ] Every enabled catalog has matching keys and arguments; zero/one/many, interpolation, errors, and accessibility labels render correctly
- [ ] Client leaves receive only needed namespaces or primitive labels; no copy functions cross the RSC boundary
- [ ] Copy-language switching preserves Shopify country, cart identity, and currency behavior
- [ ] Existing localized installations retain translations, public URLs, providers, and custom commerce behavior
- [ ] API, OAuth, markdown, cart, and chat boundaries validate locale themselves and do not read it from a root-param getter
- [ ] Report which fresh and existing-installation migration paths were actually exercised; lint/build alone do not prove migration parity
- [ ] Bare `/` redirects to default locale
- [ ] Each enabled locale serves 200 at its prefix
- [ ] `<html lang>` matches the URL's locale segment
- [ ] Sitemap emits one entry per locale per page
- [ ] Canonical + hreflang alternates appear in page metadata
- [ ] Internal `Link` hrefs preserve the selected locale; legacy unprefixed public URLs still redirect correctly
