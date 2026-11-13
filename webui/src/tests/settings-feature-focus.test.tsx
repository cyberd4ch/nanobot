import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { SettingsFeature } from "@/components/settings/shared/SettingsFeature";

function FeatureFixture() {
  const [enabled, setEnabled] = useState(false);
  return <SettingsFeature title="Example feature" enabled={enabled} onChange={setEnabled}>
    <p>Configuration</p>
  </SettingsFeature>;
}

it.each(["title", "configure", "toggle"] as const)("returns Escape to the actual %s opener", async (opener) => {
  const user = userEvent.setup();
  render(<FeatureFixture />);
  const trigger = opener === "toggle" ? screen.getByRole("switch", { name: "Example feature" })
    : screen.getByRole("button", { name: opener === "title" ? "Example feature" : "Configure" });
  await user.click(trigger);
  await screen.findByRole("dialog");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
});
