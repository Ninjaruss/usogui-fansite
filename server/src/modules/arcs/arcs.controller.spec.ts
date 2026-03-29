import { Test, TestingModule } from '@nestjs/testing';
import { ArcsController } from './arcs.controller';
import { ArcsService } from './arcs.service';
import { CloudflareR2Service } from '../../services/cloudflare-r2.service';

describe('ArcsController', () => {
  let controller: ArcsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArcsController],
      providers: [
        {
          provide: ArcsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: CloudflareR2Service,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getSignedUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ArcsController>(ArcsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
