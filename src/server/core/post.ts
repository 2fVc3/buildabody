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
        'r': 50,  // More variation for chaos
        'g': 40,  // More variation for chaos
        'b': 30,  // More variation for chaos
      },
      'intensity': {
        'r': 0.2,
        'g': 0.25,
        'b': 0.15,
      },
    },
  },
  'gameplay': {
    'distance': 8, // Wider movement range for more chaos
    'speed': {
      'min': 5,
      'max': 10,
      'multiplier': 0.03,
    },
    'accuracy': 0.25, // More forgiving for chaos mode
    'effectProbability': 0.3, // More effects for more chaos
  },
  'instructions': {
    'height': 4, // Show instructions for fewer layers
  },
  'camera': {
    'near': -100,
    'far': 1000,
    'viewSize': 22, // Slightly wider view for the chaos
    'position': {
      'x': 14, // Better angle for viewing the madness
      'y': 16,
      'z': 14,
    },
    'lookAt': {
      'x': 0,
      'y': 4,
      'z': 0,
    },
    'offset': 7,
  },
  'background': {
    'color': '0xF0F8FF', // Alice blue for a dreamy circus feel
  },
  'light': {
    'directional': {
      'color': '0xFFFFFF',
      'intensity': 0.9, // Brighter for more dramatic shadows
      'position': {
        'x': 12,
        'y': 25,
        'z': 12,
      },
    },
    'ambient': {
      'color': '0xFFE4E1', // Misty rose for warm ambient light
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