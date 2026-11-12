# Publish Instagram Image

## What it does

This workflow publishes a single image post to Instagram on a daily schedule. It demonstrates the core media-publishing flow:

1. **Cron trigger** — fires once every 24 hours.
2. **Instagram node (Image / Publish)** — creates a media container from the provided image URL, polls Instagram Graph API until the container is ready, then calls `media_publish` to post it to the account.

## Features exercised

- **Resource:** `Image`
- **Operation:** `Publish`
- Container → publish two-step flow with automatic polling
- Optional **alt text** for accessibility
- Optional **location ID** tagging
- Optional **product tags** and **user tags**

## Trigger

This workflow uses a **Cron trigger** (every 24 hours).

**Why cron?** Publishing an image is an outbound action you initiate on a schedule. Instagram does not emit a real-time event when you want to publish content, so there is no webhook to listen to. A cron trigger is the right choice for scheduled publishing.

**When to use Instagram Trigger instead:** Never for publishing. The Instagram Trigger is for inbound events (comments, messages, mentions) pushed by Meta, not for outbound publishing.

## Prerequisites

- An **Instagram API** credential (`instagramApi`) configured with a long-lived access token.
- Replace `YOUR_IG_USER_ID` with your Instagram Business/Creator account ID (or select from the account list).
- Replace `https://example.com/images/photo.jpg` with a publicly accessible image URL that Meta can fetch.

## How to use

1. Import `01-publish-image.json` into n8n.
2. Open the **Publish Image** node and select or enter your Instagram account ID.
3. Update the **Image URL** and **Caption** parameters.
4. Optionally add alt text, location ID, product tags, or user tags in **Additional Fields**.
5. Save and execute the workflow (or let the cron trigger run it automatically).

## Related documentation

- [Instagram Graph API - Publishing](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media)
- [Content publishing guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing/)
