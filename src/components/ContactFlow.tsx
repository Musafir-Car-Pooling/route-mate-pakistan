import { useState } from "react";
import { X, Phone, MessageCircle, Clock, Upload, CheckCircle2 } from "lucide-react";
import { useStore, setState, uid, formatPKR, compressImage, unlockFor, type Interest, type Post } from "@/lib/store";

export function ContactButton({ post, person }: { post: Post; person: Interest }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [method, setMethod] = useState<"easypaisa" | "jazzcash" | "bank">("easypaisa");
  const [txn, setTxn] = useState("");
  const [shot, setShot] = useState<string>();
  const settings = useStore((s) => s.settings);
  const user = useStore((s) => s.user);
  const unlock = useStore((s) => unlockFor(post.id, person.id, s));

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
    setState((s) => ({
      ...s,
      unlocks: [...s.unlocks, { id: uid(), postId: post.id, interestId: person.id, userId: user?.id ?? "", method, txn, screenshot: shot, amount: s.settings.fee, status: s.settings.instantUnlock ? "unlocked" : "pending", at: Date.now() }],
    }));
    setStep(0);
  };

  const methods = [
    { k: "easypaisa", label: "Easypaisa", acc: settings.easypaisa },
    { k: "jazzcash", label: "JazzCash", acc: settings.jazzcash },
    { k: "bank", label: "Bank", acc: settings.bankIban },
  ] as const;

  return (
    <>
      <button onClick={() => setStep(1)} className="btn-big mt-3 text-xl"><Phone className="h-5 w-5" />Contact</button>
      {step > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-popover p-5 animate-in slide-in-from-bottom">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-3xl">{step === 1 ? "Unlock Contact" : "Payment"}</h2>
              <button aria-label="Close" onClick={() => setStep(0)}><X /></button>
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
                <button onClick={() => setStep(2)} className="btn-big mt-5">Proceed to Payment</button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {methods.map((m) => (
                    <button key={m.k} onClick={() => setMethod(m.k)} className={`rounded-xl border-2 py-3 font-bold ${method === m.k ? "border-primary bg-primary/15" : "border-border bg-secondary"}`}>{m.label}</button>
                  ))}
                </div>
                <div className="mt-4 card-box space-y-1 p-4">
                  <p className="text-sm text-muted-foreground">Send {formatPKR(settings.fee)} to</p>
                  {method === "bank" && <p className="font-semibold">Account Title: {settings.bankTitle}</p>}
                  <p className="font-display text-2xl">{methods.find((m) => m.k === method)!.acc}</p>
                </div>
                <input className="field mt-4" placeholder="Transaction ID" value={txn} onChange={(e) => setTxn(e.target.value)} />
                <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed p-4 text-muted-foreground">
                  {shot ? <CheckCircle2 className="text-success" /> : <Upload />} {shot ? "Screenshot attached" : "Upload payment screenshot"}
                  <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setShot(await compressImage(f)); }} />
                </label>
                <button disabled={!txn.trim()} onClick={pay} className="btn-big mt-5">Confirm Payment</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
