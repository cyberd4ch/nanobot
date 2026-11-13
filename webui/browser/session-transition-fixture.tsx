import { useState } from "react";

import { ThreadShell } from "@/components/thread/ThreadShell";
import { PaneWorkbench } from "@/components/workbench/PaneWorkbench";
import { transitionSession } from "@/components/thread/session-transition";
import { settings } from "@/dev/gallery/settings";
import { ComposerDraftStore } from "@/lib/composer-draft";
import { ThreadMessageCache } from "@/lib/thread-message-cache";
import { ClientProvider } from "@/providers/ClientProvider";
import { createStreamClient } from "@/tests/stream-client";

const { client, receive } = createStreamClient();
for (const topic of ["goal", "together", "blocked"]) {
  receive({ event: "goal_state", chat_id: topic, goal_state: {
    active: true, status: topic === "blocked" ? "blocked" : "active",
    ui_summary: "Keep the composer stable",
    objective: "Verify session navigation with real components.\n\n" + "- Preserve drafts, reading position and usable header controls.\n".repeat(28),
    ...(topic === "blocked" ? { recap: "Waiting for a workspace permission decision." } : {}),
  } });
}

export function SessionTransitionFixture() {
  const workbench = new URLSearchParams(location.search).has("workbench");
  const [topic, setTopic] = useState(workbench ? "goal" : "plain");
  const [cache] = useState(() => new ThreadMessageCache(() => false));
  const [drafts] = useState(() => new ComposerDraftStore());
  const dark = new URLSearchParams(location.search).has("dark");
  document.documentElement.classList.toggle("dark", dark);
  return <ClientProvider client={client} token="fixture" webuiCapabilities={["webui.core.v1", "webui.subagents.v1"]}>
    <main className="thread-workspace flex min-w-0 flex-col overflow-hidden bg-background text-foreground" style={{ height: "100dvh" }} data-session={topic}>
      <nav aria-label="Sessions" className="flex shrink-0 flex-wrap gap-4 px-4 py-2 text-xs">
        {(workbench ? ["goal", "blocked"] : ["plain", "goal", "tasks", "together", "blocked", "cold"]).map(key => <button key={key} onClick={() => transitionSession(() => setTopic(key), !workbench && key !== topic)}>{key}</button>)}
        <button onClick={() => {
          receive({ event: "goal_status", chat_id: topic, turn_id: "live-turn", status: "running", started_at: Date.now() / 1000 });
          receive({ event: "delta", chat_id: topic, turn_id: "live-turn", stream_id: "live", text: "Live reply continues" });
        }}>Stream reply</button>
      </nav>
      {workbench ? <PaneWorkbench
        panes={["goal", "blocked"].map(key => ({ key, title: key }))} activePaneKey={topic} layout="columns"
        showLayoutControl={false} onActivatePane={setTopic} onAddPane={() => {}} onLayoutChange={() => {}} onPaneOrderChange={() => {}}
        renderPane={(pane, context) => <ThreadShell
          session={{ key: `websocket:${pane.key}`, channel: "websocket", chatId: pane.key, createdAt: null, updatedAt: null, preview: "" }}
          title={pane.title} hideHeaderTitle onToggleSidebar={() => {}} theme={dark ? "dark" : "light"}
          settingsSnapshot={settings} messageCache={cache} draftStore={drafts} emptyComposerVariant="thread"
          headerPortalTarget={context.headerPortalTarget} headerActive={context.active}
          composerPortalTarget={context.composerPortalTarget} composerActive={context.active} headerActions={context.headerActions}
        />}
      /> : <ThreadShell session={{ key: `websocket:${topic}`, channel: "websocket", chatId: topic, createdAt: null, updatedAt: null, preview: "" }}
        title={topic} hideHeaderTitle onToggleSidebar={() => {}} theme={dark ? "dark" : "light"}
        settingsSnapshot={settings} messageCache={cache} draftStore={drafts} emptyComposerVariant="thread" />}
    </main>
  </ClientProvider>;
}
