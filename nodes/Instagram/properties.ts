import type { INodeProperties } from 'n8n-workflow';
import { instagramResourceFields } from './resources';

export const instagramProperties: INodeProperties[] = [
  {
    displayName: 'Resource',
    name: 'resource',
    type: 'options',
    noDataExpression: true,
    options: [
      {
        name: 'Auth',
        value: 'auth',
        description: 'Exchange and refresh Instagram access tokens; call /me',
      },
      {
        name: 'Carousel',
        value: 'carousel',
        description: 'Publish a carousel (album) post with up to 10 images or videos',
      },
      {
        name: 'Comment',
        value: 'comments',
        description: 'Moderate comments on Instagram media',
      },
      {
        name: 'IG Hashtag',
        value: 'igHashtag',
        description: 'Search hashtags and fetch top or recent media for a hashtag',
      },
      {
        name: 'IG User',
        value: 'igUser',
        description: 'Read profile and media for an Instagram Business or Creator account',
      },
      {
        name: 'Image',
        value: 'image',
        description: 'Publish image posts to Instagram',
      },
      {
        name: 'Messaging',
        value: 'messaging',
        description: 'Send direct messages via the Instagram Messaging API',
      },
      {
        name: 'Page',
        value: 'page',
        description: 'Work with the connected Facebook Page and its Instagram account',
      },
      {
        name: 'Reel',
        value: 'reels',
        description: 'Publish Reels videos to Instagram',
      },
      {
        name: 'Story',
        value: 'stories',
        description: 'Publish story videos to Instagram',
      },
    ],
    default: 'image',
    description: 'Select what you want to do with the Instagram API',
    required: true,
  },
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['image', 'reels', 'stories'],
      },
    },
    options: [
      {
        name: 'Publish',
        value: 'publish',
        action: 'Publish',
        description: 'Publish the selected media type (image, reel, or story) to Instagram',
      },
    ],
    default: 'publish',
    required: true,
  },
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['page'],
      },
    },
    options: [
      {
        name: 'Get Instagram Account',
        value: 'getInstagramAccount',
        action: 'Get instagram account',
        description: 'Get the Instagram business/creator account connected to a Facebook Page',
      },
    ],
    default: 'getInstagramAccount',
    required: true,
  },
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['carousel'],
      },
    },
    options: [
      {
        name: 'Publish',
        value: 'publish',
        action: 'Publish',
        description: 'Publish a carousel (album) post with up to 10 images or videos',
      },
    ],
    default: 'publish',
    required: true,
  },
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['comments'],
      },
    },
    options: [
      {
        name: 'Delete',
        value: 'deleteComment',
        action: 'Delete a comment',
        description: 'Delete a comment from an Instagram media object',
      },
      {
        name: 'Disable',
        value: 'disableComments',
        action: 'Disable comments on media',
        description: 'Disable comments on an Instagram media object',
      },
      {
        name: 'Enable',
        value: 'enableComments',
        action: 'Enable comments on media',
        description: 'Enable comments on an Instagram media object',
      },
      {
        name: 'Hide',
        value: 'hideComment',
        action: 'Hide a comment',
        description: 'Hide a comment from an Instagram media object',
      },
      {
        name: 'List',
        value: 'list',
        action: 'List comments',
        description: 'List comments on an Instagram media object',
      },
      {
        name: 'Send Private Reply',
        value: 'sendPrivateReply',
        action: 'Send a private reply',
        description: 'Send a private reply message to a commenter using the comment ID',
      },
      {
        name: 'Unhide',
        value: 'unhideComment',
        action: 'Unhide a comment',
        description: 'Unhide a previously hidden comment',
      },
    ],
    default: 'list',
    required: true,
  },
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['igUser'],
      },
    },
    options: [
      {
        name: 'Get',
        value: 'get',
        action: 'Get IG user',
        description: 'Get basic profile information for an Instagram Business or Creator account',
      },
      {
        name: 'Get Media',
        value: 'getMedia',
        action: 'Get media',
        description: 'List media objects owned by an Instagram Business or Creator account',
      },
    ],
    default: 'get',
    required: true,
  },
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['auth'],
      },
    },
    options: [
      {
        name: 'Exchange Access Token',
        value: 'exchangeAccessToken',
        action: 'Exchange short lived token',
        description:
          'Exchange a short-lived Instagram User access token for a long-lived token using the Instagram Platform access token endpoint',
      },
      {
        name: 'Get Me',
        value: 'getMe',
        action: 'Get me profile',
        description:
          'Call the Graph API /me endpoint using the access token from the Instagram API credential',
      },
      {
        name: 'Refresh Access Token',
        value: 'refreshAccessToken',
        action: 'Refresh access token',
        description:
          'Refresh a long-lived Instagram User access token using the Instagram Platform refresh endpoint',
      },
    ],
    default: 'refreshAccessToken',
    required: true,
  },
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['igHashtag'],
      },
    },
    options: [
      {
        name: 'Search',
        value: 'search',
        action: 'Search hashtags',
        description: 'Search for a hashtag by name and return its ID',
      },
      {
        name: 'Get Recent Media',
        value: 'getRecentMedia',
        action: 'Get recent media for hashtag',
        description: 'Get the most recent media tagged with a hashtag',
      },
      {
        name: 'Get Top Media',
        value: 'getTopMedia',
        action: 'Get top media for hashtag',
        description: 'Get the most popular media tagged with a hashtag',
      },
    ],
    default: 'search',
    required: true,
  },
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['messaging'],
      },
    },
    options: [
      {
        name: 'Send Message',
        value: 'sendMessage',
        action: 'Send direct message',
        description: 'Send a text message to an Instagram user via the Messaging API',
      },
    ],
    default: 'sendMessage',
    required: true,
  },
  {
    displayName: 'Instagram Account ID',
    name: 'node',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    description:
      'The Instagram Business Account ID or User ID (IGSID) on which to publish the media, or the professional account that owns the commented media, or the IG User to read data for, or the IG User performing a hashtag or messaging query. Not an n8n workflow node.',
    displayOptions: {
      show: {
        resource: [
          'image',
          'reels',
          'stories',
          'carousel',
          'comments',
          'igUser',
          'igHashtag',
          'messaging',
        ],
        operation: [
          'publish',
          'sendPrivateReply',
          'get',
          'getMedia',
          'search',
          'getRecentMedia',
          'getTopMedia',
          'sendMessage',
        ],
      },
    },
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        placeholder: 'Select an account...',
        typeOptions: {
          searchListMethod: 'searchInstagramAccounts',
          searchable: true,
        },
      },
      {
        displayName: 'By ID',
        name: 'id',
        type: 'string',
        validation: [],
        placeholder: 'Enter Instagram Account ID',
        extractValue: {
          type: 'regex',
          regex: '(.*)',
        },
      },
    ],
  },
  {
    displayName: 'Access Token',
    name: 'accessToken',
    type: 'string',
    typeOptions: {
      password: true,
    },
    default: '',
    description:
      'The long-lived Instagram User access token to refresh. Leave empty to use the access token from the Instagram API credential.',
    displayOptions: {
      show: {
        resource: ['auth'],
        operation: ['refreshAccessToken'],
      },
    },
  },
  {
    displayName: 'Short-Lived Access Token',
    name: 'shortLivedAccessToken',
    type: 'string',
    typeOptions: {
      password: true,
    },
    default: '',
    description:
      'The short-lived Instagram User access token to exchange for a long-lived token. This is usually obtained from the login flow.',
    required: true,
    displayOptions: {
      show: {
        resource: ['auth'],
        operation: ['exchangeAccessToken'],
      },
    },
  },
  {
    displayName: 'App Secret',
    name: 'appSecret',
    type: 'string',
    typeOptions: {
      password: true,
    },
    default: '',
    description:
      'Instagram App Secret from the Meta App Dashboard. Required to securely exchange a short-lived access token for a long-lived token.',
    required: true,
    displayOptions: {
      show: {
        resource: ['auth'],
        operation: ['exchangeAccessToken'],
      },
    },
  },
  {
    displayName: 'Graph API Version',
    name: 'graphApiVersion',
    type: 'string',
    default: 'v26.0',
    description: 'Facebook Graph API version to use (e.g., v26.0, v25.0, v24.0)',
    placeholder: 'v26.0',
    required: true,
    displayOptions: {
      show: {
        resource: [
          'image',
          'reels',
          'stories',
          'carousel',
          'comments',
          'igUser',
          'igHashtag',
          'auth',
          'messaging',
          'page',
        ],
        operation: [
          'publish',
          'list',
          'hideComment',
          'unhideComment',
          'deleteComment',
          'disableComments',
          'enableComments',
          'get',
          'getMedia',
          'search',
          'getRecentMedia',
          'getTopMedia',
          'getMe',
          'sendMessage',
          'sendPrivateReply',
          'getInstagramAccount',
        ],
      },
    },
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: {
      show: {
        resource: ['igUser', 'igHashtag'],
        operation: ['getMedia', 'getRecentMedia', 'getTopMedia'],
      },
    },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: {
      minValue: 1,
      maxValue: 500,
    },
    default: 50,
    description: 'Max number of results to return',
    displayOptions: {
      show: {
        resource: ['igUser', 'igHashtag'],
        operation: ['getMedia', 'getRecentMedia', 'getTopMedia'],
        returnAll: [false],
      },
    },
  },
  {
    displayName: 'Recipient IG User ID',
    name: 'recipientId',
    type: 'string',
    default: '',
    description:
      'The Instagram-scoped user ID (IGSID) of the recipient. This is provided in webhook events or other Messaging API responses.',
    required: true,
    displayOptions: {
      show: {
        resource: ['messaging'],
        operation: ['sendMessage'],
      },
    },
  },
  {
    displayName: 'Page ID',
    name: 'pageId',
    type: 'string',
    default: '',
    description:
      'The Facebook Page ID that is connected to an Instagram business or creator account',
    required: true,
    displayOptions: {
      show: {
        resource: ['page'],
        operation: ['getInstagramAccount'],
      },
    },
  },
  {
    displayName: 'Message Text',
    name: 'messageText',
    type: 'string',
    typeOptions: {
      rows: 4,
    },
    default: '',
    description: 'The text content of the direct message to send',
    required: true,
    displayOptions: {
      show: {
        resource: ['messaging'],
        operation: ['sendMessage'],
      },
    },
  },
  {
    displayName: 'Hashtag Name',
    name: 'hashtagName',
    type: 'string',
    default: '',
    description: 'The hashtag name to search for, without the # symbol',
    required: true,
    displayOptions: {
      show: {
        resource: ['igHashtag'],
        operation: ['search'],
      },
    },
  },
  {
    displayName: 'Hashtag ID',
    name: 'hashtagId',
    type: 'string',
    default: '',
    description: 'The IG Hashtag ID returned by the hashtag search',
    required: true,
    displayOptions: {
      show: {
        resource: ['igHashtag'],
        operation: ['getRecentMedia', 'getTopMedia'],
      },
    },
  },
  {
    displayName: 'Media ID',
    name: 'mediaId',
    type: 'string',
    default: '',
    description: 'The IG Media ID whose comments you want to manage',
    required: true,
    displayOptions: {
      show: {
        resource: ['comments'],
        operation: ['list', 'disableComments', 'enableComments'],
      },
    },
  },
  {
    displayName: 'Comment ID',
    name: 'commentId',
    type: 'string',
    default: '',
    description: 'The IG Comment ID you want to moderate',
    required: true,
    displayOptions: {
      show: {
        resource: ['comments'],
        operation: ['hideComment', 'unhideComment', 'deleteComment', 'sendPrivateReply'],
      },
    },
  },
  {
    displayName: 'Message',
    name: 'privateReplyText',
    type: 'string',
    typeOptions: {
      rows: 4,
    },
    default: '',
    description: 'The text of the private reply message',
    required: true,
    displayOptions: {
      show: {
        resource: ['comments'],
        operation: ['sendPrivateReply'],
      },
    },
  },
  ...instagramResourceFields,
  {
    displayName: 'Caption',
    name: 'caption',
    type: 'string',
    default: '',
    description:
      'Optional caption for a feed image, Reel, or carousel. Stories do not support captions.',
    displayOptions: {
      show: {
        resource: ['image', 'reels', 'carousel'],
        operation: ['publish'],
      },
    },
  },
  {
    displayName: 'Carousel Input Mode',
    name: 'carouselInputMode',
    type: 'options',
    options: [
      {
        name: 'Manual Media Items',
        value: 'manual',
        description: 'Manually configure each carousel media item in this node',
      },
      {
        name: 'Use Field From Input',
        value: 'fromField',
        description:
          'Read an array of media URLs from a field on the incoming item and build the carousel from it',
      },
    ],
    default: 'manual',
    description:
      'Whether to configure carousel media directly in this node or read them from an incoming field',
    displayOptions: {
      show: {
        resource: ['carousel'],
        operation: ['publish'],
      },
    },
  },
  {
    displayName: 'Media Array Field Name',
    name: 'carouselMediaArrayField',
    type: 'string',
    default: '',
    description:
      'Name of the field on the incoming item that contains an array of media URLs or objects (for example, "mediaUrls" or "data.carousel")',
    displayOptions: {
      show: {
        resource: ['carousel'],
        operation: ['publish'],
        carouselInputMode: ['fromField'],
      },
    },
  },
  {
    displayName: 'Media Type for Array URLs',
    name: 'carouselMediaArrayType',
    type: 'options',
    default: 'auto',
    description: 'How to determine whether each URL in the array is treated as an image or a video',
    options: [
      {
        name: 'Auto-Detect From URL',
        value: 'auto',
        description:
          'Try to infer the media type from the URL or file extension; defaults to image when uncertain',
      },
      {
        name: 'Image',
        value: 'image',
        description: 'Treat all URLs in the array as images',
      },
      {
        name: 'Video',
        value: 'video',
        description: 'Treat all URLs in the array as videos',
      },
    ],
    displayOptions: {
      show: {
        resource: ['carousel'],
        operation: ['publish'],
        carouselInputMode: ['fromField'],
      },
    },
  },
  {
    displayName: 'Carousel Media',
    name: 'carouselMedia',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
      minValue: 2,
      maxValue: 10,
    },
    default: { mediaItem: [] },
    placeholder: 'Add media item',
    description: 'Up to 10 images or videos for the carousel. Order is preserved.',
    displayOptions: {
      show: {
        resource: ['carousel'],
        operation: ['publish'],
        carouselInputMode: ['manual'],
      },
    },
    options: [
      {
        displayName: 'Media Item',
        name: 'mediaItem',
        values: [
          {
            displayName: 'Alt Text',
            name: 'altText',
            type: 'string',
            default: '',
            description: 'Alternative text for this image slide. Image slides only.',
            displayOptions: {
              show: { mediaType: ['image'] },
            },
          },
          {
            displayName: 'Image URL',
            name: 'imageUrl',
            type: 'string',
            default: '',
            description: 'URL of the image. Required when Media Type is Image.',
            displayOptions: {
              show: { mediaType: ['image'] },
            },
          },
          {
            displayName: 'Media Type',
            name: 'mediaType',
            type: 'options',
            default: 'image',
            options: [
              { name: 'Image', value: 'image' },
              { name: 'Video', value: 'video' },
            ],
          },
          {
            displayName: 'Product Tags',
            name: 'productTags',
            type: 'fixedCollection',
            typeOptions: { multipleValues: true, maxValue: 5 },
            placeholder: 'Add Product Tag',
            default: {},
            description:
              'Products to tag on this carousel slide. Up to 5 per slide and 20 per carousel.',
            options: [
              {
                displayName: 'Tag',
                name: 'tag',
                values: [
                  {
                    displayName: 'Product ID',
                    name: 'product_id',
                    type: 'string',
                    default: '',
                    required: true,
                  },
                  {
                    displayName: 'X Position',
                    name: 'x',
                    type: 'number',
                    typeOptions: { minValue: 0, maxValue: 1, numberStepSize: 0.01 },
                    default: 0.5,
                    description: 'Optional horizontal position for image slides',
                    displayOptions: { show: { mediaType: ['image'] } },
                  },
                  {
                    displayName: 'Y Position',
                    name: 'y',
                    type: 'number',
                    typeOptions: { minValue: 0, maxValue: 1, numberStepSize: 0.01 },
                    default: 0.5,
                    description: 'Optional vertical position for image slides',
                    displayOptions: { show: { mediaType: ['image'] } },
                  },
                ],
              },
            ],
          },
          {
            displayName: 'User Tags',
            name: 'userTags',
            type: 'fixedCollection',
            typeOptions: { multipleValues: true },
            placeholder: 'Add User Tag',
            default: {},
            description: 'Users to tag in this image slide. Image slides only.',
            displayOptions: {
              show: { mediaType: ['image'] },
            },
            options: [
              {
                displayName: 'Tag',
                name: 'tag',
                values: [
                  {
                    displayName: 'Username',
                    name: 'username',
                    type: 'string',
                    default: '',
                    required: true,
                  },
                  {
                    displayName: 'X Position',
                    name: 'x',
                    type: 'number',
                    typeOptions: { minValue: 0, maxValue: 1, numberStepSize: 0.01 },
                    default: 0.5,
                    description: 'Horizontal image position from 0 to 1',
                  },
                  {
                    displayName: 'Y Position',
                    name: 'y',
                    type: 'number',
                    typeOptions: { minValue: 0, maxValue: 1, numberStepSize: 0.01 },
                    default: 0.5,
                    description: 'Vertical image position from 0 to 1',
                  },
                ],
              },
            ],
          },
          {
            displayName: 'Video URL',
            name: 'videoUrl',
            type: 'string',
            default: '',
            description: 'URL of the video. Required when Media Type is Video.',
            displayOptions: {
              show: { mediaType: ['video'] },
            },
          },
        ],
      },
    ],
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['image', 'reels', 'stories', 'carousel'],
        operation: ['publish'],
      },
    },
    options: [
      {
        displayName: 'Alt Text',
        name: 'altText',
        type: 'string',
        default: '',
        description:
          'Alternative text for image posts (for accessibility). Image only; not supported for Reels or Stories.',
        displayOptions: {
          show: { resource: ['image'] },
        },
      },
      {
        displayName: 'Audio Name',
        name: 'audioName',
        type: 'string',
        default: '',
        description: 'Optional audio name for the Reel. Reels only.',
        displayOptions: {
          show: { resource: ['reels'] },
        },
      },
      {
        displayName: 'Collaborators',
        name: 'collaborators',
        type: 'string',
        default: '',
        description:
          'Comma-separated Instagram usernames (up to 3). Available for feed images, Reels, and carousels; not Stories.',
        displayOptions: {
          show: { resource: ['image', 'reels', 'carousel'] },
        },
      },
      {
        displayName: 'Cover Image URL',
        name: 'coverUrl',
        type: 'string',
        default: '',
        description: 'Public image URL to use as the Reel cover. Reels only.',
        displayOptions: {
          show: { resource: ['reels'] },
        },
      },
      {
        displayName: 'Location ID',
        name: 'locationId',
        type: 'string',
        default: '',
        description:
          'Facebook Page ID for a location to tag. Use Pages Search API to find location pages. Available for feed images, Reels, and carousels; not for Stories or carousel slides.',
        displayOptions: {
          show: { resource: ['image', 'reels', 'carousel'] },
        },
      },
      {
        displayName: 'Product Tags',
        name: 'productTags',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
          maxValue: 20,
        },
        placeholder: 'Add Product Tag',
        default: {},
        description:
          'Products to tag in a feed image or Reel. Product ID is required; image coordinates are optional. Not available for Stories or carousel items.',
        displayOptions: {
          show: { resource: ['image', 'reels'] },
        },
        options: [
          {
            displayName: 'Tag',
            name: 'tag',
            values: [
              {
                displayName: 'Product ID',
                name: 'product_id',
                type: 'string',
                default: '',
                description: 'Product ID from your catalog',
                required: true,
              },
              {
                displayName: 'X Position',
                name: 'x',
                type: 'number',
                typeOptions: {
                  minValue: 0,
                  maxValue: 1,
                  numberStepSize: 0.01,
                },
                default: 0.5,
                description: 'Horizontal position (0–1). Optional. 0 = left edge, 1 = right edge',
                displayOptions: {
                  show: { resource: ['image'] },
                },
              },
              {
                displayName: 'Y Position',
                name: 'y',
                type: 'number',
                typeOptions: {
                  minValue: 0,
                  maxValue: 1,
                  numberStepSize: 0.01,
                },
                default: 0.5,
                description: 'Vertical position (0–1). Optional. 0 = top edge, 1 = bottom edge',
                displayOptions: {
                  show: { resource: ['image'] },
                },
              },
            ],
          },
        ],
      },
      {
        displayName: 'Share to Feed',
        name: 'shareToFeed',
        type: 'boolean',
        default: true,
        description: 'Whether the Reel or carousel should also appear in the feed',
        displayOptions: {
          show: { resource: ['reels', 'carousel'] },
        },
      },
      {
        displayName: 'Thumbnail Offset (Ms)',
        name: 'thumbOffset',
        type: 'number',
        typeOptions: { minValue: 0 },
        default: 0,
        description: 'Video frame offset in milliseconds to use as the Reel thumbnail. Reels only.',
        displayOptions: {
          show: { resource: ['reels'] },
        },
      },
      {
        displayName: 'Trial Reel - Graduation Strategy',
        name: 'trialReelGraduationStrategy',
        type: 'options',
        default: 'MANUAL',
        description: 'Configure Trial Reels graduation strategy. Available for Reels only.',
        displayOptions: {
          show: { resource: ['reels'] },
        },
        options: [
          {
            name: 'Manual',
            value: 'MANUAL',
            description:
              'You manually decide in the Instagram app when (or if) to graduate the trial reel',
          },
          {
            name: 'Performance-Based (SS_PERFORMANCE)',
            value: 'SS_PERFORMANCE',
            description:
              'Instagram automatically graduates the trial reel if it performs well with non-followers',
          },
        ],
      },
      {
        displayName: 'User Tags',
        name: 'userTags',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        placeholder: 'Add User Tag',
        default: {},
        description:
          'Users to tag in images, Reels, or Stories. Username is required. Coordinates are required for images, optional for Stories, and not used for Reels.',
        displayOptions: {
          show: { resource: ['image', 'reels', 'stories'] },
        },
        options: [
          {
            displayName: 'Tag',
            name: 'tag',
            values: [
              {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                default: '',
                description: 'Instagram username to tag (without @)',
                required: true,
              },
              {
                displayName: 'X Position',
                name: 'x',
                type: 'number',
                typeOptions: {
                  minValue: 0,
                  maxValue: 1,
                  numberStepSize: 0.01,
                },
                default: 0.5,
                description:
                  'Horizontal position (0–1). Required for images, optional for stories. 0 = left edge, 1 = right edge',
                displayOptions: {
                  show: { resource: ['image', 'stories'] },
                },
              },
              {
                displayName: 'Y Position',
                name: 'y',
                type: 'number',
                typeOptions: {
                  minValue: 0,
                  maxValue: 1,
                  numberStepSize: 0.01,
                },
                default: 0.5,
                description:
                  'Vertical position (0–1). Required for images, optional for stories. 0 = top edge, 1 = bottom edge',
                displayOptions: {
                  show: { resource: ['image', 'stories'] },
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
