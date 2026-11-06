# Interest withdrawal, chat delivery and chat icon

## What members will see

**1. "Not interested" after "Interested" removes the interest**
- If a member taps Interested and then taps Not interested (or Cancel interest), their name disappears from the poster's interested list straight away, and the poster's count goes down.

**2. Hidden-number member actually receives chat messages**
- Messages sent by the payer arrive live on the hidden member's chat screen, and the hidden member can reply.
- The "This page didn't load" screen on the hidden member's phone will be fixed so the chat opens normally.
- A phone notification is sent to the hidden member when a new message arrives (only when they allowed notifications); tapping it opens that chat.

**3. Chat icon with unread count in the header**
- The bell in the top bar is replaced with a chat icon.
- It shows a count of unread messages from all chats.
- Opening a chat marks its messages as read and the count drops; new messages bring it back.
- Nearby ride/request alerts still open their own screen automatically as today (they just no longer use the bell badge). Please tell me if you want the bell kept next to the chat icon instead.

## Technical details
- Interest: "Not interested" in IncomingOffers currently only hides the card locally; make it also call `removeMemberInterest` when the member already sent interest, so cloud.ts deletes `posts/{pid}/interests/{uid}`. Verify the poster's listener updates.
- Chat failure is not yet confirmed. First step: reproduce with two test accounts (payer + hidden member, approved chat unlock) via Playwright, capture the runtime error behind "This page didn't load" and the Firestore errors for `watchIncomingChats` / `watchChat` (likely candidates: chat route crashing when the unlock is not in the hidden member's store, a missing composite index for the `interestId + kind` query, or rules not yet published). Fix the confirmed cause.
- Unread: store a per-chat `lastRead` timestamp per member (`chatReads/{uid}` doc, owner-only in firestore.rules); unread = messages from the other person newer than `lastRead`. A shared watcher in cloud.ts subscribes to all my chat threads and feeds the header badge.
- Notification: reuse existing push setup in src/lib/push.ts to send a data push to the other member on sendChat, with path `/chat/{id}`.
- Updated firestore.rules block will be provided for publishing.
- Tests: withdrawing interest removes it from the post; unread count drops to 0 after marking read.
