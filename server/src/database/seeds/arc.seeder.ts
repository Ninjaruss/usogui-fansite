import { DataSource } from 'typeorm';
import { Arc } from '../../entities/arc.entity';
import { Seeder } from './seeder.interface';

export class ArcSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const arcRepository = this.dataSource.getRepository(Arc);

    const initialArcs = [
      {
        name: 'Introduction Arc',
        order: 0,
        description:
          "Introduction to the world of underground gambling and Baku Madarame's unique abilities. This arc establishes the foundation of the story, introducing key characters, the concept of lie detection, and the dangerous nature of high-stakes gambling.",
        startChapter: 1,
        endChapter: 10,
      },
      {
        name: 'Kakerou Initiation Arc',
        order: 1,
        description:
          "Baku's formal introduction to the Kakerou organization and its complex hierarchy. He learns about the rules, consequences, and opportunities within this underground gambling syndicate.",
        startChapter: 11,
        endChapter: 25,
      },
      {
        name: 'First Tournament Arc',
        order: 2,
        description:
          'Baku participates in his first major tournament, facing skilled opponents and learning the true depths of psychological warfare in gambling. Alliance formations and betrayals shape the narrative.',
        startChapter: 26,
        endChapter: 45,
      },
      {
        name: 'Protoporos Arc',
        order: 3,
        description:
          "A complex gambling game involving mathematical strategy and psychological manipulation. This arc showcases the intellectual depth of the story's games.",
        startChapter: 46,
        endChapter: 65,
      },
      {
        name: 'Character Development Arc',
        order: 4,
        description:
          'Focus on character backstories and relationships. Key character motivations are revealed, and the bonds between allies are tested and strengthened.',
        startChapter: 66,
        endChapter: 85,
      },
      {
        name: 'High Stakes Tournament Arc',
        order: 5,
        description:
          'A major tournament with life-or-death consequences. Multiple factions compete, and the stakes reach unprecedented levels.',
        startChapter: 86,
        endChapter: 120,
      },
    ];

    // Create arcs with chapter numbers
    for (const arcData of initialArcs) {
      const existingArc = await arcRepository.findOne({
        where: {
          name: arcData.name,
        },
      });

      if (!existingArc) {
        const arc = arcRepository.create({
          name: arcData.name,
          order: arcData.order,
          description: arcData.description,
          startChapter: arcData.startChapter,
          endChapter: arcData.endChapter,
        });
        await arcRepository.save(arc);
      }
    }
  }
}
