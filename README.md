# @0m4r/n8n-nodes-instagram

---

> This fork is maintained by [0m4r](https://github.com/0m4r) and is based on [MookieLian's original project](https://github.com/MookieLian/n8n-nodes-instagram).  
> Please use [this fork's issue tracker](https://github.com/0m4r/n8n-nodes-instagram/issues) for questions or bug reports.

---

This package’s Instagram nodes for n8n let you publish and manage content, moderate comments, send DMs, and react to real-time events (comments, messages, mentions, story insights, etc.) on Instagram Business and Creator accounts via the Facebook/Instagram Graph API.

All functionality is built on the Facebook/Instagram Graph API, including media publishing (images, Reels, Stories, carousels), comment moderation, private replies, messaging, hashtag search, IG User/Page helpers, and webhook-based triggers for Business and Creator accounts.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

The node exposes several resources:

| Resource              | Description                                                                                                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Image`               | Publish a single image with an optional caption. Uses the two-step container → publish flow. Supports alt text, location, user tags, and product tags.                                                                                                          |
| `Reels`               | Publish a reel video. Handles container polling until the video is processed before publishing. Supports product tags and **Trial Reels** via `trial_params`.                                                                                                   |
| `Stories`             | Publish a story video using the same logic as reels with `media_type=STORIES`.                                                                                                                                                                                  |
| `Carousel`            | Publish a carousel (album) post with up to 10 images and/or videos. The node creates child containers, builds a carousel container, waits for it to be ready, then publishes it. Includes detailed per-item error reporting and progress messages.              |
| `Comments`            | List comments on media, hide/unhide or delete individual comments, disable/enable comments on media, and send **private replies** to commenters.                                                                                                                |
| `IG User`             | Read basic profile data for an Instagram Business/Creator account and list its media using the IG User Graph API.                                                                                                                                               |
| `IG Hashtag`          | Search for hashtags by name and fetch top or recent media for a hashtag with paging and limit/return-all support.                                                                                                                                               |
| `Messaging`           | Send direct messages (DMs) to Instagram users via the Instagram Messaging API.                                                                                                                                                                                  |
| `Page`                | Given a Facebook Page ID, fetch the connected Instagram Business/Creator account (`instagram_business_account`).                                                                                                                                                |
| `Auth`                | Exchange short-lived Instagram User tokens for long-lived tokens, refresh long-lived tokens, and call the Graph API `/me` endpoint.                                                                                                                             |
| **Instagram Trigger** | **Trigger:** receive real-time webhook events from Meta (comments, messages, mentions, story insights, etc.) and run a workflow for each event. Requires a separate **Instagram Webhook** credential (App Secret) and Meta App Dashboard webhook configuration. |

## Credentials

Create an **Instagram API** credential and provide an access token with permissions for the selected API endpoint.

For **Instagram Login** (`graph.instagram.com`), use an Instagram User access token with:

- `instagram_business_basic`
- `instagram_business_content_publish`
- `instagram_business_manage_comments`
- `instagram_business_manage_messages`

For **Facebook Login** (`graph.facebook.com`), use a Facebook User or Page access token with the permissions required by the operations you use. A typical setup includes:

- `instagram_basic`
- `pages_show_list`
- `instagram_content_publish`
- `pages_read_engagement`
- `instagram_manage_comments`
- `instagram_manage_messages`
- `pages_manage_metadata` (for webhook subscriptions)

Steps:

1. Make sure the Instagram account is a Business/Creator (professional) account. A linked Facebook Page is required for Facebook Login/Page-token operations, but is not a general requirement for Instagram Login.
2. Use Meta's Graph Explorer or your own app to generate an access token that includes the scopes listed above.
3. Convert it to a long-lived token and paste it into the credential's **Access Token** field.
4. **Select API Endpoint**: Choose between:
   - **Instagram Graph API** (`graph.instagram.com`) - Default option for Instagram Login.
   - **Facebook Graph API** (`graph.facebook.com`) - Use a Facebook Login token; required for Page lookup and hashtag search.
5. The built-in credential test uses v26.0 to confirm the token works.

Changing the endpoint does not convert your token, change its login flow, or grant permissions. Use a token issued for the selected API. The node routes requests to the endpoint selected in the credential; use the token type and permissions required by that operation's Meta login flow. Page lookup and hashtag search require Facebook Login.

> **Note on Messaging:** The Instagram Messaging API (Send Message and Send Private Reply) supports two host URLs depending on your credential's **API Endpoint** setting:
>
> - **Instagram Graph API** (`graph.instagram.com`) - Use with Instagram Login access token
> - **Facebook Graph API** (`graph.facebook.com`) - Use with Facebook Page access token
>
> The node automatically uses the host URL matching your credential's **API Endpoint** setting. The default is `graph.facebook.com` for backward compatibility.
>
> **Important:** You must use the correct access token type for your chosen API endpoint:
>
> - Instagram Login: Use an **Instagram User access token**
> - Facebook Login: Use a **Facebook Page access token** with `instagram_manage_messages` permission
>
> See Meta's [Send a Private Reply to a Commenter](https://developers.facebook.com/documentation/instagram-platform/private-replies) and [Instagram Send API reference](https://developers.facebook.com/docs/messenger-platform/instagram/reference/send-api/) for more details.

### Instagram Webhook Trigger credentials

For the **Instagram Trigger** node, create an **Instagram Webhook API** credential and enter the Meta **App Secret** (App Dashboard → Settings → Basic). Signature verification is enabled by default and checks `X-Hub-Signature-256` against the raw request body. The **Verify Token** is set in the node parameters and must match the value entered in the Meta App Dashboard for the callback URL. Disable signature verification only for a trusted test environment. Existing workflows may have the previous skip-verification setting saved; set it to false and update the old webhook credential with the App Secret.

## Instagram Webhook Trigger

The **Instagram Trigger** receives Meta webhook notifications and starts a workflow for each included event. For direct messages with **Instagram Login** (`graph.instagram.com`), follow Meta's Instagram Platform Webhooks setup. This flow uses an Instagram User access token to subscribe the professional account to webhook fields; it does not use a Facebook Page access token.

### Requirements

- The Instagram account must be a **Business or Creator (professional) account**, and must authorize your app.
- For Instagram Login, request `instagram_business_basic` and `instagram_business_manage_messages` to receive the `messages` field. The app needs **Advanced Access** for production use and the business must be verified. The app must be Live/published to receive notifications from app users; in development, delivery is limited to eligible app roles/testers.
- Meta must be able to reach the callback URL over **HTTPS** with a valid TLS certificate. Self-signed certificates are not supported.
- Subscribe to fields in **both** places: select them for your app in the Meta App Dashboard, then enable notifications on each Instagram professional account using that account's token. Account subscription applies the fields selected for the app; it does not select a different field set per account.

These requirements and the permissions for other webhook fields vary by API setup and field. See Meta's [Instagram Webhooks setup and requirements](https://developers.facebook.com/documentation/instagram-platform/webhooks) and [field/permission matrix](https://developers.facebook.com/documentation/instagram-platform/webhooks/fields).

### Setup

1. **Configure the trigger in n8n**
   Add the **Instagram Trigger** node. Set **Verify Token** to a random string; you will enter the same value in Meta. Add an **Instagram Webhook API** credential containing your Meta **App Secret** (App Dashboard → App settings → Basic). The App Secret is used to validate webhook signatures; it is not an access token.

2. **Configure the app-level callback and fields in Meta**
   In the Meta App Dashboard, open your Instagram API setup's **Webhooks** configuration. Add the n8n callback URL and the matching Verify Token. Use the **Production URL** for an active workflow, or the **Test URL** while the workflow is listening for a test event. Verify the callback, then subscribe the app to `messages` (and any other fields you need).

3. **Enable notifications on each Instagram account**
   For Instagram Login, make a `POST` to the professional account's `subscribed_apps` edge using its Instagram User access token. Set `subscribed_fields` to the fields selected for the app. For example, to receive DMs:

   ```bash
   curl -i -X POST \
     "https://graph.instagram.com/v{api-version}/{IG_USER_ID}/subscribed_apps" \
     -d "subscribed_fields=messages" \
     -d "access_token={INSTAGRAM_USER_ACCESS_TOKEN}"
   ```

   A successful response is `{"success":true}`. Use the supported Graph API version for your app. Do not use an Instagram User access token with `graph.facebook.com`, or a Facebook/Page token with `graph.instagram.com`. For Unified Login or Facebook Login, use the matching host, account/Page ID, token type, and permissions in Meta's [setup guide](https://developers.facebook.com/documentation/instagram-platform/webhooks).

4. **Optional: filter events**
   Use **Events to Include** to pass only selected event types (for DMs, include `messages`). If left empty, all received event types are output. This filter only affects events after Meta has delivered them; it does not create Meta subscriptions.

Meta verifies the callback with a GET request containing `hub.mode`, `hub.verify_token`, and `hub.challenge`; the node checks the token and returns the challenge. For POST notifications, Meta signs the raw JSON body with the app secret and sends `X-Hub-Signature-256`. The node validates this signature by default and responds to accepted events with HTTP 200. Meta retries failed deliveries, so keep signature verification enabled and avoid slow downstream work before acknowledging events.

Each accepted event is output as an item with `object`, `field`, `value`, `id`, `time`, and the event payload. Use the **Instagram** node (for example, Messaging or Comments) in the same workflow to act on it.

## Compatibility

- Built and typechecked against **`n8n-workflow 2.41.2`**, the current stable release.
- Declares a peer dependency on **`n8n-workflow *`** as required by n8n's strict community-node linter. Compatibility with earlier workflow versions is not verified.
- Requires n8n with community nodes enabled.
- Uses only built-in n8n dependencies, so it is Cloud-compatible.

## Usage

### Publishing media (Image / Reels / Stories)

1. Add the **Instagram** node to your workflow and select one of the resources (`Image` / `Reels` / `Stories`).
2. Provide:
   - **Account**: Select your Instagram account from the dropdown or enter the IG User ID manually
   - **Graph API Version**: Enter the API version (e.g., `v26.0`, `v25.0`, `v24.0`) - defaults to `v26.0`
   - **Media URL** and, for feed images or Reels, an optional **Caption** (Stories do not support captions)
3. Add optional fields only where supported: alt text for feed images and carousel image slides; location tags for feed images, Reels, and carousels; product tags for feed images, Reels, and carousel slides (up to 5 per slide, 20 per carousel); user tags for images, Reels, Stories, and carousel image slides; collaborators for feed images, Reels, and carousels. Cover/audio/thumbnail/Trial Reel settings are Reels-only; share-to-feed is available for Reels and carousels.
4. The node first creates the media container, polls Graph API until processing completes, then triggers `media_publish`.
5. For long-running uploads (large videos), the node uses robust polling and retry logic and surfaces progress via the n8n execution logs (for example, when publishing Reels or Trial Reels).
6. Handle any errors returned by the API (rate limits, permissions, validation) via the node's error output or `Continue On Fail`.

### Publishing carousel posts (Carousel)

1. Add the **Instagram** node and set **Resource** to `Carousel`, **Operation** to `Publish`.
2. Provide:
   - **Account** – Select your Instagram account from the list (loaded automatically) or enter the IG User ID manually
   - **Graph API Version** – Enter the API version (e.g., `v26.0`) - defaults to `v26.0`
   - `Caption` – optional caption for the published carousel.
   - `Carousel Media` – 2–10 items, each with:
     - `Media Type` – `Image` or `Video`.
     - `Image URL` or `Video URL` – public URLs Meta can fetch.
     - For image slides, optional `Alt Text` and `User Tags`; image and video slides may have up to 5 `Product Tags` each (20 total per carousel).
   - **Additional Fields → Collaborators** – optional, up to 3 Instagram usernames.
3. The node:
   - Creates one child container per image/video (`is_carousel_item=true` for each).
   - Waits for each child container to become ready.
   - Creates a carousel container (`media_type=CAROUSEL`, `children=<child_ids>`) with the caption.
   - Waits for the carousel container to be ready, then calls `/{ig-user-id}/media_publish`.
4. Errors during any step are annotated with **which child item failed** (for example, “Carousel item 3 (video)…”), making it easier to debug problematic URLs.

### Comment moderation and private replies (Comments)

1. Add the **Instagram** node and set **Resource** to `Comments`.
2. Choose an **Operation**:
   - `List` – fetch comments for a given media ID.
   - `Hide` / `Unhide` / `Delete` – moderate a specific comment by its comment ID.
   - `Disable Comments` / `Enable Comments` – toggle comments on a media object by its media ID.
   - `Send Private Reply` – send a private reply message to a commenter using their comment ID.
3. Provide the required IDs:
   - `Media ID` for listing comments or enabling/disabling comments.
   - `Comment ID` for hide/unhide/delete/private reply operations.
4. For **Send Private Reply**, also fill in:
   - `Node` – the Instagram professional account ID that owns the commented media.
   - `Message` – the private reply text that will be sent to the commenter’s inbox/request folder (subject to the 7‑day and messaging window rules defined by Meta).

### Reading IG User profile and media (IG User)

1. Add the **Instagram** node and set **Resource** to `IG User`.
2. Choose an **Operation**:
   - `Get` – fetch basic profile information for an Instagram Business/Creator account (username, name, bio, website, media_count, followers/follows, profile picture URL).
   - `Get Media` – list media owned by that account, including media type, URLs, caption, permalink, timestamp and username.
3. Provide:
   - `Node` – the IG User ID of the professional account you want to read (or `me` if your credential token belongs to that account).
   - **Graph API Version** – Enter the API version (e.g., `v26.0`) - defaults to `v26.0`.

### Searching hashtags and fetching hashtag media (IG Hashtag)

1. Add the **Instagram** node and set **Resource** to `IG Hashtag`.
2. Choose an **Operation**:
   - `Search` – look up a hashtag by name and get its global hashtag ID.
   - `Get Recent Media` – get the most recently published media tagged with a hashtag.
   - `Get Top Media` – get the most popular media tagged with a hashtag.
3. For **Search**, provide:
   - `Node` – the IG User ID performing the query.
   - `Hashtag Name` – the hashtag name, without `#`.
4. For **Get Recent Media** / **Get Top Media**, provide:
   - `Node` – the IG User ID performing the query.
   - `Hashtag ID` – the ID returned from the search operation.
   - `Return All` / `Limit` – choose whether to fetch all available media (within a safety cap) or only up to a limit.

### Sending direct messages (Messaging)

1. Add the **Instagram** node and set **Resource** to `Messaging`.
2. Choose **Operation** `Send Message`.
3. Provide:
   - `Node` – the IG professional account ID that will send the message.
   - **Graph API Version** – Enter the API version (e.g., `v26.0`) - defaults to `v26.0`.
   - `Recipient IG User ID` – the Instagram-scoped user ID (IGSID) of the recipient, typically obtained from Messaging webhook events.
   - `Message Text` – the text body of the direct message.

The recipient must have initiated a conversation with the professional account; the Messaging API does not send first-contact DMs to arbitrary usernames. The recipient IGSID is required by Meta. See the [Instagram Messaging API](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api).

### Token exchange, refresh and `/me` (Auth)

1. Add the **Instagram** node and set **Resource** to `Auth`.
2. Choose an **Operation**:
   - `Exchange Access Token` – exchange a **short-lived** Instagram User access token for a **long-lived** token.
   - `Refresh Access Token` – refresh an existing long-lived token using the Instagram Platform refresh endpoint.
   - `Get Me` – call the Graph API `/me` endpoint using the `instagramApi` credential’s access token.
3. For **Exchange Access Token**, provide:
   - `Short-Lived Access Token` – the short-lived token from your login flow.
   - `App Secret` – the Instagram App Secret from your Meta App Dashboard.
4. For **Refresh Access Token**, optionally provide:
   - `Access Token` – the long-lived token to refresh. Leave empty to use the token from the credential.
5. For **Get Me**, the node uses a fixed, versioned `/me` URL under the hood and does **not** depend on any UI parameters, so older workflows remain compatible.

### Getting the Instagram account for a Facebook Page (Page)

1. Add the **Instagram** node and set **Resource** to `Page`, **Operation** to `Get Instagram Account`.
2. Provide:
   - **Graph API Version** – Enter the API version (e.g., `v26.0`) - defaults to `v26.0`.
   - `Page ID` – the Facebook Page ID that is linked to your Instagram professional account.
3. The node calls:
   - `GET /{page-id}?fields=instagram_business_account`
     and returns the `instagram_business_account` object (including the Instagram User ID) so you can feed it into other resources (Image/Reels/Stories/Carousel/IG User).

### Trial Reels (Reels with `trial_params`)

1. Add the **Instagram** node and set **Resource** to `Reels`, **Operation** to `Publish`.
2. Under **Additional Fields**, set **Trial Reel – Graduation Strategy**:
   - `MANUAL` – you will decide in the Instagram app when (or if) to graduate the trial reel.
   - `SS_PERFORMANCE` – Instagram will automatically graduate the trial reel if it performs well.
3. The node sends a `trial_params` JSON object in the create-container request, as documented in the IG User Media reference.

## Resources

- [Example workflows](examples/README.md), including manual examples that do not need webhook setup or hard-coded account IDs.

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Instagram Graph API - Publishing](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media)
- [Video/Reels publishing guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing/reels/)
- [Comment Moderation](https://developers.facebook.com/docs/instagram-platform/comment-moderation)
- [Private Replies](https://developers.facebook.com/docs/instagram-platform/private-replies)
- [IG User](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user)
- [IG Hashtag Search](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag-search/)
- [IG Hashtag Recent Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag/recent-media/)
- [IG Hashtag Top Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag/top-media/)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram/features/)
- [Instagram Platform Access Token](https://developers.facebook.com/docs/instagram-platform/reference/access_token/)
- [Instagram Platform Refresh Access Token](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/)
- [Instagram Platform /me](https://developers.facebook.com/docs/instagram-platform/reference/me/)
- [Webhooks from Meta (getting started)](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
- [Instagram webhook reference](https://developers.facebook.com/docs/graph-api/webhooks/reference/instagram)

## Version history

| Version       | Notes                                                                                                                                                                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4.1.11-beta.11 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes. |
| 4.1.11-beta.10 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes. |
| 4.1.11-beta.9 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes. |
| 4.1.11-beta.8 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.11-beta.7 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.11-beta.6 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.11-beta.5 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.11-beta.4 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.11-beta.3 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.11-beta.2 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.11-beta.1 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.11-beta.0 | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.10        | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.9         | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.8         | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.7         | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.6         | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.5         | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.4         | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.3         | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.2         | See [CHANGELOG.md](CHANGELOG.md) for complete release notes.                                                                                                                                                                                                                                                                         |
| 4.1.1         | Automates release-note generation for [`CHANGELOG.md`](CHANGELOG.md) and the README version history.                                                                                                                                                                                                                                 |
| 4.1.0         | Adds automated regression coverage, failure-first media-container status handling, and CI test enforcement.                                                                                                                                                                                                                          |
| 4.0.5         | Updates npm publishing workflow configuration.                                                                                                                                                                                                                                                                                       |
| 4.0.4         | Updates npm publishing workflow configuration.                                                                                                                                                                                                                                                                                       |
| 4.0.3         | Updates npm publishing workflow configuration.                                                                                                                                                                                                                                                                                       |
| 4.0.2         | Updates npm publishing workflow configuration.                                                                                                                                                                                                                                                                                       |
| 4.0.1         | Updates npm publishing workflow configuration.                                                                                                                                                                                                                                                                                       |
| 4.0.0         | Major Instagram node overhaul and refactoring, including configurable webhook credential endpoints.                                                                                                                                                                                                                                  |
| 4.0.0-beta.0  | Pre-release with enhanced webhook and media configuration.                                                                                                                                                                                                                                                                           |
| 3.4.0         | Introduces credential types and improves direct-message sending.                                                                                                                                                                                                                                                                     |
| 3.3.0         | Adds Reel configuration fields and improves media settings.                                                                                                                                                                                                                                                                          |
| 3.4.0         | Introduce new credential types and improve Send a direct message operation.                                                                                                                                                                                                                                                          |
| 4.0.0         | Overhaul and refactoring; enable webhook credentials to switch API endpoint.                                                                                                                                                                                                                                                         |
| 4.1.0         | Add Instagram node coverage and CI gate.                                                                                                                                                                                                                                                                                             |
| 4.1.11-beta.1 | Current beta: scope publish to tags and CI to non-main branches; intermediate 4.0.x–4.1.x patch releases documented in CHANGELOG.md.                                                                                                                                                                                                 |
| 3.2.1         | Introduces the Instagram webhook trigger and compatibility improvements.                                                                                                                                                                                                                                                             |
| 3.2.0         | Adds carousel media configuration options.                                                                                                                                                                                                                                                                                           |
| 3.1.5         | Updates lint tooling and dependencies.                                                                                                                                                                                                                                                                                               |
| 3.1.4         | Updates node tooling and cloud compatibility.                                                                                                                                                                                                                                                                                        |
| 3.1.3         | Removes the `node:buffer` requirement.                                                                                                                                                                                                                                                                                               |
| 3.1.2         | Updates documentation and removes `globalThis` usage.                                                                                                                                                                                                                                                                                |
| 3.1.1         | Fixes overlapping description text in the node UI; documentation/layout-only cleanup with no runtime behavior changes.                                                                                                                                                                                                               |
| 3.1.0         | Sets `skipSignatureVerification` to `true` by default for the Instagram Trigger node and ensures webhook executions are correctly registered.                                                                                                                                                                                        |
| 3.0.0         | Introduces the Instagram Trigger node for webhook-based events (comments, messages, mentions, story insights) and updates underlying dependencies.                                                                                                                                                                                   |
| 2.6.2         | Documentation-only release. Adds or updates `CONTRIBUTING.md` contributor guidance and refreshes this README to reflect recent changes; does not modify runtime behavior or node functionality.                                                                                                                                      |
| 2.6.1         | Patch release that keeps all execution-time, polling and error-reporting improvements from 2.6.0 and updates docs/readme to reflect the current behavior and supported resources.                                                                                                                                                    |
| 2.6.0         | Shortens polling intervals across resources, adds general execution time optimizations, introduces URL validation before making Graph API calls, and adds more detailed error messages to make debugging easier.                                                                                                                     |
| 2.5.4         | Further shortens the container health polling interval in the **Reels** resource to reduce average execution time when publishing videos.                                                                                                                                                                                            |
| 2.5.3         | Adds `CODE_OF_CONDUCT.md` and `LICENSE`. This is a documentation/compliance update and does not change runtime behavior.                                                                                                                                                                                                             |
| 2.5.2         | Bumps the required `n8n-workflow` peer dependency to `>=2.6.1` to address security advisories (arbitrary file upload, RCE, prototype pollution, etc.) and updates the README to describe the latest features.                                                                                                                        |
| 2.5.1         | Introduces the `Page` resource to retrieve the connected Instagram Business/Creator account for a Facebook Page and adds the **Trial Reel – Graduation Strategy** option for Reels (via `trial_params`), alongside the first stable release of Carousel publishing, extended tagging options, and streaming-style progress messages. |
| 2.4.0         | Adds `IG Hashtag` (search, recent media, top media), `Messaging` (send DMs), and `Auth` helpers for token exchange/refresh and `/me`.                                                                                                                                                                                                |
| 2.3.0         | Adds `Comments` resource with comment moderation (list/hide/unhide/delete, enable/disable comments) and **Private Replies** support, and an `IG User` resource for reading profile data and listing media.                                                                                                                           |
| 2.2.0         | Improves publishing UX and adds alt text, location ID, user tags, and product tags support for media publishing.                                                                                                                                                                                                                     |
| 2.1.0         | Stable release of Instagram publishing (Image/Reels/Stories) using the container → publish flow with robust polling and error handling.                                                                                                                                                                                              |
| 0.1.0         | Initial release with Image, Reels and Stories publishing & built-in container polling.                                                                                                                                                                                                                                               |
