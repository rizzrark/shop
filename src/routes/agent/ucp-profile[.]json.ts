import { createFileRoute } from "@tanstack/react-router";

import { shopConfig } from "@/lib/config";

export const Route = createFileRoute("/agent/ucp-profile.json")({
  server: {
    handlers: {
      GET: async () => {
        if (!shopConfig.agent.isEnabled) return new Response(null, { status: 404 });
        const { agentProfile } = await import("@/agent/lib/profile");
        return Response.json(agentProfile, { headers: { "Cache-Control": "public, max-age=300" } });
      },
    },
  },
});
