import { DataSource } from 'typeorm';
import { Gamble } from '../../entities/gamble.entity';
import { GambleCharacter } from '../../entities/gamble-character.entity';
import { GambleRound } from '../../entities/gamble-round.entity';
import { Character } from '../../entities/character.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Seeder } from './seeder.interface';

export class GambleSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const gambleRepository = this.dataSource.getRepository(Gamble);
    const participantRepository =
      this.dataSource.getRepository(GambleCharacter);
    const roundRepository = this.dataSource.getRepository(GambleRound);
    const characterRepository = this.dataSource.getRepository(Character);
    const chapterRepository = this.dataSource.getRepository(Chapter);

    // Get characters for gamble associations
    const baku = await characterRepository.findOne({
      where: { name: 'Baku Madarame' },
    });

    const marco = await characterRepository.findOne({
      where: { name: 'Marco Reiji' },
    });

    // Get chapter references by chapter number (not ID)
    const chapter1 = await chapterRepository.findOne({ where: { number: 1 } });
    const chapter5 = await chapterRepository.findOne({ where: { number: 5 } });
    const chapter10 = await chapterRepository.findOne({ where: { number: 10 } });
    const chapter15 = await chapterRepository.findOne({ where: { number: 15 } });

    // Create gambles with proper chapter ID references
    const gambles = [
      {
        name: 'Protoporos',
        rules:
          'A game involving removing stones from piles. Players take turns removing any number of stones from a single pile. The objective varies depending on the specific variant being played.',
        winCondition:
          'The player who is forced to take the last stone loses the game.',
        chapterId: chapter1?.id || 1, // Use actual chapter ID or fallback
        hasTeams: false,
        observers: [],
      },
      {
        name: 'Poker Tournament',
        rules:
          "Standard Texas Hold'em poker with high stakes. Each player receives two hole cards and must make the best five-card hand using any combination of their hole cards and the community cards.",
        winCondition:
          'The player with the best hand at showdown wins the pot. The tournament continues until one player has all the chips.',
        chapterId: chapter5?.id || 1, // Use actual chapter ID or fallback
        hasTeams: false,
        observers: [],
      },
      {
        name: 'Russian Roulette Variant',
        rules:
          'A deadly variant of Russian Roulette using a special mechanism. Players take turns with specific rules that determine the outcome based on psychological and strategic elements.',
        winCondition:
          'Survive all rounds while maintaining psychological advantage over opponents.',
        chapterId: chapter10?.id || 1, // Use actual chapter ID or fallback
        hasTeams: false,
        observers: [],
      },
      {
        name: 'Card Matching Game',
        rules:
          'A complex card game involving memory, strategy, and psychological manipulation. Players must match cards while predicting opponent moves.',
        winCondition:
          'First player to achieve the target score or eliminate all opponents wins.',
        chapterId: chapter15?.id || 1, // Use actual chapter ID or fallback
        hasTeams: false,
        observers: [],
      },
    ];

    for (const gambleData of gambles) {
      let existingGamble = await gambleRepository.findOne({
        where: { name: gambleData.name },
      });

      if (!existingGamble) {
        existingGamble = await gambleRepository.save(gambleData);

        // Create participants for this gamble
        if (baku) {
          await participantRepository.save({
            gamble: existingGamble,
            character: baku,
            isWinner: true,
            stake: 'High stakes bet - Winner takes all',
          });
        }

        if (marco) {
          await participantRepository.save({
            gamble: existingGamble,
            character: marco,
            isWinner: false,
            stake: 'Reputation and territorial rights',
          });
        }

        // Create rounds for this gamble
        const rounds = [
          {
            roundNumber: 1,
            gamble: existingGamble,
            outcome: `Baku wins the first round of ${gambleData.name} through strategic play`,
            reward: 'Advancement to next round',
            penalty: 'None',
          },
          {
            roundNumber: 2,
            gamble: existingGamble,
            outcome: `Marco makes a comeback in round 2 using psychological tactics`,
            reward: 'Equalizes the score',
            penalty: 'Baku loses momentum',
          },
          {
            roundNumber: 3,
            gamble: existingGamble,
            outcome: `Final round won by Baku with a brilliant strategic move`,
            reward: 'Victory and all stakes',
            penalty: 'Marco forfeits his stake',
          },
        ];

        for (const roundData of rounds) {
          await roundRepository.save(roundData);
        }
      }
    }
  }
}
