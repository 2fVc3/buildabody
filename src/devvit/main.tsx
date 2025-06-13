import { Devvit, Post } from '@devvit/public-api';

// Side effect import to bundle the server. The /index is required for server splitting.
import '../server/index';
import { defineConfig } from '@devvit/server';
import { postConfigNew } from '../server/core/post';

defineConfig({
  name: '🐸 Froggy Flight 🐸',
  entry: 'index.html',
  height: 'tall',
  menu: { enable: false },
});

export const Preview: Devvit.BlockComponent<{ text?: string }> = ({ text = 'Loading Froggy Flight...' }) => {
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

// MAIN GAME POST CREATION
Devvit.addMenuItem({
  label: '🐸 Create Froggy Flight 🐸',
  location: 'subreddit',
  forUserType: 'moderator',
  async onPress(event, context) {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      const post = await reddit.submitPost({
        title: '🐸 Froggy Flight - Launch Frogs Into The Sky! 🐸',
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

      ui.showToast({ text: '🐸 Froggy Flight has begun! 🐸' });
      await ui.navigateTo(post.url);
    } catch (error) {
      ui.showToast({ 
        text: `💥 Froggy Flight creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  },
});

// WEEKLY TOURNAMENT POST
Devvit.addMenuItem({
  label: '🏆 Weekly Frog Tournament 🏆',
  location: 'subreddit',
  forUserType: 'moderator',
  async onPress(event, context) {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      const weekNumber = Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      const post = await reddit.submitPost({
        title: `🏆 WEEKLY FROG TOURNAMENT #${weekNumber} - Compete for Glory! 🏆`,
        text: `# 🐸 Welcome to Weekly Frog Tournament #${weekNumber}! 🐸

## 🎯 **Tournament Rules:**
- **Duration:** 7 days from this post
- **Goal:** Achieve the highest frog launch score
- **Prize:** Tournament winner gets special flair! 🏅

## 🛩️ **How to Participate:**
1. Play Froggy Flight in our main game post
2. Screenshot your best score
3. Comment below with your score and screenshot
4. Tag 3 friends to join the tournament!

## 🏆 **Current Tournament Leaderboard:**
*Will be updated daily by moderators*

## 📅 **Tournament Schedule:**
- **Starts:** ${new Date().toLocaleDateString()}
- **Ends:** ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
- **Winner Announced:** ${new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString()}

## 🎮 **Pro Tips:**
- Avoid as many planes as possible before crashing
- Look for golden planes for super launches!
- Each frog personality has unique bonuses
- Practice makes perfect!

Good luck, pilots! May your frogs fly far and your scores soar high! 🚀🐸

---
*This is an automated tournament post. Next tournament starts in 7 days!*`,
        subredditName: subreddit.name,
      });

      ui.showToast({ text: '🏆 Weekly Tournament Created! 🏆' });
      await ui.navigateTo(post.url);
    } catch (error) {
      ui.showToast({ 
        text: `Failed to create tournament: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  },
});

// DAILY CHALLENGE POST
Devvit.addMenuItem({
  label: '⭐ Daily Frog Challenge ⭐',
  location: 'subreddit',
  forUserType: 'moderator',
  async onPress(event, context) {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      const today = new Date().toLocaleDateString();
      
      const challenges = [
        {
          title: "🎭 Drama Queen Challenge",
          description: "Play with a DRAMATIC frog personality and score over 500 points!",
          reward: "Drama Queen Flair 🎭"
        },
        {
          title: "🧘 Zen Master Challenge", 
          description: "Achieve inner peace with a ZEN frog and land softly (under 3 bounces)!",
          reward: "Zen Master Flair 🧘"
        },
        {
          title: "🌪️ Chaos Creator Challenge",
          description: "Embrace chaos with a CHAOTIC frog and get 5+ bounces!",
          reward: "Chaos Creator Flair 🌪️"
        },
        {
          title: "💤 Sleepy Pilot Challenge",
          description: "Wake up a SLEEPY frog and still score over 300 points!",
          reward: "Sleepy Pilot Flair 💤"
        },
        {
          title: "💪 Confidence Boost Challenge",
          description: "Show confidence with a CONFIDENT frog and avoid 10+ planes!",
          reward: "Ace Pilot Flair 💪"
        },
        {
          title: "😰 Anxiety Fighter Challenge",
          description: "Overcome fear with an ANXIOUS frog and achieve any score!",
          reward: "Brave Heart Flair 😰"
        },
        {
          title: "🤔 Deep Thinker Challenge",
          description: "Contemplate existence with a PHILOSOPHICAL frog and score over 400!",
          reward: "Philosopher Flair 🤔"
        },
        {
          title: "😤 Rebel Challenge",
          description: "Break the rules with a REBELLIOUS frog and crash into a destroyer plane on purpose!",
          reward: "Rebel Flair 😤"
        }
      ];

      const todayChallenge = challenges[new Date().getDay()];
      
      const post = await reddit.submitPost({
        title: `⭐ DAILY CHALLENGE - ${today} - ${todayChallenge.title} ⭐`,
        text: `# 🐸 Today's Froggy Flight Challenge! 🐸

## 🎯 **${todayChallenge.title}**

### 📋 **Challenge Description:**
${todayChallenge.description}

### 🏅 **Reward:**
Complete this challenge and earn the **${todayChallenge.reward}**!

## 📸 **How to Complete:**
1. Play Froggy Flight with the specified frog personality
2. Meet the challenge requirements
3. Take a screenshot of your success
4. Comment below with your screenshot and tag a friend!

## 🎮 **Challenge Tips:**
- Frog personalities are randomly assigned when you start
- Keep restarting until you get the right personality
- Each personality has unique quotes and bonuses
- Have fun and don't take it too seriously!

## 🗓️ **Challenge Schedule:**
- **Monday:** Drama Queen Challenge 🎭
- **Tuesday:** Zen Master Challenge 🧘  
- **Wednesday:** Chaos Creator Challenge 🌪️
- **Thursday:** Sleepy Pilot Challenge 💤
- **Friday:** Confidence Boost Challenge 💪
- **Saturday:** Anxiety Fighter Challenge 😰
- **Sunday:** Deep Thinker Challenge 🤔

Good luck, brave pilots! Show us what you and your frog can accomplish! 🚀

---
*New challenge every day! Come back tomorrow for a fresh challenge!*`,
        subredditName: subreddit.name,
      });

      ui.showToast({ text: '⭐ Daily Challenge Created! ⭐' });
      await ui.navigateTo(post.url);
    } catch (error) {
      ui.showToast({ 
        text: `Failed to create challenge: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  },
});

// COMMUNITY LEADERBOARD POST
Devvit.addMenuItem({
  label: '📊 Community Leaderboard 📊',
  location: 'subreddit',
  forUserType: 'moderator',
  async onPress(event, context) {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      
      const post = await reddit.submitPost({
        title: '📊 FROGGY FLIGHT COMMUNITY LEADERBOARD - Hall of Fame! 📊',
        text: `# 🏆 Froggy Flight Hall of Fame 🏆

## 🥇 **Top Pilots of All Time**

### 🛩️ **How Rankings Work:**
- **Score:** Your highest frog launch distance
- **Rank:** Position among all community pilots  
- **Achievements:** Special accomplishments and records

## 🎯 **Current Records:**

### 🏅 **Distance Records:**
- **Longest Flight:** *To be updated*
- **Most Bounces:** *To be updated*  
- **Fastest Speed:** *To be updated*
- **Most Planes Avoided:** *To be updated*

### 🐸 **Frog Personality Champions:**
- **🎭 Drama Queen Master:** *To be updated*
- **🧘 Zen Master:** *To be updated*
- **🌪️ Chaos Champion:** *To be updated*
- **💤 Sleepy Success:** *To be updated*
- **💪 Confidence King/Queen:** *To be updated*
- **😰 Anxiety Overcomer:** *To be updated*
- **🤔 Philosophy Phenom:** *To be updated*
- **😤 Rebel Leader:** *To be updated*

### ✈️ **Special Achievements:**
- **🟡 Golden Plane Hunter:** Most super launches
- **🔴 Destroyer Survivor:** Avoided the most destroyer planes
- **🎨 Rainbow Master:** Most rainbow effects triggered
- **🦣 Giant Frog Launcher:** Most giant frog launches
- **🐭 Tiny Frog Expert:** Most tiny frog launches

## 📈 **Weekly Stats:**
*Updated every Monday*

## 🎮 **How to Climb the Leaderboard:**
1. Play Froggy Flight regularly
2. Master different frog personalities
3. Learn plane patterns and timing
4. Share your best scores with screenshots
5. Participate in daily challenges and tournaments

## 🏆 **Leaderboard Rewards:**
- **Top 10:** Special "Elite Pilot" flair
- **Top 3:** "Ace Pilot" flair + custom user flair
- **#1:** "Frog Flight Champion" flair + pinned achievement post

Keep flying, pilots! Your name could be up here next! 🚀🐸

---
*Leaderboard updated weekly. Scores verified through game data and community screenshots.*`,
        subredditName: subreddit.name,
      });

      ui.showToast({ text: '📊 Community Leaderboard Created! 📊' });
      await ui.navigateTo(post.url);
    } catch (error) {
      ui.showToast({ 
        text: `Failed to create leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  },
});

// TIPS AND TRICKS POST
Devvit.addMenuItem({
  label: '💡 Strategy Guide 💡',
  location: 'subreddit',
  forUserType: 'moderator',
  async onPress(event, context) {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      
      const post = await reddit.submitPost({
        title: '💡 FROGGY FLIGHT MASTER GUIDE - Tips, Tricks & Strategies! 💡',
        text: `# 🎓 Froggy Flight Academy - Master Class! 🎓

## 🛩️ **Basic Flight School**

### 🎮 **Controls:**
- **Mouse Movement:** Control your airplane
- **Smooth Following:** Plane follows cursor naturally
- **Height Range:** Move between ground level and sky
- **Crash to Launch:** Strategic crashing launches your frog!

## ✈️ **Plane Types & Strategy**

### 🔴 **Red Planes (Normal):**
- Standard crash launch
- Good for building speed first
- Safe choice for beginners

### 🟤 **Dark Red Planes (Destroyer):**
- **AVOID AT ALL COSTS!** 💀
- Destroys your frog completely
- No launch, no points, game over
- Learn to recognize the darker red color

### 🟡 **Gold Planes (Super Launch):**
- **BEST CHOICE!** ⭐
- 3x launch power multiplier
- Aim for these after building speed
- Creates rainbow frog effect

### 🔵 **Blue Planes (Slow Motion):**
- Gentle, controlled launch
- Good for precision landings
- Creates glowing frog effect

### 🟠 **Orange Planes (Bouncy):**
- Extra bouncy frog physics
- More bounces = more points
- Fun but unpredictable

### 🟣 **Purple Planes (Tiny):**
- Miniature frog launch
- Reduced power but cute effect
- Good for style points

### 🟢 **Green Planes (Giant):**
- Supersized frog launch
- Increased power and presence
- Impressive visual effect

## 🐸 **Frog Personality Guide**

### 🎭 **Dramatic Frog:**
- **Bonus:** +50 style points
- **Quotes:** Theatrical and over-the-top
- **Strategy:** Great for high scores

### 🧘 **Zen Frog:**
- **Bonus:** +30 peaceful points
- **Quotes:** Calm but disappointed
- **Strategy:** Controlled launches

### 🌪️ **Chaotic Frog:**
- **Bonus:** +40 chaos points
- **Quotes:** Wild and unpredictable
- **Strategy:** Embrace the randomness

### 💤 **Sleepy Frog:**
- **Bonus:** +20 effort points
- **Quotes:** Tired and grumpy
- **Strategy:** Lower power but consistent

### 💪 **Confident Frog:**
- **Bonus:** +35 confidence points
- **Quotes:** Arrogant about flying
- **Strategy:** Slightly better launches

### 😰 **Anxious Frog:**
- **Bonus:** +45 bravery points
- **Quotes:** Worried about safety
- **Strategy:** Weaker launches but high bonus

### 🤔 **Philosophical Frog:**
- **Bonus:** +25 wisdom points
- **Quotes:** Deep thoughts about flight
- **Strategy:** Balanced approach

### 😤 **Rebellious Frog:**
- **Bonus:** +55 rebel points
- **Quotes:** Defies aviation rules
- **Strategy:** Strongest launches

## 🎯 **Advanced Strategies**

### 🚀 **The Speed Build Strategy:**
1. Avoid 5-10 planes to build speed multiplier
2. Look for golden planes for super launch
3. Avoid destroyer planes at all costs
4. Time your crash for maximum effect

### 🎪 **The Personality Play:**
- Restart until you get high-bonus personalities
- Dramatic and Rebellious give most points
- Learn each personality's quotes and timing

### 🏆 **The Perfect Run:**
1. Start with confident or rebellious frog
2. Avoid 8+ planes (speed 3.0x+)
3. Crash into golden plane
4. Land with 3+ bounces
5. Score 800+ points!

## 📊 **Scoring Breakdown**

### 🎯 **Base Score:**
- **Distance:** 10 points per unit
- **Speed Multiplier:** Planes avoided × 0.2
- **Bounce Bonus:** 10 points per bounce

### 🎁 **Bonus Points:**
- **Personality Bonus:** 20-55 points
- **Special Effects:** 25 points
- **Landing Bonus:** 50 points

### 🏅 **Score Targets:**
- **Beginner:** 100-200 points
- **Intermediate:** 300-500 points  
- **Advanced:** 600-800 points
- **Master:** 900+ points
- **Legend:** 1000+ points

## 🎮 **Pro Tips**

### ⚡ **Speed Management:**
- Higher speed = harder to dodge
- Find your comfort zone
- Don't get greedy with plane avoidance

### 🎨 **Visual Cues:**
- Watch plane colors carefully
- Destroyer planes are slightly darker red
- Golden planes shine brighter

### 🎵 **Audio Cues:**
- Listen to frog quotes for personality
- Different personalities have different timing

### 🎪 **Fun Challenges:**
- Try to get every personality type
- Aim for specific plane types
- Challenge friends to beat your score

## 🏆 **Community Challenges**

### 📅 **Daily Goals:**
- Play with different personalities
- Try new strategies
- Share your best runs

### 🎯 **Weekly Targets:**
- Master one new personality
- Achieve a new personal best
- Help other players improve

Remember: Froggy Flight is about having fun! Don't stress about perfect scores - enjoy the journey and the hilarious frog commentary! 🐸✈️

---
*Good luck, pilots! May your frogs fly far and your scores soar high!* 🚀`,
        subredditName: subreddit.name,
      });

      ui.showToast({ text: '💡 Strategy Guide Created! 💡' });
      await ui.navigateTo(post.url);
    } catch (error) {
      ui.showToast({ 
        text: `Failed to create guide: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  },
});

// COMMUNITY SHOWCASE POST
Devvit.addMenuItem({
  label: '🎨 Community Showcase 🎨',
  location: 'subreddit',
  forUserType: 'moderator',
  async onPress(event, context) {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      
      const post = await reddit.submitPost({
        title: '🎨 COMMUNITY SHOWCASE - Share Your Epic Frog Flights! 🎨',
        text: `# 🎪 Froggy Flight Community Showcase! 🎪

## 📸 **Share Your Epic Moments!**

This is the place to share your most amazing, funny, and epic Froggy Flight moments!

### 🏆 **What to Share:**
- **High Score Screenshots** - Show off your best runs!
- **Funny Frog Quotes** - Share the hilarious things your frogs say
- **Epic Crashes** - Those spectacular collision moments
- **Perfect Landings** - When everything goes just right
- **Personality Moments** - Capture your frog's unique character
- **Strategy Videos** - Help others improve their game

### 📱 **How to Share:**
1. Take a screenshot or record a video
2. Upload to Reddit or your preferred platform
3. Comment below with your submission
4. Tell us the story behind the moment!
5. Tag friends to see your achievement

## 🎭 **Featured Categories:**

### 🚀 **Epic Launches:**
Share your longest flights and highest scores!

### 😂 **Funniest Quotes:**
What's the most hilarious thing your frog has said?

### 💥 **Spectacular Crashes:**
Sometimes the crash is more entertaining than the flight!

### 🎨 **Beautiful Screenshots:**
Capture the gorgeous low-poly world and effects

### 🎮 **Strategy Clips:**
Show off your dodging skills and perfect timing

### 🐸 **Frog Personalities:**
Showcase each unique frog personality in action

## 🏅 **Community Awards:**

### 📸 **Screenshot of the Week:**
Best screenshot gets featured and special flair!

### 🎬 **Video of the Month:**
Most entertaining video gets pinned post!

### 😂 **Funniest Quote:**
Best frog quote gets immortalized in our hall of fame!

### 🏆 **Most Helpful:**
Best strategy content gets "Community Helper" flair!

## 🎯 **Submission Guidelines:**

### ✅ **Do:**
- Keep it family-friendly
- Give credit where due
- Be supportive of other players
- Share genuine moments
- Have fun with it!

### ❌ **Don't:**
- Spam multiple posts
- Use offensive language
- Claim others' content
- Be negative or toxic
- Post unrelated content

## 🎉 **Community Events:**

### 📅 **Weekly Themes:**
- **Monday:** Motivational Monday - Share your comeback stories
- **Tuesday:** Technique Tuesday - Strategy and tips
- **Wednesday:** Wacky Wednesday - Funny moments and quotes
- **Thursday:** Throwback Thursday - Your first successful flight
- **Friday:** Feature Friday - Showcase a specific frog personality
- **Saturday:** Screenshot Saturday - Beautiful game captures
- **Sunday:** Social Sunday - Tag friends and share together

### 🎊 **Monthly Contests:**
- Best overall submission wins special recognition
- Community voting determines winners
- Prizes include custom flairs and featured posts

## 💬 **Comment Template:**

\`\`\`
🐸 **Frog Personality:** [Dramatic/Zen/Chaotic/etc.]
🎯 **Score Achieved:** [Your score]
✈️ **Planes Avoided:** [Number]
💥 **Crash Type:** [Normal/Super/Destroyer/etc.]
📖 **Story:** [Tell us what happened!]
🏷️ **Tags:** @username1 @username2
\`\`\`

## 🌟 **Hall of Fame:**

*This section will be updated with the best community submissions!*

### 🏆 **Current Champions:**
- **Highest Score:** *To be updated*
- **Funniest Quote:** *To be updated*
- **Best Screenshot:** *To be updated*
- **Most Creative:** *To be updated*

Let's build an amazing community around Froggy Flight! Share your moments, support each other, and most importantly - have fun! 🎮🐸

---
*Remember: Every pilot started as a beginner. Share your journey and inspire others!*`,
        subredditName: subreddit.name,
      });

      ui.showToast({ text: '🎨 Community Showcase Created! 🎨' });
      await ui.navigateTo(post.url);
    } catch (error) {
      ui.showToast({ 
        text: `Failed to create showcase: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  },
});

export default Devvit;
