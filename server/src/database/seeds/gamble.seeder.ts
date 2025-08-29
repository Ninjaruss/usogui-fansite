import { DataSource } from 'typeorm';
import { Gamble } from '../../entities/gamble.entity';
import { GambleCharacter } from '../../entities/gamble-character.entity';
import { GambleRound } from '../../entities/gamble-round.entity';
import { Character } from '../../entities/character.entity';
import { Seeder } from './seeder.interface';

export class GambleSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const gambleRepository = this.dataSource.getRepository(Gamble);
    const participantRepository = this.dataSource.getRepository(GambleCharacter);
    const roundRepository = this.dataSource.getRepository(GambleRound);
    const characterRepository = this.dataSource.getRepository(Character);

    // Get characters for gamble associations
    const baku = await characterRepository.findOne({
      where: { name: 'Baku Madarame'}
    });

    const marco = await characterRepository.findOne({
      where: { name: 'Marco Reiji'}
    });

    // Create gambles
    const gambles = [
      {
        name: 'Protoporos',
        rules: 'A game involving removing stones from piles. Players take turns removing any number of stones from a single pile. The objective varies depending on the specific variant being played.',
        winCondition: 'The player who is forced to take the last stone loses the game.',
        chapterId: 1,
        hasTeams: false,
        observers: []
      },
      {
        name: 'Poker Tournament',
        rules: 'Standard Texas Hold\'em poker with high stakes. Each player receives two hole cards and must make the best five-card hand using any combination of their hole cards and the community cards.',
        winCondition: 'The player with the best hand at showdown wins the pot. The tournament continues until one player has all the chips.',
        chapterId: 5,
        hasTeams: false,
        observers: []
      },
      {
        name: 'Russian Roulette Variant',
        rules: 'A deadly variant of Russian Roulette using a special mechanism. Players take turns with specific rules that determine the outcome based on psychological and strategic elements.',
        winCondition: 'Survive all rounds while maintaining psychological advantage over opponents.',
        chapterId: 10,
        hasTeams: false,
        observers: []
      },
      {
        name: 'Card Matching Game',
        rules: 'A complex card game involving memory, strategy, and psychological manipulation. Players must match cards while predicting opponent moves.',
        winCondition: 'First player to achieve the target score or eliminate all opponents wins.',
        chapterId: 15,
        hasTeams: false,
        observers: []
      }
    ];

    for (const gambleData of gambles) {
      let existingGamble = await gambleRepository.findOne({
        where: { name: gambleData.name }
      });

      if (!existingGamble) {
        existingGamble = await gambleRepository.save(gambleData);

        // Create participants for this gamble
        if (baku) {
          await participantRepository.save({
            gamble: existingGamble,
            character: baku,
            isWinner: true,
            stake: 'High stakes bet - Winner takes all'
          });
        }

        if (marco) {
          await participantRepository.save({
            gamble: existingGamble,
            character: marco,
            isWinner: false,
            stake: 'Reputation and territorial rights'
          });
        }

        // Create rounds for this gamble
        const rounds = [
          {
            roundNumber: 1,
            gamble: existingGamble,
            outcome: `Baku wins the first round of ${gambleData.name} through strategic play`,
            reward: 'Advancement to next round',
            penalty: 'None'
          },
          {
            roundNumber: 2,
            gamble: existingGamble,
            outcome: `Marco makes a comeback in round 2 using psychological tactics`,
            reward: 'Equalizes the score',
            penalty: 'Baku loses momentum'
          },
          {
            roundNumber: 3,
            gamble: existingGamble,
            outcome: `Final round won by Baku with a brilliant strategic move`,
            reward: 'Victory and all stakes',
            penalty: 'Marco forfeits his stake'
          }
        ];

        for (const roundData of rounds) {
          await roundRepository.save(roundData);
        }
      }
    }
  }
}
