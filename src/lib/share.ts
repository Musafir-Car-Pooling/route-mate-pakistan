/** Opens the phone's share sheet, or copies the text when sharing isn't supported. */
export async function shareText(title: string, text: string, url: string) {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    window.alert("Link copied. Paste it to share with your friends.");
  } catch {
    window.prompt("Copy this link to share:", url);
  }
}

export const appUrl = () => (typeof window !== "undefined" ? window.location.origin : "https://route-mate-pakistan.lovable.app");
