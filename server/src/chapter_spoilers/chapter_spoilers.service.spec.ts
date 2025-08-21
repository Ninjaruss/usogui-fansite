import { Test, TestingModule } from '@nestjs/testing';
import { ChapterSpoilersService } from './chapter_spoilers.service';

describe('ChapterSpoilersService', () => {
  let service: ChapterSpoilersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChapterSpoilersService],
    }).compile();

    service = module.get<ChapterSpoilersService>(ChapterSpoilersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
