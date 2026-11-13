# List Comments on Recent Media

## What it does

Manually finds the authenticated account's five most recent media items and lists comments for each item. It derives the account ID and media IDs from API responses, so you do not need to paste IDs into the workflow. It does not require a Meta webhook or an Instagram Trigger.

1. **Manual Trigger** — run the workflow from the n8n editor.
2. **Auth / Get Me** — gets the ID for the account in your credential.
3. **IG User / Get Media** — gets up to five recent media items for that account.
4. **Code** — emits each media object as its own item.
5. **Comment / List** — lists comments for each media ID.

## Prerequisites

- An **Instagram API** credential using Instagram Login and an Instagram User access token.
- The token must have `instagram_business_basic` and `instagram_business_manage_comments` permissions and access to the account's media/comments.

## How to use

1. Import `14-list-recent-comments.json` into n8n.
2. Select the same Instagram API credential on the Instagram nodes.
3. Click **Execute Workflow**. Adjust the media limit if needed.

The comments operation is read-only. To hide, delete, or reply to a comment, Meta requires the corresponding media/comment ID; pass those values from this workflow's output rather than hardcoding them.

## Related documentation

- [Instagram Comment Moderation](https://developers.facebook.com/docs/instagram-platform/comment-moderation)
- [IG User media edge](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media)
