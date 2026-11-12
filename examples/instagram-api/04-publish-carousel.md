# Publish Instagram Carousel (Album)

## What it does

This workflow publishes a carousel (album) post with up to 10 images and/or videos on a monthly schedule. It demonstrates the multi-item container creation flow.

1. **Cron trigger** — fires once every 30 days.
2. **Instagram node (Carousel / Publish)** — creates one child container per media item, waits for all children to be ready, creates a carousel container, then publishes it.

## Features exercised

- **Resource:** `Carousel`
- **Operation:** `Publish`
- Up to 10 media items per carousel (images and/or videos)
- Per-item container creation with polling
- Carousel container creation and publishing
- Per-item error reporting (if any child container fails, the error identifies which item)
- Optional **alt text**, **location ID**, **product tags**, and **user tags**

## Trigger

This workflow uses a **Cron trigger** (every 30 days).

**Why cron?** Publishing a carousel is an outbound action you initiate on a schedule. Instagram does not emit a real-time event when you want to publish content, so there is no webhook to listen to. A cron trigger is the right choice for scheduled publishing.

**When to use Instagram Trigger instead:** Never for publishing. The Instagram Trigger is for inbound events (comments, messages, mentions) pushed by Meta, not for outbound publishing.

## Prerequisites

- An **Instagram API** credential (`instagramApi`) configured with a long-lived access token.
- Replace `YOUR_IG_USER_ID` with your Instagram Business/Creator account ID.
- Replace media URLs with publicly accessible URLs that Meta can fetch.

## How to use

1. Import `04-publish-carousel.json` into n8n.
2. Open the **Publish Carousel** node and select or enter your Instagram account ID.
3. Update the **Caption** and **Carousel Media** items (2–10 items, mix of images and videos).
4. Save and execute.

## Alternative: dynamic media from input

Set **Carousel Input Mode** to `Use Field From Input` and provide an array field name (e.g., `mediaUrls`) on the incoming item. Each entry can be a string URL or an object with `url`/`src`/`imageUrl`/`videoUrl` properties.

## Related documentation

- [Carousel/album publishing](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media#carousel)