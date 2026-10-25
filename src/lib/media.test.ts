import { afterEach, describe, expect, it, vi } from "vitest";
import { compressMedia } from "./media";

afterEach(() => vi.restoreAllMocks());

describe("admin media compression", () => {
  it("rejects non-image uploads", async () => {
    await expect(compressMedia(new File(["text"], "file.txt", { type: "text/plain" }), "logo")).rejects.toThrow("Please select an image.");
  });
  it("encodes uploaded payment and partner logos as PNG", async () => {
    vi.stubGlobal("Image", class { width = 600; height = 600; onload?: () => void; set src(_value: string) { this.onload?.(); } });
    vi.stubGlobal("URL", { createObjectURL: () => "blob:test", revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    const encode = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,YQ==");
    const result = await compressMedia(new File(["image"], "logo.png", { type: "image/png" }), "logo");
    expect(encode).toHaveBeenCalledWith("image/png", 0.65);
    expect(result).toBe("data:image/png;base64,YQ==");
    vi.unstubAllGlobals();
  });
});