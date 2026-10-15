import type { ConsentConfig, I18nConfig } from "@shopify/hydrogen";
import type { initBotId } from "botid/client/core";

export type CommerceLocale = Pick<I18nConfig, "country" | "language">;

export interface ShopConfig {
  agent: {
    isEnabled: boolean;
  };
  analytics: {
    shopify: {
      consent: {
        isEnabled: boolean;
        mode: NonNullable<ConsentConfig["mode"]>;
      };
      isEnabled: boolean;
    };
    speedInsights: {
      isEnabled: boolean;
    };
    vercel: {
      isEnabled: boolean;
    };
  };
  auth: {
    isEnabled: boolean;
  };
  botid: {
    checkLevel: NonNullable<
      NonNullable<
        Parameters<typeof initBotId>[0]["protect"][number]["advancedOptions"]
      >["checkLevel"]
    >;
    isEnabled: boolean;
  };
  localization: CommerceLocale & {
    locale: string;
  };
  pdp: {
    bundles: {
      isEnabled: boolean;
    };
    buyWithShop: {
      isEnabled: boolean;
    };
    complementaryProducts: {
      isEnabled: boolean;
    };
    quantityPicker: {
      isEnabled: boolean;
    };
    relatedProducts: {
      isEnabled: boolean;
    };
  };
  redirects: {
    shopifyNotFound: {
      isEnabled: boolean;
    };
  };
  search: {
    isEnabled: boolean;
  };
  shopify: {
    webmcp: {
      isEnabled: boolean;
    };
  };
  site: {
    description: string;
    name: string;
    url: string;
  };
}
