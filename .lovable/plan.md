# Number privacy + paid in-app chat

## What members will see

**Sign up (Create Account)**
- New question after the mobile number: "Apna number hide rakhna chahte hain? / Keep your number hidden?" with two choices: **Show my number after payment** (current behaviour) or **Hide my number**.
- Short explanation under it (English + Urdu): "If you hide your number, drivers/passengers will never see it, even after payment. They can only contact you through in-app chat. You can change this later in My Account."
- Same switch in My Account so members can change it later.

**Contact button on a hidden-number member**
- Tapping Contact first shows a notice: "This member has kept their number hidden. You can only reach them through in-app chat. Pay PKR 150 to turn on chat." (English + Urdu).
- "Proceed" then opens the exact same fee + disclaimer + Easypaisa/JazzCash/Bank screens as today — the disclaimer text is not changed.
- After the payment is approved (or instantly if instant unlock is on), instead of a phone number the card shows an **Open chat** button.

**Chat screen**
- Simple one-to-one chat between the payer and that member, per offer: message list, text box, Send. Messages appear live on both phones.
- The hidden member sees the chat from the bell/My Account ("Messages") and from the offer card, and can reply.
- Phone number is never revealed in this case.

**Members who show their number** — nothing changes.

**Admin** — chat fee shown as a setting (default PKR 150) next to the existing connection fee; payments list labels each as "Contact" or "Chat".

## Technical details
- `User.phonePublic` already exists (always false today); repurpose as new `hidePhone: boolean` on user + public profile copy on each interest so the payer's client knows before paying.
- Settings: add `chatFee` (default 150). Unlock record gets `kind: "phone" | "chat"`; amount = chatFee for chat.
- `firestore.rules`: `private/{uid}` read additionally requires target not `hidePhone`; new `chats/{unlockId}/messages/{id}` readable/writable only by payer and member when the unlock is `unlocked`. Rules block will be given to publish in Firebase console.
- New route `src/routes/chat.$id.tsx`, live Firestore listener in `cloud.ts`; ContactFlow branches on `hidePhone` for the pre-notice and post-unlock button.
- Demo users: add optional "hide number" toggle in AdminDemoUsers; chat with demo users is one-way (no replies) — flagged for you to confirm.
- Tests: chat unlock uses chatFee 150; hidden member's phone never returned after unlock.
