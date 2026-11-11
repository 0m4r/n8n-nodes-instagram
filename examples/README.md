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
│   └── 12-full-content-pipeline.md
└── facebook-api/                # graph.facebook.com (Facebook Login)
    ├── 07-hashtag-search.json   # Search hashtags, fetch top/recent media
    ├── 07-hashtag-search.md
    ├── 10-page-to-ig-account.json # Get Instagram account from a Facebook Page
    └── 10-page-to-ig-account.md
```

## graph.instagram.com vs graph.facebook.com — Use Case Differences

| Aspect                    | `graph.instagram.com` (Instagram Login)                         | `graph.facebook.com` (Facebook Login)                  |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Credential Endpoint**   | `graph.instagram.com` (default)                                 | `graph.facebook.com`                                   |
| **Token Type**            | Instagram User access token                                     | Facebook Login access token                            |
| **Primary Use Cases**     | Publishing media, comments, DMs, IG User profile, token refresh | Hashtag search, Page → Instagram account lookup        |
| **Media Publishing**      | ✅ Image, Reels, Stories, Carousel                              | ❌ Not supported on this endpoint                      |
| **Comment Moderation**    | ✅ List, hide/unhide, delete, private replies                   | ❌ Not supported                                       |
| **Direct Messaging**      | ✅ Send DMs via Messaging API                                   | ❌ Not supported                                       |
| **IG User Profile/Media** | ✅ Read profile and media                                       | ❌ Not supported                                       |
| **Hashtag Search**        | ❌ Not supported                                                | ✅ Search by name, top media, recent media             |
| **Page Lookup**           | ❌ Not supported                                                | ✅ Get Instagram Business Account from a Facebook Page |
| **Auth (/me, refresh)**   | ✅ Token exchange, refresh, validation                          | ✅ Also works (endpoint-agnostic)                      |

### When to use `graph.instagram.com`

Use this endpoint (the default) for **content publishing and engagement** workflows:

- Publishing images, Reels, Stories, and carousels to your Instagram Business/Creator account
- Moderating comments (list, hide, unhide, delete, private replies)
- Sending direct messages to Instagram users
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

## How to Use These Examples

1. **Install the node package** in your n8n instance following the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).
2. **Create credentials:**
   - **Instagram API** — Access Token + API Endpoint (`graph.instagram.com` or `graph.facebook.com`)
   - **Instagram Webhook API** — Meta App Secret (for the Trigger node in `instagram-api/11-trigger-and-reply.json`)
3. **Import a workflow** JSON file from the appropriate subfolder.
4. **Configure parameters** — replace placeholder values like `YOUR_IG_USER_ID`, `YOUR_MEDIA_ID`, and media URLs with your own data.
5. **Save and execute** (or activate for scheduled/webhook triggers).

## Node Resources Covered by Subfolder

**instagram-api/** (`graph.instagram.com`):

- Auth, Carousel, Comments, IG User, Image, Messaging, Reels, Stories, Instagram Trigger

**facebook-api/** (`graph.facebook.com`):

- IG Hashtag, Page

## Support

For issues with these examples or the node package, see the [main README](../README.md) or open an issue at [github.com/0m4r/n8n-nodes-instagram](https://github.com/0m4r/n8n-nodes-instagram/issues).
