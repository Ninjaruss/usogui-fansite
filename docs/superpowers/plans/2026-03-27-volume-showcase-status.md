# Volume Showcase Status Card — Image Detection Fix & Pairing Indicator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the admin volume showcase status card to accurately detect image upload state (approved/pending/rejected/missing) and display whether the volume is paired in the showcase layout.

**Architecture:** Add a new admin-only `GET /volumes/:id/showcase-status` endpoint that queries media existence without an approval filter, then rewrite `VolumeShowcaseStatusCard` to use it. The public showcase endpoints are untouched.

**Tech Stack:** NestJS + TypeORM (server), Next.js 15 + React 19 + MUI (client). Use `yarn` — never `npm`.

**Spec:** `docs/superpowers/specs/2026-03-27-volume-showcase-status-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `server/src/modules/media/media.service.ts` | Modify | Add `findLatestByUsageTypeAny` — same as `findOneByUsageType` but no status filter |
| `server/src/modules/volumes/volumes.service.ts` | Modify | Add `getVolumeShowcaseStatus` — calls both image type checks, returns status strings |
| `server/src/modules/volumes/volumes.controller.ts` | Modify | Add `GET :id/showcase-status` route, admin-gated |
| `client/src/lib/api.ts` | Modify | Add `getVolumeShowcaseStatus(volumeId)` client method |
| `client/src/components/admin/VolumeShowcaseStatusCard.tsx` | Rewrite | New props (`volumeId`, `pairedVolumeId`), three-state status tiles, pairing tile |
| `client/src/components/admin/Volumes.tsx` | Modify | Update `VolumeShowcaseStatusCard` call site with new props |

---

## Task 1: Add `findLatestByUsageTypeAny` to MediaService

**Files:**
- Modify: `server/src/modules/media/media.service.ts`

- [ ] **Step 1: Open and read the existing `findOneByUsageType` method**

  In `server/src/modules/media/media.service.ts`, find `findOneByUsageType` (around line 1223). It looks like:

  ```ts
  async findOneByUsageType(
    ownerType: MediaOwnerType,
    ownerId: number,
    usageType: MediaUsageType,
  ): Promise<Media | null> {
    return this.mediaRepo.findOne({
      where: {
        ownerType,
        ownerId,
        usageType,
        status: MediaStatus.APPROVED,
      },
      order: { createdAt: 'DESC' },
    });
  }
  ```

- [ ] **Step 2: Add `findLatestByUsageTypeAny` immediately after `findOneByUsageType`**

  Insert this method after the closing brace of `findOneByUsageType` and before `findAllApprovedByUsageType`:

  ```ts
  /**
   * Find the most recent media for a specific owner + usageType, regardless of approval status.
   * Used by admin endpoints that need to show actual upload state.
   */
  async findLatestByUsageTypeAny(
    ownerType: MediaOwnerType,
    ownerId: number,
    usageType: MediaUsageType,
  ): Promise<Media | null> {
    return this.mediaRepo.findOne({
      where: { ownerType, ownerId, usageType },
      order: { createdAt: 'DESC' },
    });
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd server && yarn build
  ```

  Expected: no errors. If you see `Property 'findLatestByUsageTypeAny' does not exist`, check the method is inside the `@Injectable()` class body.

- [ ] **Step 4: Commit**

  ```bash
  git add server/src/modules/media/media.service.ts
  git commit -m "feat(media): add findLatestByUsageTypeAny for status-agnostic media lookup"
  ```

---

## Task 2: Add `getVolumeShowcaseStatus` to VolumesService

**Files:**
- Modify: `server/src/modules/volumes/volumes.service.ts`

- [ ] **Step 1: Open `server/src/modules/volumes/volumes.service.ts` and locate the existing `getVolumeShowcaseMedia` method (around line 120)**

  The file already imports `MediaOwnerType` and `MediaUsageType` from `../../entities/media.entity`.

- [ ] **Step 2: Add `getVolumeShowcaseStatus` after `getVolumeShowcaseMedia`**

  ```ts
  async getVolumeShowcaseStatus(volumeId: number): Promise<{
    background: string | null;
    popout: string | null;
  }> {
    const [bg, pop] = await Promise.all([
      this.mediaService.findLatestByUsageTypeAny(
        MediaOwnerType.VOLUME,
        volumeId,
        MediaUsageType.VOLUME_SHOWCASE_BACKGROUND,
      ),
      this.mediaService.findLatestByUsageTypeAny(
        MediaOwnerType.VOLUME,
        volumeId,
        MediaUsageType.VOLUME_SHOWCASE_POPOUT,
      ),
    ]);
    return {
      background: bg ? bg.status : null,
      popout: pop ? pop.status : null,
    };
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd server && yarn build
  ```

  Expected: no errors. If you see `Property 'findLatestByUsageTypeAny' does not exist on type 'MediaService'`, Task 1 was not saved correctly — recheck step 2 of Task 1.

- [ ] **Step 4: Commit**

  ```bash
  git add server/src/modules/volumes/volumes.service.ts
  git commit -m "feat(volumes): add getVolumeShowcaseStatus for per-image status detection"
  ```

---

## Task 3: Add `GET /volumes/:id/showcase-status` controller route

**Files:**
- Modify: `server/src/modules/volumes/volumes.controller.ts`

- [ ] **Step 1: Open `server/src/modules/volumes/volumes.controller.ts` and find the `getShowcaseMedia` method (the `@Get(':id/showcase/:type')` route)**

- [ ] **Step 2: Add the new route immediately before `getShowcaseMedia`**

  Add this block just before the `@Get(':id/showcase/:type')` decorator:

  ```ts
  @Get(':id/showcase-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get showcase image upload status for a volume (admin)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Volume database ID' })
  @ApiResponse({
    status: 200,
    description: 'Upload status of each showcase image type',
    schema: {
      properties: {
        background: { type: 'string', nullable: true, enum: ['approved', 'pending', 'rejected', null] },
        popout: { type: 'string', nullable: true, enum: ['approved', 'pending', 'rejected', null] },
      },
    },
  })
  async getShowcaseStatus(@Param('id', ParseIntPipe) id: number) {
    return this.service.getVolumeShowcaseStatus(id);
  }
  ```

  All required imports (`UseGuards`, `ApiBearerAuth`, `JwtAuthGuard`, `RolesGuard`, `Roles`, `UserRole`) are already imported in this file.

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd server && yarn build
  ```

  Expected: no errors.

- [ ] **Step 4: Start the server and verify the endpoint exists**

  ```bash
  cd server && yarn start:dev
  ```

  Then check Swagger at `http://localhost:3001/api-docs` — you should see `GET /volumes/{id}/showcase-status` under the `volumes` tag.

- [ ] **Step 5: Commit**

  ```bash
  git add server/src/modules/volumes/volumes.controller.ts
  git commit -m "feat(volumes): add GET /volumes/:id/showcase-status admin endpoint"
  ```

---

## Task 4: Add `getVolumeShowcaseStatus` to the API client

**Files:**
- Modify: `client/src/lib/api.ts`

- [ ] **Step 1: Open `client/src/lib/api.ts` and find the existing `getVolumeShowcaseMedia` method**

  It looks like:

  ```ts
  async getVolumeShowcaseMedia(id: number, type: 'background' | 'popout') {
    return this.get<{
      id: number
      url: string
      usageType: string
    } | null>(`/volumes/${id}/showcase/${type}`)
  }
  ```

- [ ] **Step 2: Add `getVolumeShowcaseStatus` immediately after `getVolumeShowcaseMedia`**

  ```ts
  async getVolumeShowcaseStatus(volumeId: number) {
    return this.get<{
      background: 'approved' | 'pending' | 'rejected' | null
      popout: 'approved' | 'pending' | 'rejected' | null
    }>(`/volumes/${volumeId}/showcase-status`)
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd client && yarn build
  ```

  Expected: no errors (or only pre-existing errors unrelated to this change).

- [ ] **Step 4: Commit**

  ```bash
  git add client/src/lib/api.ts
  git commit -m "feat(api): add getVolumeShowcaseStatus client method"
  ```

---

## Task 5: Rewrite `VolumeShowcaseStatusCard`

**Files:**
- Rewrite: `client/src/components/admin/VolumeShowcaseStatusCard.tsx`

- [ ] **Step 1: Replace the entire file contents with the following**

  ```tsx
  'use client'

  import React, { useEffect, useState } from 'react'
  import { Box, Typography } from '@mui/material'
  import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'
  import { api } from '../../lib/api'

  type ImageStatus = 'approved' | 'pending' | 'rejected' | null
  type ShowcaseState = 'not-ready' | 'incomplete' | 'ready' | 'loading'

  interface VolumeShowcaseStatusCardProps {
    volumeId: number
    pairedVolumeId: number | null
  }

  const IMAGE_STATUS_CONFIG: Record<
    NonNullable<ImageStatus> | 'null',
    { icon: React.ReactNode; label: string; color: string }
  > = {
    approved: {
      icon: <CheckCircle size={13} color="#10b981" />,
      label: 'Approved',
      color: '#10b981',
    },
    pending: {
      icon: <Clock size={13} color="#eab308" />,
      label: 'Pending approval',
      color: '#eab308',
    },
    rejected: {
      icon: <XCircle size={13} color="#ef4444" />,
      label: 'Rejected — re-upload',
      color: '#ef4444',
    },
    null: {
      icon: null,
      label: 'Not uploaded',
      color: 'rgba(255,255,255,0.3)',
    },
  }

  function ImageStatusTile({ label, status }: { label: string; status: ImageStatus }) {
    const cfg = status ? IMAGE_STATUS_CONFIG[status] : IMAGE_STATUS_CONFIG.null
    return (
      <Box sx={{ background: 'rgba(255,255,255,0.04)', borderRadius: 1.5, p: '8px 10px' }}>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {cfg.icon}
          <Typography sx={{ color: cfg.color, fontSize: '0.75rem', fontWeight: 600 }}>
            {cfg.label}
          </Typography>
        </Box>
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
      message: 'Take action on the images below to enable showcase.',
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

  export function VolumeShowcaseStatusCard({
    volumeId,
    pairedVolumeId,
  }: VolumeShowcaseStatusCardProps) {
    const [backgroundStatus, setBackgroundStatus] = useState<ImageStatus>(null)
    const [popoutStatus, setPopoutStatus] = useState<ImageStatus>(null)
    const [state, setState] = useState<ShowcaseState>('loading')

    useEffect(() => {
      let cancelled = false

      async function fetchStatus() {
        try {
          const [showcaseReady, imageStatus] = await Promise.all([
            api.getShowcaseReadyVolumes(),
            api.getVolumeShowcaseStatus(volumeId),
          ])
          if (cancelled) return

          const bg = imageStatus?.background ?? null
          const pop = imageStatus?.popout ?? null
          setBackgroundStatus(bg)
          setPopoutStatus(pop)

          const isShowcaseReady = showcaseReady.some(
            (slot) =>
              slot.primary.volumeId === volumeId ||
              slot.secondary?.volumeId === volumeId,
          )

          if (isShowcaseReady) setState('ready')
          else if (bg !== null || pop !== null) setState('incomplete')
          else setState('not-ready')
        } catch {
          setState((prev) => (prev === 'loading' ? 'not-ready' : prev))
        }
      }

      fetchStatus()
      const interval = setInterval(fetchStatus, 5000)
      return () => {
        cancelled = true
        clearInterval(interval)
      }
    }, [volumeId])

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
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                <ImageStatusTile label="Background Image" status={backgroundStatus} />
                <ImageStatusTile label="Popout Image" status={popoutStatus} />
              </Box>
              <Box
                sx={{
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  pt: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 1.5,
                    p: '8px 10px',
                    gap: 1,
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        mb: 0.5,
                      }}
                    >
                      Showcase Layout
                    </Typography>
                    {pairedVolumeId ? (
                      <Typography sx={{ color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 600 }}>
                        ⇄ Paired · Vol. ID {pairedVolumeId}
                      </Typography>
                    ) : (
                      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                        Single (no pairing)
                      </Typography>
                    )}
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.68rem', alignSelf: 'flex-end', pb: '1px' }}>
                    (set in Edit tab)
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>
    )
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd client && yarn build
  ```

  Expected: no errors. Common issues:
  - `Property 'volumeId' does not exist on type 'ShowcaseReadyVolume'` → check that `ShowcaseReadyVolume` type in `client/src/types/index.ts` or wherever it's imported from has `volumeId`. The server returns `volumeId` in the response — if the client type is missing it, add `volumeId: number` to the `ShowcaseReadyVolume`/`ShowcaseSlot` types.

- [ ] **Step 3: Fix `ShowcaseSlot` type if needed**

  If the build fails with a missing `volumeId` property, open `client/src/types/index.ts` and find the `ShowcaseSlot` / `ShowcaseReadyVolume` type. Add `volumeId: number` to `ShowcaseReadyVolume`:

  ```ts
  export interface ShowcaseReadyVolume {
    volumeId: number       // add this if missing
    volumeNumber: number
    backgroundUrl: string
    popoutUrl: string
    title: string
  }
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add client/src/components/admin/VolumeShowcaseStatusCard.tsx client/src/types/index.ts
  git commit -m "feat(admin): rewrite VolumeShowcaseStatusCard with three-state image indicators and pairing tile"
  ```

---

## Task 6: Update the call site in `Volumes.tsx`

**Files:**
- Modify: `client/src/components/admin/Volumes.tsx`

- [ ] **Step 1: Open `client/src/components/admin/Volumes.tsx` and find the `VolumeShowcaseStatusCard` usage**

  In `VolumeShow`, the `Showcase Images` tab contains a `WithRecord` block. The current call is:

  ```tsx
  <VolumeShowcaseStatusCard volumeNumber={record.number} />
  ```

- [ ] **Step 2: Replace it with the new props**

  ```tsx
  <VolumeShowcaseStatusCard
    volumeId={record.id}
    pairedVolumeId={record.pairedVolumeId ?? null}
  />
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd client && yarn build
  ```

  Expected: no errors. If you see `Property 'volumeNumber' does not exist` it means the old prop was passed somewhere else — search for any other `VolumeShowcaseStatusCard` usages:

  ```bash
  grep -r "VolumeShowcaseStatusCard" client/src
  ```

  Update any remaining usages with the new props.

- [ ] **Step 4: Manual smoke test**

  1. Start both server and client:
     ```bash
     # Terminal 1
     cd server && yarn start:dev
     # Terminal 2
     cd client && yarn dev
     ```
  2. Log in as admin at `http://localhost:3000/admin`
  3. Navigate to Volumes → any volume → Showcase Images tab
  4. Verify the status card shows the two-column image tiles and the Showcase Layout tile
  5. For a volume with an uploaded but unapproved background image, confirm it shows "Pending approval" in yellow rather than the old "missing" red
  6. For a volume with `pairedVolumeId` set, confirm the layout tile shows "⇄ Paired · Vol. ID {n}"

- [ ] **Step 5: Commit**

  ```bash
  git add client/src/components/admin/Volumes.tsx
  git commit -m "feat(admin): update VolumeShowcaseStatusCard call site with volumeId and pairedVolumeId props"
  ```
