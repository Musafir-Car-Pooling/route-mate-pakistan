import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstallAppPrompt } from "./InstallAppPrompt";

describe("app installation invitation", () => {
  beforeEach(() => { vi.useFakeTimers(); sessionStorage.clear(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

  function browserOffer(outcome: "accepted" | "dismissed" = "accepted") {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    const prompt = vi.fn().mockResolvedValue(undefined);
    Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
    act(() => { window.dispatchEvent(event); vi.advanceTimersByTime(4500); });
    return { event, prompt };
  }

  it("automatically offers installation and only invokes the browser after a click", async () => {
    render(<InstallAppPrompt />);
    const { event, prompt } = browserOffer();
    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(prompt).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Install app" })); });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not offer installation when already running as an installed app", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    render(<InstallAppPrompt />);
    const { prompt } = browserOffer();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(prompt).not.toHaveBeenCalled();
  });

  it("keeps the invitation closed after Not now in the same browser session", () => {
    const { unmount } = render(<InstallAppPrompt />);
    browserOffer();
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    unmount();
    render(<InstallAppPrompt />);
    browserOffer();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the invitation immediately when installation completes", () => {
    render(<InstallAppPrompt />);
    browserOffer();
    act(() => { window.dispatchEvent(new Event("appinstalled")); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("offers manual home-screen installation on iPhones without a native event", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone) Safari/604.1");
    render(<InstallAppPrompt />);
    act(() => { vi.advanceTimersByTime(4500); });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Install app" })).not.toBeInTheDocument();
  });
});