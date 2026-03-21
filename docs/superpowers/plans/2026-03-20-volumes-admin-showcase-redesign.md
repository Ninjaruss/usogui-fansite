# Volumes Admin Showcase Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the admin "Media" tab to "Cover Image", add a live showcase status card to the Showcase Images tab, and replace the hardcoded homepage showcase config with a dynamic API endpoint that automatically includes any volume with both approved showcase images.

**Architecture:** Three independent layers of change: (1) backend — add `findAllApprovedByUsageType` to `MediaService` and `getShowcaseReadyVolumes` + route to `VolumesService`/`VolumesController`; (2) frontend admin — new `VolumeShowcaseStatusCard` component wired into `Volumes.tsx`; (3) frontend homepage — replace hardcoded config fetch in `page.tsx` with a single API call, then clean up `showcase-config.ts`.

**Tech Stack:** NestJS + TypeORM (backend), Next.js 15 + React 19 + MUI + Lucide React (frontend), TypeScript throughout. Package manager: yarn.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `server/src/modules/media/media.service.ts` | Modify | Add `findAllApprovedByUsageType()` — bulk fetch approved media by usage type across all owners |
| `server/src/modules/volumes/volumes.service.ts` | Modify | Add `getShowcaseReadyVolumes()` — find volumes with both approved showcase images |
| `server/src/modules/volumes/volumes.controller.ts` | Modify | Add `GET /volumes/showcase-ready` route (before the `/:id` route) |
| `client/src/types/index.ts` | Modify | Add `ShowcaseReadyVolume` interface |
| `client/src/lib/api.ts` | Modify | Add `getShowcaseReadyVolumes()` method |
| `client/src/components/admin/VolumeShowcaseStatusCard.tsx` | **Create** | Polling status card showing background/popout image state |
| `client/src/components/admin/Volumes.tsx` | Modify | Rename Media tab, add cover image description, wire status card, add REQUIRED badges |
| `client/src/app/page.tsx` | Modify | Replace hardcoded showcase fetch with `api.getShowcaseReadyVolumes()` |
| `client/src/lib/showcase-config.ts` | Modify | Remove hardcoded configs and management functions; keep types and animation presets |

---

## Task 1: Add `findAllApprovedByUsageType` to MediaService

**Files:**
- Modify: `server/src/modules/media/media.service.ts` (append after `findOneByUsageType` at line ~1209)

This adds a bulk fetch method that `VolumesService` will use. `MediaService` already imports `In` from typeorm (line 11) and has access to `this.mediaRepo`.

- [ ] **Step 1: Add the method**

Open `server/src/modules/media/media.service.ts`. Insert the new method **before** the final closing `}` of the class (the last line of the file). Place it directly after `findOneByUsageType` — i.e., between `findOneByUsageType`'s closing `}` and the class's closing `}`:

```ts
/**
 * Find all approved media records for a given owner type and usage type.
 * Used for bulk operations like showcase-ready volume fetching.
 */
async findAllApprovedByUsageType(
  ownerType: MediaOwnerType,
  usageType: MediaUsageType,
): Promise<Media[]> {
  return this.mediaRepo.find({
    where: { ownerType, usageType, status: MediaStatus.APPROVED },
    order: { createdAt: 'DESC' },
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | head -30
```
Expected: no errors (or only pre-existing errors unrelated to this change).

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/media/media.service.ts
git commit -m "feat(media): add findAllApprovedByUsageType bulk fetch method"
```

---

## Task 2: Add `getShowcaseReadyVolumes` to VolumesService

**Files:**
- Modify: `server/src/modules/volumes/volumes.service.ts`

`VolumesService` already has `this.mediaService` injected (line 15) and imports `MediaOwnerType`, `MediaUsageType` (line 9). Add `In` to the typeorm import.

- [ ] **Step 1: Add `In` to the typeorm import**

The current import in `volumes.service.ts` line 3 is:
```ts
import { Repository } from 'typeorm';
```

Change it to:
```ts
import { Repository, In } from 'typeorm';
```

- [ ] **Step 2: Add the `ShowcaseReadyVolume` interface and method**

After the existing imports in `volumes.service.ts`, add the interface:

```ts
export interface ShowcaseReadyVolume {
  volumeId: number;
  volumeNumber: number;
  backgroundUrl: string;
  popoutUrl: string;
  title: string;
}
```

Then at the end of the `VolumesService` class (before the final `}`), add:

```ts
async getShowcaseReadyVolumes(): Promise<ShowcaseReadyVolume[]> {
  const [bgMedia, popMedia] = await Promise.all([
    this.mediaService.findAllApprovedByUsageType(
      MediaOwnerType.VOLUME,
      MediaUsageType.VOLUME_SHOWCASE_BACKGROUND,
    ),
    this.mediaService.findAllApprovedByUsageType(
      MediaOwnerType.VOLUME,
      MediaUsageType.VOLUME_SHOWCASE_POPOUT,
    ),
  ]);

  // Keep only the latest approved record per volume for each type
  const latestBg = new Map(bgMedia.map((m) => [m.ownerId, m]));
  const latestPop = new Map(popMedia.map((m) => [m.ownerId, m]));
  const sharedVolumeIds = [...latestBg.keys()].filter((id) =>
    latestPop.has(id),
  );

  if (sharedVolumeIds.length === 0) return [];

  const volumes = await this.repo.find({
    where: { id: In(sharedVolumeIds) },
  });
  const volumeMap = new Map(volumes.map((v) => [v.id, v]));

  return sharedVolumeIds
    .filter((id) => volumeMap.has(id))
    .map((volumeId) => {
      const vol = volumeMap.get(volumeId)!;
      return {
        volumeId,
        volumeNumber: vol.number,
        backgroundUrl: latestBg.get(volumeId)!.url,
        popoutUrl: latestPop.get(volumeId)!.url,
        title: `Volume ${vol.number}`,
      };
    });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/volumes/volumes.service.ts
git commit -m "feat(volumes): add getShowcaseReadyVolumes service method"
```

---

## Task 3: Add `GET /volumes/showcase-ready` Route

**Files:**
- Modify: `server/src/modules/volumes/volumes.controller.ts`

**Critical:** This route must be placed **before** the `@Get(':id')` route (currently around line 111) or NestJS will match `showcase-ready` as the `:id` param.

- [ ] **Step 1: Find the insertion point**

In `volumes.controller.ts`, find the `@Get(':id')` handler. The new route goes directly above it.

- [ ] **Step 2: Add the route**

Insert before `@Get(':id')`:

```ts
@Get('showcase-ready')
@ApiOperation({ summary: 'Get all volumes with both approved showcase images' })
@ApiResponse({
  status: 200,
  description: 'Volumes ready for homepage showcase',
  schema: {
    type: 'array',
    items: {
      properties: {
        volumeId: { type: 'number' },
        volumeNumber: { type: 'number' },
        backgroundUrl: { type: 'string' },
        popoutUrl: { type: 'string' },
        title: { type: 'string' },
      },
    },
  },
})
async getShowcaseReady() {
  return this.service.getShowcaseReadyVolumes();
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 4: Smoke-test the endpoint manually**

With the server running (`yarn start:dev` in a separate terminal), hit the endpoint:

```bash
curl http://localhost:3001/api/volumes/showcase-ready
```

Expected: a JSON array (empty `[]` is fine if no volumes have both showcase images yet).

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/volumes/volumes.controller.ts
git commit -m "feat(volumes): add GET /volumes/showcase-ready endpoint"
```

---

## Task 4: Add `ShowcaseReadyVolume` type and `getShowcaseReadyVolumes` to Frontend

**Files:**
- Modify: `client/src/types/index.ts`
- Modify: `client/src/lib/api.ts`

- [ ] **Step 1: Add the interface to `client/src/types/index.ts`**

Append to the end of the file:

```ts
export interface ShowcaseReadyVolume {
  volumeId: number
  volumeNumber: number
  backgroundUrl: string
  popoutUrl: string
  title: string
}
```

- [ ] **Step 2: Add `getShowcaseReadyVolumes` to `client/src/lib/api.ts`**

The existing `getVolumeShowcaseMedia` method is around line 1085. Add the new method directly after it:

```ts
async getShowcaseReadyVolumes() {
  return this.get<import('../types').ShowcaseReadyVolume[]>('/volumes/showcase-ready')
}
```

- [ ] **Step 3: Verify frontend TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -40
```
Expected: no errors related to these additions.

- [ ] **Step 4: Commit**

```bash
git add client/src/types/index.ts client/src/lib/api.ts
git commit -m "feat(api): add getShowcaseReadyVolumes client method and type"
```

---

## Task 5: Create `VolumeShowcaseStatusCard` Component

**Files:**
- Create: `client/src/components/admin/VolumeShowcaseStatusCard.tsx`

This component polls `GET /volumes/{volumeNumber}/showcase/background` and `/popout` every 5 seconds and displays a status card with three states. It uses `api.getVolumeShowcaseMedia(volumeNumber, type)` which already exists in `api.ts` (line 1085).

The component uses MUI for layout (`Box`, `Typography`) and Lucide React icons (`CheckCircle`, `XCircle`, `AlertTriangle`) — both already used throughout the admin.

- [ ] **Step 1: Create the file**

```tsx
// client/src/components/admin/VolumeShowcaseStatusCard.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'

interface VolumeShowcaseStatusCardProps {
  volumeNumber: number
}

type ShowcaseState = 'not-ready' | 'incomplete' | 'ready' | 'loading'

interface ChecklistItemProps {
  label: string
  present: boolean
}

function ChecklistItem({ label, present }: ChecklistItemProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {present ? (
        <CheckCircle size={15} color="#10b981" />
      ) : (
        <XCircle size={15} color="rgba(239,68,68,0.6)" />
      )}
      <Typography
        variant="caption"
        sx={{ color: present ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)' }}
      >
        {label} — {present ? 'uploaded' : <em>missing</em>}
      </Typography>
    </Box>
  )
}

const STATE_CONFIG = {
  loading: {
    border: 'rgba(99,102,241,0.35)',
    bg: 'rgba(99,102,241,0.08)',
    icon: null,
    titleColor: 'rgba(255,255,255,0.5)',
    title: 'Checking status…',
    message: '',
  },
  'not-ready': {
    border: 'rgba(239,68,68,0.35)',
    bg: 'rgba(239,68,68,0.08)',
    icon: <XCircle size={28} color="#ef4444" />,
    titleColor: '#ef4444',
    title: 'Not in Showcase',
    message: 'Both images are required for this volume to appear in the homepage showcase.',
  },
  incomplete: {
    border: 'rgba(234,179,8,0.4)',
    bg: 'rgba(234,179,8,0.07)',
    icon: <AlertTriangle size={28} color="#eab308" />,
    titleColor: '#eab308',
    title: 'Incomplete — Not in Showcase',
    message: 'Upload the missing image to enable showcase.',
  },
  ready: {
    border: 'rgba(16,185,129,0.4)',
    bg: 'rgba(16,185,129,0.07)',
    icon: <CheckCircle size={28} color="#10b981" />,
    titleColor: '#10b981',
    title: 'Showcase Ready',
    message: 'This volume will appear in the homepage showcase automatically.',
  },
}

export function VolumeShowcaseStatusCard({ volumeNumber }: VolumeShowcaseStatusCardProps) {
  const [hasBackground, setHasBackground] = useState(false)
  const [hasPopout, setHasPopout] = useState(false)
  const [state, setState] = useState<ShowcaseState>('loading')

  useEffect(() => {
    let cancelled = false

    async function fetchStatus() {
      try {
        const [bg, pop] = await Promise.all([
          api.getVolumeShowcaseMedia(volumeNumber, 'background'),
          api.getVolumeShowcaseMedia(volumeNumber, 'popout'),
        ])
        if (cancelled) return
        const hasBg = bg !== null
        const hasPop = pop !== null
        setHasBackground(hasBg)
        setHasPopout(hasPop)
        if (hasBg && hasPop) setState('ready')
        else if (hasBg || hasPop) setState('incomplete')
        else setState('not-ready')
      } catch {
        // silently retain last known state on fetch errors
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [volumeNumber])

  const config = STATE_CONFIG[state]

  return (
    <Box
      sx={{
        p: '16px 20px',
        background: config.bg,
        border: `2px solid ${config.border}`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        mb: 3,
      }}
    >
      {config.icon && (
        <Box sx={{ flexShrink: 0, mt: '2px' }}>{config.icon}</Box>
      )}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body1"
          sx={{ color: config.titleColor, fontWeight: 700, mb: 0.5 }}
        >
          {config.title}
        </Typography>
        {config.message && (
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.55)', mb: 1.5 }}
          >
            {config.message}
          </Typography>
        )}
        {state !== 'loading' && (
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <ChecklistItem label="Background Image" present={hasBackground} />
            <ChecklistItem label="Popout Image" present={hasPopout} />
          </Box>
        )}
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -40
```
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/admin/VolumeShowcaseStatusCard.tsx
git commit -m "feat(admin): add VolumeShowcaseStatusCard component with polling"
```

---

## Task 6: Update `Volumes.tsx` — Tab Rename + Status Card + REQUIRED Badges

**Files:**
- Modify: `client/src/components/admin/Volumes.tsx`

Three changes in one file:
1. Rename `<Tab label="Media">` → `<Tab label="Cover Image">` and add a section heading + description inside.
2. Import and render `VolumeShowcaseStatusCard` at the top of the Showcase Images tab using `record.number`.
3. Add `REQUIRED` badges and updated descriptions to both showcase sections.

- [ ] **Step 1: Add the import**

At the top of `Volumes.tsx`, add after the `EntityDisplayMediaSection` import (line 21):

```ts
import { VolumeShowcaseStatusCard } from './VolumeShowcaseStatusCard'
```

- [ ] **Step 2: Rename the Media tab and add description**

Find and replace the Media tab block (lines 217–228 in the original):

```tsx
// BEFORE
<Tab label="Media">
  <WithRecord
    render={(record) => (
      <EntityDisplayMediaSection
        ownerType="volume"
        ownerId={record.id}
        accentColor="#6366f1"
        usageType="volume_image"
      />
    )}
  />
</Tab>
```

Replace with:

```tsx
<Tab label="Cover Image">
  <WithRecord
    render={(record) => (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 'bold', mb: 0.5 }}>
          Cover Image
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
          The main cover/thumbnail for this volume. Used in volume listings and cards.
        </Typography>
        <EntityDisplayMediaSection
          ownerType="volume"
          ownerId={record.id}
          accentColor="#6366f1"
          usageType="volume_image"
        />
      </Box>
    )}
  />
</Tab>
```

- [ ] **Step 3: Update the Showcase Images tab**

Find and replace the entire Showcase Images tab block (lines 230–265 in the original):

```tsx
// BEFORE
<Tab label="Showcase Images">
  <WithRecord
    render={(record) => (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 'bold', mb: 1 }}>
            Background Image
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
            Full-width background used in the homepage volume showcase.
          </Typography>
          <EntityDisplayMediaSection
            ownerType="volume"
            ownerId={record.id}
            accentColor="#6366f1"
            usageType="volume_showcase_background"
          />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 'bold', mb: 1 }}>
            Popout Image
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
            Foreground popout image used in the homepage volume showcase.
          </Typography>
          <EntityDisplayMediaSection
            ownerType="volume"
            ownerId={record.id}
            accentColor="#6366f1"
            usageType="volume_showcase_popout"
          />
        </Box>
      </Box>
    )}
  />
</Tab>
```

Replace with:

```tsx
<Tab label="Showcase Images">
  <WithRecord
    render={(record) => (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <VolumeShowcaseStatusCard volumeNumber={record.number} />

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 'bold' }}>
              Background Image
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.15)',
              }}
            >
              <Typography sx={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Required
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
            Full-width background displayed behind the volume showcase on the homepage.
          </Typography>
          <EntityDisplayMediaSection
            ownerType="volume"
            ownerId={record.id}
            accentColor="#6366f1"
            usageType="volume_showcase_background"
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 'bold' }}>
              Popout Image
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.15)',
              }}
            >
              <Typography sx={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Required
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
            Foreground character/art image that pops out in the homepage showcase animation.
          </Typography>
          <EntityDisplayMediaSection
            ownerType="volume"
            ownerId={record.id}
            accentColor="#6366f1"
            usageType="volume_showcase_popout"
          />
        </Box>
      </Box>
    )}
  />
</Tab>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -40
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/admin/Volumes.tsx
git commit -m "feat(admin): rename Media tab, add showcase status card and REQUIRED badges"
```

---

## Task 7: Replace Hardcoded Showcase Fetch in `page.tsx`

**Files:**
- Modify: `client/src/app/page.tsx`

Replace the multi-step `loadShowcase` function that reads from hardcoded config with a single `api.getShowcaseReadyVolumes()` call. Also remove the now-unused imports.

- [ ] **Step 1: Replace the import line**

Find and remove (line 9 in the original):

```ts
import { buildShowcaseItemFromApiData, getActiveConfiguration } from '../lib/showcase-config'
```

Replace with:

```ts
import type { ShowcaseReadyVolume } from '../types'
```

- [ ] **Step 2: Keep the `VolumeShowcaseItem` import**

The import on line 10 stays — `VolumeShowcaseItem` is still used by `DynamicVolumeShowcase` and by the `useState` declaration on line 27. The `const volumes = ...` cast on line 45 is part of the old block being replaced in Step 3, so it disappears automatically — no manual cleanup needed.

- [ ] **Step 3: Replace the `loadShowcase` function**

Find and replace the entire `useEffect` block (lines 29–52):

```ts
// BEFORE
useEffect(() => {
  async function loadShowcase() {
    try {
      const config = getActiveConfiguration()
      const items = await Promise.all(
        config.volumes.map(async (vol) => {
          const [bg, pop] = await Promise.all([
            api.getVolumeShowcaseMedia(vol.id, 'background'),
            api.getVolumeShowcaseMedia(vol.id, 'popout'),
          ])
          const backgroundUrl = bg?.url ?? vol.backgroundImage
          const popoutUrl = pop?.url ?? vol.popoutImage ?? null
          return buildShowcaseItemFromApiData(vol.id, backgroundUrl, popoutUrl, vol.title, vol.description)
        })
      )
      const volumes = items.filter(Boolean) as VolumeShowcaseItem[]
      if (volumes.length > 0) setShowcaseVolumes(volumes)
    } catch {
      // showcase stays null; component renders nothing
    }
  }
  loadShowcase()
}, [])
```

Replace with:

```ts
useEffect(() => {
  async function loadShowcase() {
    try {
      const items = await api.getShowcaseReadyVolumes()
      if (items.length > 0) {
        setShowcaseVolumes(
          items.map((v: ShowcaseReadyVolume) => ({
            id: v.volumeId,
            backgroundImage: v.backgroundUrl,
            popoutImage: v.popoutUrl,
            title: v.title,
          }))
        )
      }
    } catch {
      // showcase stays null; component renders nothing
    }
  }
  loadShowcase()
}, [])
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -40
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/app/page.tsx
git commit -m "feat(homepage): replace hardcoded showcase config with dynamic API fetch"
```

---

## Task 8: Clean Up `showcase-config.ts`

**Files:**
- Modify: `client/src/lib/showcase-config.ts`

Remove everything that was only needed for the hardcoded config system. Keep `VolumeShowcaseItem`, `ShowcaseAnimations`, and `ANIMATION_PRESETS` — these are still used by `DynamicVolumeShowcase.tsx`.

- [ ] **Step 1: Confirm no remaining callers**

Before deleting, verify nothing else imports the removed functions:

```bash
cd client && grep -r "getActiveConfiguration\|buildShowcaseItemFromApiData\|getConfigurationById\|setActiveConfiguration\|createShowcaseConfiguration\|validateShowcaseConfiguration\|SHOWCASE_CONFIGURATIONS\|ShowcaseConfiguration" src/ --include="*.ts" --include="*.tsx"
```

Expected: no matches (the `page.tsx` import was removed in Task 7).

- [ ] **Step 2: Rewrite `showcase-config.ts` keeping only what's needed**

Replace the entire file contents with:

```ts
export interface VolumeShowcaseItem {
  id: number
  backgroundImage: string
  popoutImage?: string
  title?: string
  description?: string
}

export interface ShowcaseAnimations {
  floatIntensity?: number
  parallaxIntensity?: number
  scaleRange?: [number, number]
  rotationRange?: [number, number]
  delayOffset?: number
}

export const ANIMATION_PRESETS = {
  subtle: {
    floatIntensity: 1,
    parallaxIntensity: 8,
    scaleRange: [1, 1.02] as [number, number],
    rotationRange: [-1, 1] as [number, number],
    delayOffset: 0.1
  },
  standard: {
    floatIntensity: 2,
    parallaxIntensity: 15,
    scaleRange: [1, 1.05] as [number, number],
    rotationRange: [-2, 2] as [number, number],
    delayOffset: 0.2
  },
  dramatic: {
    floatIntensity: 3.5,
    parallaxIntensity: 25,
    scaleRange: [1, 1.08] as [number, number],
    rotationRange: [-4, 4] as [number, number],
    delayOffset: 0.3
  }
} as const
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -40
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/showcase-config.ts
git commit -m "refactor(showcase): remove hardcoded config — dynamic API replaces it"
```

---

## Final Verification

- [ ] **Run full client build**

```bash
cd client && yarn build
```
Expected: clean build, zero TypeScript errors.

- [ ] **Run server build**

```bash
cd server && yarn build
```
Expected: clean build.

- [ ] **Manual smoke test (both servers running)**

1. Start backend: `cd server && yarn start:dev`
2. Start frontend: `cd client && yarn dev`
3. Open admin at `http://localhost:3000/admin#/volumes`
4. Click any volume → verify "Media" tab is now labelled "Cover Image" with description
5. Click "Showcase Images" tab → verify status card appears with correct state (red/amber/green)
6. Upload a background image for a volume → within 5 seconds the status card should update
7. Check homepage at `http://localhost:3000` → showcase renders only volumes with both approved images
8. Hit `http://localhost:3001/api/volumes/showcase-ready` directly → confirm JSON array shape

- [ ] **Final commit (if any lint fixes needed)**

```bash
cd client && yarn lint
cd server && yarn lint
```
