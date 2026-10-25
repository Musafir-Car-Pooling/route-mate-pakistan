import { useState } from "react";
import { X, Phone, MessageCircle, Clock, Upload, CheckCircle2, Copy, Check, Landmark, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useStore, setState, uid, formatPKR, compressImage, unlockFor, canContactPost, type Interest, type Post } from "@/lib/store";
import easypaisaLogo from "@/assets/easypaisa-compact.png.asset.json";
import jazzcashLogo from "@/assets/jazzcash-compact.png.asset.json";

export function ContactButton({ post, person }: { post: Post; person: Interest }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [method, setMethod] = useState<"easypaisa" | "jazzcash" | "bank">("easypaisa");
  const [txn, setTxn] = useState("");
  const [shot, setShot] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const settings = useStore((s) => s.settings);
  const user = useStore((s) => s.user);
  const unlock = useStore((s) => unlockFor(post.id, person.id, s));
  const currentPost = useStore((s) => s.posts.find((p) => p.id === post.id));
  if (!currentPost || !canContactPost(currentPost, settings, user?.id)) return null;

  if (unlock?.status === "unlocked") {
    const wa = "92" + person.phone.replace(/^0/, "");
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={`tel:${person.phone}`} className="btn-big text-lg"><Phone className="h-5 w-5" />{person.phone}</a>
        <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="btn-big bg-success text-lg text-accent-foreground"><MessageCircle className="h-5 w-5" />WhatsApp</a>
      </div>
    );
  }
  if (unlock?.status === "pending") {
    return <div className="mt-3 flex items-center gap-2 rounded-xl bg-warning/15 p-3 font-semibold text-warning"><Clock className="h-5 w-5" />Payment under verification</div>;
  }

  const pay = () => {
    if (!txn.trim()) return;
    setState((s) => {
      const latest = s.posts.find((p) => p.id === post.id);
      if (!latest || !s.user || !canContactPost(latest, s.settings, s.user.id) || unlockFor(post.id, person.id, s)) return s;
      return { ...s, unlocks: [...s.unlocks, { id: uid(), postId: post.id, interestId: person.id, userId: s.user.id, method, txn, screenshot: shot, amount: s.settings.fee, status: s.settings.instantUnlock ? "unlocked" : "pending", at: Date.now() }] };
    });
    setStep(0);
  };

  const methods = [
    { k: "easypaisa", label: "Easypaisa", acc: settings.easypaisa, logo: settings.paymentIcons?.easypaisa || easypaisaLogo.url },
    { k: "jazzcash", label: "JazzCash", acc: settings.jazzcash, logo: settings.paymentIcons?.jazzcash || jazzcashLogo.url },
    { k: "bank", label: "Bank", acc: settings.bankIban, logo: settings.paymentIcons?.bank || null },
  ] as const;
  const account = methods.find((m) => m.k === method)?.acc ?? "";
  const copyAccount = async () => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
    } catch { setCopyError(true); }
  };

  return (
    <>
      <Button size="contact" onClick={() => setStep(1)} className="mt-3"><Phone className="h-5 w-5" />Contact</Button>
      {step > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-popover p-5 animate-in slide-in-from-bottom">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-3xl">{step === 1 ? "Unlock Contact" : "Payment"}</h2>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setStep(0)}><X /></Button>
            </div>
            {step === 1 ? (
              <>
                <div className="rounded-2xl bg-hero p-5 text-center text-primary-foreground">
                  <p className="text-sm font-semibold uppercase opacity-80">Connection fee</p>
                  <p className="font-display text-6xl">{formatPKR(settings.fee)}</p>
                  <p className="text-sm">to unlock {person.name}'s contact</p>
                </div>
                <div className="mt-4 space-y-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
                  <p className="font-bold text-warning">Disclaimer</p>
                  <p>The contact is provided after payment only. Whether or not your ride-sharing deal is finalised with this contact, Travel Sync will not be responsible for anything beyond this point.</p>
                  <p>This offer will auto-cancel after {settings.hours} hours if the contact is not unlocked.</p>
                  <div dir="rtl" lang="ur" className="space-y-2 border-t border-warning/30 pt-3 text-base leading-loose">
                    <p className="font-bold text-warning">اعلانِ دستبرداری</p>
                    <p>یہ رابطہ نمبر ادائیگی کے بعد فراہم کیا جاتا ہے۔ اس رابطے سے آپ کی رائیڈ شیئرنگ ڈیل ہو یا نہ ہو، آگے کی کسی بھی بات کے ہم ذمہ دار نہیں ہیں۔</p>
                    <p>یہ آفر {settings.hours} گھنٹے کے بعد خودبخود منسوخ ہو جائے گی۔</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="connection" className="mt-4"><Link to="/reviews/$postId/$interestId" params={{ postId: post.id, interestId: person.id }} onClick={() => setStep(0)}><Star className="text-warning" />View ratings & reviews</Link></Button>
                <Button size="connection" onClick={() => setStep(2)} className="mt-5">Proceed to Payment</Button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {methods.map((m) => (
                    <Button variant="secondary" key={m.k} aria-label={m.label} aria-pressed={method === m.k} onClick={() => { setMethod(m.k); setCopied(false); setCopyError(false); }} className={`h-24 flex-col rounded-lg border-2 px-1 py-2 font-bold ${method === m.k ? "border-primary bg-primary/15" : "border-border bg-secondary"}`}>
                      {m.logo ? <span className="flex h-14 w-full items-center justify-center rounded bg-brand-surface p-1"><img src={m.logo} alt="" width={172} height={120} className="h-full w-full object-contain" /></span> : <Landmark className="my-4 text-muted-foreground" />}
                      <span className="text-xs">{m.label}</span>
                    </Button>
                  ))}
                </div>
                <div className="mt-4 card-box space-y-1 p-4">
                  <p className="text-sm text-muted-foreground">Send {formatPKR(settings.fee)} to</p>
                  {method === "bank" && <p className="font-semibold">Account Title: {settings.bankTitle}</p>}
                  <div className="flex items-center gap-2"><p className="min-w-0 flex-1 break-all font-display text-2xl">{account}</p><Button variant="ghost" size="icon" disabled={!account} aria-label={copied ? "Account number copied" : "Copy account number"} title={copied ? "Copied" : "Copy account number"} onClick={copyAccount} className="shrink-0 text-primary">{copied ? <Check /> : <Copy />}</Button></div>
                  <p role="status" className="min-h-5 text-xs text-muted-foreground">{copyError ? "Couldn't copy. Please select and copy the number." : copied ? "Account number copied" : ""}</p>
                </div>
                <input className="field mt-4" placeholder="Transaction ID" value={txn} onChange={(e) => setTxn(e.target.value)} />
                <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed p-4 text-muted-foreground">
                  {shot ? <CheckCircle2 className="text-success" /> : <Upload />} {shot ? "Screenshot attached" : "Upload payment screenshot"}
                  <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setShot(await compressImage(f)); }} />
                </label>
                <Button size="connection" disabled={!txn.trim()} onClick={pay} className="mt-5">Submit Payment Proof</Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
