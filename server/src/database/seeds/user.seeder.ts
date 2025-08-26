import { DataSource } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { Seeder } from './seeder.interface';
import * as bcrypt from 'bcrypt';

export class UserSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@usogui-fansite.com' }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await userRepository.save({
        email: 'admin@usogui-fansite.com',
        username: 'admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isEmailVerified: true,
        userProgress: 50 // Admin has read up to chapter 50
      });

      console.log('✅ Admin user created');
    }

    // Create a moderator user
    const existingModerator = await userRepository.findOne({
      where: { email: 'moderator@usogui-fansite.com' }
    });

    if (!existingModerator) {
      const hashedPassword = await bcrypt.hash('mod123', 10);
      
      await userRepository.save({
        email: 'moderator@usogui-fansite.com',
        username: 'moderator',
        password: hashedPassword,
        role: UserRole.MODERATOR,
        isEmailVerified: true,
        userProgress: 30 // Moderator has read up to chapter 30
      });

      console.log('✅ Moderator user created');
    }

    // Create test users with different reading progress levels
    const testUsers = [
      {
        email: 'test@example.com',
        username: 'testuser',
        password: 'test123',
        role: UserRole.USER,
        userProgress: 15 // New reader
      },
      {
        email: 'reader@example.com',
        username: 'avid_reader',
        password: 'reader123',
        role: UserRole.USER,
        userProgress: 42 // Caught up reader
      },
      {
        email: 'newbie@example.com',
        username: 'manga_newbie',
        password: 'newbie123',
        role: UserRole.USER,
        userProgress: 5 // Just started
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await userRepository.findOne({
        where: { email: userData.email }
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        await userRepository.save({
          email: userData.email,
          username: userData.username,
          password: hashedPassword,
          role: userData.role,
          isEmailVerified: true,
          userProgress: userData.userProgress
        });

        console.log(`✅ Test user created: ${userData.username} (progress: ${userData.userProgress})`);
      }
    }
  }
}
