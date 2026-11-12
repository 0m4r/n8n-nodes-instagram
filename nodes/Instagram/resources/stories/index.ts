import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import type { ResourceHandler } from '../types';

const storiesFields: INodeProperties[] = [
  {
    displayName: 'Video URL',
    name: 'videoUrl',
    type: 'string',
    default: '',
    description: 'The URL of the video to publish as a story on Instagram',
    required: true,
    displayOptions: {
      show: {
        resource: ['reels', 'stories'],
        operation: ['publish'],
      },
    },
  },
];

export const storiesResource: ResourceHandler = {
  value: 'stories',
  option: {
    name: 'Stories',
    value: 'stories',
    description: 'Publish a story',
  },
  fields: storiesFields,
  pollIntervalMs: 2000, // Reduced from 3000ms for faster polling
  maxPollAttempts: 40, // Reduced from 80 - containers usually ready within 40 attempts (~80 seconds max)
  publishRetryDelay: 2000, // Reduced from 3000ms
  publishMaxAttempts: 6,
  buildMediaPayload(this: IExecuteFunctions, itemIndex: number) {
    const videoUrl = this.getNodeParameter('videoUrl', itemIndex) as string;
    return {
      video_url: videoUrl,
      media_type: 'STORIES',
    };
  },
};
