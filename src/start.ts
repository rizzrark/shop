import { handleShopifyRoutes } from "@shopify/hydrogen";
import {
  createCustomerAccountServerHandlers,
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
} from "@shopify/hydrogen/customer-account";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

import {
  createCustomerRequestContext,
  createCustomerSessionManager,
  getCustomerRequestOrigin,
  getHydrogenCustomerSession,
  runWithCustomerRequest,
} from "@/lib/auth/server";
import { cartHandlers, createCustomerCartHandlers } from "@/lib/cart/server";
import { isRefinedCollectionPath } from "@/lib/collections";
import { shopConfig } from "@/lib/config";
import { markdownResponse } from "@/lib/markdown/response";
import { predictiveSearchHandlers } from "@/lib/search/server";
import { SHOPIFY_ROUTE_TEMPLATES } from "@/lib/shopify/routing";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront/server";

const AUTH_PATHS = new Set<string>([
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
]);

const NOOP_SESSION_MANAGER = {
  getSessionItem: () => undefined,
  getSessionOrigin: () => "",
  removeSessionItem: () => {},
  setSessionItem: () => {},
};

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

const requestMiddleware = createMiddleware().server(async ({ next, pathname, request }) => {
  if (
    pathname === "/favicon.ico" ||
    pathname === "/eve" ||
    pathname.startsWith("/eve/") ||
    pathname.startsWith("/_eve_internal")
  ) {
    return runWithCustomerRequest(request, () => next());
  }

  const shopifyRoute = await shopifyResponse(request, pathname);
  if (shopifyRoute) return shopifyRoute;
  // Filtered collection URLs stay on the public path. A direct /refine request has no page.
  if (isRefinedCollectionPath(pathname)) return new Response("Not Found", { status: 404 });

  const markdown = await markdownResponse(request);
  if (markdown) return markdown;

  return runWithCustomerRequest(request, () => next());
});

async function shopifyResponse(request: Request, pathname: string): Promise<Response | undefined> {
  const requestContext = createCustomerRequestContext(request);
  const isAuthPath = shopConfig.auth.isEnabled && AUTH_PATHS.has(pathname);
  const customerSession =
    isAuthPath || (shopConfig.auth.isEnabled && pathname === "/api/cart")
      ? await getHydrogenCustomerSession()
      : undefined;
  const shopifyRoute = await Promise.resolve(
    handleShopifyRoutes({
      handlers: customerSession
        ? customerHandlers(customerSession, isAuthPath)
        : [cartHandlers, predictiveSearchHandlers],
      request,
      requestContext,
      routeTemplates: SHOPIFY_ROUTE_TEMPLATES,
      sessionManager: customerSession
        ? createCustomerSessionManager(request)
        : NOOP_SESSION_MANAGER,
      storefrontClient: createRequestStorefrontClient(requestContext),
    }),
  );
  if (!shopifyRoute) return undefined;
  requestContext.applyResponseHeaders(shopifyRoute.headers);
  return shopifyRoute;
}

function customerHandlers(
  customerSession: Awaited<ReturnType<typeof getHydrogenCustomerSession>>,
  isAuthPath: boolean,
) {
  const cart = createCustomerCartHandlers(customerSession);
  if (!isAuthPath) return [cart, predictiveSearchHandlers];

  const auth = createCustomerAccountServerHandlers({
    cartServerHandlers: cart,
    customerSession,
    defaultPostLoginRedirectPathname: "/account",
    loginFailedRedirectPath: "/account/sign-in-failed",
    origin: getCustomerRequestOrigin,
    postLogoutRedirectUri: "/",
  });
  return [auth, cart, predictiveSearchHandlers];
}

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, requestMiddleware],
}));
