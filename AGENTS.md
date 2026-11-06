<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Firestore is the source of truth; src/lib/store.ts is the in-memory view and src/lib/cloud.ts mirrors setState diffs to Firestore and applies snapshots via setRemote. Phone numbers live only in private/{uid}, readable via firestore.rules once unlocks/{payer}_{member} is "unlocked"; keep firestore.rules in sync with any data change.
- New posts go through cloud.sharePost (waits for server confirmation, tracks state.unsent) and posts are also re-read from the server on resume/online/every 20s, because mobile networks can silently stall writes or the live stream and members would never see each other.
- City catalogs are nested under settings in the prototype store, and home validates route choices against that catalog; this keeps admin entries and passenger/driver options consistent.
- Admin city/location controls live in a dedicated AdminLocations component to keep catalog management separate from payment and CMS controls.
- Reuse LocationPicker for admin-catalog location selection with searchable dialogs so search cannot create unapproved addresses.
- Store travelMode separately from professional role and keep photo/vehicle fields optional so either registration path works without uploads.
- Registration uses approved entries from the shared company/institute catalog, departments from settings, and city-scoped location pickers; validate against current catalogs on submit to prevent stale selections. Student IDs remain personal inputs rather than catalog entries.
- Department catalog controls live in AdminDepartments to keep registration catalog management isolated from other admin tools.
- ProfileSelections reuses LocationPicker and validates all edits against current catalogs before saving, keeping registration and profile choices consistent.
- Offer cancellation and contact eligibility share store helpers; both matching and payment submission must check the latest offer state to prevent stale actions.
- Member review details live on a separate reviews route keyed by post and interest; display stored review entries only and label simulated member feedback as sample data.
- The shared side-tray mode switch updates the active member and saved profile through switchTravelMode; Home derives its module from that profile so mode changes survive navigation and reload.
- Home feature slides live in FeatureSlider with reduced-motion support; shared Button sizes keep contact and pre-payment/review actions proportionate.
- Admin media uploads use the shared MediaUpload and compressMedia pipeline with PNG logo and JPEG slide byte budgets; settings overrides feed payment icons and Home slides directly so uploaded media stays consistent across views.
- PartnerMarquee uses a duplicated, reduced-motion-aware track; the member tray scrolls only its navigation and stops automatic movement upon user interaction to preserve control accessibility.
- NearbyOffersNavigation opens dedicated nearby routes for new same-route offers from live store updates; session receipts prevent reopening acknowledged screens, and reviews/payment/profile flows are not interrupted.
- Home-screen installation stays manifest-only with a shared InstallAppPrompt using the browser's deferred install event or mobile menu instructions; never add app-shell caching or alter the separate messaging worker for installability.
- Demo members are kept in settings.demoUsers (no phones) with phones in private/demo_{id}; the poster's client writes demo_ interest docs after the post is confirmed, so the existing unlock rule protects demo phones too.
- App-served images must be real files under src/assets (Vite-bundled) or public/, never Lovable CDN pointer imports, because the app is also deployed off Lovable where that CDN path is not served.
- Members with hidePhone get a chat-kind unlock (chatFee) instead of a phone reveal; chats/{unlockId}/messages is gated in firestore.rules by that unlock, and private/{uid} stays unreadable for hidden members.
