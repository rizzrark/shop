---
name: enable-shopify-markets
description: >
  Enable Shopify Markets with regional locales, localized Storefront API context,
  and next-intl routing. Supports locale-prefixed, invisible cookie-based, and
  per-domain routing without a separate market URL segment or market mapping.
argument-hint: "[sub-path|invisible-cookie|per-domain]"
---

# Enable Shopify Markets

Add multi-region commerce to the Vercel Shop template. The fresh baseline is one deployment with clean URLs, inline component copy and reusable functions in `lib/content/index.ts`, and explicit `shopConfig.localization = { country: "US", language: "EN", locale: "en-US" }`. It does not include next-intl, catalogs, `lib/i18n/`, or a `lib/params/server.ts` locale resolver.

Copy translation and commerce market selection are separate concerns. This skill's regional-locale strategy deliberately combines them: a validated `en-US`, `en-CA`, or `fr-CA` selects translated copy plus Shopify country/language context. Confirm that coupling fits the store before adopting it. Do not infer a shopper's commerce country merely from a copy locale introduced by `enable-i18n`. Preserve existing installations that intentionally separate language and country; do not force them into this example model.

For a new regional-locale implementation, do not invent a separate market key, redundant market-to-locale map, currency map, or `/market/locale` route. Existing custom market models need an explicit migration decision, not automatic removal.

Examples of valid public routing:

- Locale sub-path: `/fr-CA/products/shoe`
- Invisible cookie routing: `/products/shoe` for every locale
- Per-domain: `example.ca/fr-CA/products/shoe` or a single locale on `example.fr/products/shoe`

Never generate redundant paths such as `/ca/fr-CA/products/shoe`.

## Before editing

Read the current versions of:

- `package.json`, `lib/config/index.ts`, `lib/content/index.ts`, and inline copy throughout routes and components
- Existing `lib/i18n/`, catalogs, next-intl plugin/providers, locale resolvers, and localized routes if present; these do not exist on the fresh baseline
- `vite.config.ts`, `src/start.ts`, and `src/router.tsx`
- Every Storefront API operation and cache wrapper
- Cart creation, cart actions, and buyer identity updates
- Customer Account auth context
- Agent/chat request payload and tools
- SEO, robots, sitemap, and markdown content-negotiation routes

The storefront is TanStack Start. File routes live in `src/routes`. Request middleware is `src/start.ts`. Server functions live in `lib/data/server-fn.ts` and `lib/<domain>/action.ts`. `pnpm build` is `vite build`. `pnpm start` is `node .output/server/index.mjs`. Install next-intl only when missing, then read its installed request and routing APIs before editing. Do not add a Next config.

Classify the installation before proceeding:

- **Fresh simplified template:** follow the next-intl installation and copy-to-catalog migration in `enable-i18n`, then use this skill's selected routing strategy and commerce propagation instead of its copy-only rules.
- **Already localized/customized:** preserve existing catalogs, translations, copy functions not yet migrated, scoped providers, public URLs, domains, cookies, redirects, and commerce/cache contracts. Extend only missing functionality; do not reinstall next-intl blindly, reset supported locales, replace custom copy with template English, or move routes twice.
- **Copy-only i18n already enabled:** keep its translations and routing. Identify the existing fixed commerce country/language before introducing regional selection. Obtain approval for any new coupling or changed public URLs.

Inventory mixed copy/catalog consumers and retain modules still in use. Preserve intentional operation locale/cache inputs even where presentation does not use them. In a noninteractive run, stop and report unresolved routing or market-model choices rather than choosing for the user.

For any Shopify GraphQL edit, use Shopify AI Toolkit to confirm current API facts and validate the complete operation. Then follow `shopify-graphql-reference` for this template's placement, transforms, cache role, locale flow, and invalidation.

## 1. Ask for routing and locales

If the user has not already decided, ask which strategy they want:

1. **Locale sub-path** — one regional locale segment, such as `/en-US/...` and `/fr-CA/...`.
2. **Invisible cookie** — all public paths stay clean; next-intl internally rewrites `/products/...` to `/[locale]/products/...` using the locale cookie.
3. **Per-domain** — domains select the available/default locale context; paths may be prefixed only when a domain supports multiple languages.

For sub-path routing, ask whether the default locale should be:

- `as-needed`: `/products/...` for the default and `/fr-CA/products/...` for others
- `always`: `/en-US/products/...` and `/fr-CA/products/...`

Then ask for the default locale and all enabled locales. Require regional BCP 47 tags with both language and region. For example:

```text
en-US, en-CA, fr-CA, de-DE
```

Do not accept bare language tags such as `en` or `fr` for Markets mode. Do not ask for a separate market identifier or currency.

Before choosing invisible cookie routing, state its SEO tradeoff: every locale shares one canonical URL, so search engines and shared links cannot target a specific cookie-selected version. Use locale sub-paths or per-domain URLs when each localized version must be independently indexed.

## 2. Make regional locales the source of truth

For a fresh regional-locale implementation, create `lib/i18n/index.ts` with the approved list and seed the initial context from `shopConfig.localization`. If its explicit country/language and formatting locale disagree, resolve that deliberately instead of deriving a different market silently. For an existing implementation, extend its current source of truth without resetting values.

The following is an example of the opted-in regional-locale model, not a replacement for every store's custom configuration:

```ts
import type { Locale } from "./types";

export const locales = ["en-US", "en-CA", "fr-CA"] as const;

export const defaultLocale: Locale = "en-US";
export const enabledLocales: readonly Locale[] = locales;
export const localeSwitchingEnabled = enabledLocales.length > 1;
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function isEnabledLocale(value: string): value is Locale {
  return enabledLocales.some((locale) => locale === value);
}
```

Define `Locale` in `lib/i18n/types.ts` as `type Locale = (typeof locales)[number]` with a type-only import of `locales` from `./index`, and import the contract directly from `types.ts`. Use `lib/i18n/routing/index.ts` for universal routing configuration, `lib/i18n/navigation/client.ts` for client navigation, `lib/i18n/request/server.ts` for request configuration, `lib/i18n/action.ts` for locale-switch actions, and `lib/params/server.ts` for the Server Component root-param resolver. Do not add barrels or forwarding exports. Preserve working module paths in customized installations rather than renaming them solely to match these examples.

Create boundary validation such as `isEnabledLocale` on the fresh baseline; retain existing `isEnabledLocale` / `resolveLocale` behavior where present. Reject unsupported request values instead of casting arbitrary strings to `Locale`. For the approved regional-locale strategy, derive Shopify context from the validated locale:

```ts
import type { CommerceLocale } from "@/lib/config/types";

export function getCountryCode(locale: Locale): CommerceLocale["country"] {
  const country = new Intl.Locale(locale).region;
  if (country === "US" || country === "CA") return country;
  throw new Error(`Unsupported commerce country: ${country}`);
}

export function getLanguageCode(locale: Locale): CommerceLocale["language"] {
  const language = new Intl.Locale(locale).language.toUpperCase();
  if (language === "EN" || language === "FR") return language;
  throw new Error(`Unsupported commerce language: ${language}`);
}

export function getCommerceLocale(locale: Locale): CommerceLocale {
  return { country: getCountryCode(locale), language: getLanguageCode(locale) };
}
```

These guards cover only the example locale list above. Extend them deliberately for the store's approved countries and languages; reject unsupported values rather than asserting them into Shopify types. Pass `getCommerceLocale(locale)` to operation `locale` options.

Prefer `Locale` over `string` for internal routing locale parameters. Request bodies, cookies, headers, route params, and query params remain untrusted strings until validated. Validate the country/language conversion against Shopify's supported values with Shopify AI Toolkit; do not assume uppercasing every BCP 47 language produces a valid Shopify language code.

The transport's operation `locale` option is a `CommerceLocale` object (`{ country, language }` from `lib/config/types.ts`), not a BCP 47 string. Convert once at the validated commerce boundary and propagate that object through existing operation/cache inputs. Keep the copy/routing `Locale` string distinct. For an older customized transport, adapt its actual signature instead of replacing it wholesale.

### Currency rule

Currency always comes from Shopify's localized response (`MoneyV2.currencyCode`, cart cost, product prices, etc.). Never infer currency from locale and never add `localeCurrency`, `marketCurrency`, or a locale-to-currency lookup.

When UI outside a price object needs a currency code, pass one from fetched Shopify data. If Shopify returns no product or cart from which to derive it, omit currency-specific UI rather than guessing.

## 3. Install next-intl and migrate copy

Use the `enable-i18n` section "Introduce next-intl and migrate copy" for the catalog work. On a fresh storefront, run `pnpm add next-intl` and create its request config. Wire locale negotiation in `src/start.ts`. Do not add `createNextIntlPlugin`, `next.config.ts`, or `proxy.ts`. Preserve the installation's feature settings. Do not enable the agent, auth, BotID, or analytics. Do not apply copy-only commerce rules or force `localePrefix: "always"` when using this Markets skill.

Build the initial catalog from the installation's actual inline copy, component configuration labels, and reusable functions in `lib/content/index.ts`. Convert typed interpolation and plural functions to equivalent ICU messages, preserving parameters, zero/one/many behavior, rich text, errors, and accessibility labels. Do not serialize functions or write a custom `t()` parser. Preserve already translated/customized catalogs rather than regenerating them from the template.

Use server `getTranslations()` and primitive labels by default. Only interactive leaves that need runtime messages use `useTranslations()` under narrowly scoped `NextIntlClientProvider` boundaries. Do not ship full catalogs at the root or pass copy functions across the RSC boundary. Include metadata, error/not-found screens, and formatting in the migration. Remove shared content functions only after all their consumers have migrated; update the installation's `AGENTS.md` for its now-localized architecture.

Add an explicit message loader and catalog for every enabled copy locale. Reuse a language catalog only intentionally; for example, `en-US` and `en-CA` may share `en.json` while Shopify still receives distinct country contexts. Commerce context does not translate storefront labels automatically.

Validate every generated JSON file and keep keys and interpolation arguments aligned. Agree on temporary fallbacks before publishing a locale with incomplete copy; never silently label fallback English as a complete translation.

## 4. Configure routing

Create `lib/i18n/routing/index.ts` and use `enabledLocales` directly. There is no market mapping layer.

### Locale sub-path

```ts
import { defineRouting } from "next-intl/routing";

import { defaultLocale, enabledLocales, LOCALE_COOKIE_NAME } from "@/lib/i18n";

export const routing = defineRouting({
  defaultLocale,
  localeCookie: { name: LOCALE_COOKIE_NAME, sameSite: "lax" },
  localePrefix: "as-needed", // or "always"
  locales: enabledLocales,
});
```

Use full regional locale prefixes. One segment is enough.

### Invisible cookie routing

```ts
import { defineRouting } from "next-intl/routing";

import { defaultLocale, enabledLocales, LOCALE_COOKIE_NAME } from "@/lib/i18n";

export const routing = defineRouting({
  alternateLinks: false,
  defaultLocale,
  localeCookie: { name: LOCALE_COOKIE_NAME, sameSite: "lax" },
  localeDetection: true,
  localePrefix: "never",
  locales: enabledLocales,
});
```

`localePrefix: "never"` keeps the locale segment internal. On a request for `/products/shoe`, next-intl resolves the cookie (or first-visit language preference/default), then rewrites internally to a route such as `/fr-CA/products/shoe`. The browser URL stays `/products/shoe`.

Do not implement a second custom market rewrite on top of this. The internal `[locale]` segment is an implementation detail, not a public URL.

### Per-domain routing

```ts
export const routing = defineRouting({
  defaultLocale,
  domains: [
    { defaultLocale: "en-US", domain: "example.com", locales: ["en-US"] },
    { defaultLocale: "en-CA", domain: "example.ca", locales: ["en-CA", "fr-CA"] },
  ],
  localeCookie: { name: LOCALE_COOKIE_NAME, sameSite: "lax" },
  localePrefix: "as-needed",
  locales: enabledLocales,
});
```

The domain configuration is routing configuration, not a separate commerce market model. Shopify country and language still derive from the resolved regional locale.

Create `lib/i18n/navigation/client.ts` only for components that explicitly switch locales:

```ts
"use client";

import { createNavigation } from "next-intl/navigation";

import { routing } from "@/lib/i18n/routing";

export const { usePathname, useRouter } = createNavigation(routing);
```

Keep `Link` from `@/components/ui/link` for internal links; do not replace it with next-intl's `Link`. Pass explicit strategy-aware hrefs from the server so ordinary links preserve the selected locale without request-context reads in link components. Keep public paths clean in invisible-cookie mode.

## 5. Move page routes under `src/routes/$locale/`

Move localized pages under `src/routes/$locale/`. Keep `src/routes/__root.tsx` as the document shell.

Move home, products, collections, search, cart, account, blogs, pages, and policies under `$locale`.

Keep these unlocalized:

- `src/routes/api/**`
- `src/routes/agent/ucp-profile[.]json.ts`
- `src/routes/md/**`
- `src/routes/llms[.]txt.ts` and `src/routes/robots[.]txt.ts`
- `src/routes/sitemap[.]xml.ts` and `src/routes/sitemap/$shard.ts`
- `src/routes/manifest[.]webmanifest.ts`, `src/styles.css`, and `public/`

Update each `createFileRoute` path to include `$locale`. The locale layout validates `params.locale` and throws `notFound()` from `@tanstack/react-router` when it is not enabled. Do not add `ensureStatic` or `generateStaticParams`. Restart dev after the move so `src/routeTree.gen.ts` regenerates. Follow `enable-i18n` for bare `/` and unknown locales.

Resolve locale from `params.locale` and pass it into `withCache` keys. Do not read cookies or headers inside `withCache`.

## 6. Resolve locale from the root param

Validate `params.locale` in the `$locale` layout `beforeLoad`. Throw `notFound()` from `@tanstack/react-router` when it is not enabled. Loaders pass that param into message loading and `withCache`.

Create or update `lib/i18n/request/server.ts` to load messages for that locale. Do not resolve locale by reading cookies or request headers inside `withCache`. `src/start.ts` owns request negotiation for unprefixed paths. Set `<html lang>` and UI formatting from the validated locale.

Server routes and server functions validate locale on their own inputs. Keep API, OAuth, markdown, and chat handling out of the page message loader.

## 7. Extend `src/start.ts`

Hydrogen's handlers take their market from the request context's `i18n`: every cart, predictive search, and account operation they run uses `@inContext(country, language)` from it. The template pins that context to `shopConfig.localization` in `createCustomerRequestContext` (`lib/auth/server.ts`) and in the server cart seed (`lib/cart/server.ts`). Accept the validated commerce context in both instead. Resolve the locale before Shopify dispatch: from the validated locale prefix when the path has one, otherwise from the validated locale cookie (unprefixed handler paths such as `/api/cart` carry no locale segment), otherwise `defaultLocale`.

Keep the current Shopify handler options. `handleShopifyRoutes` is awaited. Return its response when present. Run Markdown negotiation next. Run locale negotiation only after both decline the request. Skip `/api`, `/eve`, `/_eve_internal`, and paths with a file extension.

`/api/webhooks/shopify`, `/api/agent/session`, and other `/api/*` routes stay out of locale negotiation unless Hydrogen owns that path. Keep `/eve/v1/` and `/_eve_internal/` outside locale and Shopify handling. Add an exact path when a new Shopify integration requires it.

For invisible cookie routing, a public locale-prefixed URL canonicalizes back to the clean path. Do not expose an internal rewrite destination in links, metadata, or redirects.

## 8. Propagate locale through commerce

Audit definitions and real callers. Under the opted-in regional-locale model, localized Storefront API operations receive validated locale/context, derive country and language at the commerce boundary, and use Shopify's validated `@inContext(country: $country, language: $language)`. Inspect existing locale and cache inputs before adding arguments. Preserve an explicitly separated country/language model rather than repurposing its copy locale.

This includes:

- products, collections, search, recommendations, and complementary products
- navigation menus added by `enable-shopify-menus`
- cart creation and cart reads that depend on buyer country
- sitemap and markdown catalog/product output
- agent tools and Storefront MCP calls

Cached functions must receive `locale` explicitly. Never read the locale cookie or request headers inside `withCache`. The locale argument naturally separates cache entries; do not add a parallel market cache key.

Keep locale defaults only at compatibility boundaries where the base single-locale template needs them. Once a route has resolved locale, pass it explicitly rather than silently defaulting deeper in the stack.

### Menus

If `enable-shopify-menus` has added `getMenu`, pass the validated commerce context as `getMenu({ handle, locale })` from every caller; its query already carries `@inContext`. Without this, navigation remains pinned to the default market.

### Customer Account auth

Pass the active validated commerce context into the Shopify/Hydrogen request context instead of pinning it to `shopConfig.localization` or an older `defaultLocale`. Preserve locale across login, authorize, refresh, and logout return URLs. Validate any locale carried through OAuth state or URL params.

### Chat and agent API

Shop Agent is disabled by default. Preserve that setting; enabling Markets must not enable chat. When chat is enabled, inspect `agent/channels/eve.ts`, `agent/tools/`, `agent/lib/`, and the Shopify connections rather than adding an app-owned chat route or commerce HTTP bridge.

The session route stays outside `$locale`, and invisible URLs do not reveal locale in the referer. Carry the selected locale explicitly, validate it against the installed locale allowlist during cart setup and in Eve's channel, and pass the validated commerce context to the direct Shopify tools and connections. Client context can describe the page, but must not select an arbitrary cart or an unsupported locale. Do not infer locale from URL segments or fall back unconditionally to `defaultLocale`.

Agent tools, Shopify connections, product context, cart creation, and navigation outputs must use that validated locale. Keep Start request APIs and `lib/cache` out of Eve. Eve uses the shared uncached Shopify catalog operations and Hydrogen handlers.

### Markdown negotiation

`markdownResponse` in `src/start.ts` negotiates Markdown before locale redirects. Update `getMarkdownPath()` and `getMarkdownMirrorPath()` in `lib/markdown/representation/index.ts` so a locale prefix still reaches the unlocalized `src/routes/md/**` handlers as a validated value. Preserve `?variant=` and search parameters.

## 9. Switch locale and carry the market to the cart

Cart writes stay in Hydrogen's `/api/cart` handler; never mutate the cart from a server function or a custom route. Because `src/start.ts` builds the handler's request context from the selected locale (section 7), the next cart read or write after a switch runs in the new market:

- `fr-CA` to `en-CA`: copy and Shopify language change; the country stays `CA`.
- `en-CA` to `en-US`: the cart's next Hydrogen operation runs with country `US`.

Use Shopify AI Toolkit to confirm how the store's cart buyer country and pricing follow `@inContext` on cart operations. If the store requires an explicit buyer-country update, the installed Hydrogen SDK exposes no cart intent for it: report that gap instead of adding a cart mutation outside Hydrogen's handlers.

The selector remains a leaf client component. A server function in `lib/i18n/action.ts` may validate the requested locale and set the locale cookie; it never reads or writes the cart. After a country change, call `refresh()` from `useCartActions()` so prices and checkout reflect Shopify's response for the new market; do not invalidate public cache tags.

- **Sub-path/per-domain:** use next-intl's client router to replace the current pathname with `{ locale: nextLocale }`, then refresh the cart.
- **Invisible cookie:** call the action, then call `router.refresh()` and refresh the cart. The pathname must not change.

Do not offer a separate currency selector unless the store has a Shopify-backed currency choice independent of country. Display currency from cart/product responses.

## 10. Strategy-specific SEO and sitemap behavior

### Locale sub-path or per-domain

Each locale has a distinct indexable URL:

- Canonical points to the current locale URL.
- Emit `hreflang` alternates for enabled locale URLs plus `x-default`.
- Emit one sitemap URL per locale with matching XHTML alternates.
- Build URLs from the selected routing strategy; do not assume every strategy uses `/${locale}`.

### Invisible cookie

All variants share one public URL:

- Canonical is the clean public path.
- Do not emit fake locale-specific `hreflang` URLs.
- Emit one sitemap URL per resource, not one per locale.
- Keep `alternateLinks: false` in next-intl routing.
- Treat localization as personalization. Shared links and crawlers without the user's cookie receive negotiated/default content.

Never put internal `/[locale]/...` rewrite targets into metadata or sitemap XML.

## 11. Verification

Run focused checks from the storefront root:

```bash
pnpm lint
pnpm build
```

Then run the app and verify the selected strategy.

### All strategies

- Default-language copy matches the pre-migration installation, including custom text, interpolation, plurals, errors, and accessibility labels.
- Every enabled catalog has aligned keys/arguments and scoped client providers; fallback text is not mistaken for completed translation.
- Existing localized installations retain translations, custom routing, and their approved commerce model.
- Report whether the fresh-baseline migration and an existing-localized migration were actually exercised; static checks cannot prove either path's parity.
- Every enabled regional locale produces the expected Shopify country/language context.
- Product and cart currency codes come from Shopify responses.
- Public caches separate localized products, prices, and menus; carts remain uncached.
- `fr-CA` to `en-CA` keeps Shopify country `CA` for the cart.
- `en-CA` to `en-US` refreshes the cart with Shopify's `US` context, and every cart write still goes through `/api/cart`.
- Chat/agent operations receive the explicit validated locale.
- Markdown responses use the same locale as HTML responses.
- Variant and filter query parameters survive switching and rewrites.

### Locale sub-path

- Locale URLs serve directly with no `/market/locale` nesting.
- Default-prefix behavior matches `always` or `as-needed`.
- Canonical, hreflang, and sitemap URLs are locale-specific.

### Invisible cookie

```bash
curl -I http://localhost:3000/products/example
curl -I --cookie "NEXT_LOCALE=fr-CA" http://localhost:3000/products/example
```

- Both requests keep `/products/example` as the public URL.
- The cookie-selected response has `<html lang="fr-CA">` and Shopify country `CA` context.
- Locale switching changes content/cart context without changing the address bar.
- `/fr-CA/products/example` does not remain a public canonical URL.
- Metadata and sitemap contain only clean public paths and no locale alternates.

### Per-domain

- Each configured host resolves its allowed/default locales.
- Cross-domain locale switching uses the correct host.
- Canonical and hreflang URLs contain the production domains.
