# WhatsApp-style ticks in chat

Your own messages will show ticks next to the time:
- **One grey tick** — sent (saved), the other person hasn't received it yet.
- **Two grey ticks** — delivered: the other person's app received it (app open anywhere, e.g. home screen, chat list).
- **Two blue ticks** — read: the other person opened that chat.
- A small clock icon while a message is still sending.

## How it works
- Each message gets `deliveredAt` and `readAt` fields.
- The receiver's app (the chat inbox watcher that already runs for the unread count) marks incoming messages as delivered as soon as they arrive.
- Opening the chat marks the other person's messages as read.
- Sender's chat screen updates ticks live.

## Technical details
- `ChatMessage` type: add optional `deliveredAt`, `readAt`.
- `cloud.ts`: add `markChatDelivered(chatId, ids)` and `markChatRead(chatId, ids)` (batched updates, only for messages not from me and missing the field).
- `chat-unread.ts` inbox watcher calls delivered; `chat.$id.tsx` calls read + renders `Check`/`CheckCheck` (lucide) with blue for read; optimistic "sending" state.
- `firestore.rules`: allow `update` on `chats/{cid}/messages/{mid}` only by a chat member who is not the sender, only changing `deliveredAt`/`readAt`. You will need to publish the updated rules in Firebase console again.
- Small test for the tick-state helper (sent / delivered / read).
