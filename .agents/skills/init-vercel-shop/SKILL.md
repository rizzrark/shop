---
name: init-vercel-shop
description: Start the Vercel Shop storefront. Use when the user wants to create, scaffold, start, or initialize this TanStack Start shop from a coding agent.
---

# Initialize Vercel Shop

Ask for the target directory if the user did not provide one. Always pass it explicitly.

1. Inspect the target. If it already contains a Vercel Shop project, stop and use the relevant storefront skill instead. If it is a non-empty directory, ask for a different target rather than overwriting files.
2. From the storefront root, with pnpm 12 and Node.js 24, install and start it:

   ```bash
   pnpm install
   pnpm dev
   ```

   `pnpm build` runs `vite build`. `pnpm start` serves that build with `node .output/server/index.mjs`.

3. Confirm the project contains `AGENTS.md`, `.agents/skills/`, `src/routes/`, `src/start.ts`, `vite.config.ts`, `components/`, `lib/shopify/`, and `package.json`.
4. Read `AGENTS.md` before making further changes.
5. If dependency installation fails, keep the generated project and show the retry command to run from its root:

   ```bash
   pnpm install
   ```

6. Ask one optional follow-up: **Connect an existing Shopify store now?**

   If yes, ask only for the store's admin URL or `.myshopify.com` domain, then read [references/storefront-token.md](references/storefront-token.md) and follow its automated Shopify CLI flow. Try to reuse or create a public Storefront token before asking the user to visit the Headless channel.

   If no, finish with the normal environment setup as the next step.

Return the generated project path, whether a Shopify store was connected, and whether dependency installation needs a retry.
