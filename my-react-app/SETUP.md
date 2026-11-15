# ReelMate: backend + React integration

An additive overlay for the `my-react-app` folder on the main branch of `fnguy093/stupid-hackathon`, based on the three reels in the reviewed snapshot. Do not extract over Felicia's latest UI blindly: the only replacement files are `src/App.jsx`, `src/components/Sidebar.jsx`, and `src/components/VibeMatch.jsx`. Keep her reel catalog, icons, action rail, pager, reel card, and styling. If those three files changed since the snapshot, merge their changes manually before replacing.

## 1. Start Supabase

1. Create a fresh project at https://supabase.com/dashboard.
2. Open SQL Editor, paste all of `supabase/setup.sql`, and run once. It creates all tables, access policies, RPCs and five fictional matches. Do not rerun on an already initialized project.
3. In Authentication settings / Sign In / Providers, enable anonymous sign-ins. Use only fictional details in the demo. Keep it private/controlled; anonymous sign-in without CAPTCHA is not production-ready.
4. Copy your project URL and **publishable** key (legacy anon key also works). Never use the secret or service_role key in React.

## 2. Run React

Copy the contents of this bundle into `my-react-app` (review the three replacement files), then from that folder:

```sh
npm install @supabase/supabase-js
```

Copy `.env.example` to `.env.local`, fill in both values, then:

```sh
npm run dev
```

Use `npm run build` to validate your installed React app. For Vercel, set the root directory to `my-react-app`, add both VITE_ environment variables, and deploy. Don't commit `.env.local`.

## 3. One-minute test

- Open the app, enter a fictional name and age 18+, choose an avatar and save.
- Like reels 1 and 2; go to Matches. Jamie should be 100%, Alex and Taylor 67% (rounded from 2/3). Other scores are filtered out.
- Unlike one: matches disappear. Like it again. Reload: profile and likes persist in the same browser.
- Connect to Jamie: status is pending, and the Connections page shows an outgoing request. Fictional profiles do not respond automatically.
- To test actual two-way requests: open a second browser profile (or incognito), create a different fictional account, like the same two reels. Connect to the real second profile, then on its Connections page accept the incoming request. Both should show accepted after refreshing.

## Design / limitations

- Users receive an anonymous Auth ID, which persists in the same browser only. No email/password or account recovery. Keep demo details fictional, age 18+ only.
- Matching is Jaccard similarity rounded to the closest whole percentage, threshold 67, minimum 2 shared likes to fit the current 3-reel catalog. To use an exact threshold or require 3 shared likes, change `get_matches` after adding more reels. No personality or romantic compatibility claims beyond the joke.
- `profiles`, `likes`, `connections` are stored in Supabase. Reel IDs are stable strings from `src/data/reels.js`, not a second database catalog; IDs must be unique and never renumbered. Existing fictional histories use IDs 1,2,3. If you add more videos, update the demo likes in Supabase accordingly (otherwise their scores may drop as the visitor likes additional videos).
- Likes are private except shared reel IDs revealed to actual matches. RLS restricts direct access to each visitor's records; connection requests go through RPCs. Seed profiles are explicitly labeled as fictional and cannot receive a real acceptance.
- No actual video assets are supplied; Felicia's currently reviewed feed uses emoji placeholders. Add video files to `public/` and set each reel's `video` to `/filename.mp4`. Use content you own or have permission to use. Saves remain local, displayed like counts retain existing sample base numbers, and other rail actions are visual only. Profile avatars are emoji, not uploads. No chat, real dating preferences, age verification, blocking/reporting, production moderation or account recovery.
- No live Supabase credentials included. This overlay was generated separately and is not pushed to GitHub. Run the integration test above against your Supabase project.
