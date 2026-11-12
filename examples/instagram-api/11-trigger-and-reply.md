# Instagram Trigger & Auto-Reply

## What it does

This workflow listens for real-time Instagram webhook events (comments and messages) and automatically replies to them. It demonstrates the **Instagram Trigger** node combined with the **Instagram** action node for response.

1. **Instagram Trigger** — receives webhook events from Meta (comments and messages).
2. **If nodes** — route events by type (`comments` vs `messages`).
3. **Instagram node (Comments / Send Private Reply)** — replies to commenters.
4. **Instagram node (Messaging / Send Message)** — replies to DM senders.

## Features exercised

- **Instagram Trigger** — webhook-based real-time event reception
- Event filtering (`comments`, `messages`)
- Signature verification via `instagramWebhookApi` credential (App Secret)
- Conditional routing with IF nodes
- Comment private reply and direct message sending

## Prerequisites

- **Instagram Webhook API** credential (`instagramWebhookApi`) configured with your Meta App Secret.
- **Instagram API** credential (`instagramApi`) configured with a **Facebook Page access token** whose **API Endpoint** is set to **Facebook Graph API** (`graph.facebook.com`). The token needs `instagram_manage_messages` to send private replies (a typical setup also includes `instagram_basic`, `instagram_manage_comments` and `pages_read_engagement`). The default `graph.instagram.com` (Instagram Login) endpoint does **not** support private replies.
- Replace `YOUR_VERIFY_TOKEN` with a secret string matching your Meta App Dashboard webhook settings.
- Replace `YOUR_IG_USER_ID` with your Instagram Business/Creator account ID.
- **Important**: Private replies can only be sent within 7 days of the comment being made. After 7 days, the Instagram API will return "Bad request - please check your parameters". Ensure the comment is recent before attempting to reply.
- The comment ID is extracted from webhook data as `{{ $json.value.id }}` (not `comment_id`).

## Setup in Meta App Dashboard

1. Go to [Meta for Developers](https://developers.facebook.com/) → your app → **Webhooks**.
2. Subscribe to the Instagram product and the fields you need (e.g., `comments`, `messages`, `mentions`).
3. Set the **Callback URL** to the production/test webhook URL shown in the **Instagram Trigger** node.
4. Set the **Verify Token** to match `YOUR_VERIFY_TOKEN` in the node.
5. Save — Meta will send a GET challenge request which the trigger node answers automatically.

## How to use

1. Import `11-trigger-and-reply.json` into n8n.
2. Configure both credentials (Webhook API with App Secret, Instagram API with access token).
3. Set your verify token and IG User ID.
4. Activate the workflow.
5. When someone comments or messages your Instagram account, n8n will receive the webhook and reply automatically.
6. **Important**: Check that the comment is within 7 days of being posted. The webhook data includes the comment's creation `time` field. If the comment is older than 7 days, the Instagram API will reject the private reply with "Bad request - please check your parameters".

## Why Instagram Trigger?

This is the **correct** trigger for this workflow because the events originate from Instagram itself (Meta pushes them to n8n). The Instagram Trigger:

- Receives real-time webhook events from Meta (comments, messages)
- Validates Meta's signature using the `instagramWebhookApi` credential (App Secret)
- Handles the GET verification challenge during webhook subscription setup
- Filters events by type (`comments`, `messages`, etc.) before emitting workflow data

A generic webhook would not work here because it cannot validate Meta's webhook signature or handle the GET challenge. A cron trigger would introduce unacceptable delay (you'd be replying to comments hours late).

## Related documentation

- [Instagram Webhook Trigger setup](https://github.com/0m4r/n8n-nodes-instagram#instagram-webhook-trigger)
- [Meta Graph API webhooks reference](https://developers.facebook.com/docs/graph-api/webhooks/reference/instagram)