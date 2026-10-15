"use client";

import { type ComponentProps, useEffect, useState } from "react";

import type { AgentPanel as AgentPanelComponent } from "./agent-panel";

export function AgentPanel(props: ComponentProps<typeof AgentPanelComponent>) {
  const [Panel, setPanel] = useState<typeof AgentPanelComponent | null>(null);

  useEffect(() => {
    void import("./agent-panel").then((mod) => setPanel(() => mod.AgentPanel));
  }, []);

  if (!Panel) return null;
  return <Panel {...props} />;
}
