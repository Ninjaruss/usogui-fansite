import { DataSource } from 'typeorm';
import { User } from '../../entities/user.entity';
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
        isAdmin: true,
        isVerified: true
      });
    }

    // Create a test user
    const existingTestUser = await userRepository.findOne({
      where: { email: 'test@example.com' }
    });

    if (!existingTestUser) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      
      await userRepository.save({
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        isAdmin: false,
        isVerified: true
      });
    }
  }
}
