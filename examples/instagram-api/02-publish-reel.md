# Publish Instagram Reel

## What it does

This workflow publishes a Reel video to Instagram on a weekly schedule. It demonstrates video media publishing with container polling and Trial Reel support.

1. **Cron trigger** — fires once every 7 days.
2. **Instagram node (Reels / Publish)** — creates a video media container, polls until processing completes, then publishes it as a Reel.

## Features exercised

- **Resource:** `Reel`
- **Operation:** `Publish`
- Video container creation and polling (longer processing than images)
- **Trial Reel** graduation strategy (`SS_PERFORMANCE` — auto-graduate if it performs well with non-followers)
- Optional **product tags** and **user tags**
- Optional **location ID** tagging

## Prerequisites

- An **Instagram API** credential (`instagramApi`) configured with a long-lived access token.
- Replace `YOUR_IG_USER_ID` with your Instagram Business/Creator account ID.
- Replace `https://example.com/videos/reel.mp4` with a publicly accessible MP4/MOV video URL that Meta can fetch.

## How to use

1. Import `02-publish-reel.json` into n8n.
2. Open the **Publish Reel** node and select or enter your Instagram account ID.
3. Update the **Video URL** and **Caption** parameters.
4. Choose a **Trial Reel – Graduation Strategy** (`MANUAL` or `SS_PERFORMANCE`) in Additional Fields.
5. Save and execute.

## Related documentation

- [Reels publishing guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing/reels/)
- [Trial Reels documentation](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media#trial_params)