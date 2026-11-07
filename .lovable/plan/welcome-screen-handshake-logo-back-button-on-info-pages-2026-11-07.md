# Welcome screen handshake logo + back button on info pages

## 1. Welcome screen (Create account / I already have an account)
- Turn on the same handshake animation used on login and splash.
- Make the logo a bit smaller (about 112px down to about 88px) so it shows up faster and looks smoother.
- Make the logo loading smoother: preload the three logo pieces (ring + two hands) as soon as the app opens, and fade the logo in only once all three are ready, so it never shows half-loaded.

## 2. Back button on Contact us, About us, Privacy policy, Terms and conditions
- Add a round, floating back button at the bottom-left corner of these pages, always visible while scrolling.
- Tapping it goes to the previous screen (or Home if the page was opened from a shared link).
- Kept above the phone's bottom edge so it is easy to reach with the thumb.

## Technical details
- `src/routes/index.tsx`: welcome gate `AuthLogo` gets `animated` and `imgSize="h-22 w-22"`-ish (`h-[88px] w-[88px]`).
- `src/components/AppShell.tsx` `HandshakeEmblem`: track load of the 3 imgs, `opacity-0` until loaded then fade; add `<link rel="preload" as="image">` for the three assets in `__root.tsx` head.
- `src/routes/info.$slug.tsx`: fixed `bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-5` ArrowLeft button using `router.history.back()` with fallback navigate to `/`.
