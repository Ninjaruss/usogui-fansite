import { Test, TestingModule } from '@nestjs/testing';
import { ChapterSpoilersController } from './chapter-spoilers.controller';

describe('ChapterSpoilersController', () => {
  let controller: ChapterSpoilersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChapterSpoilersController],
    }).compile();

    controller = module.get<ChapterSpoilersController>(ChapterSpoilersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
