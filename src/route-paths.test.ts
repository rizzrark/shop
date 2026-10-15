import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const ROUTE_FILES = [
  "src/routes/__root.tsx",
  "src/routes/index.tsx",
  "src/routes/search.tsx",
  "src/routes/search/index.tsx",
  "src/routes/cart.tsx",
  "src/routes/collections/index.tsx",
  "src/routes/collections/all.tsx",
  "src/routes/collections/all/index.tsx",
  "src/routes/collections/$handle.tsx",
  "src/routes/collections/$handle/index.tsx",
  "src/routes/products/$handle.tsx",
  "src/routes/blogs/$blogHandle/index.tsx",
  "src/routes/blogs/$blogHandle/$articleHandle.tsx",
  "src/routes/pages/$handle.tsx",
  "src/routes/policies/$handle.tsx",
  "src/routes/account/sign-in-failed.tsx",
  "src/routes/account/_authenticated.tsx",
  "src/routes/account/_authenticated/index.tsx",
  "src/routes/account/_authenticated/profile.tsx",
  "src/routes/account/_authenticated/addresses.tsx",
  "src/routes/account/_authenticated/orders/index.tsx",
  "src/routes/account/_authenticated/orders/$id.tsx",
  "src/routes/api/webhooks/shopify.ts",
  "src/routes/api/agent/session.ts",
  "src/routes/agent/ucp-profile[.]json.ts",
  "src/routes/llms[.]txt.ts",
  "src/routes/robots[.]txt.ts",
  "src/routes/manifest[.]webmanifest.ts",
  "src/routes/sitemap[.]xml.ts",
  "src/routes/sitemap/$shard.ts",
  "src/routes/md/index.ts",
  "src/routes/md/search.ts",
  "src/routes/md/products/$handle.ts",
  "src/routes/md/collections/$handle.ts",
];

describe("storefront route files", () => {
  it("keeps the public urls, dotted documents, and internal markdown routes", () => {
    const missing = ROUTE_FILES.filter((path) => !existsSync(path));
    expect(missing).toEqual([]);
  });

  it("does not publish a refine url", () => {
    expect(existsSync("src/routes/collections/$handle/refine.tsx")).toBe(false);
    expect(existsSync("src/routes/collections/all/refine.tsx")).toBe(false);
  });

  it("lists the dotted document urls in the generated route tree", () => {
    const tree = readFileSync("src/routeTree.gen.ts", "utf8");
    for (const path of [
      "/llms.txt",
      "/robots.txt",
      "/manifest.webmanifest",
      "/sitemap.xml",
      "/sitemap/$shard",
      "/agent/ucp-profile.json",
    ]) {
      expect(tree).toContain(`'${path}'`);
    }
  });
});
