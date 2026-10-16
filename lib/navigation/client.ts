"use client";

import { useRouter as useTanStackRouter, useLocation } from "@tanstack/react-router";

interface NavigateOptions {
  scroll?: boolean;
}

export function useRouter() {
  const router = useTanStackRouter();
  return {
    push(href: string, options?: NavigateOptions) {
      return router.navigate({ href, resetScroll: options?.scroll !== false });
    },
    replace(href: string, options?: NavigateOptions) {
      return router.navigate({ href, replace: true, resetScroll: options?.scroll !== false });
    },
    refresh() {
      return router.invalidate();
    },
  };
}

export function usePathname(): string {
  return useLocation({ select: (location) => location.pathname });
}

export function useSearchParams(): URLSearchParams {
  const searchStr = useLocation({ select: (location) => location.searchStr });
  return new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr);
}
