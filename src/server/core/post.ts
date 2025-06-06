import { Context } from '@devvit/public-api';
import { PostConfig } from '../../shared/types/postConfig';
import { RequestContext } from '@devvit/server';

const getPostConfigKey = (postId: string) => `post_config:${postId}` as const;

const defaultPostConfig: PostConfig = {
  'block': {
    'base': {
      'color': '0xDEB887', // Burlywood color like wooden Jenga blocks
      'scale': {
        'x': 4, // Jenga block width
        'y': 1.2, // Jenga block height
        'z': 1.2, // Jenga block depth
      },
    },
    'colors': {
      'base': {
        'r': 222, // Burlywood red component
        'g': 184, // Burlywood green component
        'b': 135, // Burlywood blue component
      },
      'range': {
        'r': 30,  // Variation towards brown
        'g': 20,  // Variation in green
        'b': 15,  // Variation in blue
      },
      'intensity': {
        'r': 0.1,
        'g': 0.15,
        'b': 0.1,
      },
    },
  },
  'gameplay': {
    'distance': 8, // Movement range
    'speed': {
      'min': 4,
      'max': 8,
      'multiplier': 0.02,
    },
    'accuracy': 0.3,
    'effectProbability': 0.2,
  },
  'instructions': {
    'height': 5,
  },
  'camera': {
    'near': -100,
    'far': 1000,
    'viewSize': 25, // Good view of the Jenga tower
    'position': {
      'x': 12, // Angled view like the image
      'y': 15,
      'z': 12,
    },
    'lookAt': {
      'x': 0,
      'y': 3,
      'z': 0,
    },
    'offset': 8,
  },
  'background': {
    'color': '0xF5F5DC', // Beige background like wooden table
  },
  'light': {
    'directional': {
      'color': '0xFFFFFF',
      'intensity': 0.8,
      'position': {
        'x': 10,
        'y': 20,
        'z': 10,
      },
    },
    'ambient': {
      'color': '0xFFFFFF',
      'intensity': 0.4,
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
  try {
    const config = await redis.get(getPostConfigKey(postId));
    return config ? JSON.parse(config) : undefined;
  } catch (error) {
    console.error(`Error getting post config for ${postId}:`, error);
    return undefined;
  }
};

export const postConfigGet = async ({
  redis,
  postId,
}: {
  redis: Context['redis'];
  postId: string;
}): Promise<PostConfig> => {
  const config = await postConfigMaybeGet({ redis, postId });
  if (!config) {
    console.log(`No config found for post ${postId}, using default config`);
    return defaultPostConfig;
  }
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
  try {
    await redis.set(getPostConfigKey(postId), JSON.stringify(config));
  } catch (error) {
    console.error(`Error setting post config for ${postId}:`, error);
    throw error;
  }
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
  try {
    const finalConfig = { ...defaultPostConfig, ...config };
    await ctx.redis.set(
      getPostConfigKey(postId),
      JSON.stringify(finalConfig)
    );
    console.log(`Created new post config for ${postId}`);
  } catch (error) {
    console.error(`Error creating post config for ${postId}:`, error);
    throw error;
  }
};