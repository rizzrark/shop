import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

import { assertShopEnv } from "./lib/config/server";

const CLIENT_ENV = [
  "NEXT_PUBLIC_SHOPIFY_SHOP_ID",
  "NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN",
  "NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN",
  "NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID",
  "VERCEL_PROJECT_PRODUCTION_URL",
] as const;

export default defineConfig(({ isSsrBuild }) => {
  assertShopEnv();

  return {
    define: isSsrBuild
      ? undefined
      : Object.fromEntries(
          CLIENT_ENV.map((key) => [`process.env.${key}`, JSON.stringify(process.env[key] ?? "")]),
        ),
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    plugins: [
      tanstackStart(),
      nitro({ preset: "node" }),
      tailwindcss(),
      react({
        babel: { plugins: ["babel-plugin-react-compiler"] },
      } as Parameters<typeof react>[0]),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./", import.meta.url)),
      },
    },
    server: {
      port: 3000,
    },
  };
});
