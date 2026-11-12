# Instagram Comment Moderation

## What it does

This workflow runs every 6 hours to fetch comments on a specific media item, hide the first comment, and send a private reply to that commenter. It demonstrates the full comment moderation and private reply feature set.

1. **Cron trigger** — fires every 6 hours.
2. **Instagram node (Comments / List)** — fetches comments for the specified media ID.
3. **Instagram node (Comments / Hide)** — hides the first comment returned by the list operation.
4. **Instagram node (Comments / Send Private Reply)** — sends a private DM reply to the commenter.

## Features exercised

- **Resource:** `Comment`
- **Operations:** `List`, `Hide Comment`, `Send Private Reply`
- Listing comments on media
- Hiding a comment by comment ID
- Sending a private reply to a commenter (subject to Meta's 7-day messaging window)
- Chaining multiple comment operations on the same data

## Trigger

This workflow uses a **Cron trigger** (every 6 hours).

**Why cron?** It polls for comments on a schedule and processes them in batches. This works well for routine moderation when real-time response is not critical.

**Consider Instagram Trigger for real-time response:** If you want to reply to comments as soon as they are posted (rather than waiting up to 6 hours), replace the Cron trigger with the **Instagram Trigger** (event: `comments`). See `11-trigger-and-reply.md` for an example of the Instagram Trigger in action with auto-reply.

## Prerequisites

- An **Instagram API** credential (`instagramApi`) configured with a long-lived access token.
- Replace `YOUR_MEDIA_ID` with the ID of the Instagram media whose comments you want to manage.
- Replace `YOUR_IG_USER_ID` with your Instagram Business/Creator account ID (used for sending private replies).

## How to use

1. Import `05-comment-moderation.json` into n8n.
2. Open each Instagram node and update `YOUR_MEDIA_ID` and `YOUR_IG_USER_ID` as needed.
3. Customize the private reply text in the **Send Private Reply** node.
4. Save and execute.

## Other comment operations available

The Comments resource also supports:
- `Unhide Comment` — restore a previously hidden comment
- `Delete Comment` — remove a comment entirely
- `Disable Comments` / `Enable Comments` — toggle comments on a media object

## Related documentation

- [Comment Moderation](https://developers.facebook.com/docs/instagram-platform/comment-moderation)
- [Private Replies](https://developers.facebook.com/docs/instagram-platform/private-replies)