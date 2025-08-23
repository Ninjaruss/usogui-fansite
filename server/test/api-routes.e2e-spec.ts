import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../src/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/entities/user.entity';
import { Series } from '../src/entities/series.entity';
import { Arc } from '../src/entities/arc.entity';
import { Chapter } from '../src/entities/chapter.entity';
import { Character } from '../src/entities/character.entity';
import { Faction } from '../src/entities/faction.entity';
import { Event } from '../src/entities/event.entity';
import { Tag } from '../src/entities/tag.entity';
import { Volume } from '../src/entities/volume.entity';
import { ChapterSpoiler } from '../src/entities/chapter-spoiler.entity';
import * as bcrypt from 'bcrypt';

describe('API Routes (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;
  let userToken: string;
  
  // Test data to be used and cleaned up
  const testIds: Record<string, number | null> = {
    series: null,
    arc: null,
    chapter: null,
    character: null,
    faction: null,
    event: null,
    tag: null,
    volume: null,
    chapterSpoiler: null
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true, 
      forbidNonWhitelisted: true 
    }));
    
    await app.init();
    
    jwtService = app.get<JwtService>(JwtService);
    const userRepository = app.get(getRepositoryToken(User));
    
    // Create test admin user in the database
    const hashedPassword = await bcrypt.hash('admintest123', 10);
    const testAdmin = await userRepository.save({
      username: 'testadmin',
      email: 'testadmin@example.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isEmailVerified: true
    });
    
    // Create test regular user
    const testRegularUser = await userRepository.save({
      username: 'testuser',
      email: 'testuser@example.com',
      password: hashedPassword,
      role: UserRole.USER,
      isEmailVerified: true
    });
    
    // Create JWT tokens for testing with real user IDs
    adminToken = jwtService.sign({ 
      sub: testAdmin.id, 
      username: testAdmin.username,
      role: testAdmin.role
    });
    
    userToken = jwtService.sign({ 
      sub: testRegularUser.id, 
      username: testRegularUser.username,
      role: testRegularUser.role
    });
    
    // Seed test data directly through repositories
    await seedTestData();
  });

  afterAll(async () => {
    // Clean up the test data
    await cleanupTestData();
    
    // Clean up test users
    const userRepository = app.get(getRepositoryToken(User));
    await userRepository.delete({ username: 'testadmin' });
    await userRepository.delete({ username: 'testuser' });
    
    await app.close();
  });

  // Helper function to seed test data directly through repositories
  async function seedTestData() {
    // Get repositories
    const seriesRepo = app.get(getRepositoryToken(Series));
    const arcRepo = app.get(getRepositoryToken(Arc));
    const chapterRepo = app.get(getRepositoryToken(Chapter));
    const characterRepo = app.get(getRepositoryToken(Character));
    const factionRepo = app.get(getRepositoryToken(Faction));
    const eventRepo = app.get(getRepositoryToken(Event));
    const tagRepo = app.get(getRepositoryToken(Tag));
    const volumeRepo = app.get(getRepositoryToken(Volume));
    
    // Create a test series
    const series = await seriesRepo.save({
      name: 'Test Series',
      description: 'A test series for e2e testing',
      order: 1
    });
    testIds.series = series.id;
    
    // Create a test arc
    const arc = await arcRepo.save({
      name: 'Test Arc',
      description: 'A test arc for e2e testing',
      series: series,
      startChapter: 1,
      endChapter: 10
    });
    testIds.arc = arc.id;
    
    // Create a test chapter
    const chapter = await chapterRepo.save({
      title: 'Test Chapter',
      number: 1,
      series: series,
      arc: arc
    });
    testIds.chapter = chapter.id;
    
    // Create a test character
    const character = await characterRepo.save({
      name: 'Test Character',
      description: 'A test character for e2e testing',
      series: series,
      occupation: 'Testing'
    });
    testIds.character = character.id;
    
    // Create a test faction
    const faction = await factionRepo.save({
      name: 'Test Faction',
      description: 'A test faction for e2e testing',
      series: series
    });
    testIds.faction = faction.id;
    
    // Create a test event
    const event = await eventRepo.save({
      title: 'Test Event',
      description: 'A test event for e2e testing',
      series: series,
      startChapter: 1,
      endChapter: 5
    });
    testIds.event = event.id;
    
    // Create a test tag
    const tag = await tagRepo.save({
      name: 'Test Tag',
      description: 'A test tag for e2e testing'
    });
    testIds.tag = tag.id;
    
    // Create a test volume
    const volume = await volumeRepo.save({
      number: 1,
      title: 'Test Volume',
      series: series,
      startChapter: 1,
      endChapter: 5
    });
    testIds.volume = volume.id;
  }

  // Helper function to clean up test data directly through repositories
  async function cleanupTestData() {
    // Clean up in reverse order to avoid foreign key constraints
    const chapterSpoilerRepo = app.get(getRepositoryToken(ChapterSpoiler));
    if (testIds.chapterSpoiler) {
      await chapterSpoilerRepo.delete(testIds.chapterSpoiler);
    }
    
    const characterRepo = app.get(getRepositoryToken(Character));
    if (testIds.character) {
      await characterRepo.delete(testIds.character);
    }
    
    const chapterRepo = app.get(getRepositoryToken(Chapter));
    if (testIds.chapter) {
      await chapterRepo.delete(testIds.chapter);
    }
    
    const arcRepo = app.get(getRepositoryToken(Arc));
    if (testIds.arc) {
      await arcRepo.delete(testIds.arc);
    }
    
    const volumeRepo = app.get(getRepositoryToken(Volume));
    if (testIds.volume) {
      await volumeRepo.delete(testIds.volume);
    }
    
    const eventRepo = app.get(getRepositoryToken(Event));
    if (testIds.event) {
      await eventRepo.delete(testIds.event);
    }
    
    const factionRepo = app.get(getRepositoryToken(Faction));
    if (testIds.faction) {
      await factionRepo.delete(testIds.faction);
    }
    
    const tagRepo = app.get(getRepositoryToken(Tag));
    if (testIds.tag) {
      await tagRepo.delete(testIds.tag);
    }
    
    const seriesRepo = app.get(getRepositoryToken(Series));
    if (testIds.series) {
      await seriesRepo.delete(testIds.series);
    }
  }

  // Series Module Tests
  describe('Series', () => {
    it('(GET) /series - should return series list', () => {
      return request(app.getHttpServer())
        .get('/series')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(Array.isArray(res.body.data)).toBeTruthy();
        });
    });

    it('(POST) /series - should create a new series', () => {
      return request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Series',
          description: 'A test series for e2e testing',
          order: 1
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          testIds.series = res.body.id;
        });
    });

    it('(GET) /series/:id - should return series by id', () => {
      return request(app.getHttpServer())
        .get(`/series/${testIds.series}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id', testIds.series);
          expect(res.body).toHaveProperty('name', 'Test Series');
        });
    });

    it('(POST) /series - should reject unauthorized users', () => {
      return request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Unauthorized Series',
          description: 'This should be rejected due to user role'
        })
        .expect(403);
    });
  });

  // Arc Module Tests
  describe('Arcs', () => {
    it('(GET) /arcs - should return arcs list', () => {
      return request(app.getHttpServer())
        .get('/arcs')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(Array.isArray(res.body.data)).toBeTruthy();
        });
    });

    it('(POST) /arcs - should create a new arc', () => {
      return request(app.getHttpServer())
        .post('/arcs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Arc 2',
          description: 'A test arc for e2e testing',
          seriesId: testIds.series,
          order: 2,
          startChapter: 11,
          endChapter: 20
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
        });
    });

    it('(GET) /arcs/:id - should return arc by id', () => {
      return request(app.getHttpServer())
        .get(`/arcs/${testIds.arc}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id', testIds.arc);
          expect(res.body).toHaveProperty('name', 'Test Arc');
        });
    });
  });

  // Chapter Module Tests
  describe('Chapters', () => {
    it('(GET) /chapters - should return chapters list', () => {
      return request(app.getHttpServer())
        .get('/chapters')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(Array.isArray(res.body.data)).toBeTruthy();
        });
    });

    it('(POST) /chapters - should create a new chapter', () => {
      return request(app.getHttpServer())
        .post('/chapters')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Chapter 2',
          number: 2,
          seriesId: testIds.series,
          arcId: testIds.arc
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
        });
    });

    it('(GET) /chapters/:id - should return chapter by id', () => {
      return request(app.getHttpServer())
        .get(`/chapters/${testIds.chapter}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id', testIds.chapter);
          expect(res.body).toHaveProperty('title', 'Test Chapter');
        });
    });
  });

  // Character Module Tests
  describe('Characters', () => {
    it('(GET) /characters - should return characters list', () => {
      return request(app.getHttpServer())
        .get('/characters')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(Array.isArray(res.body.data)).toBeTruthy();
        });
    });

    it('(POST) /characters - should create a new character', () => {
      return request(app.getHttpServer())
        .post('/characters')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Character 2',
          description: 'A test character for e2e testing',
          seriesId: testIds.series,
          occupation: 'Testing'
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
        });
    });

    it('(GET) /characters/:id - should return character by id', () => {
      return request(app.getHttpServer())
        .get(`/characters/${testIds.character}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id', testIds.character);
          expect(res.body).toHaveProperty('name', 'Test Character');
        });
    });
  });

  // Faction Module Tests
  describe('Factions', () => {
    it('(GET) /factions - should return factions list', () => {
      return request(app.getHttpServer())
        .get('/factions')
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBeTruthy();
        });
    });

    it('(POST) /factions - should create a new faction', () => {
      return request(app.getHttpServer())
        .post('/factions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Faction 2',
          description: 'A test faction for e2e testing',
          seriesId: testIds.series
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
        });
    });

    it('(GET) /factions/:id - should return faction by id', () => {
      return request(app.getHttpServer())
        .get(`/factions/${testIds.faction}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id', testIds.faction);
          expect(res.body).toHaveProperty('name', 'Test Faction');
        });
    });
  });

  // Event Module Tests
  describe('Events', () => {
    it('(GET) /events - should return events list', () => {
      return request(app.getHttpServer())
        .get('/events')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(Array.isArray(res.body.data)).toBeTruthy();
        });
    });

    it('(POST) /events - should create a new event', () => {
      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Event 2',
          description: 'A test event for e2e testing',
          seriesId: testIds.series,
          startChapter: 6,
          endChapter: 10
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
        });
    });

    it('(GET) /events/:id - should return event by id', () => {
      return request(app.getHttpServer())
        .get(`/events/${testIds.event}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id', testIds.event);
          expect(res.body).toHaveProperty('title', 'Test Event');
        });
    });
  });

  // Tag Module Tests
  describe('Tags', () => {
    it('(GET) /tags - should return tags list', () => {
      return request(app.getHttpServer())
        .get('/tags')
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBeTruthy();
        });
    });

    it('(POST) /tags - should create a new tag', () => {
      const uniqueTagName = `Test Tag ${Date.now()}`;
      return request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: uniqueTagName,
          description: 'A test tag for e2e testing'
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
        });
    });

    it('(GET) /tags/:id - should return tag by id', () => {
      return request(app.getHttpServer())
        .get(`/tags/${testIds.tag}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id', testIds.tag);
          expect(res.body).toHaveProperty('name', 'Test Tag');
        });
    });
  });

  // Volume Module Tests
  describe('Volumes', () => {
    it('(GET) /volumes - should return volumes list', () => {
      return request(app.getHttpServer())
        .get('/volumes')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.items)).toBeTruthy();
        });
    });

    it('(POST) /volumes - should create a new volume', () => {
      return request(app.getHttpServer())
        .post('/volumes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          number: 2,
          title: 'Test Volume 2',
          description: 'A test volume for e2e testing',
          seriesId: testIds.series,
          startChapter: 6,
          endChapter: 10
          // Removed releaseDate as it's not in the DTO
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
        });
    });

    it('(GET) /volumes/:id - should return volume by id', () => {
      return request(app.getHttpServer())
        .get(`/volumes/${testIds.volume}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id', testIds.volume);
          expect(res.body).toHaveProperty('title', 'Test Volume');
        });
    });
  });

  // Users Module Tests
  describe('Users', () => {
    it('(GET) /users/profile - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });
  });

  // Auth Module Tests
  describe('Auth', () => {
    it('(POST) /auth/login - should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('(POST) /auth/register - should register a new user', () => {
      const uniqueUsername = `newtestuser${Date.now()}`;
      const uniqueEmail = `newtestuser${Date.now()}@example.com`;
      
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: uniqueUsername,
          email: uniqueEmail,
          password: 'password123'
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('message');
          // Clean up the newly created user
          const userRepository = app.get(getRepositoryToken(User));
          return userRepository.delete({ username: uniqueUsername });
        });
    });
  });
});
