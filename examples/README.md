# Example n8n Workflows

This folder contains example n8n workflows for the **@0m4r/n8n-nodes-instagram** package, split into two subfolders based on which **Facebook/Instagram Graph API endpoint** they target.

## Folder Structure

```
examples/
├── README.md                    # this file — API comparison and index
├── instagram-api/               # graph.instagram.com (Instagram Login)
│   ├── 01-publish-image.json    # Publish a single image post
│   ├── 01-publish-image.md
│   ├── 02-publish-reel.json     # Publish a Reel video (Trial Reel support)
│   ├── 02-publish-reel.md
│   ├── 03-publish-story.json    # Publish a Story via webhook
│   ├── 03-publish-story.md
│   ├── 04-publish-carousel.json # Publish a carousel (album) with 2–10 items
│   ├── 04-publish-carousel.md
│   ├── 05-comment-moderation.json # List/hide comments, send private replies
│   ├── 05-comment-moderation.md
│   ├── 06-ig-user-profile.json  # Read IG User profile and recent media
│   ├── 06-ig-user-profile.md
│   ├── 08-send-direct-message.json # Send a DM via webhook
│   ├── 08-send-direct-message.md
│   ├── 09-token-operations.json # Refresh access token, validate /me
│   ├── 09-token-operations.md
│   ├── 11-trigger-and-reply.json # Real-time webhook trigger + auto-reply
│   ├── 11-trigger-and-reply.md
│   ├── 12-full-content-pipeline.json # End-to-end: verify → publish → respond
│   ├── 12-full-content-pipeline.md
│   ├── 13-get-my-account.json  # Manual /me request; no account ID or webhook
│   ├── 13-get-my-account.md
│   ├── 14-list-recent-comments.json # Find media and list comments without pasted IDs
│   ├── 14-list-recent-comments.md
│   ├── 15-publish-image-from-my-account.json # Publish using /me; no account ID or webhook
│   └── 15-publish-image-from-my-account.md
└── facebook-api/                # graph.facebook.com (Facebook Login)
    ├── 07-hashtag-search.json   # Search hashtags, fetch top/recent media
    ├── 07-hashtag-search.md
    ├── 10-page-to-ig-account.json # Get Instagram account from a Facebook Page
    └── 10-page-to-ig-account.md
```

## graph.instagram.com vs graph.facebook.com — Use Case Differences

| Aspect                    | `graph.instagram.com` (Instagram Login)                    | `graph.facebook.com` (Facebook Login)                             |
| ------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| **Credential Endpoint**   | `graph.instagram.com` (default)                            | `graph.facebook.com`                                              |
| **Token Type**            | Instagram User access token                                | Facebook Login access token                                       |
| **Primary Use Cases**     | Publishing media, comments, IG User profile, messaging, token refresh | Hashtag search, Page → Instagram account lookup |
| **Media Publishing**      | ✅ Image, Reels, Stories, Carousel                         | ❌ Not supported on this endpoint                                 |
| **Comment Moderation**    | ✅ List, hide/unhide, delete, private replies              | ❌ Not supported                                                  |
| **Direct Messaging**      | ✅ Instagram Messaging API with Instagram User token       | ✅ Messenger Platform API with Page token                         |
| **IG User Profile/Media** | ✅ Read profile and media                                  | ❌ Not supported                                                  |
| **Hashtag Search**        | ❌ Not supported                                           | ✅ Search by name, top media, recent media                        |
| **Page Lookup**           | ❌ Not supported                                           | ✅ Get Instagram Business Account from a Facebook Page            |
| **Auth (/me, refresh)**   | ✅ Token exchange, refresh, validation                     | ✅ Also works (endpoint-agnostic)                                 |

### When to use `graph.instagram.com`

Use this endpoint (the default) for **content publishing, engagement, and Instagram Login messaging** workflows:

- Publishing images, Reels, Stories, and carousels to your Instagram Business/Creator account
- Moderating comments (list, hide, unhide, delete, private replies)
- Sending direct messages to users who initiated a conversation with your professional account (requires their Instagram-scoped ID)
- Reading your own IG User profile and media
- Refreshing and validating your Instagram access token
- Responding to real-time webhook events (comments, messages)

**Credential setup:** Create an **Instagram API** credential with your Instagram User access token and leave **API Endpoint** as `graph.instagram.com`.

### When to use `graph.facebook.com`

Use this endpoint for **Facebook Login–gated** workflows that Instagram Login tokens cannot access:

- Searching for hashtags by name and retrieving their IG Hashtag ID
- Fetching top or recent media tagged with a hashtag
- Looking up the Instagram Business/Creator account connected to a Facebook Page

**Credential setup:** Create an **Instagram API** credential with a Facebook Login access token and set **API Endpoint** to `graph.facebook.com`.

> **Note:** Publishing, comments, messaging, and IG User operations require an Instagram Login token (`graph.instagram.com`). Hashtag search and Page lookup require a Facebook Login token (`graph.facebook.com`). You cannot mix endpoints in a single credential — use separate credentials if you need both sets of capabilities.

## Credentials Required

Most workflows use the **Instagram API** credential. Workflow 11 additionally needs the **Instagram Webhook API** credential (Meta App Secret) for signature verification.

## Trigger Types: Manual, Generic Webhook, and Instagram Trigger

The examples use manual execution, a generic webhook, schedules, and the Instagram Trigger. They serve different purposes.

|                   | Manual Trigger (`n8n-nodes-base.manualTrigger`) | Generic Webhook (`n8n-nodes-base.webhook`)                                                  | Instagram Trigger (`instagramTrigger`)                                       |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Who initiates** | You run it from the n8n editor                  | An external system sends an HTTP request **to n8n**                                        | Meta/Instagram pushes an event **to n8n**                                    |
| **Typical use**   | Try an API operation without a schedule        | On-demand or external-system-triggered actions                                              | Real-time reaction to Instagram activity                                     |
| **Credential**    | **Instagram API**                               | Usually **Instagram API** for the action node                                               | **Instagram Webhook API** (App Secret) + **Instagram API** for replies        |

Examples **13–15** use a Manual Trigger. Run them from the editor without configuring a webhook callback or schedule. Example 14 derives account and media IDs from API responses before listing comments.

### Use a Generic Webhook when…

An external system needs to tell n8n to do something with Instagram:

- Publishing an image, Reel, Story, or carousel on request from a CMS or mobile app
- Sending a direct message triggered by an external order confirmation or support ticket
- Any workflow where n8n initiates an outbound action to Instagram

Examples using a generic webhook: **03** (Publish Story), **08** (Send Direct Message), **12** (Full Content Pipeline).

### Use the Instagram Trigger when…

Instagram itself pushes a real-time event to n8n and you want to react:

- Auto-replying to comments as they come in
- Auto-replying to direct messages
- Monitoring mentions, story insights, or live comments

Example using the Instagram Trigger: **11** (Trigger & Auto-Reply).

### Example mapping

| #   | Example              | Trigger               | Why                                                          |
| --- | -------------------- | --------------------- | ------------------------------------------------------------ |
| 01  | Publish Image        | Cron                  | Scheduled publishing                                         |
| 02  | Publish Reel         | Cron                  | Scheduled publishing                                         |
| 03  | Publish Story        | Generic Webhook       | External system initiates publishing                         |
| 04  | Publish Carousel     | Cron                  | Scheduled publishing                                         |
| 05  | Comment Moderation   | Cron                  | Batch moderation (could use Instagram Trigger for real-time) |
| 06  | IG User Profile      | Cron                  | Read-only periodic sync                                      |
| 07  | Hashtag Search       | Cron                  | Periodic research                                            |
| 08  | Send Direct Message  | Generic Webhook       | External system initiates a DM                               |
| 09  | Token Operations     | Cron                  | Scheduled token maintenance                                  |
| 10  | Page → IG Account    | Cron                  | Periodic lookup                                              |
| 11  | Trigger & Auto-Reply | **Instagram Trigger** | Real-time inbound events from Meta                           |
| 12  | Content Pipeline     | Generic Webhook       | External system initiates publishing                         |
| 13  | Get My Account       | Manual Trigger        | Read `/me`; no account ID is required                        |
| 14  | List Recent Comments | Manual Trigger        | Derive account/media IDs and list comments                   |
| 15  | Publish from My Account | Manual Trigger     | Derive account ID with `/me`, then publish                   |

> **Key takeaway:** Use a Manual Trigger to try an operation from the editor, a schedule for recurring work, or a generic webhook when another system initiates an action. Use the Instagram Trigger when Meta pushes an event to you.

### IDs required by Meta

The manual examples avoid hard-coded account and media IDs where the API allows them to be discovered from `/me` or the account's media edge. Some actions still require IDs by API design:

- **Send Message** requires the recipient's Instagram-scoped ID (IGSID). The API does not let an app message an arbitrary username; the recipient must first message the professional account, and the app must be authorized for Instagram Messaging. Obtain the IGSID from an eligible messaging event or API response.
- **Comment moderation** requires the target media ID or comment ID. Example 14 discovers recent media IDs and lists comments without hard-coding them; moderation can use comment IDs from that output.

See Meta's [Instagram Messaging API requirements](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api) and [comment moderation guide](https://developers.facebook.com/docs/instagram-platform/comment-moderation).

For curl examples and n8n HTTP Request payloads for each webhook example, see the individual `.md` files for examples 03, 08, and 12.

## How to Use These Examples

1. **Install the node package** in your n8n instance following the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).
2. **Create credentials:**
   - **Instagram API** — Access Token + API Endpoint (`graph.instagram.com` or `graph.facebook.com`)
   - **Instagram Webhook API** — Meta App Secret (for the Trigger node in `instagram-api/11-trigger-and-reply.json`)
3. **Import a workflow** JSON file from the appropriate subfolder.
4. **Configure parameters** — replace required media URLs and operation-specific IDs. Examples 13–15 discover the account ID automatically; messaging and moderation still require target IDs for relevant actions.
5. **Save and execute**. Click **Execute Workflow** for examples 13–15; activate scheduled, generic-webhook, or Instagram-trigger workflows as appropriate.

## Node Resources Covered by Subfolder

**instagram-api/** (`graph.instagram.com`):

- Auth, Carousel, Comments, IG User, Image, Messaging, Reels, Stories, Instagram Trigger

**facebook-api/** (`graph.facebook.com`):

- IG Hashtag, Page

## Support

For issues with these examples or the node package, see the [main README](../README.md) or open an issue at [github.com/0m4r/n8n-nodes-instagram](https://github.com/0m4r/n8n-nodes-instagram/issues).
