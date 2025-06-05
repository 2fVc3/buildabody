import { Context } from '@devvit/public-api';
import { PostConfig } from '../../shared/types/postConfig';
import { RequestContext } from '@devvit/server';

const getPostConfigKey = (postId: string) => `post_config:${postId}` as const;

const defaultPostConfig: PostConfig = {
  'block': {
    'base': {
      'color': '0xFFA500', // Orange noodle color
      'scale': {
        'x': 12,
        'y': 1.5,
        'z': 12,
      },
    },
    'colors': {
      'base': {
        'r': 255,
        'g': 165,
        'b': 0,
      },
      'range': {
        'r': 30,
        'g': 30,
        'b': 30,
      },
      'intensity': {
        'r': 0.3,
        'g': 0.34,
        'b': 0.38,
      },
    },
  },
  'gameplay': {
    'distance': 14,
    'speed': {
      'min': 8,
      'max': 15,
      'multiplier': 0.05,
    },
    'accuracy': 0.3,
    'noodleBounciness': 0.8,
    'wiggleSpeed': 1.2,
  },
  'instructions': {
    'height': 5,
  },
  'camera': {
    'near': -100,
    'far': 1000,
    'viewSize': 35,
    'position': {
      'x': 2,
      'y': 2,
      'z': 2,
    },
    'lookAt': {
      'x': 0,
      'y': 0,
      'z': 0,
    },
    'offset': 8,
  },
  'background': {
    'color': '0xE6D5AC', // Warm beige background
  },
  'light': {
    'directional': {
      'color': '0xffffff',
      'intensity': 0.6,
      'position': {
        'x': 0,
        'y': 500,
        'z': 0,
      },
    },
    'ambient': {
      'color': '0xffd700',
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