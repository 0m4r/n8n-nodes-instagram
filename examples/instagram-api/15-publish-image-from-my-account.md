# Publish an Image from My Account

## What it does

Manually publishes a public image URL to the Instagram professional account selected by the credential. The workflow calls `/me` to get the account ID, so you do not have to enter or look up an Instagram account ID. It uses no webhook.

1. **Manual Trigger** — start it from the n8n editor.
2. **Auth / Get Me** — gets the account ID from the credential's access token.
3. **Image / Publish** — creates and publishes the image using that ID.

## Prerequisites

- An **Instagram API** credential using Instagram Login, with `instagram_business_basic` and `instagram_business_content_publish` permissions.
- A publicly accessible image URL that meets Meta's image publishing requirements. Replace the example URL before execution.

## How to use

1. Import `15-publish-image-from-my-account.json` into n8n.
2. Select the same Instagram API credential on both Instagram nodes.
3. Replace the placeholder image URL and caption.
4. Click **Execute Workflow** to publish.

## Related documentation

- [Instagram Content Publishing](https://developers.facebook.com/documentation/instagram-platform/content-publishing)
- [Create media container](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media)
