# Admin Dashboard QA & UX Consistency — Design Spec

**Date:** 2026-03-21
**Scope:** All 16 React Admin resources in `client/src/components/admin/`
**Approach:** Layer-by-layer across all resources
**Goal:** Audit + fix field completeness, validation, UX consistency, and admin workflows

---

## Overview

The admin dashboard uses React Admin with a custom data provider and auth provider. It covers 16 resources: Users, Characters, Arcs, Volumes, Chapters, Gambles, Events, Guides, Media, Quotes, Tags, Organizations, Badges, CharacterRelationships, CharacterOrganizations, and Annotations.

The QA pass is organized into 4 horizontal layers applied across all resources, plus a shared infrastructure change.

> **Note:** Fields were verified against the actual source files before being listed as missing. Several fields initially flagged as absent were already implemented and are excluded here.

---

## Layer 1 — Field Completeness

Audit every Edit/Create/Show/List view against its DB entity and add all genuinely missing fields.

| Resource | Missing Fields to Add | Input Type |
|---|---|---|
| Users | `fluxerUsername` (in DB, absent from admin form) | Read-only TextField in Show |
| Users | `profilePictureType` (enum in DB, absent from admin form) | SelectInput with enum choices |
| Arcs | `order` — exists in Show/List but absent from Edit and Create forms | NumberInput (Edit + Create) |
| Events | `rejectionReason` — in DB schema, verify if absent from Edit form; add if missing | TextInput, conditional on status=rejected |
| Organizations | `description` — currently plain TextInput, should be rich text like other content entities | Switch to RichMarkdownAdminInput |
| Tags | Usage count — expose as read-only count in Show view (from API) | FunctionField |
| Media | `b2FileId`, `fileName`, `mimeType`, `fileSize`, `width`, `height` — DB fields absent from admin UI | Read-only fields in Show view only |

**Already confirmed as implemented (do not add):**
- Characters: `firstAppearanceChapter`, `alternateNames` — both fully implemented
- Gambles: `participantIds` — implemented via `ReferenceArrayInput`
- Users: `isEmailVerified`, `fluxerAvatar` — both already present in admin form

---

## Layer 2 — Validation & Constants

### Extend the existing constants file
`client/src/lib/constants.ts` already exports `MAX_CHAPTER = 539`. Extend this file (do not create a parallel file) with additional constants extracted from resource components:

```ts
// Add to client/src/lib/constants.ts
export const EVENT_TYPES = ['gamble', 'decision', 'reveal', 'shift', 'resolution']
export const FACTION_ROLES = ['leader', 'member', 'supporter', 'observer']
// RELATIONSHIP_TYPES — extract the hardcoded array from Characters.tsx (line ~46).
// Note: CharacterRelationships.tsx already imports RelationshipType from src/types/index.ts;
// align both components to this single source rather than duplicating in constants.ts.
export const RELATIONSHIP_TYPES = [
  'ally', 'rival', 'mentor', 'subordinate', 'family', 'partner', 'enemy', 'acquaintance'
]
// Arc type is computed from parentId (null = major, non-null = sub-arc).
// There is no type column on the Arc entity — no ARC_TYPES constant is needed.
// MEDIA_USAGE_TYPES — source from the MediaUsageType entity enum:
// character_image | volume_image | volume_showcase_background |
// volume_showcase_popout | guide_image | gallery_upload
export const MEDIA_USAGE_TYPES = [
  'character_image', 'volume_image', 'volume_showcase_background',
  'volume_showcase_popout', 'guide_image', 'gallery_upload'
]
export const USER_ROLES = ['user', 'moderator', 'editor', 'admin']
```

All resource components that currently hardcode these arrays import from `client/src/lib/constants.ts` instead.

### Validation additions
- **Arcs:** Guard against circular parent reference — arc cannot select itself or its own descendants as parent. Implement in form-level `validate` function.
- **Chapters:** Warn on duplicate chapter number (check via `dataProvider.getList` with filter before save).
- **Volumes:** Warn on duplicate volume number (same approach).
- **Gambles:** Verify and fix `chapterId`/`chapterNumber` type mismatch — confirm whether the form field value is an ID or a number and align with what the API expects.
- **Quotes:** Add max page number validation (max 200), validate chapter is within 1–`MAX_CHAPTER`.
- **Characters:** Validate `firstAppearanceChapter` is within 1–`MAX_CHAPTER` (field exists; validation may be incomplete).

---

## Layer 3 — Modal → Inline Refactor

Convert modal-based sub-editors embedded within resource forms to React Admin's native `ArrayInput`/`SimpleFormIterator` pattern.

### Gamble FactionEditor
**Target:** The custom `FactionEditor` modal inside `Gambles.tsx` (standalone `Gambles` resource Edit/Create form — not a separate resource file).

**Current approach:** Custom modal with local React state. Makes direct `api` calls (bypassing the data provider) to persist factions separately from the gamble record.

**Prerequisite check:** Confirm whether the backend gamble GET response returns factions as nested objects. If yes, `ArrayInput` maps naturally. If factions are fetched separately, a data provider transform will be needed to merge them into the gamble record before the form receives it.

**After:**
```tsx
<ArrayInput source="factions">
  <SimpleFormIterator>
    <TextInput source="name" label="Faction Name" />
    <SelectInput source="supportedGambler" choices={...} allowEmpty />
    <ArrayInput source="members">
      <SimpleFormIterator>
        <ReferenceInput source="characterId" reference="characters">
          <AutocompleteInput />
        </ReferenceInput>
        <SelectInput source="role" choices={FACTION_ROLES} />
      </SimpleFormIterator>
    </ArrayInput>
  </SimpleFormIterator>
</ArrayInput>
```

### Character Relationship Inline Trigger
**Target:** The `RelationshipModalTrigger` component inside `Characters.tsx` — the inline button that opens a modal to add a relationship from within the Character edit form.

**Note:** `CharacterRelationships.tsx` is a standalone resource with its own List/Show/Edit/Create — it does not need refactoring. Only the embedded trigger inside `Characters.tsx` is in scope.

**After:** Replace modal trigger with an inline `ArrayInput` using `SimpleFormIterator` containing a character reference + relationship type select.

### Character Organization Inline Trigger
**Target:** The `OrgMembershipModalTrigger` component inside `Characters.tsx` — the inline button that opens a modal to add an organization membership from within the Character edit form.

**After:** Inline `ArrayInput` with `SimpleFormIterator` containing organization reference + role + optional date range fields.

---

## Layer 4 — Workflows & Bulk Actions

### Approve/Reject button pattern
Applies to: **Guides**, **Media**, **Events**

Replace the raw `SelectInput` for status with two action buttons in `EditToolbar`:
- **Approve button** — calls `useUpdate` setting `{ status: 'approved' }`, shows success toast via `useNotify`
- **Reject button** — opens inline `<Dialog>` with a `rejectionReason` TextInput; on submit calls `useUpdate` setting `{ status: 'rejected', rejectionReason: '...' }`. Dialog submit button disabled during in-flight request.

A shared `ApproveRejectToolbar` component (or extended props on the existing `EditToolbar.tsx`) handles this for all three resources, accepting `resourceName` as a prop.

On error, `useNotify` surfaces the API error message.

### Bulk actions for Guides and Media
Add `BulkActionButtons` to **Guide** and **Media** list views:
- `BulkApproveButton` — `useUpdateMany` with `{ status: 'approved' }`, deselects rows on success
- `BulkRejectButton` — prompts for a single shared rejection reason, then `useUpdateMany` with `{ status: 'rejected', rejectionReason: '...' }`

Both show loading state and notify on success/error.

### User workflow additions
- **`profilePictureType` field** — add SelectInput to Edit form (covered in Layer 1)
- **`fluxerUsername` display** — add as read-only in Show (covered in Layer 1)
- **`isEmailVerified`** — already present as `BooleanInput` in Edit form; no change needed

**Out of scope: "Send Password Reset" action.** The only backend reset endpoint (`POST /auth/password-reset/request`) is user-facing and does not accept admin-initiated calls by userId. Adding admin-initiated password reset would require a new backend endpoint, which contradicts the frontend-only constraint of this spec. This feature is excluded.

### EditLog resource (read-only, requires data provider customization)
Add a new `editLog` resource to `AdminApp.tsx` with a List-only view.

**Backend constraint:** The existing `edit-log` table is populated via the contributions service. The current controller endpoints (`recent`, `submissions`, `my-submissions`) do not follow React Admin's standard pagination/filter contract. A custom data provider override is required for this resource — add a handler in `AdminDataProvider.ts` that maps React Admin's `getList` call to the most appropriate existing endpoint, or request a new admin-scoped list endpoint from the backend.

Columns to display:
- Timestamp, Entity Type, Entity ID, Action (create/update/delete), Changed Fields (JSON chip), Acting User

Acting User display: use `ReferenceField source="userId" reference="users"` wrapping a `TextField source="username"`.

No Edit/Create/Delete views.

---

## Architecture

### File changes summary
- **Extend:** `client/src/lib/constants.ts` — add all shared admin enums
- **New file:** `client/src/components/admin/EditLog.tsx` — read-only EditLog list
- **Modified:** `client/src/components/admin/EditToolbar.tsx` — add `ApproveRejectToolbar` variant
- **Modified:** `client/src/app/admin/AdminApp.tsx` — register EditLog resource
- **Modified (confirmed):** `Gambles.tsx`, `Characters.tsx`, `Arcs.tsx`, `Events.tsx`, `Guides.tsx`, `Media.tsx`, `Users.tsx`, `Organizations.tsx`, `Tags.tsx`, `Quotes.tsx`, `Volumes.tsx`, `Chapters.tsx`, `CharacterRelationships.tsx`, `Badges.tsx`, `Annotations.tsx` — constant extraction; subset also get field additions, validation, or inline editor refactors per layers above

---

## Error Handling

- **Field validation:** React Admin `validate` prop; form-level errors (circular parent, duplicate numbers) surfaced as form banners
- **Approve/Reject failures:** `useNotify` toast with API error; reject dialog button disabled during in-flight request
- **Bulk action failures:** `useNotify` toast; rows remain selected so user can retry
- **Inline array editor failures:** React Admin surfaces field-level errors from API response natively
- **Faction data round-trip:** After refactoring FactionEditor, manually verify: create a gamble with factions → save → reload → confirm factions and members persist correctly

---

## Testing

1. `yarn build` in `client/` — no TypeScript errors
2. `yarn lint` — no lint errors
3. Manual browser spot-check per changed resource: List, Show, Edit, and Create views
4. For Layer 3 (FactionEditor, relationship/org triggers): verify full data round-trips — create, save, reload, confirm data persists

---

## Out of Scope

- Automated test suite for admin components
- Admin-initiated password reset (requires new backend endpoint)
- Backend API changes beyond the EditLog data provider customization note above
- Admin UI redesign or theme changes
- New backend entities or migrations
