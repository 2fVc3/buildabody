import { Devvit, Post } from '@devvit/public-api';

// Side effect import to bundle the server. The /index is required for server splitting.
import '../server/index';
import { defineConfig } from '@devvit/server';
import { postConfigNew } from '../server/core/post';

defineConfig({
  name: 'French Fry Stacker',
  entry: 'index.html',
  height: 'tall',
  menu: { enable: false },
});

export const Preview: Devvit.BlockComponent<{ text?: string }> = ({ text = 'Loading...' }) => {
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
  label: 'French Fry Stacker: New Game',
  location: 'subreddit',
  forUserType: 'moderator',
  async onPress(event, context) {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      const post = await reddit.submitPost({
        title: 'French Fry Stacker',
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

      ui.showToast({ text: 'Created game!' });
      await ui.navigateTo(post.url);
    } catch (error) {
      ui.showToast({ 
        text: `Error creating game: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  },
});

export default Devvit;