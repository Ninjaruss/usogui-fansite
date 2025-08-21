import { Test, TestingModule } from '@nestjs/testing';
import { ArcsController } from './arcs.controller';

describe('ArcsController', () => {
  let controller: ArcsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArcsController],
    }).compile();

    controller = module.get<ArcsController>(ArcsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
