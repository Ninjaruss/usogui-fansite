import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchType } from './dto/search-query.dto';

describe('SearchController', () => {
  let controller: SearchController;
  let service: SearchService;

  const mockSearchService = {
    search: jest.fn(),
    getSuggestions: jest.fn(),
    getContentTypes: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('should return search results', async () => {
      const searchQuery = {
        query: 'Baku',
        type: SearchType.ALL,
        userProgress: 15,
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        results: [
          {
            id: 1,
            type: 'character',
            title: 'Baku Madarame',
            description: 'Professional gambler',
            score: 1.0,
            hasSpoilers: false,
            slug: 'character-1',
            metadata: {},
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockSearchService.search.mockResolvedValue(expectedResult);

      const result = await controller.search(searchQuery);

      expect(result).toEqual(expectedResult);
      expect(service.search).toHaveBeenCalledWith(searchQuery);
    });
  });

  describe('getSuggestions', () => {
    it('should return suggestions for valid query', async () => {
      const query = 'Baku';
      const expectedSuggestions = ['Baku Madarame', 'Bakudan'];

      mockSearchService.getSuggestions.mockResolvedValue(expectedSuggestions);

      const result = await controller.getSuggestions(query);

      expect(result).toEqual(expectedSuggestions);
      expect(service.getSuggestions).toHaveBeenCalledWith(query);
    });

    it('should return empty array for short query', async () => {
      const result = await controller.getSuggestions('B');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty query', async () => {
      const result = await controller.getSuggestions('');
      expect(result).toEqual([]);
    });
  });

  describe('getContentTypes', () => {
    it('should return content types with counts', async () => {
      const expectedTypes = [
        { type: 'chapters', count: 541 },
        { type: 'characters', count: 150 },
        { type: 'events', count: 89 },
        { type: 'arcs', count: 12 },
      ];

      mockSearchService.getContentTypes.mockResolvedValue(expectedTypes);

      const result = await controller.getContentTypes();

      expect(result).toEqual(expectedTypes);
      expect(service.getContentTypes).toHaveBeenCalled();
    });
  });
});
