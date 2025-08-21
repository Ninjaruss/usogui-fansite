import { Test, TestingModule } from '@nestjs/testing';
import { ArcsService } from './arcs.service';

describe('ArcsService', () => {
  let service: ArcsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArcsService],
    }).compile();

    service = module.get<ArcsService>(ArcsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
