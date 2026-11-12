# Get Instagram Account from Facebook Page

## What it does

This workflow runs daily to look up the Instagram Business/Creator account connected to a Facebook Page. It demonstrates the Page resource, which requires the Facebook Graph API endpoint (`graph.facebook.com`).

1. **Cron trigger** — fires once every 24 hours.
2. **Instagram node (Page / Get Instagram Account)** — calls `GET /{page-id}?fields=instagram_business_account` and returns the connected Instagram account ID.

## Features exercised

- **Resource:** `Page`
- **Operation:** `Get Instagram Account`
- Retrieves the `instagram_business_account` object for a Facebook Page
- Returns the Instagram User ID, which can be fed into other resources (Image/Reels/Stories/Carousel/IG User)

## Trigger

This workflow uses a **Cron trigger** (every 24 hours).

**Why cron?** Looking up the Instagram account connected to a Facebook Page is a periodic administrative task. There is no real-time webhook event for Page-to-Instagram-Account mapping changes, so a cron trigger is the right choice.

**When to use Instagram Trigger instead:** Not applicable. This is an outbound lookup, not an inbound event.

## Prerequisites

- An **Instagram API** credential (`instagramApi`) configured with a long-lived access token.
- The credential's **API Endpoint** should be set to **Facebook Graph API** (`graph.facebook.com`).
- Replace `YOUR_FACEBOOK_PAGE_ID` with the Facebook Page ID linked to your Instagram professional account.

## How to use

1. Import `10-page-to-ig-account.json` into n8n.
2. Open your Instagram API credential and set **API Endpoint** to `Facebook Graph API`.
3. Open the **Get Instagram Account** node and update **Page ID**.
4. Save and execute. The output contains the Instagram Business Account ID you can use in other workflows.

## Related documentation

- [Page Instagram Business Account lookup](https://developers.facebook.com/docs/graph-api/reference/page#instagram_business_account)
