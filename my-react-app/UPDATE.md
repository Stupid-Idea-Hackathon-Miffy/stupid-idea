# ReelMate – Chat + Relationship Roulette

Based on `Stupid-Idea-Hackathon-Miffy/stupid-idea`, main commit `1c911aab7789b2ad66b420f7f09e05a9474d2dc9`.

## Install (existing Supabase project)
1. Open the existing Supabase project > SQL Editor > New query.
2. Paste and run **supabase/upgrade.sql**. Do NOT rerun the original setup.sql; the upgrade preserves existing profiles, likes, and connections.
3. Copy the ZIP's `src` and `supabase` folders into `my-react-app` (merge folders, replace only the supplied files). Back up or commit local work before replacing anything. If teammates have modified the same files since the base commit, merge those changes instead of blindly replacing them.
4. `npm run dev` from `my-react-app`. Existing `.env.local` and package dependencies are unchanged.

## Demo
- Like reels 1 and 2 to find fictional profiles. Open Matches.
- Gamble to add: 50% success, 50% denied; a failed add locks that target's add button for 30 seconds.
- A successful add requests a connection. Real recipients explicitly spin to accept; fictional profiles accept automatically.
- Messages: choose an accepted connection, select a reel, press Send. From the feed, tap Send or Share to choose a rotmate and send the current reel. A fictional profile gives a clearly labeled automated reply.
- Gamble to reject: 10% success, 90% denied; a failed rejection locks that target's theatrical rejection for seven days. On success the pair is hidden and contact stops. Private hide/block is always available and immediately prevents contact in both directions. No real money is involved.
- The odds and timestamps are calculated on the database rather than in the animation. Existing accepted connections remain accepted.
- For two real users, use two browsers/incognito windows and fictional adult profiles, like the same reels, and try both add/accept spins.

## When adding new reels
The source repo had IDs 1, 2, 3. Add your new IDs to `public.reel_catalog` in Supabase (and to `src/data/reels.js`). Example: `insert into public.reel_catalog(reel_id) values ('4'), ('5') on conflict do nothing;`. Reel-only messaging validates this catalog on the server. Seeded profile likes and automated replies still use the original IDs; keep their meanings stable. The existing three reels are emoji placeholders until actual video files/URLs are supplied.

## Checks & limitations
JS/JSX syntax was checked with TypeScript transpilation, but the full React app and SQL were not run against your live project. Polling updates conversations every 2.5 seconds while open; no realtime subscription is required. This is a fictional 18+ hackathon prototype, not a production dating platform. GitHub denied permission to create a branch, so no changes have been pushed.
