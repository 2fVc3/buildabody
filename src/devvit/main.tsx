import { Devvit, Post } from '@devvit/public-api';

// Side effect import to bundle the server. The /index is required for server splitting.
import '../server/index';
import { defineConfig } from '@devvit/server';
import { postConfigNew } from '../server/core/post';

defineConfig({
  name: '🎪 Chaotic Jenga Circus 🎪',
  entry: 'index.html',
  height: 'tall',
  menu: { enable: false },
});

export const Preview: Devvit.BlockComponent<{ text?: string }> = ({ text = 'Loading the chaos...' }) => {
  return (
    <zstack width={'100%'} height={'100%'} alignment="center middle">
      <vstack width={'100%'} height={'100%'} alignment="center middle">
        <image
          url="loading.gif"
          description="Loading..."
          height={'140px'}
          width={'140px'}
          imageHeight={'240px'}
          imageWidth={'240px'}
        />
        <spacer size="small" />
        <text maxWidth={`80%`} size="large" weight="bold" alignment="center middle" wrap>
          {text}
        </text>
      </vstack>
    </zstack>
  );
};

Devvit.addMenuItem({
  label: '🎪 Create Chaotic Jenga Circus 🎪',
  location: 'subreddit',
  forUserType: 'moderator',
  async onPress(event, context) {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      const post = await reddit.submitPost({
        title: '🎪 Chaotic Jenga Circus - Defy Physics & Logic! 🎪',
        subredditName: subreddit.name,
        preview: <Preview />,
      });

      if (!post) {
        throw new Error('Failed to create post');
      }

      await postConfigNew({
        ctx: context,
        postId: post.id,
      });

      ui.showToast({ text: '🎪 Chaos has been unleashed! 🎪' });
      await ui.navigateTo(post.url);
    } catch (error) {
      ui.showToast({ 
        text: `💥 Chaos creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  },
});

export default Devvit;