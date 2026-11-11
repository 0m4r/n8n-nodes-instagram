# Search Hashtags & Get Media

## What it does

This workflow runs daily to search for a hashtag by name, then fetches the top media tagged with that hashtag. It demonstrates the IG Hashtag resource, which requires the Facebook Graph API endpoint (`graph.facebook.com`).

1. **Cron trigger** — fires once every 24 hours.
2. **Instagram node (IG Hashtag / Search)** — searches for the hashtag "n8n" and returns its IG Hashtag ID.
3. **Instagram node (IG Hashtag / Get Top Media)** — fetches up to 20 top media items tagged with that hashtag ID.

## Features exercised

- **Resource:** `IG Hashtag`
- **Operations:** `Search`, `Get Top Media` (also supports `Get Recent Media`)
- Hashtag search by name (without the `#` symbol)
- Top media and recent media pagination with configurable limit
- Uses the hashtag ID from search output as input to media lookup

## Prerequisites

- An **Instagram API** credential (`instagramApi`) configured with a long-lived access token.
- The credential's **API Endpoint** should be set to **Facebook Graph API** (`graph.facebook.com`), because hashtag search requires Facebook Login.
- Replace `"n8n"` with the hashtag you want to search (without the `#` symbol).

## How to use

1. Import `07-hashtag-search.json` into n8n.
2. Open your Instagram API credential and set **API Endpoint** to `Facebook Graph API`.
3. Open the **Search Hashtag** node and update the **Hashtag Name** parameter.
4. Optionally switch `Get Top Media` to `Get Recent Media` in the second node.
5. Save and execute.

## Related documentation

- [IG Hashtag Search](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag-search/)
- [IG Hashtag Top Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag/top-media/)
- [IG Hashtag Recent Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag/recent-media/)