import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  ICredentialTestFunctions,
  ICredentialsDecrypted,
  IDataObject,
  IHookFunctions,
  INodeExecutionData,
  INodeType,
  INodeCredentialTestResult,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

const INSTAGRAM_OBJECT = 'instagram';

const INSTAGRAM_WEBHOOK_FIELDS = [
  { name: 'Comments', value: 'comments', description: 'When someone comments on media' },
  { name: 'Live Comments', value: 'live_comments', description: 'Comments during live streams' },
  { name: 'Message Echoes', value: 'message_echoes', description: 'Messages sent by your account' },
  {
    name: 'Messaging Reactions',
    value: 'messaging_reactions',
    description: 'Reactions to direct messages',
  },
  { name: 'Messages', value: 'messages', description: 'When users send direct messages' },
  { name: 'Mentions', value: 'mentions', description: 'When your account is @mentioned' },
  {
    name: 'Messaging Handover',
    value: 'messaging_handover',
    description: 'Thread control changes',
  },
  {
    name: 'Messaging Referral',
    value: 'messaging_referrals',
    description: 'Referral from messaging',
  },
  {
    name: 'Messaging Opt-Ins',
    value: 'messaging_optins',
    description: 'When a user opts in to messaging',
  },
  { name: 'Messaging Seen', value: 'messaging_seen', description: 'When someone sees a message' },
  {
    name: 'Messaging Postbacks',
    value: 'messaging_postbacks',
    description: 'Postback button clicks',
  },
  { name: 'Standby', value: 'standby', description: 'Standby events' },
  {
    name: 'Story Insights',
    value: 'story_insights',
    description: 'Metrics when a story expires (Facebook Login only)',
  },
] as const;

export class InstagramTrigger implements INodeType {
  methods = {
    credentialTest: {
      async instagramTrigger(
        this: ICredentialTestFunctions,
        credential: ICredentialsDecrypted,
      ): Promise<INodeCredentialTestResult> {
        const appSecret = credential.data?.appSecret;
        const hasAppSecret = typeof appSecret === 'string' && appSecret.length > 0;
        const logContext = {
          file: 'InstagramTrigger.node.ts',
          function: 'credentialTest.instagramTrigger',
        };
        this.logger.debug(
          '[InstagramTrigger.node.ts:credentialTest.instagramTrigger] Testing webhook credential',
          {
            ...logContext,
            appSecretConfigured: hasAppSecret,
          },
        );

        if (!hasAppSecret) {
          this.logger.error(
            '[InstagramTrigger.node.ts:credentialTest.instagramTrigger] App Secret is missing',
            logContext,
          );
          return {
            status: 'Error',
            message: 'App Secret is required for Instagram webhook signature verification.',
          };
        }

        this.logger.debug(
          '[InstagramTrigger.node.ts:credentialTest.instagramTrigger] App Secret is present; signature validity is checked on webhook delivery',
          logContext,
        );
        return {
          status: 'OK',
          message:
            'App Secret is configured. Its validity is checked against incoming webhook signatures.',
        };
      },
    },
  };

  description: INodeTypeDescription = {
    displayName: 'Instagram Trigger',
    name: 'instagramTrigger',
    icon: {
      light: 'file:../Instagram/instagram.svg',
      dark: 'file:../Instagram/instagram.dark.svg',
    },
    group: ['trigger'],
    version: 2,
    subtitle: 'Instagram webhook',
    description:
      'Instagram trigger to receive real-time webhook events from Meta and start a workflow when an event is received.',
    defaults: {
      name: 'Instagram Trigger',
    },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'instagramWebhookApi',
        required: true,
        testedBy: 'instagramTrigger',
        displayOptions: { show: { skipSignatureVerification: [false] } },
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'GET',
        responseMode: 'onReceived',
        path: 'instagram',
      },
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'instagram',
      },
    ],
    properties: [
      {
        displayName: 'Verify Token',
        name: 'verifyToken',
        type: 'string',
        typeOptions: { password: true },
        required: true,
        default: '',
        description:
          'Must match the Verify Token you set in Meta App Dashboard → Webhooks. Meta sends this on GET for URL verification.',
      },
      {
        displayName: 'Events to Include',
        name: 'eventsToInclude',
        type: 'multiOptions',
        options: INSTAGRAM_WEBHOOK_FIELDS.map((f) => ({
          name: f.name,
          value: f.value,
          description: f.description,
        })),
        default: [],
        description:
          'If empty, all received events are output. Otherwise only selected event types are passed to the workflow.',
      },
      {
        displayName: 'Skip Signature Verification',
        name: 'skipSignatureVerification',
        type: 'boolean',
        default: false,
        description:
          "Whether to accept webhook requests without validating Meta's X-Hub-Signature-256 signature",
      },
    ],
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        return true;
      },
      async create(this: IHookFunctions): Promise<boolean> {
        return true;
      },
      async delete(this: IHookFunctions): Promise<boolean> {
        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const method = (req.method || 'GET').toUpperCase();

    if (method === 'GET') {
      const query = this.getQueryData() as IDataObject;
      const hubMode = query['hub.mode'] ?? query.hub_mode;
      const hubChallenge = query['hub.challenge'] ?? query.hub_challenge;
      const hubVerifyToken = query['hub.verify_token'] ?? query.hub_verify_token;
      const verifyToken = this.getNodeParameter('verifyToken') as string;

      if (
        hubMode === 'subscribe' &&
        String(hubVerifyToken) === String(verifyToken) &&
        hubChallenge != null
      ) {
        return {
          webhookResponse: String(hubChallenge),
        };
      }
      return {
        webhookResponse: 'Forbidden',
        noWebhookResponse: false,
      };
    }

    // POST: event notification
    const skipVerification = this.getNodeParameter('skipSignatureVerification') as boolean;

    if (skipVerification) {
      this.logger.debug(
        '[InstagramTrigger.node.ts:webhook] Skipping signature verification by configuration',
        {
          file: 'InstagramTrigger.node.ts',
          function: 'webhook',
        },
      );
    }

    if (!skipVerification) {
      const logContext = { file: 'InstagramTrigger.node.ts', function: 'webhook' };
      const request = this.getRequestObject();
      await request.readRawBody();
      const rawBody = request.rawBody;
      const signatureHeader = request.headers['x-hub-signature-256'];
      const signature = typeof signatureHeader === 'string' ? signatureHeader : '';
      let appSecret = '';

      this.logger.debug(
        '[InstagramTrigger.node.ts:webhook] Checking signature verification inputs',
        {
          ...logContext,
          signatureHeaderPresent: signature.length > 0,
          rawBodyAvailable: Buffer.isBuffer(rawBody),
        },
      );

      try {
        const credentials = await this.getCredentials('instagramWebhookApi');
        appSecret = typeof credentials.appSecret === 'string' ? credentials.appSecret : '';
      } catch (error) {
        appSecret = '';
        this.logger.error('[InstagramTrigger.node.ts:webhook] Failed to read webhook credential', {
          ...logContext,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }

      const rejectRequest = (statusCode: number, message: string) => {
        this.getResponseObject().status(statusCode).send(message);
        return { noWebhookResponse: true };
      };

      if (!appSecret || !Buffer.isBuffer(rawBody)) {
        this.logger.error(
          '[InstagramTrigger.node.ts:webhook] Signature verification is unavailable',
          {
            ...logContext,
            appSecretConfigured: appSecret.length > 0,
            rawBodyAvailable: Buffer.isBuffer(rawBody),
          },
        );
        return rejectRequest(500, 'Webhook signature verification is unavailable');
      }

      const digest = signature.startsWith('sha256=') ? signature.slice(7) : '';
      if (!/^[\da-f]{64}$/i.test(digest)) {
        this.logger.error(
          '[InstagramTrigger.node.ts:webhook] Signature header has an invalid format',
          {
            ...logContext,
            signatureHeaderPresent: signature.length > 0,
            digestLength: digest.length,
          },
        );
        return rejectRequest(401, 'Forbidden');
      }

      const expectedDigest = createHmac('sha256', appSecret).update(rawBody).digest();
      const receivedDigest = Buffer.from(digest, 'hex');
      if (!timingSafeEqual(expectedDigest, receivedDigest)) {
        this.logger.error(
          '[InstagramTrigger.node.ts:webhook] Signature does not match the configured App Secret',
          {
            ...logContext,
          },
        );
        return rejectRequest(401, 'Forbidden');
      }

      this.logger.debug(
        '[InstagramTrigger.node.ts:webhook] Signature verified successfully',
        logContext,
      );
    }

    const bodyData = this.getBodyData();
    const payload = typeof bodyData === 'object' && bodyData !== null ? bodyData : {};
    const objectType = payload.object as string;
    const entries = Array.isArray(payload.entry) ? payload.entry : [];

    if (objectType !== INSTAGRAM_OBJECT) {
      return { webhookResponse: 'OK' };
    }

    const eventsToInclude = (this.getNodeParameter('eventsToInclude') as string[]) || [];
    const filterByEvents = eventsToInclude.length > 0;

    const items: INodeExecutionData[] = [];
    for (const entry of entries) {
      const entryObj = entry as IDataObject;
      const id = entryObj.id;
      const time = entryObj.time;

      // Instagram Login sends some change notifications directly on entry.
      if (typeof entryObj.field === 'string' && 'value' in entryObj) {
        const field = entryObj.field;
        if (!filterByEvents || eventsToInclude.includes(field)) {
          items.push({
            json: {
              object: objectType,
              field,
              value: entryObj.value,
              id,
              time,
            },
          });
        }
      }

      // Format 1: Graph API webhooks – entry[].changes[] (comments, mentions, story_insights, etc.)
      const changesRaw = entryObj.changes;
      const changes: IDataObject[] = Array.isArray(changesRaw) ? (changesRaw as IDataObject[]) : [];
      for (const change of changes) {
        const field = (change as IDataObject).field as string | undefined;
        if (filterByEvents && field && !eventsToInclude.includes(field)) continue;
        items.push({
          json: {
            object: objectType,
            field,
            value: (change as IDataObject).value,
            id,
            time,
            ...(change as IDataObject),
          } as IDataObject,
        });
      }

      // Format 2: Messaging webhooks – entry[].messaging[] (direct messages)
      const messagingRaw = entryObj.messaging;
      const messaging: IDataObject[] = Array.isArray(messagingRaw)
        ? (messagingRaw as IDataObject[])
        : [];
      for (const msg of messaging) {
        const messageData = msg.message as IDataObject | undefined;
        const field = msg.reaction
          ? 'messaging_reactions'
          : msg.read
            ? 'messaging_seen'
            : msg.postback
              ? 'messaging_postbacks'
              : msg.referral
                ? 'messaging_referrals'
                : msg.optin
                  ? 'messaging_optins'
                  : msg.pass_thread_control || msg.take_thread_control
                    ? 'messaging_handover'
                    : msg.standby
                      ? 'standby'
                      : messageData?.is_echo
                        ? 'message_echoes'
                        : 'messages';
        const legacyField =
          field === 'messaging_reactions'
            ? 'message_reactions'
            : field === 'messaging_referrals'
              ? 'messaging_referral'
              : undefined;
        if (
          filterByEvents &&
          !eventsToInclude.includes(field) &&
          !(legacyField && eventsToInclude.includes(legacyField))
        ) {
          continue;
        }
        items.push({
          json: {
            object: objectType,
            field,
            id,
            time,
            sender: (msg as IDataObject).sender,
            recipient: (msg as IDataObject).recipient,
            timestamp: (msg as IDataObject).timestamp,
            message: (msg as IDataObject).message,
            ...(msg as IDataObject),
          } as IDataObject,
        });
      }
    }

    if (items.length === 0) {
      return { webhookResponse: 'OK' };
    }

    return {
      workflowData: [items],
      webhookResponse: 'OK',
    };
  }
}
