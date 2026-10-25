import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressMedia, type MediaKind } from "@/lib/media";

export function MediaUpload({ label, kind, onUpload }: { label: string; kind: MediaKind; onUpload: (image: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="min-w-0">
    <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()} className="h-auto min-h-11 w-full whitespace-normal"><Upload />{busy ? "Compressing…" : label}</Button>
    <input ref={input} type="file" accept="image/*" aria-label={label} className="hidden" onChange={async (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      setBusy(true); setError("");
      try { onUpload(await compressMedia(file, kind)); } catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); }
      finally { setBusy(false); event.target.value = ""; }
    }} />
    {error && <p role="alert" className="mt-1 text-sm text-destructive">{error}</p>}
  </div>;
}