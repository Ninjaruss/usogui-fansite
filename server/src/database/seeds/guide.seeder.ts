import { DataSource } from 'typeorm';
import { Guide, GuideStatus } from '../../entities/guide.entity';
import { GuideLike } from '../../entities/guide-like.entity';
import { User } from '../../entities/user.entity';
import { Tag } from '../../entities/tag.entity';
import { Seeder } from './seeder.interface';

export class GuideSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const guideRepository = this.dataSource.getRepository(Guide);
    const guideLikeRepository = this.dataSource.getRepository(GuideLike);
    const userRepository = this.dataSource.getRepository(User);
    const tagRepository = this.dataSource.getRepository(Tag);

    // Get existing users for guide authorship
    const users = await userRepository.find();
    if (users.length === 0) {
      console.log('No users found. Please run UserSeeder first.');
      return;
    }

    // Get or create tags for guides
    const guideTags = [
      { name: 'strategy', description: 'Strategic gameplay and analysis' },
      { name: 'poker', description: 'Poker-related content' },
      { name: 'psychology', description: 'Psychological aspects of gambling' },
      { name: 'character-analysis', description: 'Character analysis and development' },
      { name: 'game-rules', description: 'Game rules and mechanics' },
      { name: 'theory', description: 'Theoretical concepts and frameworks' }
    ];

    const savedTags: Tag[] = [];
    for (const tagData of guideTags) {
      let tag = await tagRepository.findOne({ where: { name: tagData.name } });
      if (!tag) {
        tag = tagRepository.create(tagData);
        tag = await tagRepository.save(tag);
      }
      savedTags.push(tag);
    }

    // Sample guide data
    const guideData = [
      {
        title: 'Mastering Poker Psychology in Usogui',
        description: 'A comprehensive guide to understanding the psychological warfare that defines poker in the Usogui universe. Learn how Baku and other masters read their opponents.',
        content: `# Mastering Poker Psychology in Usogui

## Introduction

In the world of Usogui, poker isn't just a card game—it's a battlefield of minds where the slightest tell can mean the difference between life and death. This guide explores the psychological tactics used by master gamblers like Baku Madarame.

## Key Concepts

### 1. The Art of Reading Tells

Physical tells are the most obvious form of psychological information:
- Micro-expressions lasting fractions of a second
- Changes in breathing patterns
- Subtle shifts in posture
- Hand movements and finger positioning

### 2. Emotional Control

Master gamblers maintain absolute emotional control:
- Never show excitement when holding strong hands
- Maintain the same demeanor regardless of hand strength
- Use breathing techniques to control heart rate
- Practice meditation to achieve mental clarity

### 3. Misdirection and Bluffing

Advanced bluffing techniques:
- Creating false tells to mislead opponents
- Varying betting patterns to confuse reads
- Using reverse psychology to induce specific actions
- Timing bets for maximum psychological impact

## Practical Applications

### Example 1: The Baku Method
When Baku sits at a poker table, he immediately begins cataloging every detail about his opponents...

### Example 2: Counter-Psychology
Sometimes the best strategy is to let opponents think they've read you correctly...

## Conclusion

Mastering poker psychology requires years of practice and keen observation. Start with basic tell recognition and gradually develop your own unique style.`,
        status: GuideStatus.PUBLISHED,
        tagNames: ['poker', 'psychology', 'strategy', 'advanced']
      },
      {
        title: 'Understanding Game Theory in Gambling',
        description: 'An introduction to game theory principles and how they apply to various gambling scenarios in Usogui. Perfect for beginners looking to understand the mathematical foundations.',
        content: `# Understanding Game Theory in Gambling

## What is Game Theory?

Game theory is the mathematical study of strategic decision-making between rational players. In gambling, this translates to understanding optimal plays and predicting opponent behavior.

## Basic Concepts

### Nash Equilibrium
A state where no player can improve their outcome by unilaterally changing their strategy.

### Expected Value
The average outcome of a decision when repeated many times:
\`\`\`
EV = (Probability of Win × Win Amount) - (Probability of Loss × Loss Amount)
\`\`\`

### Risk vs Reward
Every gambling decision involves weighing potential gains against potential losses.

## Application in Usogui

### The Protoporos Game
This unique game demonstrates pure game theory in action...

### Poker Applications
Game theory optimal (GTO) play in poker...

## Exercises

Try calculating the expected value for these scenarios:
1. A coin flip bet with 2:1 odds
2. A poker hand with 30% chance to win a $100 pot

Remember: The house always has an edge, but understanding game theory helps you minimize losses and maximize wins when you do have an advantage.`,
        status: GuideStatus.PUBLISHED,
        tagNames: ['theory', 'game-rules', 'beginner', 'strategy']
      },
      {
        title: 'Character Analysis: Baku Madarame',
        description: 'A deep dive into the psychology and methods of Usogui\'s protagonist. Explore what makes Baku such a formidable gambler and strategist.',
        content: `# Character Analysis: Baku Madarame

## The Death God of Gambling

  Baku Madarame, known as the "Death God," represents the pinnacle of gambling mastery in the Usogui universe. This analysis explores his methods, psychology, and evolution throughout the story.

## Core Characteristics

### Absolute Confidence
Baku's most defining trait is his unwavering confidence:
- Never shows doubt, even in impossible situations
- Uses confidence as a weapon to intimidate opponents
- Maintains composure under extreme pressure

### Analytical Mind
His approach to gambling is highly analytical:
- Observes every detail of opponents and environment
- Calculates probabilities and odds instantly
- Adapts strategies based on new information

### Risk Tolerance
Baku's relationship with risk is unique:
- Willing to bet his life on games
- Sees death as just another stake
- Uses extreme risk to maximize psychological pressure

## Famous Strategies

### The Lie Detection Method
Baku has developed sophisticated techniques for detecting lies...

### Psychological Warfare
His ability to get inside opponents' heads...

### Adaptive Gameplay
How Baku modifies his approach based on the opponent...

## Evolution Throughout the Story

From his early appearances to the final arcs, Baku's character development shows...

## Lessons for Real Gambling

While we can't all be Baku, there are practical lessons:
- Maintain emotional control
- Study your opponents carefully
- Never bet more than you can afford to lose
- Confidence is a powerful tool, but back it with skill

## Conclusion

Baku Madarame represents the idealized gambler—one who combines mathematical precision with psychological insight and absolute fearlessness.`,
        status: GuideStatus.PUBLISHED,
        tagNames: ['character-analysis', 'psychology', 'strategy', 'advanced']
      },
      {
        title: 'Beginner\'s Guide to Kakerou Rules',
        description: 'Everything you need to know about the Kakerou organization and its unique gambling rules. A must-read for newcomers to the Usogui universe.',
        content: `# Beginner's Guide to Kakerou Rules

## What is Kakerou?

Kakerou is the underground gambling organization that serves as the primary setting for most of Usogui's gambling battles. Understanding its rules and structure is essential for following the story.

## Basic Structure

### Membership
- Regular members
- Referees
- Executives
- The Leader

### Ranking System
Kakerou operates on a strict hierarchy...

## Game Rules

### Standard Procedures
All Kakerou games follow certain protocols:
1. Games must be overseen by official referees
2. All participants must agree to stakes beforehand
3. Cheating is allowed if undetected
4. Disputes are resolved by referee judgment

### Common Game Types
- Card games (poker, blackjack variants)
- Dice games
- Unique Kakerou-exclusive games
- Death games (highest stakes)

## The Referee System

Referees are crucial to maintaining order:
- Must remain impartial
- Can make binding decisions
- Responsible for game integrity
- Often former high-level gamblers

## Notable Locations

### Tower of Kakerou
The organization's headquarters...

### Underground Venues
Various secret gambling locations...

## Joining Kakerou

Requirements and processes for membership...

## Safety Considerations

While Kakerou games are fictional, remember:
- Real gambling can be addictive
- Never bet money you can't afford to lose
- Seek help if gambling becomes a problem

This is entertainment, not a guide to real gambling!`,
        status: GuideStatus.PUBLISHED,
        tagNames: ['beginner', 'game-rules', 'theory']
      },
      {
        title: 'Draft: Advanced Bluffing Techniques',
        description: 'Work in progress - exploring advanced bluffing strategies used by master gamblers. This guide is still being developed.',
        content: `# Advanced Bluffing Techniques (DRAFT)

## Introduction

This guide will cover advanced bluffing techniques... (work in progress)

## Basic Concepts

- What is a bluff?
- When to bluff
- Reading opponent tendencies

## Advanced Techniques

(To be completed)

## Examples

(Need to add specific examples from the story)

## Conclusion

(Draft - needs completion)`,
        status: GuideStatus.DRAFT,
        tagNames: ['strategy', 'poker', 'advanced']
      }
    ];

    // Create guides
    for (let i = 0; i < guideData.length; i++) {
      const data = guideData[i];
      const author = users[i % users.length]; // Cycle through available users

      // Check if guide already exists
      const existingGuide = await guideRepository.findOne({
        where: { title: data.title }
      });

      if (!existingGuide) {
        // Get tags for this guide
        const guideTags = savedTags.filter(tag => 
          data.tagNames.includes(tag.name)
        );

        const guide = guideRepository.create({
          title: data.title,
          description: data.description,
          content: data.content,
          status: data.status,
          authorId: author.id,
          viewCount: Math.floor(Math.random() * 500) + 10, // Random view count
          likeCount: 0, // Will be set by likes
          tags: guideTags
        });

        const savedGuide = await guideRepository.save(guide);

        // Create some likes for published guides
        if (data.status === GuideStatus.PUBLISHED) {
          const likeCount = Math.floor(Math.random() * Math.min(users.length, 15)) + 2;
          const likingUsers = users
            .filter(user => user.id !== author.id) // Don't let authors like their own guides
            .sort(() => 0.5 - Math.random()) // Shuffle
            .slice(0, likeCount); // Take random subset

          for (const user of likingUsers) {
            const existingLike = await guideLikeRepository.findOne({
              where: { guideId: savedGuide.id, userId: user.id }
            });

            if (!existingLike) {
              const guideLike = guideLikeRepository.create({
                guideId: savedGuide.id,
                userId: user.id
              });
              await guideLikeRepository.save(guideLike);
            }
          }

          // Update like count
          await guideRepository.update(savedGuide.id, { 
            likeCount: likingUsers.length 
          });
        }

        console.log(`Created guide: ${data.title} by ${author.username}`);
      } else {
        console.log(`Guide already exists: ${data.title}`);
      }
    }
  }
}
