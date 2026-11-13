# Get My Instagram Account

## What it does

Runs the Instagram `/me` request using the account selected in the Instagram API credential. This is a manual, read-only example: it needs no webhook configuration, account ID, media ID, or recipient ID.

1. **Manual Trigger** — run it from the n8n editor with **Execute Workflow**.
2. **Instagram (Auth / Get Me)** — returns the authenticated account details, including its ID and username.

## Prerequisites

- An **Instagram API** credential with an Instagram User access token and the appropriate `graph.instagram.com` endpoint.
- The token must have permission to access the Instagram professional account.

## How to use

1. Import `13-get-my-account.json` into n8n.
2. Select your Instagram API credential on **Get My Account**.
3. Click **Execute Workflow**. Use the returned `id` in later nodes, or reference it dynamically with `={{ $json.id }}`.

## Related documentation

- [Instagram Platform Webhooks and API setup](https://developers.facebook.com/documentation/instagram-platform/overview)
- [Instagram User `/me` reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user)
