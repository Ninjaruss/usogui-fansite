# Role & Approval System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a consistent role/approval system where editors create/edit content (live immediately), moderators verify editorial changes and approve community submissions, and admins have exclusive control of volumes/users/badges.

**Architecture:** Three migrations add `isMinorEdit` to edit_log, verification columns to editorial entities, and a status workflow to quotes. Each editorial entity service gets a `verify()` method and a minor-edit flag on `update()`. The `@Roles()` guards on volumes and community submission approval endpoints are tightened.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, React Admin, Next.js 15

**Spec:** `docs/superpowers/specs/2026-03-27-role-approval-system-design.md`

---

## Task 1: Migration — isMinorEdit on edit_log + extend EditLogEntityType enum

**Files:**
- Create: `server/src/migrations/1743200000000-AddIsMinorEditAndEnumValues.ts`

- [ ] **Step 1: Create the migration file**

```typescript
// server/src/migrations/1743200000000-AddIsMinorEditAndEnumValues.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsMinorEditAndEnumValues1743200000000 implements MigrationInterface {
  name = 'AddIsMinorEditAndEnumValues1743200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new enum values to edit_log_entitytype_enum
    await queryRunner.query(`ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'tag'`);
    await queryRunner.query(`ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'character_relationship'`);
    await queryRunner.query(`ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'character_organization'`);

    // Add isMinorEdit column to edit_log table
    await queryRunner.query(`
      ALTER TABLE "edit_log"
      ADD COLUMN "isMinorEdit" BOOLEAN NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "edit_log" DROP COLUMN "isMinorEdit"`);
    // Note: PostgreSQL does not support removing enum values directly.
    // To remove TAG, CHARACTER_RELATIONSHIP, CHARACTER_ORGANIZATION values,
    // a full enum recreation would be required. Omitted for safety.
  }
}
```

- [ ] **Step 2: Run the migration**

```bash
cd server && yarn db:migrate
```

Expected: Migration `AddIsMinorEditAndEnumValues1743200000000` runs successfully with no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/migrations/1743200000000-AddIsMinorEditAndEnumValues.ts
git commit -m "feat(migration): add isMinorEdit to edit_log and extend EntityType enum"
```

---

## Task 2: Migration — verification columns on all editorial entity tables

**Files:**
- Create: `server/src/migrations/1743200000001-AddVerificationColumnsToEditorialEntities.ts`

- [ ] **Step 1: Create the migration file**

```typescript
// server/src/migrations/1743200000001-AddVerificationColumnsToEditorialEntities.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationColumnsToEditorialEntities1743200000001 implements MigrationInterface {
  name = 'AddVerificationColumnsToEditorialEntities1743200000001';

  private readonly tables = [
    'character',
    'arc',
    'gamble',
    'chapter',
    'organization',
    'tag',
    'character_relationship',
    'character_organization',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN "verifiedById" INTEGER REFERENCES "user"("id") ON DELETE SET NULL,
        ADD COLUMN "verifiedAt" TIMESTAMP
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        DROP COLUMN IF EXISTS "isVerified",
        DROP COLUMN IF EXISTS "verifiedById",
        DROP COLUMN IF EXISTS "verifiedAt"
      `);
    }
  }
}
```

- [ ] **Step 2: Run the migration**

```bash
cd server && yarn db:migrate
```

Expected: All 8 tables gain `isVerified`, `verifiedById`, `verifiedAt` columns.

- [ ] **Step 3: Commit**

```bash
git add server/src/migrations/1743200000001-AddVerificationColumnsToEditorialEntities.ts
git commit -m "feat(migration): add verification columns to editorial entities"
```

---

## Task 3: Migration — QuoteStatus workflow on quote table

**Files:**
- Create: `server/src/migrations/1743200000002-AddQuoteStatusWorkflow.ts`

- [ ] **Step 1: Create the migration file**

```typescript
// server/src/migrations/1743200000002-AddQuoteStatusWorkflow.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuoteStatusWorkflow1743200000002 implements MigrationInterface {
  name = 'AddQuoteStatusWorkflow1743200000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "quote_status_enum" AS ENUM ('pending', 'approved', 'rejected')
    `);
    await queryRunner.query(`
      ALTER TABLE "quote"
      ADD COLUMN "status" "quote_status_enum" NOT NULL DEFAULT 'pending',
      ADD COLUMN "rejectionReason" VARCHAR(500)
    `);
    // Approve all existing quotes so they stay visible
    await queryRunner.query(`UPDATE "quote" SET "status" = 'approved'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quote" DROP COLUMN "rejectionReason"`);
    await queryRunner.query(`ALTER TABLE "quote" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "quote_status_enum"`);
  }
}
```

- [ ] **Step 2: Run the migration**

```bash
cd server && yarn db:migrate
```

Expected: `quote` table gains `status` (default 'pending') and `rejectionReason`. All existing quotes are set to 'approved'.

- [ ] **Step 3: Commit**

```bash
git add server/src/migrations/1743200000002-AddQuoteStatusWorkflow.ts
git commit -m "feat(migration): add status workflow to quotes"
```

---

## Task 4: EditLog entity + service — add isMinorEdit

**Files:**
- Modify: `server/src/entities/edit-log.entity.ts`
- Modify: `server/src/modules/edit-log/edit-log.service.ts`

- [ ] **Step 1: Add isMinorEdit to the EditLog entity**

In `server/src/entities/edit-log.entity.ts`, add these three new enum values to `EditLogEntityType` and the `isMinorEdit` column to the entity. Also add TAG, CHARACTER_RELATIONSHIP, CHARACTER_ORGANIZATION to the enum:

```typescript
export enum EditLogEntityType {
  CHARACTER = 'character',
  GAMBLE = 'gamble',
  ARC = 'arc',
  ORGANIZATION = 'organization',
  EVENT = 'event',
  GUIDE = 'guide',
  MEDIA = 'media',
  ANNOTATION = 'annotation',
  CHAPTER = 'chapter',
  TAG = 'tag',
  CHARACTER_RELATIONSHIP = 'character_relationship',
  CHARACTER_ORGANIZATION = 'character_organization',
}
```

Add after the `changedFields` column declaration (around line 68):

```typescript
  @ApiPropertyOptional({ description: 'Whether this edit was marked as a minor change' })
  @Column({ default: false })
  isMinorEdit: boolean;
```

- [ ] **Step 2: Update EditLogService — add isMinorEdit to logEdit and logUpdate, add findLastMajorEdit**

In `server/src/modules/edit-log/edit-log.service.ts`, find the private `logEdit` method and update it to accept `isMinorEdit`:

```typescript
  private async logEdit(
    entityType: EditLogEntityType,
    entityId: number,
    action: EditLogAction,
    userId: number,
    changedFields?: string[],
    isMinorEdit = false,
  ): Promise<EditLog> {
    const editLog = this.editLogRepository.create({
      entityType,
      entityId,
      action,
      userId,
      changedFields: changedFields || null,
      isMinorEdit,
    });
    return await this.editLogRepository.save(editLog);
  }
```

Update `logUpdate` to pass through `isMinorEdit`:

```typescript
  async logUpdate(
    entityType: EditLogEntityType,
    entityId: number,
    userId: number,
    changedFields: string[],
    isMinorEdit = false,
  ): Promise<EditLog> {
    return this.logEdit(entityType, entityId, EditLogAction.UPDATE, userId, changedFields, isMinorEdit);
  }
```

Add the new `findLastMajorEdit` method at the end of the service (before the closing brace):

```typescript
  async findLastMajorEdit(
    entityType: EditLogEntityType,
    entityId: number,
  ): Promise<EditLog | null> {
    return this.editLogRepository.findOne({
      where: {
        entityType,
        entityId,
        action: EditLogAction.UPDATE,
        isMinorEdit: false,
      },
      order: { createdAt: 'DESC' },
    });
  }
```

- [ ] **Step 3: Build to verify no TypeScript errors**

```bash
cd server && yarn build
```

Expected: Compiles successfully with no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/entities/edit-log.entity.ts server/src/modules/edit-log/edit-log.service.ts
git commit -m "feat(edit-log): add isMinorEdit flag and findLastMajorEdit method"
```

---

## Task 5: Characters — isMinorEdit on update + verify endpoint

**Files:**
- Modify: `server/src/entities/character.entity.ts`
- Modify: `server/src/modules/characters/characters.service.ts`
- Modify: `server/src/modules/characters/characters.controller.ts`
- Modify: `server/src/modules/characters/characters.service.spec.ts`

- [ ] **Step 1: Add verification columns to the Character entity**

In `server/src/entities/character.entity.ts`, add these imports at the top (add `ManyToOne`, `JoinColumn` to existing typeorm imports if not present):

```typescript
import { ManyToOne, JoinColumn } from 'typeorm'; // add to existing typeorm import
import { User } from './user.entity'; // add if not already imported
```

Add these columns after the existing `updatedAt` column:

```typescript
  @ApiProperty({ description: 'Whether this character page has been verified by a moderator' })
  @Column({ default: false })
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'ID of the moderator who last verified this page' })
  @Column({ nullable: true })
  verifiedById: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @ApiPropertyOptional({ description: 'When this page was last verified' })
  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;
```

- [ ] **Step 2: Write failing tests for verify() in characters.service.spec.ts**

Replace the contents of `server/src/modules/characters/characters.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Organization } from '../../entities/organization.entity';
import { PageViewsService } from '../page-views/page-views.service';
import { MediaService } from '../media/media.service';
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';

const mockCharacter = {
  id: 1,
  name: 'Baku Madarame',
  isVerified: false,
  verifiedById: null,
  verifiedAt: null,
};

const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockEditLogService = {
  logCreate: jest.fn(),
  logUpdate: jest.fn(),
  logDelete: jest.fn(),
  findLastMajorEdit: jest.fn(),
};

describe('CharactersService', () => {
  let service: CharactersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        { provide: getRepositoryToken(Character), useValue: mockRepo },
        { provide: getRepositoryToken(Gamble), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(Organization), useValue: { find: jest.fn() } },
        { provide: PageViewsService, useValue: { recordView: jest.fn(), getCount: jest.fn() } },
        { provide: MediaService, useValue: { findByOwner: jest.fn() } },
        { provide: EditLogService, useValue: mockEditLogService },
      ],
    }).compile();

    service = module.get<CharactersService>(CharactersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verify()', () => {
    it('throws NotFoundException when character does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.verify(99, 1, false)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when non-admin verifies their own major edit', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockCharacter });
      mockEditLogService.findLastMajorEdit.mockResolvedValue({ userId: 5 });
      await expect(service.verify(1, 5, false)).rejects.toThrow(ForbiddenException);
    });

    it('allows verify when there is no prior major edit', async () => {
      const saved = { ...mockCharacter, isVerified: true, verifiedById: 3, verifiedAt: new Date() };
      mockRepo.findOne.mockResolvedValue({ ...mockCharacter });
      mockEditLogService.findLastMajorEdit.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue(saved);
      const result = await service.verify(1, 3, false);
      expect(result.isVerified).toBe(true);
      expect(result.verifiedById).toBe(3);
    });

    it('allows a different moderator to verify', async () => {
      const saved = { ...mockCharacter, isVerified: true, verifiedById: 7, verifiedAt: new Date() };
      mockRepo.findOne.mockResolvedValue({ ...mockCharacter });
      mockEditLogService.findLastMajorEdit.mockResolvedValue({ userId: 5 });
      mockRepo.save.mockResolvedValue(saved);
      const result = await service.verify(1, 7, false);
      expect(result.isVerified).toBe(true);
    });

    it('allows admin to verify their own edit', async () => {
      const saved = { ...mockCharacter, isVerified: true, verifiedById: 5, verifiedAt: new Date() };
      mockRepo.findOne.mockResolvedValue({ ...mockCharacter });
      mockRepo.save.mockResolvedValue(saved);
      const result = await service.verify(1, 5, true); // isAdmin=true
      expect(result.isVerified).toBe(true);
      expect(mockEditLogService.findLastMajorEdit).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 3: Run tests — they should fail (verify() not yet implemented)**

```bash
cd server && yarn test src/modules/characters/characters.service.spec.ts
```

Expected: Tests fail with "service.verify is not a function" or similar.

- [ ] **Step 4: Update CharactersService — add isMinorEdit to update() and add verify()**

In `server/src/modules/characters/characters.service.ts`, update the `update` method signature:

```typescript
  async update(
    id: number,
    updateCharacterDto: UpdateCharacterDto,
    userId: number,
    isMinorEdit = false,
  ): Promise<Character> {
    const character = await this.repo.findOne({ where: { id } });
    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    const { organizationIds: _ignored, ...characterData } = updateCharacterDto;
    Object.assign(character, characterData);
    if (!isMinorEdit) {
      character.isVerified = false;
      character.verifiedById = null;
      character.verifiedAt = null;
    }
    const saved = await this.repo.save(character);
    const changedFields = Object.keys(characterData).filter(
      (k) => characterData[k as keyof typeof characterData] !== undefined,
    );
    await this.editLogService.logUpdate(
      EditLogEntityType.CHARACTER,
      id,
      userId,
      changedFields,
      isMinorEdit,
    );
    return saved;
  }
```

Add the `verify` method after `update` (add `ForbiddenException` to the imports from `@nestjs/common`):

```typescript
  async verify(id: number, verifierId: number, isAdmin: boolean): Promise<Character> {
    const character = await this.repo.findOne({ where: { id } });
    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    if (!isAdmin) {
      const lastEdit = await this.editLogService.findLastMajorEdit(
        EditLogEntityType.CHARACTER,
        id,
      );
      if (lastEdit && lastEdit.userId === verifierId) {
        throw new ForbiddenException('You cannot verify your own edit');
      }
    }
    character.isVerified = true;
    character.verifiedById = verifierId;
    character.verifiedAt = new Date();
    return this.repo.save(character);
  }
```

Add `ForbiddenException` to the NestJS common import at the top of the service file.

- [ ] **Step 5: Update CharactersController — pass isMinorEdit + add verify endpoint**

In `server/src/modules/characters/characters.controller.ts`, find the `@Put(':id')` update endpoint and update the body to accept `isMinorEdit`:

```typescript
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
  // ... existing @Api decorators ...
  async update(
    @Param('id') id: number,
    @Body() data: UpdateCharacterDto,
    @Body('isMinorEdit') isMinorEdit: boolean,
    @CurrentUser() user: User,
  ) {
    return this.service.update(+id, data, user.id, isMinorEdit ?? false);
  }
```

Add the verify endpoint after the update endpoint:

```typescript
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a character page (Moderator/Admin)' })
  @ApiParam({ name: 'id', description: 'Character ID' })
  @ApiResponse({ status: 200, description: 'Character verified successfully' })
  @ApiResponse({ status: 403, description: 'Cannot verify your own edit' })
  @ApiResponse({ status: 404, description: 'Character not found' })
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Character> {
    return this.service.verify(id, user.id, user.role === UserRole.ADMIN);
  }
```

Add `Post` to the NestJS controller imports and `ParseIntPipe` if not already imported.

- [ ] **Step 6: Run tests — they should pass**

```bash
cd server && yarn test src/modules/characters/characters.service.spec.ts
```

Expected: All tests pass.

- [ ] **Step 7: Build to verify TypeScript**

```bash
cd server && yarn build
```

Expected: No TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add server/src/entities/character.entity.ts \
        server/src/modules/characters/characters.service.ts \
        server/src/modules/characters/characters.controller.ts \
        server/src/modules/characters/characters.service.spec.ts
git commit -m "feat(characters): add isMinorEdit, isVerified, and verify endpoint"
```

---

## Task 6: Arcs — isMinorEdit on update + verify endpoint

**Files:**
- Modify: `server/src/entities/arc.entity.ts`
- Modify: `server/src/modules/arcs/arcs.service.ts`
- Modify: `server/src/modules/arcs/arcs.controller.ts`

- [ ] **Step 1: Add verification columns to the Arc entity**

In `server/src/entities/arc.entity.ts`, add to imports at top:

```typescript
import { ManyToOne, JoinColumn } from 'typeorm'; // add to existing typeorm import
import { User } from './user.entity';
```

Add after the existing columns (before closing brace of the class):

```typescript
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedById: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;
```

- [ ] **Step 2: Update ArcsService — add isMinorEdit to update() and add verify()**

In `server/src/modules/arcs/arcs.service.ts`, update the `update` method to accept `isMinorEdit` and reset verification on major edits. Also add `ForbiddenException` to NestJS common imports.

Find the existing `update` method and add the isMinorEdit parameter and verification reset:

```typescript
  async update(
    id: number,
    dto: UpdateArcDto,
    userId: number,
    isMinorEdit = false,
  ): Promise<Arc> {
    const arc = await this.repo.findOne({ where: { id } });
    if (!arc) throw new NotFoundException(`Arc with id ${id} not found`);
    Object.assign(arc, dto);
    if (!isMinorEdit) {
      arc.isVerified = false;
      arc.verifiedById = null;
      arc.verifiedAt = null;
    }
    const saved = await this.repo.save(arc);
    const changedFields = Object.keys(dto).filter(
      (k) => dto[k as keyof typeof dto] !== undefined,
    );
    await this.editLogService.logUpdate(EditLogEntityType.ARC, id, userId, changedFields, isMinorEdit);
    return saved;
  }
```

Add `verify` method after `update`:

```typescript
  async verify(id: number, verifierId: number, isAdmin: boolean): Promise<Arc> {
    const arc = await this.repo.findOne({ where: { id } });
    if (!arc) throw new NotFoundException(`Arc with id ${id} not found`);
    if (!isAdmin) {
      const lastEdit = await this.editLogService.findLastMajorEdit(EditLogEntityType.ARC, id);
      if (lastEdit && lastEdit.userId === verifierId) {
        throw new ForbiddenException('You cannot verify your own edit');
      }
    }
    arc.isVerified = true;
    arc.verifiedById = verifierId;
    arc.verifiedAt = new Date();
    return this.repo.save(arc);
  }
```

- [ ] **Step 3: Update ArcsController — pass isMinorEdit + add verify endpoint**

In `server/src/modules/arcs/arcs.controller.ts`, find the update endpoint and update to pass `isMinorEdit`:

```typescript
  async update(
    @Param('id') id: string,
    @Body() data: UpdateArcDto,
    @Body('isMinorEdit') isMinorEdit: boolean,
    @CurrentUser() user: User,
  ) {
    return this.service.update(+id, data, user.id, isMinorEdit ?? false);
  }
```

Add verify endpoint:

```typescript
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify an arc page (Moderator/Admin)' })
  @ApiParam({ name: 'id', description: 'Arc ID' })
  @ApiResponse({ status: 200, description: 'Arc verified successfully' })
  @ApiResponse({ status: 403, description: 'Cannot verify your own edit' })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Arc> {
    return this.service.verify(id, user.id, user.role === UserRole.ADMIN);
  }
```

Add `Post`, `ParseIntPipe` to imports if not already present. Add `CurrentUser` decorator import if not present.

- [ ] **Step 4: Build**

```bash
cd server && yarn build
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/entities/arc.entity.ts \
        server/src/modules/arcs/arcs.service.ts \
        server/src/modules/arcs/arcs.controller.ts
git commit -m "feat(arcs): add isMinorEdit, isVerified, and verify endpoint"
```

---

## Task 7: Gambles — isMinorEdit on update + verify endpoint

**Files:**
- Modify: `server/src/entities/gamble.entity.ts`
- Modify: `server/src/modules/gambles/gambles.service.ts`
- Modify: `server/src/modules/gambles/gambles.controller.ts`

- [ ] **Step 1: Add verification columns to the Gamble entity**

In `server/src/entities/gamble.entity.ts`, add to imports:

```typescript
import { ManyToOne, JoinColumn } from 'typeorm'; // add to existing typeorm import
import { User } from './user.entity';
```

Add after existing columns:

```typescript
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedById: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;
```

- [ ] **Step 2: Update GamblesService — add isMinorEdit to update() and add verify()**

In `server/src/modules/gambles/gambles.service.ts`, find the update method. Add `isMinorEdit` parameter, add verification reset on major edits, update the `editLogService.logUpdate` call to pass `isMinorEdit`. Add `ForbiddenException` to imports.

The update method should include:

```typescript
  async update(
    id: number,
    dto: UpdateGambleDto,
    userId: number,
    isMinorEdit = false,
  ): Promise<Gamble> {
    const gamble = await this.repo.findOne({ where: { id } });
    if (!gamble) throw new NotFoundException(`Gamble with id ${id} not found`);
    // ... existing logic to handle factions, etc. ...
    if (!isMinorEdit) {
      gamble.isVerified = false;
      gamble.verifiedById = null;
      gamble.verifiedAt = null;
    }
    const saved = await this.repo.save(gamble);
    // ... existing changedFields + editLogService.logUpdate call, add isMinorEdit ...
    await this.editLogService.logUpdate(EditLogEntityType.GAMBLE, id, userId, changedFields, isMinorEdit);
    return saved;
  }
```

Add verify method:

```typescript
  async verify(id: number, verifierId: number, isAdmin: boolean): Promise<Gamble> {
    const gamble = await this.repo.findOne({ where: { id } });
    if (!gamble) throw new NotFoundException(`Gamble with id ${id} not found`);
    if (!isAdmin) {
      const lastEdit = await this.editLogService.findLastMajorEdit(EditLogEntityType.GAMBLE, id);
      if (lastEdit && lastEdit.userId === verifierId) {
        throw new ForbiddenException('You cannot verify your own edit');
      }
    }
    gamble.isVerified = true;
    gamble.verifiedById = verifierId;
    gamble.verifiedAt = new Date();
    return this.repo.save(gamble);
  }
```

- [ ] **Step 3: Update GamblesController — pass isMinorEdit + add verify endpoint**

In `server/src/modules/gambles/gambles.controller.ts`, update the update endpoint to read `isMinorEdit` from the body and pass it to the service. Add verify endpoint:

```typescript
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a gamble page (Moderator/Admin)' })
  @ApiParam({ name: 'id', description: 'Gamble ID' })
  @ApiResponse({ status: 200, description: 'Gamble verified successfully' })
  @ApiResponse({ status: 403, description: 'Cannot verify your own edit' })
  @ApiResponse({ status: 404, description: 'Gamble not found' })
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Gamble> {
    return this.service.verify(id, user.id, user.role === UserRole.ADMIN);
  }
```

- [ ] **Step 4: Build**

```bash
cd server && yarn build
```

- [ ] **Step 5: Commit**

```bash
git add server/src/entities/gamble.entity.ts \
        server/src/modules/gambles/gambles.service.ts \
        server/src/modules/gambles/gambles.controller.ts
git commit -m "feat(gambles): add isMinorEdit, isVerified, and verify endpoint"
```

---

## Task 8: Chapters — isMinorEdit on update + verify endpoint

**Files:**
- Modify: `server/src/entities/chapter.entity.ts`
- Modify: `server/src/modules/chapters/chapters.service.ts`
- Modify: `server/src/modules/chapters/chapters.controller.ts`

- [ ] **Step 1: Add verification columns to the Chapter entity**

In `server/src/entities/chapter.entity.ts`, add to imports:

```typescript
import { ManyToOne, JoinColumn } from 'typeorm'; // add to existing typeorm import
import { User } from './user.entity';
```

Add after existing columns:

```typescript
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedById: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;
```

- [ ] **Step 2: Update ChaptersService — add isMinorEdit to update() and add verify()**

In `server/src/modules/chapters/chapters.service.ts`, add `isMinorEdit` to the update method, reset verification on major edits, pass `isMinorEdit` to `editLogService.logUpdate`. Add `ForbiddenException` to imports.

Add verify method:

```typescript
  async verify(id: number, verifierId: number, isAdmin: boolean): Promise<Chapter> {
    const chapter = await this.repo.findOne({ where: { id } });
    if (!chapter) throw new NotFoundException(`Chapter with id ${id} not found`);
    if (!isAdmin) {
      const lastEdit = await this.editLogService.findLastMajorEdit(EditLogEntityType.CHAPTER, id);
      if (lastEdit && lastEdit.userId === verifierId) {
        throw new ForbiddenException('You cannot verify your own edit');
      }
    }
    chapter.isVerified = true;
    chapter.verifiedById = verifierId;
    chapter.verifiedAt = new Date();
    return this.repo.save(chapter);
  }
```

- [ ] **Step 3: Update ChaptersController — pass isMinorEdit + add verify endpoint**

Update the update endpoint to read `isMinorEdit` from body and pass to service. Add verify endpoint following the same pattern as Task 5:

```typescript
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a chapter (Moderator/Admin)' })
  @ApiParam({ name: 'id', description: 'Chapter ID' })
  @ApiResponse({ status: 200, description: 'Chapter verified successfully' })
  @ApiResponse({ status: 403, description: 'Cannot verify your own edit' })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Chapter> {
    return this.service.verify(id, user.id, user.role === UserRole.ADMIN);
  }
```

- [ ] **Step 4: Build + commit**

```bash
cd server && yarn build
git add server/src/entities/chapter.entity.ts \
        server/src/modules/chapters/chapters.service.ts \
        server/src/modules/chapters/chapters.controller.ts
git commit -m "feat(chapters): add isMinorEdit, isVerified, and verify endpoint"
```

---

## Task 9: Organizations — isMinorEdit on update + verify endpoint

**Files:**
- Modify: `server/src/entities/organization.entity.ts`
- Modify: `server/src/modules/organizations/organizations.service.ts`
- Modify: `server/src/modules/organizations/organizations.controller.ts`

- [ ] **Step 1: Add verification columns to the Organization entity**

In `server/src/entities/organization.entity.ts`, add to imports and add columns:

```typescript
import { ManyToOne, JoinColumn } from 'typeorm'; // add to existing typeorm import
import { User } from './user.entity';
```

```typescript
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedById: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;
```

- [ ] **Step 2: Update OrganizationsService — isMinorEdit + verify()**

In `server/src/modules/organizations/organizations.service.ts`, update the `update` method to accept `isMinorEdit`, reset verification on major edits, pass `isMinorEdit` to `editLogService.logUpdate`. Add `ForbiddenException` to imports.

Add verify method:

```typescript
  async verify(id: number, verifierId: number, isAdmin: boolean): Promise<Organization> {
    const org = await this.repo.findOne({ where: { id } });
    if (!org) throw new NotFoundException(`Organization with id ${id} not found`);
    if (!isAdmin) {
      const lastEdit = await this.editLogService.findLastMajorEdit(EditLogEntityType.ORGANIZATION, id);
      if (lastEdit && lastEdit.userId === verifierId) {
        throw new ForbiddenException('You cannot verify your own edit');
      }
    }
    org.isVerified = true;
    org.verifiedById = verifierId;
    org.verifiedAt = new Date();
    return this.repo.save(org);
  }
```

- [ ] **Step 3: Update OrganizationsController — isMinorEdit + verify endpoint**

Update the update endpoint body to read `isMinorEdit` and pass to service. Add verify endpoint:

```typescript
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify an organization (Moderator/Admin)' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization verified successfully' })
  @ApiResponse({ status: 403, description: 'Cannot verify your own edit' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Organization> {
    return this.service.verify(id, user.id, user.role === UserRole.ADMIN);
  }
```

- [ ] **Step 4: Build + commit**

```bash
cd server && yarn build
git add server/src/entities/organization.entity.ts \
        server/src/modules/organizations/organizations.service.ts \
        server/src/modules/organizations/organizations.controller.ts
git commit -m "feat(organizations): add isMinorEdit, isVerified, and verify endpoint"
```

---

## Task 10: Tags — add EditLog support + isMinorEdit + verify endpoint

Tags currently has no edit log support. This task adds it.

**Files:**
- Modify: `server/src/entities/tag.entity.ts`
- Modify: `server/src/modules/tags/tags.service.ts`
- Modify: `server/src/modules/tags/tags.controller.ts`
- Modify: `server/src/modules/tags/tags.module.ts`

- [ ] **Step 1: Add verification columns to the Tag entity**

In `server/src/entities/tag.entity.ts`, add to imports:

```typescript
import { ManyToOne, JoinColumn } from 'typeorm'; // add to existing typeorm import
import { User } from './user.entity';
```

Add after existing columns:

```typescript
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedById: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;
```

- [ ] **Step 2: Update TagsModule to import EditLogModule**

In `server/src/modules/tags/tags.module.ts`, add `EditLogModule` to imports:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { Tag } from '../../entities/tag.entity';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tag]), EditLogModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
```

- [ ] **Step 3: Update TagsService — inject EditLogService + add edit log calls + verify()**

Replace the contents of `server/src/modules/tags/tags.service.ts`:

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../../entities/tag.entity';
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
import { User, UserRole } from '../../entities/user.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag) private repo: Repository<Tag>,
    private readonly editLogService: EditLogService,
  ) {}

  async findAll(
    filters: {
      sort?: string;
      order?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: Tag[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const { sort, order = 'ASC', page = 1, limit = 1000 } = filters;
    const query = this.repo
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.events', 'events');
    const allowedSort = ['id', 'name'];
    if (sort && allowedSort.includes(sort)) {
      query.orderBy(`tag.${sort}`, order);
    } else {
      query.orderBy('tag.name', 'ASC');
    }
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);
    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, total, page, perPage: limit, totalPages };
  }

  async findOne(id: number): Promise<Tag> {
    const tag = await this.repo.findOne({ where: { id }, relations: ['events'] });
    if (!tag) throw new NotFoundException(`Tag with ID ${id} not found`);
    return tag;
  }

  async create(data: Partial<Tag>, userId: number): Promise<Tag> {
    const tag = this.repo.create(data);
    const saved = await this.repo.save(tag);
    await this.editLogService.logCreate(EditLogEntityType.TAG, saved.id, userId);
    return saved;
  }

  async update(id: number, data: Partial<Tag>, userId: number, isMinorEdit = false): Promise<Tag> {
    const tag = await this.findOne(id);
    Object.assign(tag, data);
    if (!isMinorEdit) {
      tag.isVerified = false;
      tag.verifiedById = null;
      tag.verifiedAt = null;
    }
    const saved = await this.repo.save(tag);
    const changedFields = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined);
    await this.editLogService.logUpdate(EditLogEntityType.TAG, id, userId, changedFields, isMinorEdit);
    return saved;
  }

  async remove(id: number, userId: number): Promise<{ deleted: boolean }> {
    await this.editLogService.logDelete(EditLogEntityType.TAG, id, userId);
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Tag with ID ${id} not found`);
    return { deleted: true };
  }

  async verify(id: number, verifierId: number, isAdmin: boolean): Promise<Tag> {
    const tag = await this.findOne(id);
    if (!isAdmin) {
      const lastEdit = await this.editLogService.findLastMajorEdit(EditLogEntityType.TAG, id);
      if (lastEdit && lastEdit.userId === verifierId) {
        throw new ForbiddenException('You cannot verify your own edit');
      }
    }
    tag.isVerified = true;
    tag.verifiedById = verifierId;
    tag.verifiedAt = new Date();
    return this.repo.save(tag);
  }
}
```

- [ ] **Step 4: Update TagsController — add CurrentUser + isMinorEdit + verify endpoint**

In `server/src/modules/tags/tags.controller.ts`, add imports:

```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
```

Update the create endpoint handler to pass userId:

```typescript
  create(
    @Body() data: CreateTagDto,
    @CurrentUser() user: User,
  ): Promise<Tag> {
    return this.service.create(data, user.id);
  }
```

Update the update endpoint handler:

```typescript
  update(
    @Param('id') id: string,
    @Body() data: UpdateTagDto,
    @Body('isMinorEdit') isMinorEdit: boolean,
    @CurrentUser() user: User,
  ) {
    return this.service.update(+id, data, user.id, isMinorEdit ?? false);
  }
```

Update the delete endpoint handler to pass userId:

```typescript
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.service.remove(+id, user.id);
  }
```

Add verify endpoint:

```typescript
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a tag (Moderator/Admin)' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  @ApiResponse({ status: 200, description: 'Tag verified successfully' })
  @ApiResponse({ status: 403, description: 'Cannot verify your own edit' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Tag> {
    return this.service.verify(id, user.id, user.role === UserRole.ADMIN);
  }
```

Add `Post`, `ParseIntPipe` to NestJS controller imports if not already present.

- [ ] **Step 5: Build + commit**

```bash
cd server && yarn build
git add server/src/entities/tag.entity.ts \
        server/src/modules/tags/tags.service.ts \
        server/src/modules/tags/tags.controller.ts \
        server/src/modules/tags/tags.module.ts
git commit -m "feat(tags): add edit log support, isMinorEdit, isVerified, and verify endpoint"
```

---

## Task 11: CharacterRelationships — add EditLog support + isMinorEdit + verify endpoint

**Files:**
- Modify: `server/src/entities/character-relationship.entity.ts`
- Modify: `server/src/modules/character-relationships/character-relationships.service.ts`
- Modify: `server/src/modules/character-relationships/character-relationships.controller.ts`
- Modify: `server/src/modules/character-relationships/character-relationships.module.ts`

- [ ] **Step 1: Add verification columns to CharacterRelationship entity**

In `server/src/entities/character-relationship.entity.ts`, add to imports:

```typescript
import { ManyToOne, JoinColumn } from 'typeorm'; // add to existing typeorm import
import { User } from './user.entity';
```

Add after existing columns:

```typescript
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedById: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;
```

- [ ] **Step 2: Update CharacterRelationshipsModule to import EditLogModule**

In `server/src/modules/character-relationships/character-relationships.module.ts`, add `EditLogModule` to imports (same pattern as Task 10 Step 2).

- [ ] **Step 3: Update CharacterRelationshipsService — inject EditLogService + edit log calls + verify()**

In `server/src/modules/character-relationships/character-relationships.service.ts`:

1. Add `EditLogService` constructor injection (after existing repos)
2. Add `ForbiddenException` to NestJS common imports
3. Update `create()` to call `editLogService.logCreate(EditLogEntityType.CHARACTER_RELATIONSHIP, saved.id, userId)` — add `userId: number` param
4. Update `update()` to accept `userId: number, isMinorEdit = false`, reset verification on major edits, call `editLogService.logUpdate(..., isMinorEdit)`
5. Add `verify()` method:

```typescript
  async verify(id: number, verifierId: number, isAdmin: boolean): Promise<CharacterRelationship> {
    const rel = await this.repo.findOne({ where: { id } });
    if (!rel) throw new NotFoundException(`CharacterRelationship with id ${id} not found`);
    if (!isAdmin) {
      const lastEdit = await this.editLogService.findLastMajorEdit(
        EditLogEntityType.CHARACTER_RELATIONSHIP,
        id,
      );
      if (lastEdit && lastEdit.userId === verifierId) {
        throw new ForbiddenException('You cannot verify your own edit');
      }
    }
    rel.isVerified = true;
    rel.verifiedById = verifierId;
    rel.verifiedAt = new Date();
    return this.repo.save(rel);
  }
```

- [ ] **Step 4: Update CharacterRelationshipsController — add CurrentUser + isMinorEdit + verify endpoint**

In `server/src/modules/character-relationships/character-relationships.controller.ts`:

1. Add `CurrentUser` decorator import and `User` entity import
2. Update create handler: `async create(@Body(ValidationPipe) dto: CreateCharacterRelationshipDto, @CurrentUser() user: User)` — pass `user.id` to service
3. Update update handler: add `@Body('isMinorEdit') isMinorEdit: boolean, @CurrentUser() user: User` params — pass both to service
4. Add verify endpoint:

```typescript
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a character relationship (Moderator/Admin)' })
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiResponse({ status: 200, description: 'Relationship verified successfully' })
  @ApiResponse({ status: 403, description: 'Cannot verify your own edit' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<CharacterRelationship> {
    return this.service.verify(id, user.id, user.role === UserRole.ADMIN);
  }
```

- [ ] **Step 5: Build + commit**

```bash
cd server && yarn build
git add server/src/entities/character-relationship.entity.ts \
        server/src/modules/character-relationships/character-relationships.service.ts \
        server/src/modules/character-relationships/character-relationships.controller.ts \
        server/src/modules/character-relationships/character-relationships.module.ts
git commit -m "feat(character-relationships): add edit log support, isMinorEdit, verify endpoint"
```

---

## Task 12: CharacterOrganizations — add EditLog support + isMinorEdit + verify endpoint

**Files:**
- Modify: `server/src/entities/character-organization.entity.ts`
- Modify: `server/src/modules/character-organizations/character-organizations.service.ts`
- Modify: `server/src/modules/character-organizations/character-organizations.controller.ts`
- Modify: `server/src/modules/character-organizations/character-organizations.module.ts`

- [ ] **Step 1: Add verification columns to CharacterOrganization entity**

In `server/src/entities/character-organization.entity.ts`, add to imports:

```typescript
import { ManyToOne, JoinColumn } from 'typeorm'; // add to existing typeorm import
import { User } from './user.entity';
```

Add after existing columns:

```typescript
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedById: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;
```

- [ ] **Step 2: Update CharacterOrganizationsModule to import EditLogModule**

Same pattern as Task 10 Step 2 — add `EditLogModule` to imports array in the module file.

- [ ] **Step 3: Update CharacterOrganizationsService — EditLogService + verify()**

Same pattern as Task 11 Step 3. Use `EditLogEntityType.CHARACTER_ORGANIZATION`. Update `create()` and `update()` to accept and pass `userId` and `isMinorEdit`. Add `verify()`.

- [ ] **Step 4: Update CharacterOrganizationsController — CurrentUser + isMinorEdit + verify endpoint**

Same pattern as Task 11 Step 4. Use `CharacterOrganization` as the return type. Add verify endpoint with `@Roles(UserRole.MODERATOR, UserRole.ADMIN)`.

- [ ] **Step 5: Build + commit**

```bash
cd server && yarn build
git add server/src/entities/character-organization.entity.ts \
        server/src/modules/character-organizations/character-organizations.service.ts \
        server/src/modules/character-organizations/character-organizations.controller.ts \
        server/src/modules/character-organizations/character-organizations.module.ts
git commit -m "feat(character-organizations): add edit log support, isMinorEdit, verify endpoint"
```

---

## Task 13: Volumes — restrict create/update to ADMIN only

**Files:**
- Modify: `server/src/modules/volumes/volumes.controller.ts`

- [ ] **Step 1: Change @Roles on create and update endpoints**

In `server/src/modules/volumes/volumes.controller.ts`:

Line ~306 (create endpoint): change
```typescript
@Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
```
to:
```typescript
@Roles(UserRole.ADMIN)
```

Line ~337 (update endpoint): change
```typescript
@Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
```
to:
```typescript
@Roles(UserRole.ADMIN)
```

Line ~268 (showcase-status GET): change
```typescript
@Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
```
to:
```typescript
@Roles(UserRole.ADMIN)
```

(Delete is already `@Roles(UserRole.ADMIN)` — no change needed.)

- [ ] **Step 2: Build**

```bash
cd server && yarn build
```

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/volumes/volumes.controller.ts
git commit -m "feat(volumes): restrict create/update/showcase-status to ADMIN only"
```

---

## Task 14: Remove EDITOR from community submission approve/reject endpoints

**Files:**
- Modify: `server/src/modules/guides/guides.controller.ts`
- Modify: `server/src/modules/media/media.controller.ts`
- Modify: `server/src/modules/annotations/annotations.controller.ts`
- Modify: `server/src/modules/events/events.controller.ts`

- [ ] **Step 1: Guides — remove EDITOR from approve/reject**

In `server/src/modules/guides/guides.controller.ts`:

Line 930 (approve endpoint):
```typescript
// Change from:
@Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
// To:
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
```

Line 970 (reject endpoint):
```typescript
// Change from:
@Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
// To:
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
```

- [ ] **Step 2: Annotations — remove EDITOR from approve/reject**

In `server/src/modules/annotations/annotations.controller.ts`:

Line 284 (approve endpoint) and Line 308 (reject endpoint): change `@Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)` to `@Roles(UserRole.ADMIN, UserRole.MODERATOR)`.

- [ ] **Step 3: Events — remove EDITOR from approve/reject**

In `server/src/modules/events/events.controller.ts`:

Line 439 (approve endpoint) and Line 453 (reject endpoint): change `@Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)` to `@Roles(UserRole.ADMIN, UserRole.MODERATOR)`.

- [ ] **Step 4: Media — remove EDITOR from approve/reject**

In `server/src/modules/media/media.controller.ts`, find the approve and reject endpoints (search for `@Post(':id/approve')` and `@Post(':id/reject')`): change `@Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)` to `@Roles(UserRole.ADMIN, UserRole.MODERATOR)` on both.

- [ ] **Step 5: Build**

```bash
cd server && yarn build
```

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/guides/guides.controller.ts \
        server/src/modules/media/media.controller.ts \
        server/src/modules/annotations/annotations.controller.ts \
        server/src/modules/events/events.controller.ts
git commit -m "feat(permissions): remove EDITOR from community submission approve/reject"
```

---

## Task 15: Quote entity + service — approval workflow

**Files:**
- Modify: `server/src/entities/quote.entity.ts`
- Modify: `server/src/modules/quotes/quotes.service.ts`

- [ ] **Step 1: Add QuoteStatus enum and columns to Quote entity**

In `server/src/entities/quote.entity.ts`, add the enum before the class and new columns in the class:

```typescript
export enum QuoteStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
```

Add after the `updatedAt` column:

```typescript
  @ApiProperty({ enum: QuoteStatus, default: QuoteStatus.PENDING })
  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.PENDING })
  status: QuoteStatus;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason: string | null;
```

- [ ] **Step 2: Write failing tests for approve/reject in quotes.service.ts**

Create `server/src/modules/quotes/quotes.service.spec.ts` (it does not currently exist):

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { Quote, QuoteStatus } from '../../entities/quote.entity';
import { Character } from '../../entities/character.entity';
import { UserRole } from '../../entities/user.entity';

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
```

- [ ] **Step 3: Run tests — they should fail**

```bash
cd server && yarn test src/modules/quotes/quotes.service.spec.ts
```

Expected: Fails — `approve` and `reject` methods do not exist yet.

- [ ] **Step 4: Update QuotesService — filter public queries + add approve/reject**

In `server/src/modules/quotes/quotes.service.ts`:

1. Add `BadRequestException` to the NestJS common import.
2. Import `QuoteStatus` from the entity.
3. Update `findAll` to filter by `status: 'approved'` by default (add optional `includeAll?: boolean` param for admin use):

```typescript
  async findAll(options?: {
    characterId?: number;
    chapterNumber?: number;
    chapterRange?: { start: number; end: number };
    search?: string;
    submittedById?: number;
    page?: number;
    limit?: number;
    includeAll?: boolean; // admin-only: returns all statuses
    status?: QuoteStatus;  // filter by specific status
  }): Promise<{ data: Quote[]; total: number; page?: number; perPage?: number; totalPages?: number }> {
    const queryBuilder = this.quotesRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.character', 'character')
      .leftJoinAndSelect('quote.submittedBy', 'submittedBy')
      .orderBy('quote.createdAt', 'DESC');

    // Public by default shows only approved; admin can request all or filter by status
    if (options?.status) {
      queryBuilder.andWhere('quote.status = :status', { status: options.status });
    } else if (!options?.includeAll) {
      queryBuilder.andWhere('quote.status = :status', { status: QuoteStatus.APPROVED });
    }

    // ... rest of existing filters unchanged ...
  }
```

4. Update `findOne` to not expose rejected/pending to public (add an `includeAll` option):

```typescript
  async findOne(id: number, includeAll = false): Promise<Quote> {
    const quote = await this.quotesRepository.findOne({
      where: includeAll ? { id } : { id, status: QuoteStatus.APPROVED },
      relations: ['character', 'submittedBy'],
    });
    if (!quote) throw new NotFoundException(`Quote with ID ${id} not found`);
    return quote;
  }
```

5. Update `findRandom` to only return approved quotes (add `andWhere('quote.status = :status', { status: QuoteStatus.APPROVED })`).

6. Update `searchQuotes` to only return approved quotes (add `.andWhere('quote.status = :status', { status: QuoteStatus.APPROVED })`).

7. Update `getQuotesByChapter` to only return approved quotes (add `status: QuoteStatus.APPROVED` to the where clause).

8. Add `approve` and `reject` methods at the end:

```typescript
  async approve(id: number): Promise<Quote> {
    const quote = await this.quotesRepository.findOne({ where: { id } });
    if (!quote) throw new NotFoundException(`Quote with ID ${id} not found`);
    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Only pending quotes can be approved');
    }
    quote.status = QuoteStatus.APPROVED;
    quote.rejectionReason = null;
    return this.quotesRepository.save(quote);
  }

  async reject(id: number, rejectionReason: string): Promise<Quote> {
    const quote = await this.quotesRepository.findOne({ where: { id } });
    if (!quote) throw new NotFoundException(`Quote with ID ${id} not found`);
    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Only pending quotes can be rejected');
    }
    quote.status = QuoteStatus.REJECTED;
    quote.rejectionReason = rejectionReason;
    return this.quotesRepository.save(quote);
  }

  async getPendingQuotes(): Promise<Quote[]> {
    return this.quotesRepository.find({
      where: { status: QuoteStatus.PENDING },
      relations: ['character', 'submittedBy'],
      order: { createdAt: 'ASC' },
    });
  }
```

- [ ] **Step 5: Run tests — they should pass**

```bash
cd server && yarn test src/modules/quotes/quotes.service.spec.ts
```

Expected: All tests pass.

- [ ] **Step 6: Build**

```bash
cd server && yarn build
```

- [ ] **Step 7: Commit**

```bash
git add server/src/entities/quote.entity.ts \
        server/src/modules/quotes/quotes.service.ts \
        server/src/modules/quotes/quotes.service.spec.ts
git commit -m "feat(quotes): add status workflow, approve/reject, public filtering"
```

---

## Task 16: Quotes controller — approve/reject endpoints + fix public filtering

**Files:**
- Modify: `server/src/modules/quotes/quotes.controller.ts`

- [ ] **Step 1: Update findAll to pass includeAll for admin**

In `server/src/modules/quotes/quotes.controller.ts`, update the `findAll` method signature to add `status` and `includeAll` query params, and pass them to the service. Also add `CurrentUser` and `OptionalJwtAuthGuard` usage to detect admin context:

Add these query params to the existing `@Get()` endpoint:

```typescript
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    // ... existing params ...
    @Query('status') status?: string,
    @CurrentUser() user?: User,
  ) {
    const includeAll = user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR;
    return this.quotesService.findAll({
      // ... existing options ...
      status: status as QuoteStatus | undefined,
      includeAll,
    });
  }
```

Add `OptionalJwtAuthGuard` import: `import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';`
Add `QuoteStatus` import from the entity.

- [ ] **Step 2: Update findOne to pass includeAll for admin/mod**

Update the `@Get(':id')` endpoint similarly:

```typescript
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: User,
  ): Promise<Quote> {
    const includeAll = user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR;
    return this.quotesService.findOne(id, includeAll);
  }
```

- [ ] **Step 3: Add GET /pending + POST approve/reject endpoints**

Add after the existing `findAll` endpoint (before `findRandom`):

```typescript
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending quotes (Moderator/Admin)' })
  @ApiResponse({ status: 200, description: 'Pending quotes retrieved', type: [Quote] })
  getPendingQuotes(): Promise<Quote[]> {
    return this.quotesService.getPendingQuotes();
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a pending quote (Moderator/Admin)' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 200, description: 'Quote approved', type: Quote })
  @ApiResponse({ status: 400, description: 'Quote is not pending' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  approveQuote(@Param('id', ParseIntPipe) id: number): Promise<Quote> {
    return this.quotesService.approve(id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a pending quote (Moderator/Admin)' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 200, description: 'Quote rejected', type: Quote })
  @ApiResponse({ status: 400, description: 'Quote is not pending' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  rejectQuote(
    @Param('id', ParseIntPipe) id: number,
    @Body('rejectionReason') rejectionReason: string,
  ): Promise<Quote> {
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }
    return this.quotesService.reject(id, rejectionReason.trim());
  }
```

Add `BadRequestException` to the NestJS common import. Add `Post` if not already imported.

- [ ] **Step 4: Build**

```bash
cd server && yarn build
```

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/quotes/quotes.controller.ts
git commit -m "feat(quotes): add approve/reject endpoints and public-only filtering"
```

---

## Task 17: api.ts — add verify + quote approval methods

**Files:**
- Modify: `client/src/lib/api.ts`

- [ ] **Step 1: Add verify methods for all editorial entities**

In `client/src/lib/api.ts`, find where `approveEvent` is defined (~line 1467) and add similar methods for verification. Add these near the other moderation actions:

```typescript
  // --- Editorial Verification ---
  async verifyCharacter(id: number) {
    return this.post(`/characters/${id}/verify`, {});
  }
  async verifyArc(id: number) {
    return this.post(`/arcs/${id}/verify`, {});
  }
  async verifyGamble(id: number) {
    return this.post(`/gambles/${id}/verify`, {});
  }
  async verifyChapter(id: number) {
    return this.post(`/chapters/${id}/verify`, {});
  }
  async verifyOrganization(id: number) {
    return this.post(`/organizations/${id}/verify`, {});
  }
  async verifyTag(id: number) {
    return this.post(`/tags/${id}/verify`, {});
  }
  async verifyCharacterRelationship(id: number) {
    return this.post(`/character-relationships/${id}/verify`, {});
  }
  async verifyCharacterOrganization(id: number) {
    return this.post(`/character-organizations/${id}/verify`, {});
  }

  // --- Quote Approval ---
  async approveQuote(id: number) {
    return this.post(`/quotes/${id}/approve`, {});
  }
  async rejectQuote(id: number, rejectionReason: string) {
    return this.post(`/quotes/${id}/reject`, { rejectionReason });
  }
```

- [ ] **Step 2: Build the client to verify TypeScript**

```bash
cd client && yarn build
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/api.ts
git commit -m "feat(api): add verify and quote approval methods to API client"
```

---

## Task 18: Admin — usePendingCounts + AdminMenu + AdminApp (volumes + quotes)

**Files:**
- Modify: `client/src/hooks/usePendingCounts.ts`
- Modify: `client/src/components/admin/AdminMenu.tsx`
- Modify: `client/src/app/admin/AdminApp.tsx`

- [ ] **Step 1: Update usePendingCounts to add unverified editorial count**

Replace the contents of `client/src/hooks/usePendingCounts.ts`:

```typescript
import { useState, useEffect } from 'react'
import { useDataProvider, usePermissions } from 'react-admin'

interface PendingCounts {
  guides: number
  media: number
  events: number
  annotations: number
  quotes: number
  unverifiedEditorial: number
  total: number
}

/**
 * Shared hook to fetch pending counts for all moderatable resources.
 * Auto-refreshes every 60 seconds.
 */
export const usePendingCounts = () => {
  const [counts, setCounts] = useState<PendingCounts>({
    guides: 0,
    media: 0,
    events: 0,
    annotations: 0,
    quotes: 0,
    unverifiedEditorial: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const dataProvider = useDataProvider()
  const { permissions } = usePermissions()

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const unverifiedFilter = { isVerified: false }
        const oneItem = { page: 1, perPage: 1 }
        const idSort = { field: 'id', order: 'ASC' as const }

        const [guidesRes, mediaRes, eventsRes, annotationsRes, quotesRes,
               charsRes, arcsRes, gamblesRes, chaptersRes, orgsRes] = await Promise.all([
          dataProvider.getList('guides', { filter: { status: 'pending' }, pagination: oneItem, sort: idSort }),
          dataProvider.getList('media', { filter: { status: 'pending' }, pagination: oneItem, sort: idSort }),
          dataProvider.getList('events', { filter: { status: 'pending' }, pagination: oneItem, sort: idSort }),
          dataProvider.getList('annotations', { filter: { status: 'pending' }, pagination: oneItem, sort: idSort }),
          dataProvider.getList('quotes', { filter: { status: 'pending' }, pagination: oneItem, sort: idSort }),
          dataProvider.getList('characters', { filter: unverifiedFilter, pagination: oneItem, sort: idSort }),
          dataProvider.getList('arcs', { filter: unverifiedFilter, pagination: oneItem, sort: idSort }),
          dataProvider.getList('gambles', { filter: unverifiedFilter, pagination: oneItem, sort: idSort }),
          dataProvider.getList('chapters', { filter: unverifiedFilter, pagination: oneItem, sort: idSort }),
          dataProvider.getList('organizations', { filter: unverifiedFilter, pagination: oneItem, sort: idSort }),
        ])

        const unverifiedEditorial =
          (charsRes.total || 0) + (arcsRes.total || 0) + (gamblesRes.total || 0) +
          (chaptersRes.total || 0) + (orgsRes.total || 0)

        const newCounts: PendingCounts = {
          guides: guidesRes.total || 0,
          media: mediaRes.total || 0,
          events: eventsRes.total || 0,
          annotations: annotationsRes.total || 0,
          quotes: quotesRes.total || 0,
          unverifiedEditorial,
          total: 0,
        }
        newCounts.total = newCounts.guides + newCounts.media + newCounts.events +
                          newCounts.annotations + newCounts.quotes + newCounts.unverifiedEditorial

        setCounts(newCounts)
      } catch (error) {
        console.error('Failed to fetch pending counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [dataProvider])

  return { counts, loading }
}
```

- [ ] **Step 2: Update AdminMenu — add quotes badge, unverified editorial badge, hide volumes for non-admin**

Replace the contents of `client/src/components/admin/AdminMenu.tsx`:

```tsx
import React from 'react'
import { Menu, MenuItemLink, useSidebarState, usePermissions } from 'react-admin'
import { Typography, Divider, Badge } from '@mui/material'
import {
  Users, User, BookOpen, Crown, Zap, FileText, Image, Quote,
  Tag, Shield, Link2, Building2, MessageSquare, Library, Award, Hash, CheckSquare
} from 'lucide-react'
import { usePendingCounts } from '../../hooks/usePendingCounts'

const SectionHeader = ({ children }: { children: React.ReactNode }) => {
  const [open] = useSidebarState()
  if (!open) return null
  return (
    <Typography variant="overline" sx={{ px: 2, pt: 2, pb: 0.5, display: 'block', color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em' }}>
      {children}
    </Typography>
  )
}

const badgeStyle = { '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: '16px', height: '16px', padding: '0 4px' } }

export const AdminMenu = () => {
  const { permissions } = usePermissions()
  const { counts } = usePendingCounts()

  return (
    <Menu>
      {/* Core Content */}
      <SectionHeader>Core Content</SectionHeader>
      <MenuItemLink to="/characters" primaryText="Characters" leftIcon={
        <Badge badgeContent={counts.unverifiedEditorial > 0 ? counts.unverifiedEditorial : undefined} color="info" sx={badgeStyle}>
          <User size={20} />
        </Badge>
      } />
      <MenuItemLink to="/arcs" primaryText="Arcs" leftIcon={<BookOpen size={20} />} />
      <MenuItemLink to="/gambles" primaryText="Gambles" leftIcon={<Crown size={20} />} />
      <MenuItemLink to="/events" primaryText="Events" leftIcon={
        <Badge badgeContent={counts.events} color="warning" sx={badgeStyle}><Zap size={20} /></Badge>
      } />

      <Divider sx={{ my: 1 }} />

      {/* Community Submissions */}
      <SectionHeader>Community Submissions</SectionHeader>
      <MenuItemLink to="/guides" primaryText="Guides" leftIcon={
        <Badge badgeContent={counts.guides} color="warning" sx={badgeStyle}><FileText size={20} /></Badge>
      } />
      <MenuItemLink to="/media" primaryText="Media" leftIcon={
        <Badge badgeContent={counts.media} color="warning" sx={badgeStyle}><Image size={20} /></Badge>
      } />
      <MenuItemLink to="/annotations" primaryText="Annotations" leftIcon={
        <Badge badgeContent={counts.annotations} color="warning" sx={badgeStyle}><MessageSquare size={20} /></Badge>
      } />
      <MenuItemLink to="/quotes" primaryText="Quotes" leftIcon={
        <Badge badgeContent={counts.quotes} color="warning" sx={badgeStyle}><Quote size={20} /></Badge>
      } />

      <Divider sx={{ my: 1 }} />

      {/* Reference Data */}
      <SectionHeader>Reference Data</SectionHeader>
      <MenuItemLink to="/organizations" primaryText="Organizations" leftIcon={<Shield size={20} />} />
      <MenuItemLink to="/tags" primaryText="Tags" leftIcon={<Tag size={20} />} />
      {permissions === 'admin' && (
        <MenuItemLink to="/volumes" primaryText="Volumes" leftIcon={<Library size={20} />} />
      )}
      <MenuItemLink to="/chapters" primaryText="Chapters" leftIcon={<Hash size={20} />} />

      <Divider sx={{ my: 1 }} />

      {/* Relationships */}
      <SectionHeader>Relationships</SectionHeader>
      <MenuItemLink to="/character-relationships" primaryText="Character Relations" leftIcon={<Link2 size={20} />} />
      <MenuItemLink to="/character-organizations" primaryText="Org Memberships" leftIcon={<Building2 size={20} />} />

      <Divider sx={{ my: 1 }} />

      {/* User Management — Admin Only */}
      {permissions === 'admin' && <SectionHeader>User Management</SectionHeader>}
      {permissions === 'admin' && (
        <MenuItemLink to="/users" primaryText="Users" leftIcon={<Users size={20} />} />
      )}
      {permissions === 'admin' && (
        <MenuItemLink to="/badges" primaryText="Badges" leftIcon={<Award size={20} />} />
      )}
    </Menu>
  )
}
```

- [ ] **Step 3: Update AdminApp.tsx — wrap volumes Resource in admin-only condition**

In `client/src/app/admin/AdminApp.tsx`, the volumes resource needs to be conditionally rendered. React Admin supports this via `usePermissions` but resources must be registered at the top level. Instead, we restrict the resource by removing `create`, `edit` from non-admin roles at the component level. The cleaner approach is to leave the resource registered (read access is still valid for all) but add role checks inside `VolumeCreate` and `VolumeEdit` components (in the next task). For now, no change needed here — AdminMenu already hides the nav link.

- [ ] **Step 4: Build client**

```bash
cd client && yarn build
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/usePendingCounts.ts \
        client/src/components/admin/AdminMenu.tsx \
        client/src/app/admin/AdminApp.tsx
git commit -m "feat(admin): add unverified count badge, move quotes to submissions section, hide volumes for non-admin"
```

---

## Task 19: Admin Quotes — add status, approve/reject actions

**Files:**
- Modify: `client/src/components/admin/Quotes.tsx`

- [ ] **Step 1: Add status field + approve/reject buttons to QuoteList and QuoteShow**

In `client/src/components/admin/Quotes.tsx`, add the following:

1. Add imports at the top of the file:

```tsx
import { useNotify, useRefresh, usePermissions, Button } from 'react-admin'
import { Check, X } from 'lucide-react'
import { api } from '../../lib/api'
```

2. Add `ApproveQuoteButton` component:

```tsx
const ApproveQuoteButton = ({ record }: { record: any }) => {
  const notify = useNotify()
  const refresh = useRefresh()

  if (record?.status !== 'pending') return null

  const handleApprove = async () => {
    try {
      await api.approveQuote(Number(record.id))
      notify('Quote approved successfully', { type: 'success' })
      refresh()
    } catch (error: any) {
      notify(error?.message || 'Error approving quote', { type: 'error' })
    }
  }

  return (
    <Button label="Approve" onClick={handleApprove} color="primary" startIcon={<Check size={16} />} />
  )
}
```

3. Add `RejectQuoteButton` component:

```tsx
const RejectQuoteButton = ({ record }: { record: any }) => {
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')

  if (record?.status !== 'pending') return null

  const handleReject = async () => {
    if (!reason.trim()) { notify('Rejection reason required', { type: 'warning' }); return }
    try {
      await api.rejectQuote(Number(record.id), reason.trim())
      notify('Quote rejected', { type: 'success' })
      refresh()
      setOpen(false)
      setReason('')
    } catch (error: any) {
      notify(error?.message || 'Error rejecting quote', { type: 'error' })
    }
  }

  return (
    <>
      <Button label="Reject" onClick={() => setOpen(true)} color="error" startIcon={<X size={16} />} />
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, maxWidth: 400, width: '100%' }}>
            <h3>Reject Quote</h3>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              style={{ width: '100%', marginBottom: 16 }}
              placeholder="Enter rejection reason..."
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)}>Cancel</button>
              <button onClick={handleReject}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

4. In `QuoteList`, add a `status` column to the `<Datagrid>`:

```tsx
<TextField source="status" />
```

5. In `QuoteShow` (or the show view's actions area), add the approve/reject buttons using `useRecordContext`:

```tsx
const QuoteShowActions = () => {
  const record = useRecordContext()
  const { permissions } = usePermissions()
  if (permissions !== 'admin' && permissions !== 'moderator') return null
  return (
    <TopToolbar>
      <ApproveQuoteButton record={record} />
      <RejectQuoteButton record={record} />
    </TopToolbar>
  )
}
```

Add `QuoteShowActions` to the `<Show actions={<QuoteShowActions />}>` element.

- [ ] **Step 2: Build client**

```bash
cd client && yarn build
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/admin/Quotes.tsx
git commit -m "feat(admin-quotes): add status display and approve/reject actions"
```

---

## Task 20: Admin — Verify button for editorial content (Characters as reference, then all others)

**Files:**
- Modify: `client/src/components/admin/Characters.tsx`
- Modify: `client/src/components/admin/Arcs.tsx`
- Modify: `client/src/components/admin/Gambles.tsx`
- Modify: `client/src/components/admin/Chapters.tsx`
- Modify: `client/src/components/admin/Organizations.tsx`
- Modify: `client/src/components/admin/Tags.tsx`
- Modify: `client/src/components/admin/CharacterRelationships.tsx`
- Modify: `client/src/components/admin/CharacterOrganizations.tsx`

- [ ] **Step 1: Add VerifyButton component to Characters.tsx**

In `client/src/components/admin/Characters.tsx`, add these imports at the top:

```tsx
import { useNotify, useRefresh, usePermissions, useRecordContext, Button, TopToolbar } from 'react-admin'
import { CheckCircle, Clock } from 'lucide-react'
import { api } from '../../lib/api'
```

Add the `VerifyButton` component:

```tsx
const VerifyButton = ({ apiMethod }: { apiMethod: (id: number) => Promise<any> }) => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const { permissions } = usePermissions()

  if (permissions !== 'admin' && permissions !== 'moderator') return null
  if (!record) return null

  const handleVerify = async () => {
    try {
      await apiMethod(Number(record.id))
      notify('Verified successfully', { type: 'success' })
      refresh()
    } catch (error: any) {
      notify(error?.message || 'Could not verify — you may have authored the last edit', { type: 'error' })
    }
  }

  if (record.isVerified) {
    return (
      <Button label="Verified" disabled color="success" startIcon={<CheckCircle size={16} />} />
    )
  }

  return (
    <Button label="Verify" onClick={handleVerify} color="primary" startIcon={<Clock size={16} />} />
  )
}
```

In the `CharacterShow` (or `CharacterEdit`) component, find the `TopToolbar` or actions area and add the verify button:

```tsx
const CharacterShowActions = () => (
  <TopToolbar>
    <VerifyButton apiMethod={api.verifyCharacter.bind(api)} />
  </TopToolbar>
)
```

Apply: `<Show actions={<CharacterShowActions />}>`.

In `CharacterList`, add an `isVerified` column to the datagrid:

```tsx
<BooleanField source="isVerified" label="Verified" />
```

- [ ] **Step 2: Apply the same pattern to Arcs.tsx**

In `client/src/components/admin/Arcs.tsx`:
1. Add the same imports as Step 1.
2. Add `VerifyButton` component (exact same code as Step 1).
3. Add `ArcShowActions` with `api.verifyArc.bind(api)`.
4. Add `<BooleanField source="isVerified" label="Verified" />` to `ArcList` datagrid.

- [ ] **Step 3: Apply the same pattern to Gambles.tsx**

In `client/src/components/admin/Gambles.tsx`:
1. Add the same imports.
2. Add `VerifyButton`.
3. Add `GambleShowActions` with `api.verifyGamble.bind(api)`.
4. Add `isVerified` BooleanField to list.

- [ ] **Step 4: Apply the same pattern to Chapters.tsx**

In `client/src/components/admin/Chapters.tsx`:
1. Add the same imports.
2. Add `VerifyButton`.
3. Add `ChapterShowActions` with `api.verifyChapter.bind(api)`.
4. Add `isVerified` BooleanField to list.

- [ ] **Step 5: Apply the same pattern to Organizations.tsx**

In `client/src/components/admin/Organizations.tsx`:
1. Add the same imports.
2. Add `VerifyButton`.
3. Add `OrganizationShowActions` with `api.verifyOrganization.bind(api)`.
4. Add `isVerified` BooleanField to list.

- [ ] **Step 6: Apply the same pattern to Tags.tsx**

In `client/src/components/admin/Tags.tsx`:
1. Add the same imports.
2. Add `VerifyButton`.
3. Add `TagShowActions` with `api.verifyTag.bind(api)`.
4. Add `isVerified` BooleanField to list.

- [ ] **Step 7: Apply the same pattern to CharacterRelationships.tsx and CharacterOrganizations.tsx**

In `client/src/components/admin/CharacterRelationships.tsx`:
1. Add imports, `VerifyButton`, show actions with `api.verifyCharacterRelationship.bind(api)`, add `isVerified` field.

In `client/src/components/admin/CharacterOrganizations.tsx`:
1. Add imports, `VerifyButton`, show actions with `api.verifyCharacterOrganization.bind(api)`, add `isVerified` field.

- [ ] **Step 8: Build**

```bash
cd client && yarn build
```

Expected: No TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add client/src/components/admin/Characters.tsx \
        client/src/components/admin/Arcs.tsx \
        client/src/components/admin/Gambles.tsx \
        client/src/components/admin/Chapters.tsx \
        client/src/components/admin/Organizations.tsx \
        client/src/components/admin/Tags.tsx \
        client/src/components/admin/CharacterRelationships.tsx \
        client/src/components/admin/CharacterOrganizations.tsx
git commit -m "feat(admin): add isVerified display and Verify button to all editorial resources"
```

---

## Task 21: Admin Volumes — restrict edit/create views to admin

**Files:**
- Modify: `client/src/components/admin/Volumes.tsx`

- [ ] **Step 1: Add role guard to VolumeEdit and VolumeCreate**

In `client/src/components/admin/Volumes.tsx`, add at the top of the `VolumeEdit` and `VolumeCreate` components:

```tsx
import { usePermissions } from 'react-admin'

// Inside VolumeEdit:
export const VolumeEdit = () => {
  const { permissions } = usePermissions()
  if (permissions !== 'admin') return <div>Access denied. Volume editing is restricted to administrators.</div>
  return (
    // ... existing edit form ...
  )
}

// Inside VolumeCreate:
export const VolumeCreate = () => {
  const { permissions } = usePermissions()
  if (permissions !== 'admin') return <div>Access denied. Volume creation is restricted to administrators.</div>
  return (
    // ... existing create form ...
  )
}
```

- [ ] **Step 2: Build**

```bash
cd client && yarn build
```

Expected: No TypeScript errors.

- [ ] **Step 3: Full integration verification**

Start both server and client and manually verify:
1. Log in as an editor → can edit characters but cannot approve guides
2. Log in as a moderator → can approve guides, can verify characters, cannot create volumes
3. Log in as admin → can do everything including create volumes
4. Submit a quote as a user → it's pending, not visible publicly
5. Approve a quote as moderator → it appears publicly
6. Edit a character (major edit) as editor → `isVerified` resets to false
7. Verify that character as a different moderator → `isVerified` becomes true
8. Try to verify as the same moderator who made the last edit → should get a 403

```bash
# Terminal 1
cd server && yarn start:dev

# Terminal 2
cd client && yarn dev
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/admin/Volumes.tsx
git commit -m "feat(admin-volumes): restrict edit/create views to admin role"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Editor can create/edit editorial content (Tasks 5–12: EDITOR in @Roles on create/update)
- ✅ Moderator verifies editorial content (Tasks 5–12: verify endpoints)
- ✅ Admin can do all (Tasks 5–12: ADMIN in all guards)
- ✅ isMinorEdit skips verification reset (Tasks 4–12)
- ✅ Self-verify prevention for mods (Task 5 service verify() method, replicated in 6–12)
- ✅ Admins exempt from self-verify (isAdmin param in verify())
- ✅ Volumes admin-only (Task 13)
- ✅ EDITOR removed from approve/reject (Task 14)
- ✅ Quotes get status workflow (Tasks 3, 15, 16)
- ✅ Admin panel unverified count (Task 18)
- ✅ Admin panel volumes hidden for non-admin (Task 18 + 21)
- ✅ Admin panel verify button on editorial resources (Task 20)
- ✅ Admin panel quotes approve/reject (Task 19)

**One note:** The contributor display on public-facing pages (showing who has edited a character page) is not included in this plan. The backend edit log already captures this data. A separate task/PR should add this to the public character/arc/etc. page components once the backend changes are stable.
