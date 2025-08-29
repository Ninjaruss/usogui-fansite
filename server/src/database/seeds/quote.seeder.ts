import { DataSource } from 'typeorm';
import { Quote } from '../../entities/quote.entity';
import { Character } from '../../entities/character.entity';
import { User } from '../../entities/user.entity';
import { Seeder } from './seeder.interface';

export class QuoteSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const quoteRepository = this.dataSource.getRepository(Quote);
    const characterRepository = this.dataSource.getRepository(Character);
    const userRepository = this.dataSource.getRepository(User);

    const adminUser = await userRepository.findOne({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      console.log('Admin user not found. Please run UserSeeder first.');
      return;
    }

    // Get main characters
    const bakuCharacter = await characterRepository.findOne({
      where: { name: 'Baku Madarame'}
    });

    const marcoCharacter = await characterRepository.findOne({
      where: { name: 'Marco Reiji'}
    });

    if (!bakuCharacter || !marcoCharacter) {
      console.log('Characters not found. Please run CharacterSeeder first.');
      return;
    }

    const initialQuotes = [
      {
        text: 'The essence of gambling is not about winning or losing... it\'s about the thrill of the unknown.',
        chapterNumber: 1,
  description: 'Baku\'s philosophy on gambling introduced early in the story',
        pageNumber: 15,
        character: bakuCharacter,
        submittedBy: adminUser,
      },
      {
        text: 'A lie isn\'t necessarily a bad thing. Sometimes it\'s the kindest truth you can offer.',
        chapterNumber: 3,
        description: 'Baku explaining his perspective on deception',
        pageNumber: 22,
        character: bakuCharacter,
        submittedBy: adminUser,
      },
      {
        text: 'In the world of gambling, trust is the most dangerous bet you can make.',
        chapterNumber: 5,
        description: 'Marco\'s cynical view on trust in gambling',
        pageNumber: 8,
        character: marcoCharacter,
        submittedBy: adminUser,
      },
      {
        text: 'I don\'t gamble to win money. I gamble to understand people.',
        chapterNumber: 7,
        description: 'Baku revealing his deeper motivation for gambling',
        pageNumber: 34,
        character: bakuCharacter,
        submittedBy: adminUser,
      },
      {
        text: 'The moment you think you\'ve figured out the game is the moment you\'ve already lost.',
        chapterNumber: 12,
        description: 'Baku\'s warning about overconfidence',
        pageNumber: 19,
        character: bakuCharacter,
        submittedBy: adminUser,
      },
      {
        text: 'Every gambler has a tell. The trick is knowing when they\'re telling the truth.',
        chapterNumber: 15,
        description: 'Marco discussing the psychology of gambling',
        pageNumber: 41,
        character: marcoCharacter,
        submittedBy: adminUser,
      },
      {
        text: 'Fear and excitement... they\'re closer than most people realize.',
        chapterNumber: 20,
        description: 'Baku on the emotional aspects of high-stakes gambling',
        pageNumber: 27,
        character: bakuCharacter,
        submittedBy: adminUser,
      },
      {
        text: 'The house always wins? That\'s what they want you to believe.',
        chapterNumber: 25,
        description: 'Marco challenging conventional gambling wisdom',
        pageNumber: 12,
        character: marcoCharacter,
        submittedBy: adminUser,
      },
      {
        text: 'Sometimes the best move is the one that makes no sense to anyone else.',
        chapterNumber: 30,
        description: 'Baku\'s unpredictable strategic approach',
        pageNumber: 35,
        character: bakuCharacter,
        submittedBy: adminUser,
      },
      {
        text: 'In gambling, as in life, the only certainty is uncertainty.',
        chapterNumber: 35,
        description: 'Philosophical reflection during a tense gambling match',
        pageNumber: 45,
        character: bakuCharacter,
        submittedBy: adminUser,
      },
      {
        text: 'You can\'t bluff someone who has nothing left to lose.',
        chapterNumber: 40,
        description: 'Marco observing desperate opponents',
        pageNumber: 18,
        character: marcoCharacter,
        submittedBy: adminUser,
      },
      {
        text: 'The real game isn\'t about the cards you\'re dealt, but how you play them.',
        chapterNumber: 45,
        description: 'Baku\'s perspective on strategy over luck',
        pageNumber: 28,
        character: bakuCharacter,
        submittedBy: adminUser,
      },
    ];

    for (const quoteData of initialQuotes) {
      const existingQuote = await quoteRepository.findOne({
        where: { 
          text: quoteData.text,
          character: { id: quoteData.character.id }
        }
      });

      if (!existingQuote) {
        await quoteRepository.save(quoteData);
        console.log(`✅ Added quote: "${quoteData.text.substring(0, 50)}..." by ${quoteData.character.name}`);
      } else {
        console.log(`⏭️  Quote already exists: "${quoteData.text.substring(0, 50)}..."`);
      }
    }

    console.log('✅ Quote seeding completed');
  }
}
