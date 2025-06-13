import { Devvit } from '@devvit/public-api';

// SCHEDULED POSTS SYSTEM

// Daily Challenge Scheduler
Devvit.addSchedulerJob({
  name: 'dailyChallenge',
  cron: '0 9 * * *', // Every day at 9 AM
  async onRun(event, context) {
    const { reddit } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      const today = new Date().toLocaleDateString();
      
      const challenges = [
        {
          title: "🎭 Drama Queen Challenge",
          description: "Play with a DRAMATIC frog personality and score over 500 points!",
          reward: "Drama Queen Flair 🎭",
          tips: "Dramatic frogs give +50 style points and have the most theatrical quotes!"
        },
        {
          title: "🧘 Zen Master Challenge", 
          description: "Achieve inner peace with a ZEN frog and land softly (under 3 bounces)!",
          reward: "Zen Master Flair 🧘",
          tips: "Zen frogs prefer gentle landings and give +30 peaceful points!"
        },
        {
          title: "🌪️ Chaos Creator Challenge",
          description: "Embrace chaos with a CHAOTIC frog and get 5+ bounces!",
          reward: "Chaos Creator Flair 🌪️",
          tips: "Chaotic frogs love unpredictability and give +40 chaos points!"
        },
        {
          title: "💤 Sleepy Pilot Challenge",
          description: "Wake up a SLEEPY frog and still score over 300 points!",
          reward: "Sleepy Pilot Flair 💤",
          tips: "Sleepy frogs have lower energy but give +20 effort points for trying!"
        },
        {
          title: "💪 Confidence Boost Challenge",
          description: "Show confidence with a CONFIDENT frog and avoid 10+ planes!",
          reward: "Ace Pilot Flair 💪",
          tips: "Confident frogs have slightly better launches and give +35 confidence points!"
        },
        {
          title: "😰 Anxiety Fighter Challenge",
          description: "Overcome fear with an ANXIOUS frog and achieve any score!",
          reward: "Brave Heart Flair 😰",
          tips: "Anxious frogs are nervous but give +45 bravery points for overcoming fear!"
        },
        {
          title: "🤔 Deep Thinker Challenge",
          description: "Contemplate existence with a PHILOSOPHICAL frog and score over 400!",
          reward: "Philosopher Flair 🤔",
          tips: "Philosophical frogs ponder the meaning of flight and give +25 wisdom points!"
        }
      ];

      const todayChallenge = challenges[new Date().getDay()];
      
      await reddit.submitPost({
        title: `⭐ DAILY CHALLENGE - ${today} - ${todayChallenge.title} ⭐`,
        text: `# 🐸 Today's Froggy Flight Challenge! 🐸

## 🎯 **${todayChallenge.title}**

### 📋 **Challenge Description:**
${todayChallenge.description}

### 🏅 **Reward:**
Complete this challenge and earn the **${todayChallenge.reward}**!

### 💡 **Pro Tip:**
${todayChallenge.tips}

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

Good luck, brave pilots! Show us what you and your frog can accomplish! 🚀

---
*New challenge every day! Come back tomorrow for a fresh challenge!*`,
        subredditName: subreddit.name,
      });

      console.log(`Daily challenge posted for ${today}`);
    } catch (error) {
      console.error('Failed to post daily challenge:', error);
    }
  },
});

// Weekly Tournament Scheduler
Devvit.addSchedulerJob({
  name: 'weeklyTournament',
  cron: '0 10 * * 1', // Every Monday at 10 AM
  async onRun(event, context) {
    const { reddit } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      const weekNumber = Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      await reddit.submitPost({
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

## 🏆 **Tournament Categories:**
- **🥇 Highest Score Overall**
- **🎭 Best Dramatic Frog Performance**
- **🧘 Most Zen Landing**
- **🌪️ Wildest Chaotic Flight**
- **💤 Sleepiest Success Story**

## 📅 **Tournament Schedule:**
- **Starts:** ${new Date().toLocaleDateString()}
- **Ends:** ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
- **Winner Announced:** ${new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString()}

## 🎮 **Pro Tips:**
- Avoid as many planes as possible before crashing
- Look for golden planes for super launches!
- Each frog personality has unique bonuses
- Practice makes perfect!

## 🏅 **Prizes:**
- **1st Place:** "Tournament Champion" flair + pinned achievement post
- **2nd Place:** "Silver Pilot" flair
- **3rd Place:** "Bronze Aviator" flair
- **Participation:** "Tournament Pilot" badge

Good luck, pilots! May your frogs fly far and your scores soar high! 🚀🐸

---
*This is an automated tournament post. Next tournament starts in 7 days!*`,
        subredditName: subreddit.name,
      });

      console.log(`Weekly tournament #${weekNumber} posted`);
    } catch (error) {
      console.error('Failed to post weekly tournament:', error);
    }
  },
});

// Monthly Leaderboard Update
Devvit.addSchedulerJob({
  name: 'monthlyLeaderboard',
  cron: '0 12 1 * *', // First day of every month at 12 PM
  async onRun(event, context) {
    const { reddit } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      await reddit.submitPost({
        title: `📊 MONTHLY LEADERBOARD UPDATE - ${month} Hall of Fame! 📊`,
        text: `# 🏆 ${month} Froggy Flight Hall of Fame 🏆

## 🥇 **Top Pilots This Month**

### 🎯 **Monthly Champions:**
*Leaderboard will be updated with actual player data*

### 🏅 **Achievement Highlights:**
- **🚀 Longest Flight:** *To be updated with actual data*
- **🎪 Most Bounces:** *To be updated with actual data*
- **⚡ Fastest Speed:** *To be updated with actual data*
- **✈️ Most Planes Avoided:** *To be updated with actual data*

### 🐸 **Personality Masters:**
- **🎭 Drama Queen Champion:** *To be updated*
- **🧘 Zen Master:** *To be updated*
- **🌪️ Chaos Creator:** *To be updated*
- **💤 Sleepy Success:** *To be updated*
- **💪 Confidence King/Queen:** *To be updated*
- **😰 Anxiety Overcomer:** *To be updated*
- **🤔 Philosophy Phenom:** *To be updated*
- **😤 Rebel Leader:** *To be updated*

### 🎨 **Special Achievements:**
- **🟡 Golden Plane Hunter:** Most super launches
- **🔴 Destroyer Survivor:** Avoided the most destroyer planes
- **🌈 Rainbow Master:** Most rainbow effects triggered
- **🦣 Giant Frog Expert:** Most giant frog launches
- **🐭 Tiny Frog Specialist:** Most tiny frog launches

## 📈 **Monthly Stats:**
- **Total Flights:** *To be calculated*
- **Total Distance:** *To be calculated*
- **Community Growth:** *To be calculated*
- **Most Active Day:** *To be calculated*

## 🎉 **Community Highlights:**
- **Most Helpful Player:** *Community voted*
- **Funniest Frog Quote:** *Community favorite*
- **Best Screenshot:** *Most upvoted*
- **Most Creative Strategy:** *Community choice*

## 🏆 **Next Month's Goals:**
- Reach new community milestones
- Discover new strategies together
- Support new pilots joining our community
- Continue having fun with our flying frogs!

Congratulations to all our amazing pilots! Keep flying and keep improving! 🚀🐸

---
*Leaderboard updated monthly. Keep playing to see your name here next month!*`,
        subredditName: subreddit.name,
      });

      console.log(`Monthly leaderboard posted for ${month}`);
    } catch (error) {
      console.error('Failed to post monthly leaderboard:', error);
    }
  },
});

// Weekend Fun Facts
Devvit.addSchedulerJob({
  name: 'weekendFunFacts',
  cron: '0 11 * * 6', // Every Saturday at 11 AM
  async onRun(event, context) {
    const { reddit } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      
      const funFacts = [
        {
          title: "🐸 Did You Know? Frog Physics!",
          fact: "Real frogs can jump up to 20 times their body length! Our game frogs are clearly overachievers.",
          tip: "Try to beat a real frog's jumping record in your next flight!"
        },
        {
          title: "✈️ Did You Know? Aviation History!",
          fact: "The Wright brothers' first flight lasted only 12 seconds. Your frog flights last much longer!",
          tip: "Honor aviation pioneers by avoiding those destroyer planes!"
        },
        {
          title: "🎮 Did You Know? Game Secrets!",
          fact: "Each frog personality has over 30 unique quotes programmed in!",
          tip: "Try playing with different personalities to hear all their hilarious comments!"
        },
        {
          title: "🌈 Did You Know? Special Effects!",
          fact: "Golden planes create rainbow effects that give bonus points AND look amazing!",
          tip: "Always aim for golden planes after building up speed!"
        },
        {
          title: "🎭 Did You Know? Personality Bonuses!",
          fact: "Rebellious frogs give the highest personality bonus at +55 points!",
          tip: "Embrace your inner rebel for maximum scoring potential!"
        }
      ];

      const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
      
      await reddit.submitPost({
        title: `🎉 WEEKEND FUN FACTS - ${randomFact.title} 🎉`,
        text: `# 🎪 Weekend Fun with Froggy Flight! 🎪

## 🤓 **${randomFact.title}**

### 📚 **Fun Fact:**
${randomFact.fact}

### 💡 **Pro Tip:**
${randomFact.tip}

## 🎮 **Weekend Challenge:**
Put this knowledge to use in your next flight! Share your results in the comments below.

## 🎯 **More Fun Facts:**

### 🐸 **About Frogs:**
- Frogs have been around for over 200 million years
- They can see in almost every direction at once
- Some frogs can freeze solid and thaw out alive!
- Our game frogs are clearly the most advanced evolution

### ✈️ **About Flying:**
- Birds inspired the first airplane designs
- Modern planes can fly higher than Mount Everest
- The fastest plane ever built could fly at 2,193 mph
- Our game planes are much more colorful though!

### 🎨 **About Game Design:**
- The low-poly art style is called "voxel art"
- Each plane type has unique physics properties
- The environment changes as you play longer
- Every frog quote is hand-written for maximum humor!

## 🎊 **Weekend Activities:**
- Try to discover a new frog personality
- Challenge friends to beat your score
- Take screenshots of beautiful moments
- Share your funniest frog quotes

Have a fantastic weekend, pilots! Keep those frogs flying! 🚀🐸

---
*New fun facts every weekend! Learn something new while having fun!*`,
        subredditName: subreddit.name,
      });

      console.log('Weekend fun facts posted');
    } catch (error) {
      console.error('Failed to post weekend fun facts:', error);
    }
  },
});

export default Devvit;
