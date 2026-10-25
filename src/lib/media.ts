export type MediaKind = "logo" | "slide";
export const mediaLimits = { logo: { max: 240, bytes: 20_000 }, slide: { max: 960, bytes: 100_000 } } as const;

export async function compressMedia(file: File, kind: MediaKind): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image.");
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error("This image could not be opened.")); img.src = url;
    });
    const limit = mediaLimits[kind];
    let scale = Math.min(1, limit.max / Math.max(image.width, image.height));
    for (let attempt = 0; attempt < 12; attempt++) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("This image could not be processed.");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL(kind === "logo" ? "image/png" : "image/jpeg", 0.65);
      if ((result.length - result.indexOf(",") - 1) * 0.75 <= limit.bytes) return result;
      scale *= 0.8;
    }
    throw new Error("Please try a simpler or smaller image.");
  } finally { URL.revokeObjectURL(url); }
}