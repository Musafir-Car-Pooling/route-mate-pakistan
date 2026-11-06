# WhatsApp-style green chat bubbles

- Your own messages: dark WhatsApp green bubble (#005C4B style) with light text, so the blue read ticks stand out clearly.
- Other person's messages: dark grey bubble (WhatsApp dark mode style).
- Blue ticks use WhatsApp's tick blue (#53BDEB); grey ticks stay soft grey.
- The "sending" bubble uses the same green.

## Technical details
- Add semantic tokens in `src/styles.css`: `--chat-out`, `--chat-out-foreground`, `--chat-in`, `--chat-tick-read`, registered in `@theme` as colors.
- `src/routes/chat.$id.tsx`: replace `bg-primary text-primary-foreground` on own and pending bubbles with `bg-chat-out text-chat-out-foreground`, the incoming bubble with `bg-chat-in`, and `text-sky-300` with `text-chat-tick-read`.
