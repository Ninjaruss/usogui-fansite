# Granular Changelog Fields — Design Spec

**Date:** 2026-03-29
**Status:** Approved

## Problem

The changelog and activity feed show edit entries but the `changedFields` data is not reliable or readable:

1. **Backend accuracy**: Services compute `changedFields` as `Object.keys(dto).filter(k => dto[k] !== undefined)` — logging all DTO keys present in the request, even when those fields were not actually changed. A single-field edit can appear to have changed 10 fields.

2. **Frontend readability**: Field names are raw camelCase DTO keys (e.g. `imageUrl`, `statusEffects`), not human-readable labels.

## Scope

- Backend: `diffFields` utility + service call-site updates
- Frontend: field label map + `formatChangedFields` improvement
- No database schema changes required (`changedFields` column is already JSONB)
- No changes to `RecentActivityFeed` (compact feed; changedFields not shown there)

---

## Backend Design

### `diffFields` utility

**File:** `server/src/common/utils/diff-fields.ts`

```ts
export function diffFields<T extends object>(
  before: T,
  update: Partial<T>,
): string[] {
  const changed: string[] = [];
  for (const key of Object.keys(update)) {
    const val = (update as any)[key];
    if (val === undefined) continue;
    const oldVal = (before as any)[key];
    if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
      if (JSON.stringify(oldVal) !== JSON.stringify(val)) changed.push(key);
    } else if (oldVal !== val) {
      changed.push(key);
    }
  }
  return changed;
}
```

- Primitives compared with `===`
- Arrays and objects compared with `JSON.stringify` (sufficient for detecting changes; no deep-equal dependency needed)
- Returns only keys where value actually differs

### Service update pattern

Each service that calls `editLogService.logUpdate` is updated to:

1. Snapshot the entity **before** mutation
2. Call `diffFields(entity, dto)` to get truly changed fields
3. Proceed with `Object.assign` and save as before

```ts
// Before
Object.assign(entity, data)
const saved = await this.repo.save(entity)
const changedFields = Object.keys(data).filter(k => data[k] !== undefined)

// After
const changedFields = diffFields(entity, data)   // snapshot before mutation
Object.assign(entity, data)
const saved = await this.repo.save(entity)
```

Services to update (all use the same pattern):
- `characters.service.ts`
- `arcs.service.ts`
- `chapters.service.ts`
- `organizations.service.ts`
- `gambles.service.ts`
- `events.service.ts`
- `tags.service.ts`
- `character-relationships.service.ts`
- `character-organizations.service.ts`

**Special cases:**

- `events.service.ts` manually pushes `'characters'` after the changedFields array for many-to-many relation changes — this continues unchanged after the `diffFields` call.
- `guides.service.ts` and `media.service.ts` — review call sites to confirm pattern and update accordingly.
- `annotations.service.ts` manually handles `isSpoiler`, `spoilerChapter`, and `priorStatus:*` fields — review and preserve that logic.

---

## Frontend Design

### Field label map

**File:** `client/src/app/changelog/ChangelogPageContent.tsx`

Add a `FIELD_LABELS` record and a `labelField` helper:

```ts
const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  title: 'Title',
  summary: 'Summary',
  description: 'Description',
  imageUrl: 'Image URL',
  status: 'Status',
  tags: 'Tags',
  type: 'Type',
  startChapter: 'Start Chapter',
  endChapter: 'End Chapter',
  outcome: 'Outcome',
  rules: 'Rules',
  factions: 'Factions',
  characters: 'Characters',
  organizations: 'Organizations',
  strategies: 'Strategies',
  isCanon: 'Is Canon',
  number: 'Number',
  arcId: 'Arc',
  volumeId: 'Volume',
  relationshipType: 'Relationship Type',
  roleInGamble: 'Role',
  notes: 'Notes',
  content: 'Content',
  fileName: 'File Name',
  ownerType: 'Owner Type',
  ownerId: 'Owner',
}

function labelField(field: string): string {
  return FIELD_LABELS[field] ??
    field.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())
}
```

Update `formatChangedFields` to use `labelField`:

```ts
function formatChangedFields(fields: string[] | null | undefined): string {
  if (!fields?.length) return ''
  const filtered = fields.filter(f => !f.startsWith('priorStatus:'))
  if (!filtered.length) return ''
  const shown = filtered.slice(0, 4).map(labelField)
  const rest = filtered.length - 4
  return rest > 0 ? `${shown.join(', ')} +${rest} more` : shown.join(', ')
}
```

---

## What is NOT changing

- Database schema — no migration needed
- `EditLog` entity
- `EditLogService` — no changes; services pass correct data to it
- `RecentActivityFeed` — changedFields not displayed in the compact feed
- Profile field log (`ProfileFieldLog.tsx`) — review whether it also displays changedFields; update if so
