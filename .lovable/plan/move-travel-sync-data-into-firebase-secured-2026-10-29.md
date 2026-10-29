# Move Travel Sync data into Firebase (secured)

## Connection check
Your Firebase database (Firestore) is switched on and the app can reach it. It is currently in "test mode": anyone can read and write everything. This plan locks it down.

## What you will need to do in the Firebase console (about 5 minutes)
1. Authentication → Sign-in method → turn on **Email/Password**.
2. Firestore → Rules → paste the rules I write (I will give you the exact text) → Publish.
3. Create the admin account once by logging in with the admin email in the app (I create it automatically on first admin login).

## What changes in the app
- Sign up / log in use Firebase accounts instead of being saved on the phone. Passwords are no longer stored by the app.
- Members, ride posts, requests, interested members, payments, companies, cities, departments, slides and pages are all saved in Firebase, so everyone sees the same data on any phone.
- Real interest: when a member taps "Interested" on another member's post, they appear on the owner's list (replacing the sample/demo interested members).
- Phone numbers are kept in a separate private record. The security rules only let someone read it when a payment for that contact is marked "unlocked" (by admin approval, or instantly if instant-unlock is on).
- Admin panel (pp@gmail.com) can approve/reject payments and edit everything; the rules only allow that account to do admin actions.
- Uploaded images (logos, slides, screenshots) stay compressed and saved inside the records.

## Database layout
```text
users/{uid}            profile (no phone)
private/{uid}          phone number  -> readable only by owner, admin, or an unlocked payer
posts/{postId}         ride / request
posts/{postId}/interests/{uid}   members interested in a post
unlocks/{id}           payment proofs + status
settings/app           fees, accounts, cities, departments, pages, slides
companies/{id}         partner companies
```

## Limits to know
- Instant unlock is enforced by the rules, but a determined user could submit a fake transaction ID; admin review is still the safe option.
- Existing test data saved on phones will not be copied over.

## Technical details
- Add `firebase` auth + firestore modules (already installed package); store.ts keeps the same React API but subscribes to Firestore snapshots, writes go through Firestore.
- Rules use `exists()/get()` on `unlocks` to gate `private/{uid}`; admin check by `request.auth.token.email`.
- Update store tests for pure helpers; Playwright check of register → post → interest → pay → admin approve → phone visible.
