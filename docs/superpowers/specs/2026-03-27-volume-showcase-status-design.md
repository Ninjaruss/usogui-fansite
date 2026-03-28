# Volume Showcase Status Card — Image Detection Fix & Pairing Indicator

**Date:** 2026-03-27
**Status:** Approved

## Problem

The `VolumeShowcaseStatusCard` in the admin dashboard checks whether a volume's showcase images (background and popout) have been uploaded. It currently calls `GET /volumes/:id/showcase/:type`, which internally uses `findOneByUsageType` — a method that filters exclusively for `status: APPROVED` media. As a result:

- An uploaded but pending image shows as "missing" in the card.
- An uploaded but rejected image also shows as "missing."
- The card gives no actionable feedback about the actual upload state.

Additionally, the card has no indication of whether the volume is configured as single or paired in the showcase layout, even though the `pairedVolumeId` field already exists on the entity.

## Goals

1. Fix the image uploaded indicators to show three distinct states: **approved**, **pending approval**, **rejected**, or **not uploaded**.
2. Add a read-only **Showcase Layout** indicator showing single vs. paired (paired volume ID already editable in the Edit form).

## Out of Scope

- Changes to the public `/volumes/:id/showcase/:type` endpoint or `getShowcaseReadyVolumes`.
- Changes to `DynamicVolumeShowcase` or any public-facing showcase rendering.
- Media approval workflows.
- The `pairedVolumeId` edit input (already functional in `VolumeEdit`).
- No new database columns or migrations required.

---

## Data Layer

### New MediaService method

```ts
// server/src/modules/media/media.service.ts
async findLatestByUsageTypeAny(
  ownerType: MediaOwnerType,
  ownerId: number,
  usageType: MediaUsageType,
): Promise<Media | null>
```

Identical to the existing `findOneByUsageType` but with no `status` filter — returns the most recently created media record regardless of approval state. The existing `findOneByUsageType` is left untouched.

### New VolumesService method

```ts
// server/src/modules/volumes/volumes.service.ts
async getVolumeShowcaseStatus(volumeId: number): Promise<{
  background: 'approved' | 'pending' | 'rejected' | null
  popout: 'approved' | 'pending' | 'rejected' | null
}>
```

Calls `findLatestByUsageTypeAny` for both `VOLUME_SHOWCASE_BACKGROUND` and `VOLUME_SHOWCASE_POPOUT` using the volume's database ID. Returns the status string of the most recent record for each type, or `null` if none exists.

### New controller route

```
GET /volumes/:id/showcase-status
Guards: JwtAuthGuard, RolesGuard → ADMIN | MODERATOR | EDITOR
Returns: { background: string | null, popout: string | null }
```

Admin-gated because it reveals the existence of unapproved media. The `:id` parameter is the volume's database ID (not volume number).

### New API client method

```ts
// client/src/lib/api.ts
getVolumeShowcaseStatus(volumeId: number): Promise<{
  background: 'approved' | 'pending' | 'rejected' | null
  popout: 'approved' | 'pending' | 'rejected' | null
}>
```

Calls `GET /volumes/:id/showcase-status`. Used exclusively by `VolumeShowcaseStatusCard`.

---

## Status Card Component

### Prop changes

```ts
// Before
interface VolumeShowcaseStatusCardProps {
  volumeNumber: number
}

// After
interface VolumeShowcaseStatusCardProps {
  volumeId: number
  pairedVolumeId: number | null
}
```

`volumeNumber` is removed. The `getShowcaseReadyVolumes` check (for the `ready` state) matches by `volumeId` instead of `volumeNumber` — the showcase-ready response already includes `volumeId` on each slot.

### State

Replace `hasBackground: boolean` and `hasPopout: boolean` with:

```ts
backgroundStatus: 'approved' | 'pending' | 'rejected' | null
popoutStatus: 'approved' | 'pending' | 'rejected' | null
```

### Overall card state derivation

| Condition | State |
|-----------|-------|
| `volumeId` appears in `showcaseReady` slots | `ready` |
| Either status is non-null | `incomplete` |
| Both statuses are null | `not-ready` |

The `incomplete` message is: `"Take action on the images below to enable showcase."` — the tiles convey the specific per-image state.

### UI layout (Option B — grid tiles)

The checklist rows are replaced with a 2-column grid of labeled tiles.

**Image tiles (Background Image, Popout Image):**

| Status value | Icon | Label text | Color |
|---|---|---|---|
| `'approved'` | ✓ | "Approved" | `#10b981` (green) |
| `'pending'` | ⏳ | "Pending approval" | `#eab308` (yellow) |
| `'rejected'` | ✗ | "Rejected — re-upload" | `#ef4444` (red) |
| `null` | — | "Not uploaded" | `rgba(255,255,255,0.3)` (gray) |

**Showcase Layout tile** (below a divider, half-width):

| Condition | Display |
|---|---|
| `pairedVolumeId` is set | `"⇄ Paired · Vol. ID {pairedVolumeId}"` in indigo `#a5b4fc` |
| `pairedVolumeId` is null | `"Single (no pairing)"` in gray |

Both cases include a small `"(set in Edit tab)"` hint in muted gray.

### Call site

```tsx
// client/src/components/admin/Volumes.tsx — VolumeShow
// Before:
<VolumeShowcaseStatusCard volumeNumber={record.number} />

// After:
<VolumeShowcaseStatusCard
  volumeId={record.id}
  pairedVolumeId={record.pairedVolumeId ?? null}
/>
```

---

## Files Changed

| File | Change |
|------|--------|
| `server/src/modules/media/media.service.ts` | Add `findLatestByUsageTypeAny` |
| `server/src/modules/volumes/volumes.service.ts` | Add `getVolumeShowcaseStatus` |
| `server/src/modules/volumes/volumes.controller.ts` | Add `GET /volumes/:id/showcase-status` route |
| `client/src/lib/api.ts` | Add `getVolumeShowcaseStatus` method |
| `client/src/components/admin/VolumeShowcaseStatusCard.tsx` | New props, three-state UI, grid layout |
| `client/src/components/admin/Volumes.tsx` | Update status card call site |
