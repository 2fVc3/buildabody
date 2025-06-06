import { Context } from '@devvit/public-api';
import { PostConfig } from '../../shared/types/postConfig';
import { RequestContext } from '@devvit/server';

const getPostConfigKey = (postId: string) => `post_config:${postId}` as const;

const defaultPostConfig: PostConfig = {
  frog: {
    baseColor: '0x32CD32', // Lime green
    size: {
      x: 1,
      y: 0.8,
      z: 1.2
    },
    personalities: ['dramatic', 'zen', 'chaotic', 'sleepy', 'confident', 'anxious', 'philosophical', 'rebellious'],
    effects: [
      { type: 'rainbow', duration: 3000, magnitude: 1 },
      { type: 'giant', duration: 5000, magnitude: 0.5 },
      { type: 'tiny', duration: 5000, magnitude: 0.3 },
      { type: 'bouncy', duration: 4000, magnitude: 1.5 },
      { type: 'glowing', duration: 4000, magnitude: 1 },
      { type: 'spinning', duration: 3000, magnitude: 2 },
      { type: 'none', duration: 0, magnitude: 0 }
    ]
  },
  launch: {
    minPower: 10,
    maxPower: 100,
    gravity: 9.8,
    bounceDecay: 0.6,
    maxBounces: 5
  },
  scoring: {
    landingBonus: 50,
    bounceMultiplier: 10,
    personalityBonus: 25,
    effectBonus: 15,
    distanceMultiplier: 10
  },
  camera: {
    near: -100,
    far: 1000,
    viewSize: 25,
    position: {
      x: 15,
      y: 20,
      z: 15
    },
    lookAt: {
      x: 0,
      y: 0,
      z: 0
    },
    followSpeed: 0.1
  },
  background: {
    color: '0x87CEEB', // Sky blue
    skyColor: '0x87CEEB', // Sky blue
    groundColor: '0x90EE90' // Light green
  },
  light: {
    directional: {
      color: '0xFFFFFF',
      intensity: 1.0,
      position: {
        x: 20,
        y: 30,
        z: 20
      }
    },
    ambient: {
      color: '0xFFFFE0', // Light yellow
      intensity: 0.6
    }
  }
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