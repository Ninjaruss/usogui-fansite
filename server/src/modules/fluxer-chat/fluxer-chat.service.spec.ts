import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { FluxerChatService } from './fluxer-chat.service';
import { FluxerAnnouncement } from '../../entities/fluxer-announcement.entity';
import { User } from '../../entities/user.entity';

const mockAnnouncementRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockUserRepo = {
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  }),
  update: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'FLUXER_BOT_TOKEN') return 'test-bot-token';
    if (key === 'FLUXER_CHAT_CHANNEL_ID') return '1234567890';
    return undefined;
  }),
};

describe('FluxerChatService', () => {
  let service: FluxerChatService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FluxerChatService,
        { provide: getRepositoryToken(FluxerAnnouncement), useValue: mockAnnouncementRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FluxerChatService>(FluxerChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('throws FLUXER_TOKEN_MISSING when user has no access token', async () => {
      mockUserRepo.createQueryBuilder().getOne.mockResolvedValue({ id: 1, fluxerId: 'f1', fluxerAccessToken: null });

      await expect(service.sendMessage(1, 'hello')).rejects.toThrow(ForbiddenException);
      await expect(service.sendMessage(1, 'hello')).rejects.toThrow('FLUXER_TOKEN_MISSING');
    });
  });
});
