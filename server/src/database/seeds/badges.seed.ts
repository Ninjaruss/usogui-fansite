import { DataSource } from 'typeorm';
import { Badge, BadgeType } from '../../entities/badge.entity';

export async function seedBadges(dataSource: DataSource): Promise<void> {
  const badgeRepository = dataSource.getRepository(Badge);

  // Check if badges already exist
  const existingBadges = await badgeRepository.count();
  if (existingBadges > 0) {
    console.log('Badges already exist, skipping seed...');
    return;
  }

  const badges = [
    {
      name: 'Supporter',
      description: 'Awarded to supporters who have made a donation',
      type: BadgeType.SUPPORTER,
      icon: '💎',
      color: '#FFD700',
      backgroundColor: '#1A1A1A',
      displayOrder: 1,
      isActive: true,
      isManuallyAwardable: false,
    },
    {
      name: 'Active Supporter',
      description: 'Active supporter with donation in the last year',
      type: BadgeType.ACTIVE_SUPPORTER,
      icon: '⭐',
      color: '#00FF00',
      backgroundColor: '#0D1B2A',
      displayOrder: 2,
      isActive: true,
      isManuallyAwardable: false,
    },
    {
      name: 'Sponsor',
      description: 'Generous sponsor with $25+ in total donations',
      type: BadgeType.SPONSOR,
      icon: '👑',
      color: '#FF6B35',
      backgroundColor: '#2D1B69',
      displayOrder: 3,
      isActive: true,
      isManuallyAwardable: false,
    },
    {
      name: 'Community Hero',
      description: 'Outstanding contribution to the community',
      type: BadgeType.CUSTOM,
      icon: '🏆',
      color: '#FFA500',
      backgroundColor: '#8B0000',
      displayOrder: 10,
      isActive: true,
      isManuallyAwardable: true,
    },
    {
      name: 'Beta Tester',
      description: 'Helped test new features',
      type: BadgeType.CUSTOM,
      icon: '🧪',
      color: '#9370DB',
      backgroundColor: '#191970',
      displayOrder: 11,
      isActive: true,
      isManuallyAwardable: true,
    },
    {
      name: 'Content Creator',
      description: 'Created exceptional guides or content',
      type: BadgeType.CUSTOM,
      icon: '✍️',
      color: '#20B2AA',
      backgroundColor: '#2F4F4F',
      displayOrder: 12,
      isActive: true,
      isManuallyAwardable: true,
    },
  ];

  await badgeRepository.save(badges);
  console.log(`Seeded ${badges.length} badges`);
}
