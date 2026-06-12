# Blip Supabase Backend

The app now has Supabase environment variables, typed REST helpers, Supabase Auth wiring, and a hybrid UI data layer. Demo data is used only while there are no real profiles yet; once a profile exists, the UI reads the real Supabase rows.

## Project Config

Local environment file:

```txt
.env.local
```

Required values:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Setup Steps

1. Open Supabase Dashboard.
2. Go to SQL Editor.
3. Run `supabase/schema.sql`.
4. Confirm these storage buckets exist: `avatars`, `posts`, `videos`, `album-art`.
5. Keep service-role keys out of the frontend app and out of chat.

## Connected Now

- Profiles, posts, Instants, message threads, thread members, messages, friendships, and friend requests are loaded through Supabase REST.
- Settings now includes a Supabase account card for sign in/sign up/sign out using the existing public environment variables.
- After sign-up or sign-in, Blip creates the user's `profiles` row if it does not exist.
- Settings changes, friend requests, blips, comments, and sent chat messages use the signed-in user's access token when available.
- If row-level security blocks a write because no user is signed in, the UI keeps local prototype behavior so the app still feels responsive.
- Local comment-count bumps are not persisted across refreshes; real comments persist through `post_comments`.

## Next Wiring Order

1. Storage uploads for avatars, posts, videos, and album art.
2. Create-post persistence from the composer/editor.
3. Realtime subscriptions for comments, blips, friend requests, and messages.
4. Password reset and email-confirmation screens.
