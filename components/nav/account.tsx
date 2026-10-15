import { UserRoundCheckIcon, UserRoundIcon } from "lucide-react";

import { Link } from "@/components/ui/link";

export function NavAccount({ loggedIn }: { loggedIn: boolean }) {
  if (!loggedIn) {
    // Sign-in must be a full document navigation; the proxy auth route issues an OAuth redirect and must never be prefetched.
    return (
      <a
        href="/account/login"
        className="flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
      >
        <UserRoundIcon className="size-5" />
        <span className="sr-only">Sign in</span>
      </a>
    );
  }
  return (
    <Link
      href="/account"
      className="flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
    >
      <UserRoundCheckIcon className="size-5" />
      <span className="sr-only">Account</span>
    </Link>
  );
}

export function NavAccountFallback() {
  return (
    <span className="flex items-center justify-center text-foreground">
      <UserRoundIcon className="size-5" />
    </span>
  );
}
