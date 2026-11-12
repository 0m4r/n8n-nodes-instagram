# Full Instagram Content Pipeline

## What it does

This workflow demonstrates an end-to-end content pipeline triggered by an HTTP webhook. It verifies authentication, then publishes an image using the authenticated account's ID dynamically.

1. **Webhook trigger** — receives a publish request with image URL, caption, and optional alt text.
2. **Instagram node (Auth / Get Me)** — verifies the access token and returns the authenticated account ID.
3. **Instagram node (Image / Publish)** — publishes the image using the account ID from step 2 (dynamic, not hardcoded).
4. **Respond to Webhook** — returns the published media ID and permalink.

## Features exercised

- End-to-end pipeline: auth verification → publishing → response
- Dynamic account ID from `/me` response (no hardcoded IDs)
- Image publishing with optional alt text
- Returns published media metadata (ID, permalink)

## Trigger

This workflow uses a **Generic Webhook trigger** (`n8n-nodes-base.webhook`).

**Why a generic webhook?** The content pipeline is triggered by an external system requesting a publish. The webhook lets that system tell n8n to verify authentication and publish an image on Instagram. This is **not** an inbound Instagram event, so the Instagram Trigger does not apply here.

**When to use Instagram Trigger instead:** Never for outbound publishing. The Instagram Trigger is for reacting to events Meta pushes to you (comments, messages, mentions).

## Calling the webhook endpoint

After importing and activating the workflow, copy the webhook URL from the **Webhook Trigger** node.

**curl:**
```bash
curl -X POST "https://your-n8n-instance.com/webhook/content-pipeline" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/images/photo.jpg",
    "caption": "Published via the n8n content pipeline!",
    "altText": "A photo shared through automated workflow"
  }'
```

**HTTP Request (n8n):**
```json
{
  "url": "={{ $json.webhookUrl }}",
  "method": "POST",
  "json": {
    "imageUrl": "https://example.com/images/photo.jpg",
    "caption": "Published via the n8n content pipeline!",
    "altText": "A photo shared through automated workflow"
  }
}
```

## Prerequisites

- An **Instagram API** credential (`instagramApi`) configured with a long-lived access token.

## How to use

1. Import `12-full-content-pipeline.json` into n8n.
2. Copy the webhook URL from the **Webhook Trigger** node.
3. Send a POST request with a JSON body like:
   ```json
   {
     "imageUrl": "https://example.com/images/photo.jpg",
     "caption": "Published via the n8n content pipeline!",
     "altText": "A photo shared through automated workflow"
   }
   ```
4. The workflow verifies the token, publishes the image, and returns the media ID and permalink.

## Extending this pipeline

- Replace the **Publish Image** node with **Reels**, **Stories**, or **Carousel** to publish other media types.
- Add a **Comments / List** node after publishing to monitor engagement.
- Add a **Messaging / Send Message** node to notify a team when content is published.

## Related documentation

- [Instagram Graph API - Publishing](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media)
- [Auth / Get Me](https://developers.facebook.com/docs/instagram-api/reference/ig-user)