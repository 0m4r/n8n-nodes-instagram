# Publish Instagram Story

## What it does

This workflow publishes a Story to Instagram when an HTTP webhook is called. It's useful for integrating story publishing from external systems (e.g., a CMS, mobile app, or other n8n workflows).

1. **Webhook trigger** — listens for POST requests at `/webhook/publish-story`.
2. **Instagram node (Stories / Publish)** — creates a story media container from the video URL in the request body, polls until ready, then publishes it.
3. **Respond to Webhook** — returns a success response with the published story ID.

## Features exercised

- **Resource:** `Story`
- **Operation:** `Publish`
- Story media container → publish flow with polling
- Dynamic inputs from webhook request body (`videoUrl`, `caption`)
- HTTP response with the published story ID

## Prerequisites

- An **Instagram API** credential (`instagramApi`) configured with a long-lived access token.
- Replace `YOUR_IG_USER_ID` with your Instagram Business/Creator account ID.

## How to use

1. Import `03-publish-story.json` into n8n.
2. Copy the webhook URL shown in the **Webhook Trigger** node.
3. Send a POST request to that URL with a JSON body like:
   ```json
   {
     "videoUrl": "https://example.com/videos/story.mp4",
     "caption": "Check out my story!"
   }
   ```
4. The workflow publishes the story and responds with the story ID.

## Related documentation

- [Stories publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing/stories/)