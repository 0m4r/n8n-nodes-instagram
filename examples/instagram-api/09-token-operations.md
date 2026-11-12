# Instagram Token Operations

## What it does

This workflow runs weekly to refresh a long-lived Instagram access token and then calls the `/me` endpoint to verify the token is still valid. It demonstrates the Auth resource for token lifecycle management.

1. **Cron trigger** — fires once every 7 days.
2. **Instagram node (Auth / Refresh Access Token)** — refreshes the long-lived access token using the Instagram Platform refresh endpoint. If no token is provided as a parameter, it uses the token from the Instagram API credential.
3. **Instagram node (Auth / Get Me)** — calls the Graph API `/me` endpoint to confirm the token works and returns the authenticated account's ID.

## Features exercised

- **Resource:** `Auth`
- **Operations:** `Refresh Access Token`, `Get Me` (also supports `Exchange Access Token`)
- Token refresh for long-lived Instagram User access tokens
- Token validation via `/me`
- Credential-based token fallback (uses credential access token when no parameter is provided)

## Trigger

This workflow uses a **Cron trigger** (every 7 days).

**Why cron?** Token refresh is scheduled maintenance. It runs on a fixed cadence to keep long-lived access tokens valid before they expire. There is no real-time webhook event for token expiration, so cron is the right choice.

**When to use Instagram Trigger instead:** Not applicable. Token operations are administrative, not event-driven.

## Prerequisites

- An **Instagram API** credential (`instagramApi`) configured with a long-lived access token.
- For `Exchange Access Token` (not shown in this workflow but available), you would also need your Meta App Secret.

## How to use

1. Import `09-token-operations.json` into n8n.
2. Open the **Refresh Access Token** node. Optionally provide an **Access Token** to refresh; otherwise the credential's token is used.
3. Save and execute weekly to keep tokens fresh before they expire.

## Other auth operations available

- `Exchange Access Token` — exchange a short-lived token (from login flow) for a long-lived token. Requires **Short-Lived Access Token** and **App Secret**.

## Related documentation

- [Instagram Graph API - Token exchange](https://developers.facebook.com/docs/instagram-basic-display-api/guides/long-lived-access-tokens)
- [Instagram Graph API - /me](https://developers.facebook.com/docs/instagram-api/reference/ig-user)
