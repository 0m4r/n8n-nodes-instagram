# Send Instagram Direct Message

## What it does

This workflow sends a direct message (DM) to an Instagram user when an HTTP webhook is called. It's useful for automated customer support, order confirmations, or welcome messages triggered by external systems.

1. **Webhook trigger** — listens for POST requests at `/webhook/send-dm`.
2. **Instagram node (Messaging / Send Message)** — sends a text DM to the recipient IG User ID specified in the request body.
3. **Respond to Webhook** — returns a success response with the message ID.

## Features exercised

- **Resource:** `Messaging`
- **Operation:** `Send Message`
- Sends a text message via the Instagram Messaging API
- Dynamic recipient ID and message text from webhook request body
- Uses the Instagram-scoped user ID (IGSID) of the recipient

## Trigger

This workflow uses a **Generic Webhook trigger** (`n8n-nodes-base.webhook`).

**Why a generic webhook?** Sending a DM is an outbound action initiated by an external system (order confirmation, support ticket, welcome message). The webhook lets that system tell n8n to send a message on Instagram. This is **not** an inbound Instagram event, so the Instagram Trigger does not apply here.

**When to use Instagram Trigger instead:** Never for outbound messaging. The Instagram Trigger is for reacting to inbound messages Meta pushes to you.

## Calling the webhook endpoint

After importing and activating the workflow, copy the webhook URL from the **Webhook Trigger** node.

**curl:**
```bash
curl -X POST "https://your-n8n-instance.com/webhook/send-dm" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "17841405829234567",
    "message": "Hello! Thanks for reaching out."
  }'
```

**HTTP Request (n8n):**
```json
{
  "url": "={{ $json.webhookUrl }}",
  "method": "POST",
  "json": {
    "recipientId": "17841405829234567",
    "message": "Hello! Thanks for reaching out."
  }
}
```

## Prerequisites

- An **Instagram API** credential (`instagramApi`) configured with a long-lived access token that has messaging permissions.
- Replace `YOUR_IG_USER_ID` with your Instagram Business/Creator account ID (the sender).
- The recipient ID is typically obtained from Instagram Messaging webhook events (see `11-trigger-and-reply.json`).

## How to use

1. Import `08-send-direct-message.json` into n8n.
2. Copy the webhook URL shown in the **Webhook Trigger** node.
3. Send a POST request with a JSON body like:
   ```json
   {
     "recipientId": "17841405829234567",
     "message": "Hello! Thanks for reaching out."
   }
   ```
4. Save and execute.

## Related documentation

- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram/features/)
- [Messaging webhook events](https://developers.facebook.com/docs/graph-api/webhooks/reference/instagram#fields)