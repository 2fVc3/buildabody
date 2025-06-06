import { Context } from '@devvit/public-api';
import { PostConfig } from '../../shared/types/postConfig';
import { RequestContext } from '@devvit/server';

const getPostConfigKey = (postId: string) => `post_config:${postId}` as const;

const defaultPostConfig: PostConfig = {
  'block': {
    'base': {
      'color': '0xFFD700', // Golden color for fries
      'scale': {
        'x': 8, // Wider for better Jenga visibility
        'y': 1.5, // Height for Jenga-style fries
        'z': 2.5, // Deeper for better Jenga visibility
      },
    },
    'colors': {
      'base': {
        'r': 255, // Golden red component
        'g': 215, // Golden green component
        'b': 0,   // Golden blue component
      },
      'range': {
        'r': 30,  // Variation in red (towards orange/brown)
        'g': 40,  // Variation in green
        'b': 20,  // Small variation in blue
      },
      'intensity': {
        'r': 0.15,
        'g': 0.2,
        'b': 0.1,
      },
    },
  },
  'gameplay': {
    'distance': 12, // Increased movement range
    'speed': {
      'min': 6,
      'max': 12,
      'multiplier': 0.03,
    },
    'accuracy': 0.4,
    'effectProbability': 0.3,
  },
  'instructions': {
    'height': 5,
  },
  'camera': {
    'near': -100,
    'far': 1000,
    'viewSize': 50, // Increased view size to see more of the tower
    'position': {
      'x': 20, // Moved camera further back
      'y': 20,
      'z': 20,
    },
    'lookAt': {
      'x': 0,
      'y': 0,
      'z': 0,
    },
    'offset': 15, // Increased offset for better tower view
  },
  'background': {
    'color': '0xF5D6BA', // Warm paper bag color
  },
  'light': {
    'directional': {
      'color': '0xFFFAF0',
      'intensity': 0.7,
      'position': {
        'x': 15,
        'y': 25,
        'z': 15,
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