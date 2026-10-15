import { createFileRoute } from "@tanstack/react-router";

import { AccountPageHeader } from "@/components/account/page-header";
import { ProfileForm } from "@/components/account/profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { loadAccountProfile } from "@/lib/data/server-fn";

export const Route = createFileRoute("/account/_authenticated/profile")({
  loader: () => loadAccountProfile(),
  pendingComponent: ProfileSkeleton,
  component: ProfilePage,
});

function ProfilePage() {
  const profile = Route.useLoaderData();
  if (!profile) return null;
  return (
    <>
      <AccountPageHeader description="Your account information" title="Profile" />
      <ProfileForm
        labels={{
          email: "Email",
          firstName: "First name",
          lastName: "Last name",
          profileUpdated: "Profile updated",
          save: "Save",
        }}
        profile={profile}
      />
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true" className="grid max-w-md gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="grid gap-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full" />
      </div>
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  );
}
