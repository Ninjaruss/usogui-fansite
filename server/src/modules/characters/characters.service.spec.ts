import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Organization } from '../../entities/organization.entity';
import { PageViewsService } from '../page-views/page-views.service';
import { MediaService } from '../media/media.service';
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';

const mockCharacter = {
  id: 1,
  name: 'Baku Madarame',
  isVerified: false,
  verifiedById: null,
  verifiedAt: null,
};

const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockEditLogService = {
  logCreate: jest.fn(),
  logUpdate: jest.fn(),
  logDelete: jest.fn(),
  findLastMajorEdit: jest.fn(),
};

describe('CharactersService', () => {
  let service: CharactersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        { provide: getRepositoryToken(Character), useValue: mockRepo },
        { provide: getRepositoryToken(Gamble), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(Organization), useValue: { find: jest.fn() } },
        { provide: PageViewsService, useValue: { recordView: jest.fn(), getCount: jest.fn() } },
        { provide: MediaService, useValue: { findByOwner: jest.fn() } },
        { provide: EditLogService, useValue: mockEditLogService },
      ],
    }).compile();

    service = module.get<CharactersService>(CharactersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verify()', () => {
    it('throws NotFoundException when character does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.verify(99, 1, false)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when non-admin verifies their own major edit', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockCharacter });
      mockEditLogService.findLastMajorEdit.mockResolvedValue({ userId: 5 });
      await expect(service.verify(1, 5, false)).rejects.toThrow(ForbiddenException);
    });

    it('allows verify when there is no prior major edit', async () => {
      const saved = { ...mockCharacter, isVerified: true, verifiedById: 3, verifiedAt: new Date() };
      mockRepo.findOne.mockResolvedValue({ ...mockCharacter });
      mockEditLogService.findLastMajorEdit.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue(saved);
      const result = await service.verify(1, 3, false);
      expect(result.isVerified).toBe(true);
      expect(result.verifiedById).toBe(3);
    });

    it('allows a different moderator to verify', async () => {
      const saved = { ...mockCharacter, isVerified: true, verifiedById: 7, verifiedAt: new Date() };
      mockRepo.findOne.mockResolvedValue({ ...mockCharacter });
      mockEditLogService.findLastMajorEdit.mockResolvedValue({ userId: 5 });
      mockRepo.save.mockResolvedValue(saved);
      const result = await service.verify(1, 7, false);
      expect(result.isVerified).toBe(true);
    });

    it('allows admin to verify their own edit', async () => {
      const saved = { ...mockCharacter, isVerified: true, verifiedById: 5, verifiedAt: new Date() };
      mockRepo.findOne.mockResolvedValue({ ...mockCharacter });
      mockRepo.save.mockResolvedValue(saved);
      const result = await service.verify(1, 5, true); // isAdmin=true
      expect(result.isVerified).toBe(true);
      expect(mockEditLogService.findLastMajorEdit).not.toHaveBeenCalled();
    });
  });
});
