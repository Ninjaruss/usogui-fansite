# Admin Dashboard QA & UX Consistency — Design Spec

**Date:** 2026-03-21
**Scope:** All 16 React Admin resources in `client/src/components/admin/`
**Approach:** Layer-by-layer across all resources
**Goal:** Audit + fix field completeness, validation, UX consistency, and admin workflows

---

## Overview

The admin dashboard uses React Admin with a custom data provider and auth provider. It covers 16 resources: Users, Characters, Arcs, Volumes, Chapters, Gambles, Events, Guides, Media, Quotes, Tags, Organizations, Badges, CharacterRelationships, CharacterOrganizations, and Annotations.

The QA pass is organized into 4 horizontal layers applied across all resources, then a shared infrastructure change.

---

## Layer 1 — Field Completeness

Audit every Edit/Create/Show/List view against its DB entity and add all missing fields.

| Resource | Missing Fields to Add |
|---|---|
| Users | `isEmailVerified` (read-only bool), `fluxerUsername` (read-only text), `fluxerAvatar` (read-only text), `profilePictureType` (SelectInput) |
| Characters | `firstAppearanceChapter` (ReferenceInput → chapters), `alternateNames` (ArrayInput of TextInput) |
| Gambles | `participants` as proper ReferenceArrayInput (currently missing from Edit form) |
| Events | `rejectionReason` (TextInput, shown when status is rejected) |
| Organizations | Switch `description` from plain TextInput to RichMarkdownAdminInput |
| Tags | Add usage count as a read-only field in Show view (from API) |
| Media | Add `b2FileId`, `fileName`, `mimeType`, `fileSize`, `width`, `height` as read-only fields in Show view |
| Arcs | Add `order` field (NumberInput) to Edit/Create forms |

---

## Layer 2 — Validation & Constants

Replace all hardcoded values with centralized constants. Add cross-field validation.

### Shared constants file
Create `client/src/components/admin/constants.ts` exporting:
```ts
export const MAX_CHAPTER = 539
export const EVENT_TYPES = ['gamble', 'decision', 'reveal', 'shift', 'resolution']
export const FACTION_ROLES = ['leader', 'member', 'supporter', 'observer']
export const RELATIONSHIP_TYPES = [...] // extracted from CharacterRelationships.tsx
export const ARC_TYPES = ['major', 'sub'] // extracted from Arcs.tsx
export const MEDIA_USAGE_TYPES = [...] // extracted from Media.tsx
export const USER_ROLES = ['user', 'moderator', 'editor', 'admin']
```

All resource components import from this file instead of local hardcoded arrays.

### Validation additions
- **Arcs:** Guard against circular parent reference (arc cannot select itself or its own descendants as parent)
- **Chapters:** Warn on duplicate chapter number (check via dataProvider before save)
- **Volumes:** Warn on duplicate volume number
- **Gambles:** Fix `chapterId`/`chapterNumber` type mismatch — ensure form field type matches what the API expects
- **Quotes:** Add max page number validation (e.g., max 200), validate chapter is within 1–`MAX_CHAPTER`
- **Characters:** Validate `firstAppearanceChapter` is within 1–`MAX_CHAPTER`

---

## Layer 3 — Modal → Inline Refactor

Convert modal-based sub-editors to React Admin's native inline `ArrayInput`/`SimpleFormIterator` pattern.

### Gamble FactionEditor
**Before:** Custom modal dialog with local React state managing factions and members.
**After:**
```tsx
<ArrayInput source="factions">
  <SimpleFormIterator>
    <TextInput source="name" label="Faction Name" />
    <SelectInput source="supportedGambler" choices={...} />
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

### Character Relationship Modal
**Before:** Custom modal dialog for adding/editing relationships.
**After:** Inline `ArrayInput` with `SimpleFormIterator` containing character reference + relationship type select.

### Character Organization Modal
**Before:** Custom modal dialog for adding/editing organization memberships.
**After:** Inline `ArrayInput` with `SimpleFormIterator` containing organization reference + role + date range fields.

---

## Layer 4 — Workflows & Bulk Actions

### Approve/Reject button pattern
Applies to: **Guides**, **Media**, **Events**

Replace the raw `SelectInput` for status with two action buttons in `EditToolbar`:
- **Approve button** — calls `useUpdate` setting `status: 'approved'`, shows success toast
- **Reject button** — opens inline `<Dialog>` with a `rejectionReason` TextInput, then calls `useUpdate` setting `status: 'rejected'` and `rejectionReason`. Dialog submit button disabled during in-flight request.

On error, `useNotify` surfaces the API error message.

### Bulk actions
Add `BulkActionButtons` to **Guide** and **Media** list views:
- `BulkApproveButton` — calls `useUpdateMany` with `{ status: 'approved' }`, deselects rows on success
- `BulkRejectButton` — prompts for a single shared rejection reason, then calls `useUpdateMany`

Both show loading state and notify on success/error.

### User workflow additions
Add to **User Edit** view:
- **Verify Email toggle** — `BooleanInput` for `isEmailVerified`
- **Send Password Reset** action button — calls a dedicated API endpoint (no form change needed)

### EditLog resource (read-only)
Add a new `editLog` resource to `AdminApp.tsx` with List-only view. Columns:
- Timestamp, Entity Type, Entity ID, Action (create/update/delete), Changed Fields (JSON chip), Acting User

No Edit/Create/Delete. This exposes the existing backend `EditLog` entity.

---

## Architecture

### File changes summary
- **New file:** `client/src/components/admin/constants.ts` — all shared enums/constants
- **New file:** `client/src/components/admin/EditLog.tsx` — read-only EditLog list view
- **Modified:** `client/src/components/admin/EditToolbar.tsx` — add Approve/Reject button support
- **Modified:** `client/src/app/admin/AdminApp.tsx` — register EditLog resource
- **Modified:** All 16 resource files — field additions, validation, inline editors

### Approve/Reject pattern reuse
A shared `ApproveRejectToolbar` component (or props on `EditToolbar`) handles the workflow for Guides, Media, and Events identically. It accepts `resourceName` to customize the update endpoint.

### Validation pattern
Cross-field validation uses React Admin's form-level `validate` prop returning an object of field-keyed error messages. Field-level validation uses the `validate` prop on individual inputs.

---

## Error Handling

- **Field validation:** React Admin `validate` prop, form-level errors surfaced as form banner
- **Approve/Reject failures:** `useNotify` toast with API error message; reject dialog button disabled during in-flight request
- **Bulk action failures:** `useNotify` toast, rows remain selected so user can retry
- **Inline array editor failures:** React Admin surfaces field-level errors from the API response natively

---

## Testing

No automated tests are added in this pass. Verification is:
1. `yarn build` in `client/` passes with no TypeScript errors
2. `yarn lint` passes
3. Manual browser spot-check of each changed resource's List, Show, Edit, and Create views

---

## Out of Scope

- Automated test suite for admin components
- Backend API changes (all fixes are frontend-only, using existing API endpoints)
- Admin UI redesign or theme changes
- New backend entities or migrations
