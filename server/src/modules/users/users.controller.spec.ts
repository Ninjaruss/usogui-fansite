import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { BadgesService } from '../badges/badges.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByUsername: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            updateProfile: jest.fn(),
            changeEmail: jest.fn(),
            changePassword: jest.fn(),
          },
        },
        {
          provide: BadgesService,
          useValue: {
            findAllBadges: jest.fn(),
            awardBadge: jest.fn(),
            revokeBadge: jest.fn(),
            updateCustomRole: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
