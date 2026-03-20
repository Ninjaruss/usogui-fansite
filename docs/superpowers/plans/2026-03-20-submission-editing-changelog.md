# Submission Editing, Changelog & Activity Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Log submission edits to EditLog, add annotation edit UI, simplify the changelog filter, and surface submission edits in the activity feed.

**Architecture:** Extend `EditLogEntityType` with GUIDE/MEDIA/ANNOTATION values, inject `EditLogService` into the three submission services, add a JWT-protected route for the user's own submission edits, build the annotation edit page, and update the changelog + activity feed to render the new entry types.

**Tech Stack:** NestJS (backend), TypeORM, Next.js 15 App Router, TypeScript strict mode, Mantine UI, Tailwind CSS 4. No test suite — verification is via `yarn build` (TypeScript compilation) + manual testing.

---

## File Map

**Server (create/modify):**
- Modify: `server/src/entities/edit-log.entity.ts` — add GUIDE, MEDIA, ANNOTATION to enum
- Modify: `server/src/modules/edit-log/edit-log.service.ts` — enrich new types in `getRecent()`, add `getSubmissionEditsByUser()`, update `getEditCountByUserGrouped()`
- Modify: `server/src/modules/edit-log/edit-log.controller.ts` — add `GET /edit-log/my-submissions`
- Modify: `server/src/modules/guides/guides.service.ts` — inject EditLogService, call `logUpdate`
- Modify: `server/src/modules/guides/guides.module.ts` — import EditLogModule
- Modify: `server/src/modules/media/media.service.ts` — inject EditLogService, fix status reset, call `logUpdate`
- Modify: `server/src/modules/media/media.module.ts` — import EditLogModule
- Modify: `server/src/modules/annotations/annotations.service.ts` — inject EditLogService, add `findMyOne`, call `logUpdate`
- Modify: `server/src/modules/annotations/annotations.module.ts` — import EditLogModule
- Modify: `server/src/modules/annotations/annotations.controller.ts` — add `GET /annotations/my/:id`

**Client (create/modify):**
- Modify: `client/src/lib/api.ts` — add `getMyAnnotationSubmission`, `getMySubmissionEdits`
- Modify: `client/src/lib/mantine-theme.ts` — add `annotation` to `textColors`
- Modify: `client/src/components/SubmissionCard.tsx` — fix annotation edit link
- Modify: `client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx` — add `?edit=id` mode
- Modify: `client/src/app/changelog/ChangelogPageContent.tsx` — remove Wiki Edits tab, handle new types
- Modify: `client/src/app/profile/ProfilePageClient.tsx` — fetch submission edits, pass to ProfileFieldLog
- Modify: `client/src/app/profile/ProfileFieldLog.tsx` — accept `submissionEdits` prop, render edit entries

---

## Task 1: Extend EditLog entity with submission types

**Files:**
- Modify: `server/src/entities/edit-log.entity.ts`

- [ ] **Step 1: Add GUIDE, MEDIA, ANNOTATION to the enum**

Open `server/src/entities/edit-log.entity.ts`. Find the `EditLogEntityType` enum and add three new values:

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
}
```

The `@Column({ type: 'enum', enum: EditLogEntityType })` on `entityType` will automatically be compatible with schema sync (`ENABLE_SCHEMA_SYNC=true`). If deploying without schema sync, a migration adding the three new enum values to the Postgres enum type is required.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no TypeScript errors. If `getEditCountByUserGrouped` shows a type error (missing keys in the `counts` initializer), fix it in the next task.

- [ ] **Step 3: Commit**

```bash
git add server/src/entities/edit-log.entity.ts
git commit -m "feat: add GUIDE, MEDIA, ANNOTATION to EditLogEntityType enum"
```

---

## Task 2: Update EditLogService — getEditCountByUserGrouped + getRecent enrichment + getSubmissionEditsByUser

**Files:**
- Modify: `server/src/modules/edit-log/edit-log.service.ts`

- [ ] **Step 1: Update getEditCountByUserGrouped to include new types**

In `edit-log.service.ts`, find `getEditCountByUserGrouped()`. The `counts` initializer object must include all enum values. Add the three new entries:

```typescript
const counts: Record<EditLogEntityType, number> = {
  [EditLogEntityType.CHARACTER]: 0,
  [EditLogEntityType.GAMBLE]: 0,
  [EditLogEntityType.ARC]: 0,
  [EditLogEntityType.ORGANIZATION]: 0,
  [EditLogEntityType.EVENT]: 0,
  [EditLogEntityType.GUIDE]: 0,
  [EditLogEntityType.MEDIA]: 0,
  [EditLogEntityType.ANNOTATION]: 0,
};
```

The `contributions.service.ts` caller uses `Object.values(counts).reduce(...)` for `editsTotal` — this will now automatically include guide/media/annotation edit counts in the total. This is intentional per the spec. However, `contributions.service.ts` also accesses `editCounts.character`, `editCounts.gamble`, etc. by name to build the named `edits` breakdown response object. Those named fields stay as-is (the new types are just silently added to the total, not broken out as named fields). No code change to `contributions.service.ts` is needed, but be aware the edits total will increase once logging is active.

- [ ] **Step 2: Extend resolveEntityNames() to handle GUIDE, MEDIA, ANNOTATION**

In `edit-log.service.ts`, find the `resolveEntityNames()` private method. It has a `Promise.all([...])` that fetches names by type. Add three new entries to the array:

```typescript
groups.has(EditLogEntityType.GUIDE)
  ? fetch(this.guideRepository as any, EditLogEntityType.GUIDE, groups.get(EditLogEntityType.GUIDE)!, 'title')
  : Promise.resolve(),
groups.has(EditLogEntityType.MEDIA)
  ? fetch(this.mediaRepository as any, EditLogEntityType.MEDIA, groups.get(EditLogEntityType.MEDIA)!, 'title')
  : Promise.resolve(),
groups.has(EditLogEntityType.ANNOTATION)
  ? (async () => {
      const ids = groups.get(EditLogEntityType.ANNOTATION)!;
      const rows = await this.annotationRepository.find({
        where: { id: In(ids) } as any,
        select: ['id', 'title', 'ownerType'] as any,
      });
      for (const row of rows) {
        const ownerLabel = row.ownerType
          ? row.ownerType.charAt(0).toUpperCase() + row.ownerType.slice(1)
          : 'Annotation';
        nameMap.set(
          `${EditLogEntityType.ANNOTATION}:${row.id}`,
          `${ownerLabel}: ${row.title}`,
        );
      }
    })()
  : Promise.resolve(),
```

Note: `this.guideRepository`, `this.mediaRepository`, and `this.annotationRepository` are already injected in `EditLogService` (confirmed in the constructor). There is also a separate private method `resolveEntityNamesByType()` in the same service — it has its own switch-case for type lookups but is used internally only and does not need updating for the `getRecent()` path. The `resolveEntityNames()` method (what `getRecent` calls) is the one being extended here.

- [ ] **Step 3: Add getSubmissionEditsByUser() method**

Add this method to `EditLogService` (after `getEditsByUser`):

```typescript
async getSubmissionEditsByUser(userId: number): Promise<Array<EditLog & { entityName?: string }>> {
  const data = await this.editLogRepository.find({
    where: {
      userId,
      entityType: In([
        EditLogEntityType.GUIDE,
        EditLogEntityType.MEDIA,
        EditLogEntityType.ANNOTATION,
      ]),
    },
    order: { createdAt: 'DESC' },
  });
  const nameMap = await this.resolveEntityNames(data);
  return data.map((e) => ({
    ...e,
    entityName: nameMap.get(`${e.entityType}:${e.entityId}`),
  }));
}
```

Make sure `In` is imported from `typeorm` — it's already in the imports at the top of the file.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/edit-log/edit-log.service.ts
git commit -m "feat: extend EditLogService to enrich and query GUIDE/MEDIA/ANNOTATION log entries"
```

---

## Task 3: Add GET /edit-log/my-submissions route

**Files:**
- Modify: `server/src/modules/edit-log/edit-log.controller.ts`

- [ ] **Step 1: Add imports for JWT guard and CurrentUser decorator**

At the top of `edit-log.controller.ts`, add these imports alongside the existing ones:

```typescript
import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
```

Check the existing controller imports — `Controller`, `Get`, `Query` etc. are already there. Only add what's missing.

- [ ] **Step 2: Add the route method**

Add this method to `EditLogController` (after `getRecentSubmissions`):

```typescript
@Get('my-submissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get current user submission edits (requires auth)' })
@ApiResponse({ status: 200, description: 'User submission edit log entries' })
async getMySubmissions(@CurrentUser() user: User) {
  return this.editLogService.getSubmissionEditsByUser(user.id);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/edit-log/edit-log.controller.ts
git commit -m "feat: add GET /edit-log/my-submissions route (JWT-protected)"
```

---

## Task 4: Wire EditLogModule into GuidesModule, MediaModule, AnnotationsModule

**Files:**
- Modify: `server/src/modules/guides/guides.module.ts`
- Modify: `server/src/modules/media/media.module.ts`
- Modify: `server/src/modules/annotations/annotations.module.ts`

- [ ] **Step 1: Update guides.module.ts**

Add the EditLogModule import:

```typescript
import { EditLogModule } from '../edit-log/edit-log.module';
```

Add `EditLogModule` to the `imports` array:

```typescript
imports: [
  TypeOrmModule.forFeature([Guide, GuideLike, Tag, User, Character, Arc, Gamble]),
  PageViewsModule,
  EditLogModule,  // ← add this
],
```

- [ ] **Step 2: Update media.module.ts**

Add the import at the top:

```typescript
import { EditLogModule } from '../edit-log/edit-log.module';
```

Add to `imports` array:

```typescript
imports: [
  TypeOrmModule.forFeature([Media, Character]),
  HttpModule,
  EmailModule,
  ServicesModule,
  EditLogModule,  // ← add this
],
```

- [ ] **Step 3: Update annotations.module.ts**

Add the import at the top:

```typescript
import { EditLogModule } from '../edit-log/edit-log.module';
```

Add to `imports` array:

```typescript
imports: [
  TypeOrmModule.forFeature([Annotation, User, Character, Gamble, Chapter, Arc]),
  EditLogModule,  // ← add this
],
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/guides/guides.module.ts \
        server/src/modules/media/media.module.ts \
        server/src/modules/annotations/annotations.module.ts
git commit -m "feat: import EditLogModule into guides, media, and annotations modules"
```

---

## Task 5: Add logUpdate to GuidesService

**Files:**
- Modify: `server/src/modules/guides/guides.service.ts`

- [ ] **Step 1: Inject EditLogService**

In `guides.service.ts`, add the import near the top:

```typescript
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
```

In the service constructor, add the parameter:

```typescript
constructor(
  // ...existing injections...
  private readonly editLogService: EditLogService,
) {}
```

- [ ] **Step 2: Add logUpdate call in the update() method**

Find the `update()` method. Near the top of the method (after fetching the guide but before modifying it), capture the prior status:

```typescript
const priorStatus = guide.status;
```

At the very end of the method, just before the final `return` (after the manager transaction save), add:

```typescript
// Log the edit
const changedFieldNames = Object.keys(guideData).filter(k => k !== 'tagNames' && k !== 'characterIds');
if (tagNames !== undefined) changedFieldNames.push('tags');
if (characterIds !== undefined) changedFieldNames.push('characters');
await this.editLogService.logUpdate(
  EditLogEntityType.GUIDE,
  guide.id,
  currentUser.id,
  [...changedFieldNames, `priorStatus:${priorStatus}`],
);
```

Note: The `update()` method uses a TypeORM transaction manager — `editLogService.logUpdate()` uses its own injected repository (not the transaction manager), so it runs outside the transaction. This is intentional and acceptable for logging.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/guides/guides.service.ts
git commit -m "feat: log guide edits to EditLog with priorStatus encoding"
```

---

## Task 6: Fix MediaService status reset + add logUpdate

**Files:**
- Modify: `server/src/modules/media/media.service.ts`

- [ ] **Step 1: Inject EditLogService**

Add imports at top of `media.service.ts`:

```typescript
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
```

Add to the constructor parameters:

```typescript
private readonly editLogService: EditLogService,
```

- [ ] **Step 2: Fix the unconditional status reset in updateOwnSubmission()**

In `updateOwnSubmission()`, find this block near the end of the method (before `return this.mediaRepo.save(media)`):

```typescript
// Reset status to pending and clear rejection reason when resubmitting
media.status = MediaStatus.PENDING;
media.rejectionReason = null;
```

**Before** that block, capture the prior status and make the reset conditional:

```typescript
const priorStatus = media.status;

// Only reset to PENDING when the submission was REJECTED (matches guide behavior)
if (media.status === MediaStatus.REJECTED) {
  media.status = MediaStatus.PENDING;
  media.rejectionReason = null;
}
```

Remove (or replace) the existing unconditional reset lines.

- [ ] **Step 3: Add logUpdate call after the save**

After `return this.mediaRepo.save(media)` isn't possible since it returns. Change the method to save first then log:

```typescript
const saved = await this.mediaRepo.save(media);

const changedFieldNames: string[] = [];
if (updateData.description !== undefined) changedFieldNames.push('description');
if (updateData.ownerType !== undefined) changedFieldNames.push('ownerType');
if (updateData.ownerId !== undefined) changedFieldNames.push('ownerId');
if (updateData.chapterNumber !== undefined) changedFieldNames.push('chapterNumber');
if (file) changedFieldNames.push('file');

await this.editLogService.logUpdate(
  EditLogEntityType.MEDIA,
  media.id,
  user.id,
  [...changedFieldNames, `priorStatus:${priorStatus}`],
);

return saved;
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/media/media.service.ts
git commit -m "feat: fix media status reset on edit and log media edits to EditLog"
```

---

## Task 7: Add logUpdate to AnnotationsService + findMyOne

**Files:**
- Modify: `server/src/modules/annotations/annotations.service.ts`

- [ ] **Step 1: Inject EditLogService**

Add imports at top of `annotations.service.ts`:

```typescript
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
```

Add to constructor:

```typescript
private readonly editLogService: EditLogService,
```

- [ ] **Step 2: Add logUpdate call at end of update() method**

In the `update()` method, capture `priorStatus` **before** the status-reset block (the REJECTED → PENDING block that starts at around line 305):

```typescript
const priorStatus = annotation.status;
```

At the very end of `update()`, after `return await this.annotationRepository.save(annotation)`, change it to:

```typescript
const saved = await this.annotationRepository.save(annotation);

const changedFields = Object.keys(rest);
if (isSpoiler !== undefined) changedFields.push('isSpoiler');
if (spoilerChapter !== undefined) changedFields.push('spoilerChapter');

await this.editLogService.logUpdate(
  EditLogEntityType.ANNOTATION,
  annotation.id,
  currentUser.id,
  [...changedFields, `priorStatus:${priorStatus}`],
);

return saved;
```

- [ ] **Step 3: Add findMyOne() method**

Add this method after `findByAuthor()`:

```typescript
async findMyOne(id: number, userId: number): Promise<Annotation> {
  const annotation = await this.annotationRepository.findOne({
    where: { id, authorId: userId },
    relations: ['author'],
  });
  if (!annotation) {
    throw new NotFoundException('Annotation not found');
  }
  return annotation;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/annotations/annotations.service.ts
git commit -m "feat: log annotation edits to EditLog and add findMyOne service method"
```

---

## Task 8: Add GET /annotations/my/:id endpoint

**Files:**
- Modify: `server/src/modules/annotations/annotations.controller.ts`

- [ ] **Step 1: Add the route**

In `annotations.controller.ts`, add the following route **after** the `GET /annotations/my` route (around line 120) and **before** the `POST /` (create) route. The ordering matters to avoid `:id` catching `my`:

```typescript
@Get('my/:id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({
  summary: "Get one of the current user's annotations by ID",
  description: 'Fetches a single annotation belonging to the authenticated user.',
})
@ApiParam({ name: 'id', description: 'Annotation ID' })
@ApiOkResponse({ description: 'Annotation retrieved successfully' })
@ApiUnauthorizedResponse({ description: 'Not authenticated' })
@ApiNotFoundResponse({ description: 'Annotation not found or not owned by user' })
async getMyAnnotation(
  @Param('id', ParseIntPipe) id: number,
  @CurrentUser() user: User,
) {
  return await this.annotationsService.findMyOne(id, user.id);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/annotations/annotations.controller.ts
git commit -m "feat: add GET /annotations/my/:id route for owner annotation fetch"
```

---

## Task 9: Add API client methods

**Files:**
- Modify: `client/src/lib/api.ts`

- [ ] **Step 1: Add getMyAnnotationSubmission**

In `api.ts`, find the annotation-related methods section (around line 1745 where `getMyAnnotations` exists). Add after it:

```typescript
async getMyAnnotationSubmission(id: number) {
  const response = await this.request<any>(`/annotations/my/${id}`);
  return response;
},
```

- [ ] **Step 2: Add getMySubmissionEdits**

Add this method near the edit-log related methods (search for `getRecentEdits` or `getRecentSubmissions`):

```typescript
async getMySubmissionEdits() {
  const response = await this.request<any[]>('/edit-log/my-submissions');
  return response;
},
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/api.ts
git commit -m "feat: add getMyAnnotationSubmission and getMySubmissionEdits API client methods"
```

---

## Task 10: Add annotation color to theme

**Files:**
- Modify: `client/src/lib/mantine-theme.ts`

- [ ] **Step 1: Add annotation to textColors**

In `mantine-theme.ts`, find the `textColors` object (around line 770). It contains keys like `guide`, `media`, `arc`, etc. Add:

```typescript
annotation: '#ff922b',
```

Use orange (`#ff922b`) — distinct from guide (green `#51cf66`), media (purple `#a855f7`), and arc (orange `#f97316`). `#ff922b` is a lighter orange that reads differently in context.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/mantine-theme.ts
git commit -m "feat: add annotation color (orange) to textColors theme"
```

---

## Task 11: Fix SubmissionCard annotation edit link

**Files:**
- Modify: `client/src/components/SubmissionCard.tsx`

- [ ] **Step 1: Update getEditLink() for annotations**

Find the `getEditLink()` function in `SubmissionCard.tsx`. The current annotation branch is:

```typescript
if (submission.type === 'annotation' && submission.ownerType && submission.ownerId) {
  const entityPathMap: Record<string, string> = {
    character: 'characters',
    gamble: 'gambles',
    arc: 'arcs',
  }
  const basePath = entityPathMap[submission.ownerType]
  if (basePath) return `/${basePath}/${submission.ownerId}`
}
```

Replace the entire annotation branch with:

```typescript
if (submission.type === 'annotation') {
  return `/submit-annotation?edit=${submission.id}`
}
```

The `ownerType`/`ownerId` guard is removed — the edit page only needs the annotation ID.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/SubmissionCard.tsx
git commit -m "fix: annotation edit link navigates to /submit-annotation?edit=id"
```

---

## Task 12: Add annotation edit mode to SubmitAnnotationPageContent

**Files:**
- Modify: `client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx`

This is the largest single-file change. Read the current file carefully before making changes.

- [ ] **Step 1: Add edit mode state and data fetching**

Near the top of the component (after existing `useState` / `useSearchParams` calls), add:

```typescript
const editAnnotationId = searchParams.get('edit')
  ? Number(searchParams.get('edit'))
  : null;
const [editingAnnotation, setEditingAnnotation] = useState<any>(null);
const [loadingEdit, setLoadingEdit] = useState(false);
```

Add a `useEffect` that fetches the annotation when `editAnnotationId` is present (add after existing useEffects):

```typescript
useEffect(() => {
  if (!editAnnotationId) return;
  setLoadingEdit(true);
  api.getMyAnnotationSubmission(editAnnotationId)
    .then((annotation) => {
      setEditingAnnotation(annotation);
      // Pre-populate form fields from the fetched annotation
      setOwnerType(annotation.ownerType ?? '');
      setOwnerId(annotation.ownerId ?? null);
      setTitle(annotation.title ?? '');
      setContent(annotation.content ?? '');
      setSourceUrl(annotation.sourceUrl ?? '');
      setIsSpoiler(annotation.isSpoiler ?? false);
      setSpoilerChapter(annotation.spoilerChapter ?? null);
      // Skip to the content step (step after owner selection)
      setStep(2);
    })
    .catch(() => {
      // If the fetch fails (not found / not owner), redirect to create mode
    })
    .finally(() => setLoadingEdit(false));
}, [editAnnotationId]);
```

**Important:** The existing `useEffect` that reads `searchParams.get('type')` and `searchParams.get('id')` to pre-populate `ownerType` and `ownerId` must be guarded with `if (editAnnotationId) return;` at the top so it doesn't conflict with edit mode:

```typescript
useEffect(() => {
  if (editAnnotationId) return; // edit mode handles its own pre-population
  const typeParam = searchParams.get('type');
  const idParam = searchParams.get('id');
  // ... existing pre-population logic ...
}, [searchParams, editAnnotationId]);
```

- [ ] **Step 2: Add rejection reason alert**

After the loading check (and before the form renders), add a rejection alert that shows when the annotation being edited was rejected. Find where the form header renders and add before it:

```typescript
{editingAnnotation?.status === 'rejected' && editingAnnotation?.rejectionReason && (
  <Alert color="red" title="Submission Rejected" mb="md">
    {editingAnnotation.rejectionReason}
    <Text size="sm" mt={4}>Edit and resubmit your annotation below.</Text>
  </Alert>
)}
```

Import `Alert` from `@mantine/core` if not already imported.

- [ ] **Step 3: Add "Editing" badge in header**

Find the page heading (likely an `<h1>` or `<Title>` component). Next to it, conditionally render a badge when in edit mode:

```typescript
<Group align="center" mb="md">
  <Title order={2}>
    {editAnnotationId ? 'Edit Annotation' : 'Submit Annotation'}
  </Title>
  {editAnnotationId && (
    <Badge color="blue" variant="light">Editing</Badge>
  )}
</Group>
```

Import `Badge` and `Group` from `@mantine/core` if not already imported.

- [ ] **Step 4: Update the submit handler for edit mode**

Find the form submit handler (the function that calls `api.createAnnotation` or similar). Wrap the API call to branch based on edit mode:

```typescript
if (editAnnotationId) {
  await api.updateAnnotation(editAnnotationId, {
    title,
    content,
    sourceUrl: sourceUrl || undefined,
    isSpoiler,
    spoilerChapter: isSpoiler ? spoilerChapter : undefined,
  });
} else {
  await api.createAnnotation({
    ownerType,
    ownerId,
    title,
    content,
    sourceUrl: sourceUrl || undefined,
    isSpoiler,
    spoilerChapter: isSpoiler ? spoilerChapter : undefined,
  });
}
```

`api.updateAnnotation` already exists in `api.ts` — no new method needed.

- [ ] **Step 5: Show loading state while fetching edit data**

Before the form renders (after the `loadingEdit` state check), add a loading guard:

```typescript
if (editAnnotationId && loadingEdit) {
  return <Center p="xl"><Loader /></Center>;
}
```

Import `Center` and `Loader` from `@mantine/core` if not already imported.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors. Fix any missing imports or type mismatches.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx
git commit -m "feat: add annotation edit mode with ?edit=id, rejection alert, and form pre-population"
```

---

## Task 13: Update ChangelogPageContent

**Files:**
- Modify: `client/src/app/changelog/ChangelogPageContent.tsx`

Read the full file before making changes — it has complex state and filter logic.

- [ ] **Step 1: Remove the "Wiki Edits" filter tab**

Find the filter tab buttons (the segment control or button group for "All Activity | Wiki Edits | Submissions"). Remove the "Wiki Edits" tab entirely. The remaining tabs are "All Activity" and "Submissions".

If `filterType` had a value of `'edits'` (or `'wiki'`) for the Wiki Edits tab, remove any code paths that set or handle that value.

- [ ] **Step 2: Update the entity filter behavior under the Submissions tab**

Currently the entity filter row is hidden when `filterType === 'submissions'`. Change this so:
- Under "Submissions" tab: show the entity filter but only with Guide, Media, Annotation options
- Under "All Activity" tab: show all entity types including Guide, Media, Annotation

Find where entity filter options are defined (likely an array of `{ value, label }` objects) and split into two sets:

```typescript
const allEntityOptions = [
  { value: 'character', label: 'Characters' },
  { value: 'gamble', label: 'Gambles' },
  { value: 'arc', label: 'Arcs' },
  { value: 'organization', label: 'Organizations' },
  { value: 'event', label: 'Events' },
  { value: 'guide', label: 'Guides' },
  { value: 'media', label: 'Media' },
  { value: 'annotation', label: 'Annotations' },
];

const submissionEntityOptions = [
  { value: 'guide', label: 'Guides' },
  { value: 'media', label: 'Media' },
  { value: 'annotation', label: 'Annotations' },
];

const entityOptions = filterType === 'submissions' ? submissionEntityOptions : allEntityOptions;
```

Use `entityOptions` wherever the entity filter renders.

- [ ] **Step 3: Extend entityColor() and entity label mapping for new types**

Find the `entityColor()` function (around line 73). Add:

```typescript
case 'guide': return textColors.guide;
case 'media': return textColors.media;
case 'annotation': return textColors.annotation;
```

Find where entity type labels are mapped for display (e.g. `entityLabel` or similar). Add:

```typescript
guide: 'Guide',
media: 'Media',
annotation: 'Annotation',
```

- [ ] **Step 4: Add action label logic for submission edits**

The changelog renders each EditLog entry with an action label (e.g. "updated", "created"). For entries where `entityType` is `guide`, `media`, or `annotation`, add label derivation based on `priorStatus`:

```typescript
function getActionLabel(entry: any): string {
  const isSubmissionType = ['guide', 'media', 'annotation'].includes(entry.entityType);
  if (isSubmissionType && entry.action === 'update') {
    const priorStatusField = (entry.changedFields ?? []).find(
      (f: string) => f.startsWith('priorStatus:')
    );
    const priorStatus = priorStatusField?.split(':')[1];
    if (priorStatus === 'REJECTED') return 'resubmitted';
    return 'edited';
  }
  // Fall back to existing action label logic
  return entry.action; // or existing derived label
}
```

Use `getActionLabel(entry)` when rendering the action badge/text for EditLog entries.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors. Pay attention to any type errors around `textColors.annotation` — it was added in Task 10.

- [ ] **Step 6: Commit**

```bash
git add client/src/app/changelog/ChangelogPageContent.tsx
git commit -m "feat: update changelog to handle GUIDE/MEDIA/ANNOTATION types and remove Wiki Edits tab"
```

---

## Task 14: Update ProfileFieldLog + ProfilePageClient

**Files:**
- Modify: `client/src/app/profile/ProfilePageClient.tsx`
- Modify: `client/src/app/profile/ProfileFieldLog.tsx`

- [ ] **Step 1: Update ProfileFieldLog props type**

In `ProfileFieldLog.tsx`, find the props interface (likely `ProfileFieldLogProps` or similar). Add the new prop:

```typescript
submissionEdits?: Array<{
  id: number;
  entityType: string;
  entityId: number;
  entityName?: string;
  changedFields: string[] | null;
  createdAt: string | Date;
}>;
```

- [ ] **Step 2: Add edit log entries to the activity list**

In `ProfileFieldLog.tsx`, find where the activity items array is built (the part that maps guides, submissions, reading progress into a unified list). Add submission edit entries:

```typescript
const editEntries = (submissionEdits ?? []).map((edit) => {
  const priorStatusField = (edit.changedFields ?? []).find(
    (f) => f.startsWith('priorStatus:')
  );
  const priorStatus = priorStatusField?.split(':')[1];
  const action = priorStatus === 'REJECTED' ? 'resubmitted' : 'edited';

  const typeColorMap: Record<string, string> = {
    guide: textColors.guide,
    media: textColors.media,
    annotation: textColors.annotation,
  };

  return {
    date: new Date(edit.createdAt),
    color: typeColorMap[edit.entityType] ?? textColors.secondary,
    label: edit.entityType.charAt(0).toUpperCase() + edit.entityType.slice(1),
    title: `${action} ${edit.entityName ?? edit.entityType}`,
  };
});
```

Merge `editEntries` into the existing activity array, then sort by date descending and cap at 5:

```typescript
const allEntries = [...existingEntries, ...editEntries]
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 5);
```

The exact variable names depend on the current implementation — read `ProfileFieldLog.tsx` and adapt accordingly.

- [ ] **Step 3: Pass textColors to the component (if not already available)**

If `textColors` is not imported in `ProfileFieldLog.tsx`, add:

```typescript
import { textColors } from '@/lib/mantine-theme';
```

Or wherever the theme file is imported from in the project (check the alias in `tsconfig.json`).

- [ ] **Step 4: Update ProfilePageClient to fetch and pass submissionEdits**

In `ProfilePageClient.tsx`, find where the component fetches user data (likely in a `useEffect` or in server-side data passing). Add a call to `api.getMySubmissionEdits()`:

```typescript
const [submissionEdits, setSubmissionEdits] = useState<any[]>([]);

useEffect(() => {
  api.getMySubmissionEdits()
    .then(setSubmissionEdits)
    .catch(() => {}); // Non-critical; activity feed degrades gracefully
}, []);
```

Then find where `<ProfileFieldLog ... />` is rendered (around line 330) and pass the new prop:

```typescript
<ProfileFieldLog
  guides={userGuides}
  submissions={submissions}
  user={user!}
  submissionEdits={submissionEdits}
/>
```

Note: `getMySubmissionEdits` requires auth — if the profile page is public (viewing someone else's profile), this fetch is only relevant when viewing your own profile. Confirm the page already gates this on `isOwnProfile` or similar condition. Only fetch and pass `submissionEdits` when the user is viewing their own profile.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/app/profile/ProfilePageClient.tsx \
        client/src/app/profile/ProfileFieldLog.tsx
git commit -m "feat: add submission edit entries to profile activity feed"
```

---

## Final Verification

- [ ] **Step 1: Build both client and server**

```bash
cd server && yarn build && echo "Server OK"
cd ../client && yarn build && echo "Client OK"
```

Expected: both print "OK" with no errors.

- [ ] **Step 2: Manual smoke test checklist**

Start the dev servers:
```bash
# Terminal 1
cd server && yarn start:dev

# Terminal 2
cd client && yarn dev
```

Test the following flows:

1. **Annotation edit UI:** Submit an annotation. In SubmissionCard, click Edit → should navigate to `/submit-annotation?edit={id}`. Form should pre-populate. Submit should update (not create a new annotation).

2. **Rejected annotation resubmit:** As admin, reject an annotation. As the author, click Edit → rejection reason alert should appear. Submit → annotation status becomes PENDING.

3. **EditLog logging:** After editing a guide, media, or annotation, check the database `edit_log` table — a new row should exist with `entityType` of `guide`/`media`/`annotation` and `changedFields` containing `priorStatus:...`.

4. **Changelog:** Open `/changelog`. "Wiki Edits" tab should be gone. "All Activity" should show guide/media/annotation edits with "edited" or "resubmitted" labels. "Submissions" tab should show only submission entity types in the entity filter.

5. **Activity feed:** Open your own profile. The activity feed should show "edited Guide: ..." or "resubmitted Annotation: ..." entries.

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: post-verification adjustments for submission editing feature"
```
