import { Context } from '@devvit/public-api';
import { PostConfig } from '../../shared/types/postConfig';
import { RequestContext } from '@devvit/server';

const getPostConfigKey = (postId: string) => `post_config:${postId}` as const;

const defaultPostConfig: PostConfig = {
  'block': {
    'base': {
      'color': '0xFFD700', // Golden color for fries
      'scale': {
        'x': 6, // Width for Jenga-style fries
        'y': 1.5, // Height for Jenga-style fries
        'z': 2, // Depth for Jenga-style fries
      },
    },
    'colors': {
      'base': {
        'r': 255,
        'g': 215,
        'b': 0,
      },
      'range': {
        'r': 20,
        'g': 30,
        'b': 0,
      },
      'intensity': {
        'r': 0.2,
        'g': 0.3,
        'b': 0.1,
      },
    },
  },
  'gameplay': {
    'distance': 8,
    'speed': {
      'min': 6,
      'max': 12,
      'multiplier': 0.03,
    },
    'accuracy': 0.4,
    'effectProbability': 0.4,
  },
  'instructions': {
    'height': 5,
  },
  'camera': {
    'near': -100,
    'far': 1000,
    'viewSize': 30,
    'position': {
      'x': 15,
      'y': 15,
      'z': 15,
    },
    'lookAt': {
      'x': 0,
      'y': 0,
      'z': 0,
    },
    'offset': 12,
  },
  'background': {
    'color': '0xF5D6BA', // Warm paper bag color
  },
  'light': {
    'directional': {
      'color': '0xFFFAF0',
      'intensity': 0.7,
      'position': {
        'x': 10,
        'y': 20,
        'z': 10,
      },
    },
    'ambient': {
      'color': '0xFFFAF0',
      'intensity': 0.5,
      'position': {
        'x': 0,
        'y': 0,
        'z': 0,
      },
    },
  },
};

export const postConfigMaybeGet = async ({
  redis,
  postId,
}: {
  redis: Context['redis'];
  postId: string;
}): Promise<PostConfig | undefined> => {
  const config = await redis.get(getPostConfigKey(postId));
  return config ? JSON.parse(config) : undefined;
};

export const postConfigGet = async ({
  redis,
  postId,
}: {
  redis: Context['redis'];
  postId: string;
}): Promise<PostConfig> => {
  const config = await postConfigMaybeGet({ redis, postId });
  if (!config) throw new Error('Post config not found');
  return config;
};

export const postConfigSet = async ({
  redis,
  postId,
  config,
}: {
  redis: Context['redis'];
  postId: string;
  config: Partial<PostConfig>;
}): Promise<void> => {
  await redis.set(getPostConfigKey(postId), JSON.stringify(config));
};

export const postConfigNew = async ({
  ctx,
  postId,
  config,
}: {
  ctx: Context | RequestContext;
  postId: string;
  config?: Partial<PostConfig>;
}): Promise<void> => {
  await ctx.redis.set(
    getPostConfigKey(postId),
    JSON.stringify({ ...defaultPostConfig, ...config })
  );
};