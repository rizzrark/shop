import { shopConfig } from "./index";

const REQUIRED_SHOPIFY_ENV = [
  "NEXT_PUBLIC_SHOPIFY_SHOP_ID",
  "NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN",
  "NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN",
] as const;

export function assertShopEnv(): void {
  if (process.env.VITEST) return;

  const missingShopify = REQUIRED_SHOPIFY_ENV.filter((key) => !process.env[key]);
  if (missingShopify.length > 0) {
    throw new Error(
      `Missing required Shopify environment variables: ${missingShopify.join(", ")}. See .env.example.`,
    );
  }

  if (!shopConfig.auth.isEnabled) return;

  const missing = [
    "CUSTOMER_ACCOUNT_SESSION_SECRET",
    "SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID",
    "SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_SECRET",
  ].filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Enabled auth requires: ${missing.join(", ")}. ` +
        `Set the missing variables or disable auth via auth.isEnabled in lib/config/index.ts.`,
    );
  }
}
