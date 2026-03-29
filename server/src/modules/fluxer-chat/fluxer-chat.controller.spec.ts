import { Test, TestingModule } from '@nestjs/testing';
import { FluxerChatController } from './fluxer-chat.controller';
import { FluxerChatService } from './fluxer-chat.service';

const mockFluxerChatService = {
  getMessages: jest.fn(),
  getAnnouncement: jest.fn(),
  sendMessage: jest.fn(),
};

describe('FluxerChatController', () => {
  let controller: FluxerChatController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FluxerChatController],
      providers: [{ provide: FluxerChatService, useValue: mockFluxerChatService }],
    }).compile();

    controller = module.get<FluxerChatController>(FluxerChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getMessages delegates to service', async () => {
    const messages = [{ id: '1', content: 'hi', timestamp: '2026-01-01T00:00:00Z', author: { id: 'u1', username: 'Baku', avatar: null } }];
    mockFluxerChatService.getMessages.mockResolvedValue(messages);
    expect(await controller.getMessages()).toEqual(messages);
    expect(mockFluxerChatService.getMessages).toHaveBeenCalled();
  });

  it('getAnnouncement returns null when none exists', async () => {
    mockFluxerChatService.getAnnouncement.mockResolvedValue(null);
    expect(await controller.getAnnouncement()).toBeNull();
  });
});
