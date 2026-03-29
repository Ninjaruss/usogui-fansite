import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ArcsService } from './arcs.service';
import { Arc } from '../../entities/arc.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Gamble } from '../../entities/gamble.entity';
import { MediaService } from '../media/media.service';
import { EditLogService } from '../edit-log/edit-log.service';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  })),
};

describe('ArcsService', () => {
  let service: ArcsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArcsService,
        { provide: getRepositoryToken(Arc), useValue: mockRepo },
        { provide: getRepositoryToken(Chapter), useValue: mockRepo },
        { provide: getRepositoryToken(Gamble), useValue: mockRepo },
        { provide: MediaService, useValue: { findByEntity: jest.fn() } },
        { provide: EditLogService, useValue: { logEdit: jest.fn(), create: jest.fn() } },
      ],
    }).compile();

    service = module.get<ArcsService>(ArcsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
