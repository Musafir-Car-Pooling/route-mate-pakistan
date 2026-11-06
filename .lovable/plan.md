# Home cleanup, auto-remove expired posts, reviews button

## 1. Remove instructions box from Home
- Delete the "Instructions (e.g. pick me from main gate…)" box under From/To. Posts are saved with empty notes.

## 2. Expired requests/rides disappear automatically
- In "My Posts" on Home, hide any post whose 24h time is over (no more "Expired" rows).
- When the time runs out while the screen is open, the post vanishes within a second.
- When the owner's app is open, the expired post is deleted from the database, the same way as tapping the delete button. Paid contact records stay.
- Opening an expired post's screen shows "This post has expired" with a Home button.

## 3. Interested users: info first, reviews button below
- Each interested user's card shows name, company, gender, rating and car straight away, with **View ratings & reviews** underneath (already this order).
- Tapping the button now opens **only** the stars summary and the review list. The name, company and car are not shown again at the top. The page title becomes "Reviews of {name}".

## Technical
- `src/routes/index.tsx`: remove the textarea and the `notes` state; filter `mine` by `!isExpired`; a 1s tick; an effect calls `deleteOwnPost` for the user's expired posts.
- `src/routes/post.$id.tsx`: expired fallback.
- `src/routes/reviews.$postId.$interestId.tsx`: remove the profile header block.
