import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { Quote, QuoteStatus } from '../../entities/quote.entity';
import { Character } from '../../entities/character.entity';

const mockQuoteRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
  })),
};

const mockCharacterRepo = { findOne: jest.fn() };

describe('QuotesService', () => {
  let service: QuotesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: getRepositoryToken(Quote), useValue: mockQuoteRepo },
        { provide: getRepositoryToken(Character), useValue: mockCharacterRepo },
      ],
    }).compile();
    service = module.get<QuotesService>(QuotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('approve()', () => {
    it('throws NotFoundException when quote not found', async () => {
      mockQuoteRepo.findOne.mockResolvedValue(null);
      await expect(service.approve(99)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when quote is not pending', async () => {
      mockQuoteRepo.findOne.mockResolvedValue({ id: 1, status: QuoteStatus.APPROVED });
      await expect(service.approve(1)).rejects.toThrow(BadRequestException);
    });

    it('approves a pending quote', async () => {
      const quote = { id: 1, status: QuoteStatus.PENDING };
      mockQuoteRepo.findOne.mockResolvedValue(quote);
      mockQuoteRepo.save.mockResolvedValue({ ...quote, status: QuoteStatus.APPROVED, rejectionReason: null });
      const result = await service.approve(1);
      expect(result.status).toBe(QuoteStatus.APPROVED);
    });
  });

  describe('reject()', () => {
    it('throws NotFoundException when quote not found', async () => {
      mockQuoteRepo.findOne.mockResolvedValue(null);
      await expect(service.reject(99, 'reason')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when quote is not pending', async () => {
      mockQuoteRepo.findOne.mockResolvedValue({ id: 1, status: QuoteStatus.APPROVED });
      await expect(service.reject(1, 'reason')).rejects.toThrow(BadRequestException);
    });

    it('rejects a pending quote with a reason', async () => {
      const quote = { id: 1, status: QuoteStatus.PENDING };
      mockQuoteRepo.findOne.mockResolvedValue(quote);
      mockQuoteRepo.save.mockResolvedValue({ ...quote, status: QuoteStatus.REJECTED, rejectionReason: 'Low quality' });
      const result = await service.reject(1, 'Low quality');
      expect(result.status).toBe(QuoteStatus.REJECTED);
      expect(result.rejectionReason).toBe('Low quality');
    });
  });
});
