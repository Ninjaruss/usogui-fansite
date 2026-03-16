# Users List Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the user card in the community hub to be a taller portrait card with a gradient accent strip, 72px avatar, and a styled chapter badge — while leaving all page logic, infrastructure, and sub-components untouched.

**Architecture:** All changes are confined to the card JSX block inside `UsersPageContent.tsx`. The `SimpleGrid` column count is reduced at `xl` from 5 to 4, the skeleton height is increased from 160 to 220, and the `<Card>` block is replaced with the new three-child structure (accent strip → role chip → inner content box).

**Tech Stack:** Next.js 15, React 19, Mantine UI, TypeScript, motion/react

---

## Chunk 1: Card Redesign

### Task 1: Update grid columns and skeleton height

**Files:**
- Modify: `client/src/app/users/UsersPageContent.tsx:259` (skeleton)
- Modify: `client/src/app/users/UsersPageContent.tsx:285` (grid)

- [ ] **Step 1: Change skeleton card height from 160 to 220**

In `client/src/app/users/UsersPageContent.tsx`, find line 259 and update:

```tsx
// Before
<CardGridSkeleton count={12} cardWidth={280} cardHeight={160} accentColor={accentCommunity} />

// After
<CardGridSkeleton count={12} cardWidth={280} cardHeight={220} accentColor={accentCommunity} />
```

- [ ] **Step 2: Change xl grid column count from 5 to 4**

In the same file, find line 285 and update:

```tsx
// Before
<SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={rem(20)}>

// After
<SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4, xl: 4 }} spacing={rem(20)}>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/users/UsersPageContent.tsx
git commit -m "feat(users): reduce xl grid to 4 columns, update skeleton height"
```

---

### Task 2: Replace card JSX with portrait + accent strip design

**Files:**
- Modify: `client/src/app/users/UsersPageContent.tsx:294–362` (the entire `<Card>` block)

- [ ] **Step 1: Replace the entire `<Card>…</Card>` block**

Locate the existing card (lines 294–362). Replace it entirely with the following:

```tsx
<Card
  component={Link}
  href={`/users/${user.id}`}
  shadow="sm"
  radius="md"
  withBorder
  padding={0}
  style={{
    ...getCardStyles(theme, accentCommunity),
    padding: 0,
    overflow: 'hidden',
    height: '100%',
    minHeight: rem(220),
    position: 'relative',
    textDecoration: 'none',
    cursor: 'pointer',
  }}
>
  {/* Accent strip */}
  <Box
    style={{
      height: 4,
      background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)',
      width: '100%',
    }}
  />

  {/* Role chip */}
  {(user.role === 'admin' || user.role === 'moderator') && (
    <Badge
      size="xs"
      style={{
        position: 'absolute',
        top: rem(14),
        right: rem(10),
        zIndex: 10,
        backgroundColor: user.role === 'admin'
          ? 'rgba(225,29,72,0.15)'
          : 'rgba(77,171,247,0.12)',
        border: user.role === 'admin'
          ? '1px solid rgba(225,29,72,0.4)'
          : '1px solid rgba(77,171,247,0.35)',
        color: user.role === 'admin' ? '#e11d48' : '#4dabf7',
      }}
    >
      {user.role === 'admin' ? 'Admin' : 'Mod'}
    </Badge>
  )}

  {/* Inner content */}
  <Box p="md">
    <Stack gap="xs" align="center" style={{ height: '100%' }}>
      <UserProfileImage
        user={user}
        size={72}
        showFallback
        style={{ boxShadow: '0 0 0 3px rgba(168,85,247,0.2)' }}
        className="user-profile-avatar"
      />

      <Stack gap={2} align="center" w="100%">
        <Text
          fw={700}
          c={accentCommunity}
          ta="center"
          size="sm"
          lineClamp={1}
          title={user.username}
        >
          {user.username}
        </Text>
        <UserRoleDisplay
          userRole={user.role as 'admin' | 'moderator' | 'user'}
          customRole={user.customRole}
          size="small"
          spacing={0.5}
        />
      </Stack>

      <UserBadges userId={user.id} size="sm" maxDisplay={3} />

      <Text
        mt="auto"
        ta="center"
        style={{
          background: 'rgba(168,85,247,0.1)',
          border: '1px solid rgba(168,85,247,0.3)',
          color: accentCommunity,
          borderRadius: rem(20),
          padding: '3px 12px',
          fontFamily: 'monospace',
          fontSize: rem(11),
        }}
      >
        Ch. {user.userProgress ?? 0}
      </Text>
    </Stack>
  </Box>
</Card>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors. If `UserProfileImage` does not accept a `style` prop, wrap it in a `<Box style={{ boxShadow: '0 0 0 3px rgba(168,85,247,0.2)', borderRadius: '50%' }}>` instead.

- [ ] **Step 3: Verify visually**

Start the dev server (`cd client && yarn dev`) and open `http://localhost:3000/users`.

Check:
- Each card has a 4px purple gradient strip at the very top
- Avatar is larger (72px) with a faint purple glow ring
- Admin/mod cards show a tinted role chip at top-right
- Cards with no role show no chip
- Chapter badge is a purple pill at the bottom of each card (`Ch. 0` for users with no progress)
- On a wide screen, cards appear in groups of 4 (not 5) per row
- Hover still lifts the card upward

- [ ] **Step 4: Commit**

```bash
git add client/src/app/users/UsersPageContent.tsx
git commit -m "feat(users): redesign user cards with accent strip and portrait layout"
```
