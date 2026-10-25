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

- App data lives in the in-memory/localStorage store at src/lib/store.ts (prototype until a real backend and payment gateway are added); contact numbers must only render once an unlock has status "unlocked".
- City catalogs are nested under settings in the prototype store, and home validates route choices against that catalog; this keeps admin entries and passenger/driver options consistent.
- Admin city/location controls live in a dedicated AdminLocations component to keep catalog management separate from payment and CMS controls.
- Reuse LocationPicker for admin-catalog location selection with searchable dialogs so search cannot create unapproved addresses.
- Store travelMode separately from professional role and keep photo/vehicle fields optional so either registration path works without uploads.
- Registration uses approved entries from the shared company/institute catalog, departments from settings, and city-scoped location pickers; validate against current catalogs on submit to prevent stale selections. Student IDs remain personal inputs rather than catalog entries.
- Department catalog controls live in AdminDepartments to keep registration catalog management isolated from other admin tools.
- ProfileSelections reuses LocationPicker and validates all edits against current catalogs before saving, keeping registration and profile choices consistent.
- Offer cancellation and contact eligibility share store helpers; both matching and payment submission must check the latest offer state to prevent stale actions.
- Member review details live on a separate reviews route keyed by post and interest; display stored review entries only and label simulated member feedback as sample data.
