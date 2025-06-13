import { Devvit } from '@devvit/public-api';

// COMMUNITY INTERACTION FEATURES

// User Flair Management
Devvit.addMenuItem({
  label: '🏷️ Manage User Flairs 🏷️',
  location: 'subreddit',
  forUserType: 'moderator',
  async onPress(event, context) {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      
      // Create flair templates for different achievements
      const flairTemplates = [
        { text: '🏆 Frog Flight Champion', cssClass: 'champion' },
        { text: '🥇 Tournament Winner', cssClass: 'tournament-winner' },
        { text: '🎭 Drama Queen Master', cssClass: 'drama-master' },
        { text: '🧘 Zen Master', cssClass: 'zen-master' },
        { text: '🌪️ Chaos Creator', cssClass: 'chaos-creator' },
        { text: '💤 Sleepy Pilot', cssClass: 'sleepy-pilot' },
        { text: '💪 Ace Pilot', cssClass: 'ace-pilot' },
        { text: '😰 Brave Heart', cssClass: 'brave-heart' },
        { text: '🤔 Philosopher', cssClass: 'philosopher' },
        { text: '😤 Rebel Pilot', cssClass: 'rebel-pilot' },
        { text: '🛩️ Elite Pilot', cssClass: 'elite-pilot' },
        { text: '🎮 Community Helper', cssClass: 'community-helper' },
        { text: '📸 Screenshot Master', cssClass: 'screenshot-master' },
        { text: '🎬 Video Creator', cssClass: 'video-creator' },
        { text: '🎯 High Scorer', cssClass: 'high-scorer' },
        { text: '🌟 Rising Star', cssClass: 'rising-star' },
        { text: '🎪 Fun Master', cssClass: 'fun-master' },
        { text: '🚀 Distance King', cssClass: 'distance-king' },
        { text: '👑 Distance Queen', cssClass: 'distance-queen' },
        { text: '🎨 Creative Pilot', cssClass: 'creative-pilot' }
      ];

      ui.showToast({ text: '🏷️ Flair templates ready for assignment! 🏷️' });
      
    } catch (error) {
      ui.showToast({ 
        text: `Failed to setup flairs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  },
});

// Community Events Calendar
Devvit.addMenuItem({
  label: '📅 Events Calendar 📅',
  location: 'subreddit',
  forUserType: 'moderator',
  async onPress(event, context) {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      
      const post = await reddit.submitPost({
        title: '📅 FROGGY FLIGHT COMMUNITY EVENTS CALENDAR 📅',
        text: `# 🎉 Froggy Flight Community Events! 🎉

## 📅 **Recurring Events Schedule**

### 🗓️ **Daily Events:**
- **9:00 AM:** New Daily Challenge Posted
- **All Day:** Community Showcase Submissions
- **Evening:** Moderator Score Verification

### 📊 **Weekly Events:**

#### **Monday - Motivational Monday** 💪
- Share comeback stories and improvement journeys
- "From Zero to Hero" pilot spotlights
- Beginner tips and encouragement

#### **Tuesday - Technique Tuesday** 🎯
- Strategy discussions and advanced tips
- Plane-dodging masterclasses
- Frog personality deep dives

#### **Wednesday - Wacky Wednesday** 🤪
- Funniest frog quotes compilation
- Weirdest crash stories
- Chaotic frog appreciation day

#### **Thursday - Throwback Thursday** 📸
- Share your first successful flight
- "Remember when..." community memories
- Evolution of your piloting skills

#### **Friday - Feature Friday** ⭐
- Spotlight specific frog personalities
- Community member features
- Developer insights and behind-the-scenes

#### **Saturday - Screenshot Saturday** 📷
- Beautiful game captures contest
- Artistic moment sharing
- Visual storytelling with screenshots

#### **Sunday - Social Sunday** 👥
- Tag friends and play together
- Community building activities
- Relaxed discussion and fun

### 🏆 **Monthly Events:**

#### **First Week - Tournament Launch** 🎪
- New monthly tournament begins
- Special themed challenges
- Community goal setting

#### **Second Week - Mid-Month Madness** 🌪️
- Chaos-themed events
- Random challenges and surprises
- Community voting on favorites

#### **Third Week - Mastery Week** 🎓
- Advanced strategy workshops
- Expert player AMAs
- Skill-building challenges

#### **Fourth Week - Community Celebration** 🎉
- Monthly achievements recognition
- Community highlights compilation
- Planning for next month

### 🎊 **Special Events:**

#### **Seasonal Celebrations** 🌟
- **Spring:** Frog Awakening Festival
- **Summer:** High-Flying Championships
- **Fall:** Harvest of Scores Event
- **Winter:** Cozy Cockpit Challenges

#### **Milestone Events** 🚀
- Community member milestones
- Subreddit growth celebrations
- Game update launch parties
- Anniversary celebrations

#### **Themed Weeks** 🎭
- **Personality Week:** Focus on one frog type
- **Plane Week:** Master different plane types
- **Newcomer Week:** Welcome new pilots
- **Veteran Week:** Honor experienced players

## 🎯 **How to Participate:**

### 📝 **Event Participation:**
1. Check the calendar daily for new events
2. Join discussions in event posts
3. Share your experiences and screenshots
4. Support other community members
5. Have fun and be respectful!

### 🏅 **Earning Recognition:**
- Participate regularly in events
- Help other community members
- Share quality content and screenshots
- Show good sportsmanship
- Contribute to positive community atmosphere

### 🎮 **Event Rewards:**
- **Participation Badges:** For joining events
- **Achievement Flairs:** For completing challenges
- **Community Recognition:** Featured posts and mentions
- **Special Privileges:** Early access to new features

## 📢 **Event Announcements:**

### 🔔 **Stay Updated:**
- Follow this subreddit for daily posts
- Check pinned posts for current events
- Join event discussion threads
- Set Reddit notifications for important updates

### 📱 **Community Channels:**
- **Main Game Posts:** For gameplay and scores
- **Event Posts:** For specific challenges and contests
- **Showcase Posts:** For sharing achievements
- **Discussion Posts:** For strategy and community chat

## 🎪 **Upcoming Special Events:**

### 🎯 **This Month:**
- **Week 1:** New Player Welcome Week
- **Week 2:** Personality Mastery Challenge
- **Week 3:** Screenshot Contest
- **Week 4:** Community Choice Awards

### 🚀 **Next Month Preview:**
- **Major Tournament:** Cross-community championship
- **New Features:** Game updates and improvements
- **Community Milestones:** Celebrating our growth
- **Special Guests:** Developer Q&A sessions

## 🤝 **Community Guidelines:**

### ✅ **Event Etiquette:**
- Be supportive and encouraging
- Celebrate others' achievements
- Share constructive feedback
- Keep discussions on-topic
- Follow Reddit and subreddit rules

### 🎯 **Fair Play:**
- No cheating or exploiting
- Honest score reporting
- Respectful competition
- Help newcomers learn
- Report any issues to moderators

Join us for an amazing journey through the skies with our flying frogs! Every pilot is welcome, from beginners to masters! 🛩️🐸

---
*Calendar updated monthly. Suggest new events in the comments below!*`,
        subredditName: subreddit.name,
      });

      ui.showToast({ text: '📅 Events Calendar Created! 📅' });
      await ui.navigateTo(post.url);
    } catch (error) {
      ui.showToast({ 
        text: `Failed to create calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  },
});

// Community Rules and Guidelines
Devvit.addMenuItem({
  label: '📋 Community Rules 📋',
  location: 'subreddit',
  forUserType: 'moderator',
  async onPress(event, context) {
    const { reddit, ui } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      
      const post = await reddit.submitPost({
        title: '📋 FROGGY FLIGHT COMMUNITY RULES & GUIDELINES 📋',
        text: `# 🛩️ Welcome to Froggy Flight Community! 🛩️

## 🎯 **Our Mission**
To create a fun, supportive, and engaging community where pilots of all skill levels can enjoy launching frogs into the sky together!

## 📜 **Community Rules**

### 1️⃣ **Be Respectful and Kind** 🤝
- Treat all community members with respect
- No harassment, bullying, or toxic behavior
- Celebrate others' achievements, don't put them down
- Help newcomers learn and improve
- Keep discussions constructive and positive

### 2️⃣ **Stay On-Topic** 🎮
- Posts should be related to Froggy Flight
- Game discussions, screenshots, and strategies welcome
- Off-topic posts may be removed
- Use appropriate post flairs when available

### 3️⃣ **No Cheating or Exploiting** ⚖️
- Play the game fairly and honestly
- Report any bugs or exploits to moderators
- Don't use external tools to manipulate scores
- Honest competition makes it fun for everyone

### 4️⃣ **Quality Content** ⭐
- Share meaningful screenshots and videos
- Provide context for your posts
- Avoid spam or repetitive content
- Put effort into your contributions

### 5️⃣ **Follow Reddit Rules** 📱
- Adhere to Reddit's site-wide rules
- No doxxing, brigading, or vote manipulation
- Respect intellectual property
- Report rule violations to moderators

## 🎮 **Gameplay Guidelines**

### 🏆 **Score Sharing:**
- Screenshots encouraged for high scores
- Be honest about your achievements
- Celebrate personal bests, not just records
- Help others improve their gameplay

### 🐸 **Frog Personalities:**
- All frog personalities are welcome and valued
- Share funny quotes and moments
- Don't discriminate based on frog type
- Embrace the diversity of our amphibian pilots!

### ✈️ **Strategy Discussions:**
- Share tips and tricks openly
- Credit others for their strategies
- Be patient with learning players
- Constructive criticism only

## 🎪 **Community Events**

### 📅 **Event Participation:**
- Join events voluntarily and have fun
- Follow specific event rules
- Be a good sport in competitions
- Support other participants

### 🏅 **Contests and Challenges:**
- Participate fairly and honestly
- Respect judges' decisions
- Congratulate winners graciously
- Learn from challenges and improve

## 🛠️ **Moderation**

### 👮 **Moderator Actions:**
- Warnings for minor rule violations
- Temporary bans for repeated offenses
- Permanent bans for serious violations
- Appeals process available for all actions

### 📢 **Reporting:**
- Report rule violations using Reddit's report system
- Message moderators for serious issues
- Provide context and evidence when possible
- Don't take justice into your own hands

## 🎯 **Content Guidelines**

### ✅ **Encouraged Content:**
- Gameplay screenshots and videos
- Strategy guides and tips
- Funny frog quotes and moments
- Community discussions and questions
- Achievement celebrations
- Helpful tutorials and guides

### ❌ **Discouraged Content:**
- Spam or repetitive posts
- Off-topic discussions
- Negative or toxic comments
- Cheating or exploit discussions
- Personal attacks or harassment
- Unrelated memes or content

## 🌟 **Community Values**

### 🤝 **Inclusivity:**
- Welcome pilots of all skill levels
- Support diversity in our community
- Create a safe space for everyone
- Encourage participation from all members

### 🎉 **Fun First:**
- Remember this is a game - have fun!
- Don't take competition too seriously
- Laugh at funny moments and failures
- Enjoy the journey, not just the destination

### 📈 **Growth Mindset:**
- Learn from mistakes and failures
- Help others improve their skills
- Share knowledge and experiences
- Celebrate progress and improvement

## 🎁 **Community Benefits**

### 🏷️ **Flairs and Recognition:**
- Earn flairs through participation and achievements
- Get recognized for helpful contributions
- Special badges for community milestones
- Featured posts for exceptional content

### 🎪 **Exclusive Events:**
- Community-only tournaments and challenges
- Early access to new features
- Developer interactions and Q&As
- Special themed events and celebrations

## 📞 **Contact Information**

### 👥 **Moderator Team:**
- Available for questions and concerns
- Response time: Usually within 24 hours
- Open to feedback and suggestions
- Here to help make the community better

### 💬 **Community Feedback:**
- Suggest new events and features
- Report bugs and issues
- Share ideas for improvement
- Help shape our community's future

## 🚀 **Getting Started**

### 🆕 **New Pilots:**
1. Read these rules and guidelines
2. Play the game and get familiar with mechanics
3. Join daily challenges and events
4. Share your first successful flight!
5. Ask questions - we're here to help!

### 🎯 **Veteran Pilots:**
1. Welcome and mentor new players
2. Share advanced strategies and tips
3. Participate in community events
4. Help maintain positive atmosphere
5. Lead by example in following rules

Remember: We're all here to have fun launching frogs into the sky! Let's build an amazing community together! 🛩️🐸

---
*Rules updated regularly. Questions? Contact the moderator team!*`,
        subredditName: subreddit.name,
      });

      ui.showToast({ text: '📋 Community Rules Posted! 📋' });
      await ui.navigateTo(post.url);
    } catch (error) {
      ui.showToast({ 
        text: `Failed to create rules: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  },
});

export default Devvit;
