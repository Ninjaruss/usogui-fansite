import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findAll(): Promise<User[]> {
    return this.repo.find({ relations: ['submittedEvents'] });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.repo.findOne({ where: { id }, relations: ['submittedEvents'] });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async update(id: number, data: Partial<User>) {
    const result = await this.repo.update(id, data);
    if (result.affected === 0) throw new NotFoundException(`User with ID ${id} not found`);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`User with ID ${id} not found`);
    return { deleted: true };
  }
}
