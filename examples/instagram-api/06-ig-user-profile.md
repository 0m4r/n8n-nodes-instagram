# Get IG User Profile & Media

## What it does

This workflow runs every 12 hours to fetch an Instagram Business/Creator account's profile data and its recent media. It demonstrates read-only operations on the IG User resource.

1. **Cron trigger** — fires every 12 hours.
2. **Instagram node (IG User / Get)** — reads basic profile data (username, name, biography, follower counts, etc.) for the specified account.
3. **Instagram node (IG User / Get Media)** — lists up to 10 recent media objects owned by the account.

## Features exercised

- **Resource:** `IG User`
- **Operations:** `Get` (profile), `Get Media` (list media)
- Profile fields: id, username, name, biography, website, media_count, followers_count, follows_count, profile_picture_url
- Paginated media listing with configurable limit
- Read-only operations — no publishing or moderation

## Prerequisites

- An **Instagram API** credential (`instagramApi`) configured with a long-lived access token.
- Replace `YOUR_IG_USER_ID` with the Instagram Business/Creator account ID you want to read.

## How to use

1. Import `06-ig-user-profile.json` into n8n.
2. Open both Instagram nodes and replace `YOUR_IG_USER_ID` with the target account ID (or select from the account dropdown).
3. Adjust the **Limit** parameter in Get Recent Media (default 10, max 500).
4. Save and execute.

## Related documentation

- [IG User reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user)