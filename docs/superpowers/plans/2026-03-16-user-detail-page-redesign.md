# User Detail Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `UserProfileClient.tsx` (public user detail page) to match the profile page's flat dark dossier aesthetic — flat dark header, top accent bar, monospace metadata, stat strip, 2-column panel grid, and full-width content blocks.

**Architecture:** Single-file JSX/styling rewrite of `client/src/app/users/[id]/UserProfileClient.tsx`. No logic changes — all data fetching, state, and `useEffect` are preserved verbatim. Only the `return` statement's JSX structure and inline styles are rewritten. The outer wrapper order is also corrected (`motion.div` outside `Container`).

**Tech Stack:** Next.js 15, React 19, TypeScript (strict), Mantine UI v7, motion/react, Lucide React, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-03-16-user-detail-page-redesign.md`

---

## Chunk 1: Types, state, and outer structure

### Task 1: Update `userStats` type and state to include `annotationsSubmitted`

**Files:**
- Modify: `client/src/app/users/[id]/UserProfileClient.tsx`

The `PublicUser` interface's `userStats` field and the local React state for `userStats` both need `annotationsSubmitted` added. Two `setUserStats` call sites need updating.

- [ ] **Step 1: Open and read the current file**

Read `client/src/app/users/[id]/UserProfileClient.tsx` in full to locate the three places that need type changes.

- [ ] **Step 2: Update `PublicUser.userStats` interface**

Find the `userStats` field inside the `PublicUser` interface (around line 66) and replace:
```ts
userStats?: {
  guidesWritten: number
  mediaSubmitted: number
  likesReceived: number
}
```
With:
```ts
userStats?: {
  guidesWritten: number
  mediaSubmitted: number
  likesReceived: number
  annotationsSubmitted: number
  eventsSubmitted?: number
}
```

- [ ] **Step 3: Update `userStats` React state type**

Find the `useState` for `userStats` (around line 103) and replace its type to include `annotationsSubmitted` (mirror the `PublicUser.userStats` interface, keeping `eventsSubmitted` optional):
```ts
const [userStats, setUserStats] = useState<{
  guidesWritten: number
  mediaSubmitted: number
  likesReceived: number
  annotationsSubmitted: number
  eventsSubmitted?: number
} | null>(null)
```

- [ ] **Step 4: Update `baseStats` to include `annotationsSubmitted`**

In `useEffect`, find the `baseStats` object (around line 119) and add `annotationsSubmitted`. This step is a prerequisite for Step 5 — the second `setUserStats(baseStats)` call gets `annotationsSubmitted` for free because `baseStats` now includes it:
```ts
const baseStats = {
  guidesWritten: user.userStats?.guidesWritten ?? 0,
  mediaSubmitted: user.userStats?.mediaSubmitted ?? 0,
  likesReceived: user.userStats?.likesReceived ?? 0,
  annotationsSubmitted: user.userStats?.annotationsSubmitted ?? 0,
}
```

- [ ] **Step 5: Update the success-path `setUserStats` call**

Find the first `setUserStats` call (success path, around line 144) and add `annotationsSubmitted`. The second call (`setUserStats(baseStats)` in the error fallback) already gets the new field from `baseStats` updated in Step 4 — no change needed there:
```ts
setUserStats({
  guidesWritten: Math.max(totalGuides, baseStats.guidesWritten),
  mediaSubmitted: baseStats.mediaSubmitted,
  likesReceived: Math.max(aggregateLikes, baseStats.likesReceived),
  annotationsSubmitted: baseStats.annotationsSubmitted,
})
```

- [ ] **Step 6: Type-check**

```bash
cd client && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/users/[id]/UserProfileClient.tsx
git commit --no-gpg-sign -m "feat: add annotationsSubmitted to userStats type and state on user detail page"
```

---

### Task 2: Restructure outer JSX wrapper

**Files:**
- Modify: `client/src/app/users/[id]/UserProfileClient.tsx`

Currently the return is `<Container> → <motion.div>`. It must become `<motion.div> → <Container>` to match the profile page.

- [ ] **Step 1: Replace the return root structure**

Swap the wrapper order and remove `BreadcrumbNav`. The existing three section blocks (main profile Card, contributions Card, guides Card) move inside `<Stack gap={0}>` unchanged for now — they will be replaced in later chunks:
```tsx
return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
    <Container size="lg" py="xl">
      <Stack gap={0}>
        {/* Main profile Card — replaced in Task 3 */}
        {/* Contributions Card — replaced in Task 6 */}
        {/* Guides Card — replaced in Task 7 */}
      </Stack>
    </Container>
  </motion.div>
)
```

Also remove the `BreadcrumbNav` render call and its import line (`import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'`). Both will be unused after removal and will cause a lint/build error if left in.

- [ ] **Step 2: Add `Stack` to imports**

Ensure `Stack` is imported from `@mantine/core` (it may already be).

- [ ] **Step 3: Type-check**

```bash
cd client && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/users/[id]/UserProfileClient.tsx
git commit --no-gpg-sign -m "refactor: restructure UserProfileClient outer wrapper to match profile page"
```

---

## Chunk 2: Header section

### Task 3: Rewrite the header

**Files:**
- Modify: `client/src/app/users/[id]/UserProfileClient.tsx`

Replace the current "Main Profile Card" (`<Card className="gambling-card" ...>` block) with the flat dark `Box` header matching `ProfileHeader.tsx`.

- [ ] **Step 1: Remove existing header Card and its contents**

Delete the entire `<Card className="gambling-card" ...>` that wraps the current profile header, avatar, quick stats, dividers, reading progress, favorites, and favorite characters sections. Keep everything after it (contributions and guides sections).

- [ ] **Step 2: Consolidate color variable declarations and derived values**

The existing file already declares `arcColor`, `characterColor`, `gambleColor`, `quoteColor`, `guideColor`, `mediaColor`, `eventColor` etc. at module scope (around lines 164–170), and `readingProgress` around line 202. Do the following:

1. **Remove** the now-unused variables that won't appear in the new JSX: `mediaColor`, `eventColor`, `likesColor`, `accentColor`, `accentBorderColor`, `accentHoverColor`, `accentTextColor`, `cardBaseBackground`, and the entire `stats` array.

2. **Rename** `readingProgress` → `readPercent` (it's the same computation — `Math.min(Math.round((user.userProgress / MAX_CHAPTER) * 100), 100)` — just use a consistent name throughout the new JSX).

3. **Add** two new derived values immediately after the color declarations:
```ts
const caseRef = String(user.id).padStart(4, '0')
const memberSince = user.createdAt
  ? new Date(user.createdAt).toISOString().split('T')[0]
  : '—'
```

Do NOT re-declare `arcColor`, `characterColor`, `gambleColor`, `quoteColor`, or `guideColor` — they already exist at this scope.

**Note:** `annotationsSubmitted` is added to the `userStats` state type in Task 1 — the `userStats?.annotationsSubmitted` access in the stat strip relies on that change having been applied.

- [ ] **Step 3: Write the header Box**

Insert as the first child of `<Stack gap={0}>`:

```tsx
{/* ── Header ── */}
<Box
  style={{
    background: 'linear-gradient(180deg, #100508 0%, #0a0a0a 100%)',
    borderBottom: '1px solid #1a1a1a',
    padding: '20px 24px 0',
    position: 'relative',
  }}
>
  {/* Top accent bar */}
  <Box
    style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: '2px',
      background: 'linear-gradient(90deg, #e11d48 0%, rgba(124,58,237,0.5) 55%, transparent 100%)',
    }}
  />

  {/* Main row */}
  <Group justify="space-between" align="flex-end" gap="lg" wrap="wrap">
    <Group align="flex-end" gap="lg">
      {/* Avatar */}
      <Box style={{ borderRadius: '4px', border: '1px solid #2a2a2a', boxShadow: '0 0 0 2px rgba(225,29,72,0.15)', flexShrink: 0 }}>
        <UserProfileImage user={user} size={72} />
      </Box>

      {/* Name + role */}
      <Stack gap={4} style={{ paddingBottom: '4px' }}>
        <Text
          style={{
            fontFamily: 'var(--font-opti-goudy-text)',
            fontSize: '2rem',
            fontWeight: 900,
            color: '#f5f5f5',
            lineHeight: 1,
          }}
        >
          {user.username}
        </Text>
        <Group gap="xs" wrap="wrap">
          <UserRoleDisplay
            userRole={user.role as 'admin' | 'moderator' | 'user'}
            customRole={user.customRole ?? null}
            size="medium"
            spacing={2}
          />
          <UserBadges userId={user.id} />
        </Group>
      </Stack>
    </Group>

    {/* Dossier metadata */}
    <Stack gap={2} style={{ textAlign: 'right', paddingBottom: '6px' }}>
      <Text style={{ fontSize: '13px', color: '#555', letterSpacing: '0.06em', fontFamily: 'monospace', lineHeight: 1.9 }}>
        #{caseRef}<br />
        {memberSince}
      </Text>
    </Stack>
  </Group>

  {/* Stat strip */}
  <Group gap={0} style={{ marginTop: '16px', borderTop: '1px solid #1a1a1a' }}>
    {[
      { value: userStats?.guidesWritten ?? 0, label: 'Guides', accent: true },
      { value: userStats?.mediaSubmitted ?? 0, label: 'Media', accent: false },
      { value: userStats?.annotationsSubmitted ?? 0, label: 'Annotations', accent: false },
      { value: `${readPercent}%`, label: 'Read', accent: false },
    ].map((stat, i, arr) => (
      <Box
        key={stat.label}
        style={{
          padding: '8px 16px',
          paddingLeft: i === 0 ? 0 : '16px',
          borderRight: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none',
        }}
      >
        <Text style={{ fontSize: '22px', fontWeight: 800, color: stat.accent ? '#e11d48' : '#bbb', lineHeight: 1, marginBottom: '2px', display: 'block' }}>
          {stat.value}
        </Text>
        <Text style={{ fontSize: '14px', color: '#888' }}>{stat.label}</Text>
      </Box>
    ))}
  </Group>
</Box>
```

- [ ] **Step 4: Update imports**

Ensure these are imported from `@mantine/core` (add any missing):
`Box`, `Group`, `Stack`, `Text`, `Container`, `Progress`, `Badge`, `Anchor`, `Divider`, `Card`, `SimpleGrid`, `SegmentedControl`

Keep `useMantineTheme` — used for `getEntityThemeColor`.

Remove confirmed-unused imports now (more will be cleaned up in Task 8):
- `Title` — only used in the deleted Card header
- `rem` — only used in old badge padding
- `Camera` from `lucide-react` — was used for the media stat icon, no longer present

Do NOT remove `Card` yet — it is still used in Task 4 for favorite character row cards.

- [ ] **Step 5: Type-check**

```bash
cd client && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Lint**

```bash
cd client && yarn lint
```
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/users/[id]/UserProfileClient.tsx
git commit --no-gpg-sign -m "feat: rewrite user detail page header to match profile page dossier style"
```

---

## Chunk 3: 2-column grid panels

### Task 4: Write the Favorites panel (left)

**Files:**
- Modify: `client/src/app/users/[id]/UserProfileClient.tsx`

Insert the 2-column grid wrapper and left panel as the second child of `<Stack gap={0}>`, after the header `Box`.

- [ ] **Step 1: Add the grid wrapper and left panel**

```tsx
{/* ── 2-column grid ── */}
<Box
  className="profile-section-grid"
  style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}
>
  {/* Left: Favorites */}
  <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }}>
    <Stack gap="md">
      <Text fw={700}>Favorites</Text>

      {/* Favorite Quote */}
      <div>
        <Text fw={600} size="sm" mb="xs">Favorite Quote</Text>
        {favoriteQuote ? (
          <Stack gap="sm">
            <Box style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px', borderLeft: `4px solid ${quoteColor}`, padding: '12px' }}>
              <Text fs="italic" size="sm" style={{ lineHeight: 1.6 }} lineClamp={4}>
                "{favoriteQuote.text}"
              </Text>
            </Box>
            <Group gap="xs" wrap="wrap">
              <Badge size="sm" style={{ background: getAlphaColor(quoteColor, 0.2), border: `1px solid ${getAlphaColor(quoteColor, 0.4)}`, color: quoteColor }}>
                {favoriteQuote.character?.name || 'Unknown'}
              </Badge>
              {favoriteQuote.chapterNumber && (
                <Badge size="sm" style={{ background: getAlphaColor(characterColor, 0.2), border: `1px solid ${getAlphaColor(characterColor, 0.4)}`, color: characterColor }}>
                  Chapter {favoriteQuote.chapterNumber}
                </Badge>
              )}
            </Group>
            <Anchor component={Link} href={`/quotes/${favoriteQuote.id}`} size="xs" c={quoteColor}>
              View Quote
            </Anchor>
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">No favorite quote set.</Text>
        )}
      </div>

      <Divider color="rgba(255,255,255,0.06)" />

      {/* Favorite Gamble */}
      <div>
        <Text fw={600} size="sm" mb="xs">Favorite Gamble</Text>
        {favoriteGamble ? (
          <Stack gap="sm" align="center">
            <Badge
              radius="lg"
              size="xl"
              variant="gradient"
              gradient={{ from: getAlphaColor(gambleColor, 0.8), to: gambleColor }}
              style={{ fontWeight: 700 }}
            >
              {favoriteGamble.name}
            </Badge>
            {favoriteGamble.rules && (
              <Text size="xs" c="dimmed" ta="center">
                {favoriteGamble.rules.length > 100 ? `${favoriteGamble.rules.substring(0, 100)}...` : favoriteGamble.rules}
              </Text>
            )}
            <Anchor component={Link} href={`/gambles/${favoriteGamble.id}`} size="xs" c={gambleColor}>
              View Gamble
            </Anchor>
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">No favorite gamble set.</Text>
        )}
      </div>

      <Divider color="rgba(255,255,255,0.06)" />

      {/* Favorite Characters */}
      <div>
        <Text fw={600} size="sm" mb="xs">Favorite Characters</Text>
        {user.favoriteCharacters && user.favoriteCharacters.length > 0 ? (
          <Stack gap="xs">
            {user.favoriteCharacters
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((fav) => (
                <Card
                  key={fav.characterId}
                  component={Link}
                  href={`/characters/${fav.characterId}`}
                  withBorder
                  radius="sm"
                  padding="xs"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a2a', textDecoration: 'none' }}
                >
                  <Group gap="sm" align="center">
                    {fav.isPrimary && (
                      <Badge size="xs" color="yellow" variant="filled" leftSection={<Star size={10} fill="currentColor" />}>
                        #1
                      </Badge>
                    )}
                    <Text size="sm" fw={fav.isPrimary ? 700 : 400} c={characterColor}>
                      {fav.character.name}
                    </Text>
                  </Group>
                </Card>
              ))}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">No favorite characters set.</Text>
        )}
      </div>
    </Stack>
  </Box>

  {/* Right panel placeholder — added in Task 5 */}
</Box>
```

- [ ] **Step 2: Type-check**

```bash
cd client && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/app/users/[id]/UserProfileClient.tsx
git commit --no-gpg-sign -m "feat: add favorites panel to user detail page 2-column grid"
```

---

### Task 5: Write the Reading Progress panel (right)

**Files:**
- Modify: `client/src/app/users/[id]/UserProfileClient.tsx`

Replace the right panel placeholder with the reading progress panel.

- [ ] **Step 1: Add the Reading Progress panel**

Replace `{/* Right panel placeholder — added in Task 5 */}` with:

```tsx
{/* Right: Reading Progress */}
<Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }}>
  <Stack gap="md">
    <Text fw={700}>Reading Progress</Text>

    <Group justify="space-between" align="flex-end">
      <Stack gap={2}>
        <Text size="xs" c="dimmed">Chapter</Text>
        <Text style={{ fontFamily: 'var(--font-opti-goudy-text)', fontSize: '1.5rem', color: arcColor, lineHeight: 1 }}>
          {user.userProgress}
        </Text>
      </Stack>
      <Stack gap={2} style={{ textAlign: 'right' }}>
        <Text size="xs" c="dimmed">Total</Text>
        <Text style={{ fontFamily: 'var(--font-opti-goudy-text)', fontSize: '1.5rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
          {MAX_CHAPTER}
        </Text>
      </Stack>
    </Group>

    <Progress value={readPercent} color={arcColor} size="lg" radius="md" striped animated />

    <Group justify="space-between">
      <Text size="xs" c="dimmed">0%</Text>
      <Text size="sm" fw={600} c={arcColor}>{readPercent}%</Text>
      <Text size="xs" c="dimmed">100%</Text>
    </Group>
  </Stack>
</Box>
```

- [ ] **Step 2: Ensure `Progress` is imported from `@mantine/core`**

Check that `Progress` is in the `@mantine/core` import line.

- [ ] **Step 3: Type-check**

```bash
cd client && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/users/[id]/UserProfileClient.tsx
git commit --no-gpg-sign -m "feat: add reading progress panel to user detail page 2-column grid"
```

---

## Chunk 4: Full-width content + cleanup

### Task 6: Rewrite the Contributions block

**Files:**
- Modify: `client/src/app/users/[id]/UserProfileClient.tsx`

The contributions block already exists below the main card. Re-skin it to use the flat dark box style and remove all the old `getAlphaColor`/gradient styling.

- [ ] **Step 1: Replace the contributions Card with a flat Box**

Find the existing contributions `<Card className="gambling-card" ...>` block (after the main profile card). Replace the Card wrapper and its styling with:

```tsx
{submissions.length > 0 && (
  <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '20px' }}>
    <Stack gap="lg">
      {/* Heading */}
      <Group gap="sm">
        <Text fw={700}>Contributions</Text>
        <Badge variant="light" size="sm">{submissions.length}</Badge>
      </Group>

      {/* Filter */}
      <SegmentedControl
        value={contributionFilter}
        onChange={(value) => { setContributionFilter(value); setContributionsVisible(10) }}
        data={[
          { label: 'All', value: 'all' },
          { label: 'Guides', value: 'guide' },
          { label: 'Media', value: 'media' },
          { label: 'Events', value: 'event' },
          { label: 'Annotations', value: 'annotation' },
        ]}
        styles={{ indicator: { backgroundColor: guideColor } }}
      />

      {/* List */}
      <Stack gap="sm">
        {(() => {
          const filtered = contributionFilter === 'all'
            ? submissions
            : submissions.filter((s: any) => s.type === contributionFilter)
          return (
            <>
              {filtered.slice(0, contributionsVisible).map((submission: any) => (
                <SubmissionCard
                  key={`${submission.type}-${submission.id}`}
                  submission={submission as SubmissionItem}
                />
              ))}
              {filtered.length === 0 && (
                <Text c="dimmed" ta="center" py="xl">
                  No {contributionFilter === 'all' ? 'contributions' : `${contributionFilter}s`} found.
                </Text>
              )}
              {filtered.length > contributionsVisible && (
                <Button variant="subtle" fullWidth onClick={() => setContributionsVisible(v => v + 10)}>
                  Show more ({filtered.length - contributionsVisible} remaining)
                </Button>
              )}
            </>
          )
        })()}
      </Stack>
    </Stack>
  </Box>
)}
```

Note: `SubmissionCard` no longer needs a `cardStyle` prop since we're dropping the per-card gradient styling. The component has a default style.

- [ ] **Step 2: Type-check**

```bash
cd client && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/app/users/[id]/UserProfileClient.tsx
git commit --no-gpg-sign -m "feat: restyle contributions block on user detail page"
```

---

### Task 7: Rewrite the Guides block

**Files:**
- Modify: `client/src/app/users/[id]/UserProfileClient.tsx`

Same treatment as contributions — replace the Card wrapper with the flat Box style.

- [ ] **Step 1: Replace the guides Card with a flat Box**

Find the existing guides `<Card className="gambling-card" ...>` block. Replace with:

```tsx
{guides.length > 0 && (
  <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '20px' }}>
    <Stack gap="lg">
      {/* Heading */}
      <Group justify="space-between" align="center" wrap="wrap">
        <Group gap="sm">
          <Text fw={700}>Guides</Text>
          <Badge variant="light" size="sm">{userStats?.guidesWritten ?? guides.length}</Badge>
        </Group>
        <Button
          component={Link}
          href={`/guides?author=${user.id}&authorName=${encodeURIComponent(user.username)}`}
          variant="outline"
          size="sm"
          radius="md"
          leftSection={<FileText size={16} />}
          styles={{ root: { borderColor: '#2a2a2a', color: '#bbb', backgroundColor: 'transparent' } }}
        >
          View All Guides
        </Button>
      </Group>

      {/* Grid */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {guides.slice(0, guidesVisible).map((guide) => (
          <Box key={guide.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }}>
            <Stack gap="sm">
              <Anchor component={Link} href={`/guides/${guide.id}`} fw={600} c="gray.2" style={{ textDecoration: 'none' }}>
                {guide.title}
              </Anchor>
              <Text size="sm" c="dimmed" lineClamp={2}>{guide.description}</Text>
              <Group justify="space-between" align="center">
                <Group gap="md">
                  <Group gap={4} align="center">
                    <Eye size={12} color="#666" />
                    <Text size="xs" c="dimmed">{guide.viewCount}</Text>
                  </Group>
                  <Group gap={4} align="center">
                    <Heart size={12} color="#666" />
                    <Text size="xs" c="dimmed">{guide.likeCount}</Text>
                  </Group>
                </Group>
                <Text size="xs" c="dimmed">
                  {new Date(guide.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </Group>
            </Stack>
          </Box>
        ))}
      </SimpleGrid>

      {guides.length > guidesVisible && (
        <Button variant="subtle" fullWidth onClick={() => setGuidesVisible(v => v + 6)}>
          Show more ({guides.length - guidesVisible} remaining)
        </Button>
      )}
    </Stack>
  </Box>
)}
```

- [ ] **Step 2: Type-check**

```bash
cd client && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/app/users/[id]/UserProfileClient.tsx
git commit --no-gpg-sign -m "feat: restyle guides block on user detail page"
```

---

### Task 8: Clean up unused imports and final build check

**Files:**
- Modify: `client/src/app/users/[id]/UserProfileClient.tsx`

- [ ] **Step 1: Audit and remove unused imports and variables**

The following are confirmed unused after the full rewrite — remove them all:

**Mantine imports to remove:** `Title`, `rem`, `SegmentedControl` (if already imported elsewhere, keep one instance), `Progress` (keep — used in Task 5), `useMantineTheme` — **keep** (still needed for `getEntityThemeColor`)

**`mantine-theme` named imports to remove:** `headerColors`, `textColors`, `outlineStyles` — all replaced by hardcoded values or `c="dimmed"`

**Lucide imports to remove:** `Camera` (removed in Task 3), `Quote` and `Dices` (no longer used as JSX icons — favorites section uses text headings, not icon components)

**Module-scope variables to remove** (declared but no longer referenced):
- `mediaColor`
- `eventColor`
- `likesColor`
- `accentColor`, `accentBorderColor`, `accentHoverColor`, `accentTextColor`
- `cardBaseBackground`
- `stats` (the array of stat objects used in the old quick stats row)

**Import line to confirm already removed:** `BreadcrumbNav`, `createEntityBreadcrumbs` (removed in Task 2)

After removing, run tsc to confirm no new errors were introduced.

- [ ] **Step 2: Type-check**

```bash
cd client && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Lint**

```bash
cd client && yarn lint
```
Expected: no errors.

- [ ] **Step 4: Build**

```bash
cd client && yarn build
```
Expected: successful build, no TypeScript errors.

- [ ] **Step 5: Final commit**

```bash
git add client/src/app/users/[id]/UserProfileClient.tsx
git commit --no-gpg-sign -m "chore: clean up unused imports on user detail page after redesign"
```

---

## Verification

After all tasks are complete, manually verify (dev server at `http://localhost:3000`):

1. Visit `/users/[any-valid-id]`
2. Header shows flat dark background with crimson top bar
3. Avatar is square (4px radius), no edit button
4. Monospace case ref and ISO date appear top-right
5. Stat strip shows Guides / Media / Annotations / Read%
6. 2-column grid shows Favorites (left) and Reading Progress (right) with flat dark boxes
7. Each favorites sub-section shows content or "not set" placeholder
8. Contributions and Guides blocks below use flat dark box style
9. Visit `/profile` and confirm that page is visually unchanged
