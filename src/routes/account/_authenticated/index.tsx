import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/account/_authenticated/")({
  beforeLoad: () => {
    throw redirect({ href: "/account/profile", throw: true });
  },
});
